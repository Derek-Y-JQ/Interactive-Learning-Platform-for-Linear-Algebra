import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { Magnet, MoveVertical, Move, RotateCw, RotateCcw } from 'lucide-react';
import { C, hex } from '../theme';
import type { Vec3 } from '../utils/math';

export interface Handle3D {
  id: string;
  pos: Vec3;
  color: string;
  label?: string;
  onChange: (p: Vec3) => void;
}

interface ThreeViewportProps {
  /** Populate the (cleared) content group. Called whenever deps change. */
  buildScene: (group: THREE.Group, scene: THREE.Scene) => (() => void) | void;
  deps: unknown[];
  cameraPos?: [number, number, number];
  /** Axis extent is ±gridSize/2 */
  gridSize?: number;
  heightClass?: string;
  handles?: Handle3D[];
  showTicks?: boolean;
  ariaLabel?: string;
}

type ViewPreset = 'iso' | 'xy' | 'xz' | 'yz';

const VIEW_DIRS: Record<ViewPreset, [number, number, number]> = {
  iso: [1, 0.82, 0.72],
  xy: [0, -0.0001, 1],
  xz: [0, -1, 0.0001],
  yz: [1, 0, 0.0001],
};

function disposeTree(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else if (mat) mat.dispose();
  });
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  buildScene,
  deps,
  cameraPos = [7.4, 6, 5.2],
  gridSize = 8,
  heightClass = 'h-[420px] sm:h-[500px]',
  handles,
  showTicks = true,
  ariaLabel = '三维交互视图',
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<THREE.Group | null>(null);
  const handleGroupRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const handlesRef = useRef<Handle3D[] | undefined>(handles);
  handlesRef.current = handles;

  const [autoRotate, setAutoRotate] = useState(false);
  const [vertical, setVertical] = useState(false);
  const [snap, setSnap] = useState(false);
  const [preset, setPreset] = useState<ViewPreset>('iso');
  const modeRef = useRef({ vertical, snap });
  modeRef.current = { vertical, snap };
  const half = gridSize / 2;

  /* ---------------- one-time setup ---------------- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C.surface);
    sceneRef.current = scene;

    const w = host.clientWidth || 640;
    const h = host.clientHeight || 460;
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 200);
    camera.up.set(0, 0, 1);
    camera.position.set(...cameraPos);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    host.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(w, h);
    Object.assign(labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    host.appendChild(labelRenderer.domElement);

    /* ---- handle dragging (registered before OrbitControls so it runs first) ---- */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let drag: { id: string; plane: THREE.Plane; start: Vec3 } | null = null;
    let hovered: THREE.Object3D | null = null;

    const setNdc = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
    };
    const pickHandle = (): THREE.Object3D | null => {
      const g = handleGroupRef.current;
      if (!g) return null;
      const hits = raycaster.intersectObjects(g.children.filter((c) => c.userData.handleId), false);
      return hits[0]?.object ?? null;
    };

    const onDown = (e: PointerEvent) => {
      setNdc(e);
      const hit = pickHandle();
      if (!hit) return;
      const id = hit.userData.handleId as string;
      const hd = handlesRef.current?.find((x) => x.id === id);
      if (!hd) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      const p = new THREE.Vector3(...hd.pos);
      const vert = modeRef.current.vertical || e.shiftKey;
      let plane: THREE.Plane;
      if (vert) {
        const n = new THREE.Vector3();
        camera.getWorldDirection(n);
        n.z = 0;
        if (n.lengthSq() < 1e-6) n.set(0, 1, 0);
        n.normalize();
        plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, p);
      } else {
        plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), p);
      }
      drag = { id, plane, start: hd.pos };
      (plane as THREE.Plane & { vertical?: boolean }).vertical = vert;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onMove = (e: PointerEvent) => {
      setNdc(e);
      if (drag) {
        const pt = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(drag.plane, pt)) return;
        const s = modeRef.current.snap ? 0.5 : 0.1;
        const r = (x: number) => Math.max(-half, Math.min(half, Math.round(x / s) * s));
        const hd = handlesRef.current?.find((x) => x.id === drag!.id);
        if (!hd) return;
        const vert = (drag.plane as THREE.Plane & { vertical?: boolean }).vertical;
        const next: Vec3 = vert ? [hd.pos[0], hd.pos[1], r(pt.z)] : [r(pt.x), r(pt.y), hd.pos[2]];
        const clean = next.map((x) => Math.round(x * 1e6) / 1e6) as Vec3;
        if (clean.some((x, i) => x !== hd.pos[i])) hd.onChange(clean);
        return;
      }
      const hit = pickHandle();
      if (hit !== hovered) {
        if (hovered) hovered.scale.setScalar(1);
        hovered = hit;
        if (hovered) hovered.scale.setScalar(1.3);
        renderer.domElement.style.cursor = hit ? 'grab' : '';
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!drag) return;
      drag = null;
      renderer.domElement.releasePointerCapture?.(e.pointerId);
      renderer.domElement.style.cursor = '';
    };

    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointercancel', onUp);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.minDistance = 2.5;
    controls.maxDistance = 40;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    /* ---- lighting ---- */
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d3c6, 1.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(6, 4, 9);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-6, -5, -3);
    scene.add(rim);

    /* ---- grid on z = 0 ---- */
    const gridPts: number[] = [];
    const gridMinor: number[] = [];
    for (let i = -half; i <= half + 1e-9; i += 0.5) {
      const arr = Math.abs(i - Math.round(i)) < 1e-9 ? gridPts : gridMinor;
      arr.push(i, -half, 0, i, half, 0, -half, i, 0, half, i, 0);
    }
    const mkGrid = (pts: number[], color: string) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: hex(color) }));
    };
    scene.add(mkGrid(gridMinor, '#F1EEE8'));
    scene.add(mkGrid(gridPts, C.grid));

    /* ---- axes ---- */
    const axes: [THREE.Vector3, string, string][] = [
      [new THREE.Vector3(1, 0, 0), C.red, 'x'],
      [new THREE.Vector3(0, 1, 0), C.green, 'y'],
      [new THREE.Vector3(0, 0, 1), C.blue, 'z'],
    ];
    for (const [dir, color, name] of axes) {
      addVector3D(scene as unknown as THREE.Group, dir.clone().multiplyScalar(-half).toArray() as Vec3, dir.clone().multiplyScalar(half + 0.45).toArray() as Vec3, C.axis, {
        radius: 0.011,
        head: 0.2,
        headRadius: 0.06,
      });
      addLabel3D(scene as unknown as THREE.Group, name, dir.clone().multiplyScalar(half + 0.75).toArray() as Vec3, color);
      if (showTicks) {
        for (let k = -half + 1; k <= half; k++) {
          if (k === 0) continue;
          const p = dir.clone().multiplyScalar(k);
          const off = name === 'z' ? new THREE.Vector3(0.18, -0.18, 0) : new THREE.Vector3(0, 0, -0.22);
          addLabel3D(scene as unknown as THREE.Group, String(k).replace('-', '−'), p.add(off).toArray() as Vec3, C.ink3, 'tick');
        }
      }
    }

    const content = new THREE.Group();
    scene.add(content);
    contentRef.current = content;
    const hg = new THREE.Group();
    scene.add(hg);
    handleGroupRef.current = hg;

    /* ---- loop (only while on screen) ---- */
    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(host);
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      controls.update();
      for (const c of hg.children) if (c.userData.billboard) c.quaternion.copy(camera.quaternion);
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    loop();

    const ro = new ResizeObserver(() => {
      const W = host.clientWidth;
      const H = host.clientHeight;
      if (W > 0 && H > 0) {
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
        labelRenderer.setSize(W, H);
      }
    });
    ro.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointercancel', onUp);
      controls.dispose();
      disposeTree(scene);
      renderer.dispose();
      host.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  /* ---------------- content rebuild ---------------- */
  useEffect(() => {
    const group = contentRef.current;
    const scene = sceneRef.current;
    if (!group || !scene) return;
    for (const child of [...group.children]) {
      group.remove(child);
      disposeTree(child);
    }
    const cleanup = buildScene(group, scene);
    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  /* ---------------- handles rebuild ---------------- */
  const handleKey = JSON.stringify(handles?.map((h) => [h.id, h.pos, h.color, h.label]) ?? []);
  useEffect(() => {
    const g = handleGroupRef.current;
    if (!g) return;
    for (const child of [...g.children]) {
      g.remove(child);
      disposeTree(child);
    }
    for (const hd of handles ?? []) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 24, 16),
        new THREE.MeshStandardMaterial({ color: hex(hd.color), roughness: 0.35, emissive: hex(hd.color), emissiveIntensity: 0.15 })
      );
      sphere.position.set(...hd.pos);
      sphere.userData.handleId = hd.id;
      g.add(sphere);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      ring.position.set(...hd.pos);
      ring.userData.billboard = true;
      g.add(ring);
      // depth cue: drop line to the xy-plane + footprint
      if (Math.abs(hd.pos[2]) > 0.05) {
        addFatLine(g, [hd.pos, [hd.pos[0], hd.pos[1], 0]], hd.color, 1.2, { dashed: true, opacity: 0.6 });
      }
      const foot = new THREE.Mesh(
        new THREE.CircleGeometry(0.07, 20),
        new THREE.MeshBasicMaterial({ color: hex(hd.color), transparent: true, opacity: 0.45 })
      );
      foot.position.set(hd.pos[0], hd.pos[1], 0.002);
      g.add(foot);
      if (hd.label) addLabel3D(g, hd.label, [hd.pos[0], hd.pos[1], hd.pos[2] + 0.34], hd.color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleKey]);

  const goPreset = (p: ViewPreset) => {
    const cam = cameraRef.current;
    const ctl = controlsRef.current;
    if (!cam || !ctl) return;
    setPreset(p);
    const d = p === 'iso' ? new THREE.Vector3(...cameraPos).length() : cam.position.distanceTo(ctl.target);
    const dir = new THREE.Vector3(...VIEW_DIRS[p]).normalize();
    ctl.target.set(0, 0, 0);
    cam.position.copy(dir.multiplyScalar(d));
    ctl.update();
  };

  const hasHandles = (handles?.length ?? 0) > 0;

  return (
    <div className={`relative w-full ${heightClass} bg-surface overflow-hidden`}>
      <div ref={hostRef} className="absolute inset-0" role="img" aria-label={ariaLabel} />

      <div className="absolute right-2 top-2 flex flex-wrap justify-end items-center gap-1 max-w-[calc(100%-1rem)]">
        <div className="flex bg-surface/95 border border-rule rounded-md p-0.5" role="radiogroup" aria-label="视角">
          {(
            [
              ['iso', '轴测'],
              ['xy', 'xy'],
              ['xz', 'xz'],
              ['yz', 'yz'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={preset === k}
              title={k === 'iso' ? '轴测视角' : `沿法向观察 ${l} 平面`}
              onClick={() => goPreset(k)}
              className={`h-8 px-2 text-[13px] font-mono rounded-[3px] transition-colors ${
                preset === k ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex bg-surface/95 border border-rule rounded-md p-0.5">
          <Tb label={autoRotate ? '停止自动旋转' : '自动旋转'} active={autoRotate} onClick={() => setAutoRotate((v) => !v)}>
            <RotateCw className="w-4 h-4" />
          </Tb>
          <Tb label="复位视角" onClick={() => goPreset('iso')}>
            <RotateCcw className="w-4 h-4" />
          </Tb>
          {hasHandles && (
            <>
              <Tb
                label={vertical ? '当前：竖直拖动（改 z）。点击切换为水平拖动' : '当前：水平拖动（改 x, y）。点击切换为竖直拖动'}
                active={vertical}
                onClick={() => setVertical((v) => !v)}
              >
                {vertical ? <MoveVertical className="w-4 h-4" /> : <Move className="w-4 h-4" />}
              </Tb>
              <Tb label={snap ? '关闭吸附（步长 0.5）' : '开启吸附（步长 0.5）'} active={snap} onClick={() => setSnap((v) => !v)}>
                <Magnet className="w-4 h-4" />
              </Tb>
            </>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute left-2 bottom-2 text-[12px] text-ink-3 bg-surface/90 px-2 py-0.5 rounded-sm">
        {hasHandles
          ? `拖动彩色球体：${vertical ? '竖直改 z' : '水平改 x, y（按住 Shift 改 z）'} · 空白处拖动旋转`
          : '拖动旋转 · 右键平移 · 滚轮缩放'}
      </div>
    </div>
  );
};

const Tb: React.FC<{ label: string; onClick: () => void; active?: boolean; children: React.ReactNode }> = ({
  label,
  onClick,
  active,
  children,
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center rounded-[3px] transition-colors ${
      active ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'
    }`}
  >
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Scene helpers                                                       */
/* ------------------------------------------------------------------ */

const toNum = (c: number | string) => (typeof c === 'string' ? hex(c) : c);

export function solidMaterial(color: number | string, opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: toNum(color),
    roughness: 0.55,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: opacity >= 1,
  });
}

/** Solid arrow made of a cylinder and a cone. */
export function addVector3D(
  group: THREE.Group,
  from: Vec3,
  to: Vec3,
  color: number | string,
  opts: { radius?: number; head?: number; headRadius?: number; opacity?: number; label?: string; labelColor?: string } = {}
) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const len = dir.length();
  if (len < 1e-4) return;
  dir.normalize();
  const r = opts.radius ?? 0.035;
  const headLen = Math.min(opts.head ?? 0.28, len * 0.45);
  const headR = opts.headRadius ?? r * 2.7;
  const mat = solidMaterial(color, opts.opacity ?? 1);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  const shaftLen = len - headLen;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, shaftLen, 14), mat);
  shaft.quaternion.copy(q);
  shaft.position.copy(a.clone().add(dir.clone().multiplyScalar(shaftLen / 2)));
  group.add(shaft);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(headR, headLen, 20), mat);
  cone.quaternion.copy(q);
  cone.position.copy(a.clone().add(dir.clone().multiplyScalar(shaftLen + headLen / 2)));
  group.add(cone);

  if (opts.label) {
    const lp = b.clone().add(dir.clone().multiplyScalar(0.28)).add(new THREE.Vector3(0, 0, 0.12));
    addLabel3D(group, opts.label, lp.toArray() as Vec3, opts.labelColor ?? (typeof color === 'string' ? color : `#${color.toString(16).padStart(6, '0')}`));
  }
}

export function addLabel3D(group: THREE.Group, text: string, pos: Vec3, color: string, extraClass = '') {
  const el = document.createElement('div');
  el.className = `label3d ${extraClass}`.trim();
  el.textContent = text;
  if (!extraClass) el.style.color = color;
  const obj = new CSS2DObject(el);
  obj.position.set(...pos);
  group.add(obj);
  return obj;
}

/** Screen-space thick polyline. width in px. */
export function addFatLine(
  group: THREE.Group,
  pts: Vec3[],
  color: number | string,
  width = 2.5,
  opts: { dashed?: boolean; opacity?: number } = {}
) {
  if (pts.length < 2) return;
  const geom = new LineGeometry();
  geom.setPositions(pts.flat());
  const mat = new LineMaterial({
    color: toNum(color),
    linewidth: width,
    dashed: !!opts.dashed,
    dashSize: 0.12,
    gapSize: 0.08,
    transparent: (opts.opacity ?? 1) < 1,
    opacity: opts.opacity ?? 1,
  });
  const line = new Line2(geom, mat);
  if (opts.dashed) line.computeLineDistances();
  group.add(line);
  return line;
}

export function addPoint3D(group: THREE.Group, pos: Vec3, color: number | string, r = 0.09) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), solidMaterial(color));
  m.position.set(...pos);
  group.add(m);
  return m;
}

/** Filled triangle-fan polygon (convex, planar). */
export function addPolygon3D(group: THREE.Group, pts: Vec3[], color: number | string, opacity = 0.25) {
  const pos: number[] = [];
  for (let i = 1; i < pts.length - 1; i++) pos.push(...pts[0], ...pts[i], ...pts[i + 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, solidMaterial(color, opacity));
  group.add(mesh);
  return mesh;
}
