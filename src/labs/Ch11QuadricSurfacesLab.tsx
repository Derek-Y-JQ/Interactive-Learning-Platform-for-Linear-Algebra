import React, { useState } from 'react';
import * as THREE from 'three';
import { Canvas2D } from '../components/Canvas2D';
import { ThreeViewport, addFatLine, addPoint3D, addPolygon3D, solidMaterial } from '../components/ThreeViewport';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Segmented, SliderField, Status, Swatch, Tasks, Toggle, useLatch } from '../components/ui';
import { fmt, type Vec2, type Vec3 } from '../utils/math';
import { C } from '../theme';

type Kind = 'ellipsoid' | 'hyp1' | 'hyp2' | 'eparab' | 'hparab' | 'cone';

const SURF: { id: Kind; name: string; eq: (a: number, b: number, c: number) => string; ruled?: boolean }[] = [
  { id: 'ellipsoid', name: '椭球面', eq: (a, b, c) => `\\frac{x^2}{${fmt(a)}^2}+\\frac{y^2}{${fmt(b)}^2}+\\frac{z^2}{${fmt(c)}^2}=1` },
  { id: 'hyp1', name: '单叶双曲面', eq: (a, b, c) => `\\frac{x^2}{${fmt(a)}^2}+\\frac{y^2}{${fmt(b)}^2}-\\frac{z^2}{${fmt(c)}^2}=1`, ruled: true },
  { id: 'hyp2', name: '双叶双曲面', eq: (a, b, c) => `\\frac{x^2}{${fmt(a)}^2}+\\frac{y^2}{${fmt(b)}^2}-\\frac{z^2}{${fmt(c)}^2}=-1` },
  { id: 'eparab', name: '椭圆抛物面', eq: (a, b) => `z=\\frac{x^2}{${fmt(a)}^2}+\\frac{y^2}{${fmt(b)}^2}` },
  { id: 'hparab', name: '双曲抛物面', eq: (a, b) => `z=\\frac{x^2}{${fmt(a)}^2}-\\frac{y^2}{${fmt(b)}^2}`, ruled: true },
  { id: 'cone', name: '二次锥面', eq: (a, b, c) => `\\frac{x^2}{${fmt(a)}^2}+\\frac{y^2}{${fmt(b)}^2}-\\frac{z^2}{${fmt(c)}^2}=0` },
];

const LIM = 3;

function paramMesh(u0: number, u1: number, v0: number, v1: number, nu: number, nv: number, fn: (u: number, v: number) => Vec3, color: string, g: THREE.Group, wire = true) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) pos.push(...fn(u0 + ((u1 - u0) * i) / nu, v0 + ((v1 - v0) * j) / nv));
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      idx.push(a, a + 1, a + nu + 2, a, a + nu + 2, a + nu + 1);
    }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geom.setIndex(idx);
  geom.computeVertexNormals();
  g.add(new THREE.Mesh(geom, solidMaterial(color, 0.5)));
  if (!wire) return;
  for (let i = 0; i <= nu; i += Math.max(1, Math.round(nu / 16))) {
    const pts: Vec3[] = [];
    for (let j = 0; j <= nv; j++) pts.push(fn(u0 + ((u1 - u0) * i) / nu, v0 + ((v1 - v0) * j) / nv));
    addFatLine(g, pts, color, 0.8, { opacity: 0.45 });
  }
  for (let j = 0; j <= nv; j += Math.max(1, Math.round(nv / 8))) {
    const pts: Vec3[] = [];
    for (let i = 0; i <= nu; i++) pts.push(fn(u0 + ((u1 - u0) * i) / nu, v0 + ((v1 - v0) * j) / nv));
    addFatLine(g, pts, color, 0.8, { opacity: 0.45 });
  }
}

/** Cross-section with z = h, as a list of 2D polylines (+ a flag for a single point). */
function section(kind: Kind, a: number, b: number, c: number, h: number): { curves: Vec2[][]; point?: boolean; text: string } {
  const ell = (rhs: number): Vec2[][] => {
    const s = Math.sqrt(rhs);
    return [Array.from({ length: 121 }, (_, k) => [a * s * Math.cos((2 * Math.PI * k) / 120), b * s * Math.sin((2 * Math.PI * k) / 120)] as Vec2)];
  };
  const eps = 0.02;
  switch (kind) {
    case 'ellipsoid': {
      const r = 1 - (h * h) / (c * c);
      if (r > eps) return { curves: ell(r), text: '椭圆' };
      if (r > -eps) return { curves: [], point: true, text: '一点（切平面）' };
      return { curves: [], text: '空集' };
    }
    case 'hyp1':
      return { curves: ell(1 + (h * h) / (c * c)), text: '椭圆（|h| 越大越大）' };
    case 'hyp2': {
      const r = (h * h) / (c * c) - 1;
      if (r > eps) return { curves: ell(r), text: '椭圆' };
      if (r > -eps) return { curves: [], point: true, text: '一点（顶点）' };
      return { curves: [], text: '空集（两叶之间）' };
    }
    case 'eparab':
      if (h > eps) return { curves: ell(h), text: '椭圆' };
      if (h > -eps) return { curves: [], point: true, text: '一点（顶点）' };
      return { curves: [], text: '空集' };
    case 'cone':
      if (Math.abs(h) > eps) return { curves: ell((h * h) / (c * c)), text: '椭圆' };
      return { curves: [], point: true, text: '一点（锥顶）' };
    case 'hparab': {
      if (Math.abs(h) < eps) {
        return {
          curves: [
            [[-LIM, (-b / a) * LIM], [LIM, (b / a) * LIM]],
            [[-LIM, (b / a) * LIM], [LIM, (-b / a) * LIM]],
          ],
          text: '一对相交直线',
        };
      }
      const s = Math.sqrt(Math.abs(h));
      const br = (sign: number): Vec2[] =>
        Array.from({ length: 81 }, (_, k) => {
          const t = -2.5 + (5 * k) / 80;
          return h > 0 ? ([sign * a * s * Math.cosh(t), b * s * Math.sinh(t)] as Vec2) : ([a * s * Math.sinh(t), sign * b * s * Math.cosh(t)] as Vec2);
        }).filter((p) => Math.abs(p[0]) <= LIM && Math.abs(p[1]) <= LIM);
      return { curves: [br(1), br(-1)], text: h > 0 ? '双曲线（实轴沿 x）' : '双曲线（实轴沿 y）' };
    }
  }
}

export const Ch11QuadricSurfacesLab: React.FC = () => {
  const [kind, setKind] = useState<Kind>('hyp1');
  const [a, setA] = useState(1.4);
  const [b, setB] = useState(1.1);
  const [c, setC] = useState(1.2);
  const [cut, setCut] = useState(true);
  const [h, setH] = useState(0.6);
  const [rulings, setRulings] = useState(true);
  const [phi, setPhi] = useState(0.6);
  const [wire, setWire] = useState(true);

  const cur = SURF.find((s) => s.id === kind)!;
  const sec = section(kind, a, b, c, h);

  const done = useLatch({
    lines: kind === 'hparab' && cut && Math.abs(h) < 0.02,
    tangent: kind === 'ellipsoid' && cut && !!sec.point,
    empty: kind === 'hyp2' && cut && sec.curves.length === 0 && !sec.point,
    swap: kind === 'hparab' && cut && h < -0.2,
    ruled: !!cur.ruled && rulings,
  });

  return (
    <LabGrid
      stage={
        <>
          <Figure
            caption="半透明曲面 + 参数网格；黄色平面为 z = h，黑色粗线为截线。"
            legend={
              <>
                {cut && <Swatch color={C.ink} label="截线" />}
                {cur.ruled && rulings && (
                  <>
                    <Swatch color={C.red} label="第一族直母线" />
                    <Swatch color={C.green} label="第二族直母线" />
                  </>
                )}
              </>
            }
          >
            <ThreeViewport
              deps={[kind, a, b, c, cut, h, rulings, phi, wire]}
              gridSize={6}
              cameraPos={[8.6, 7, 5.4]}
              buildScene={(g) => {
                const col = C.blue;
                if (kind === 'ellipsoid') paramMesh(0, 2 * Math.PI, 0, Math.PI, 64, 32, (u, v) => [a * Math.sin(v) * Math.cos(u), b * Math.sin(v) * Math.sin(u), c * Math.cos(v)], col, g, wire);
                if (kind === 'hyp1') {
                  const vm = Math.asinh(LIM / c);
                  paramMesh(0, 2 * Math.PI, -vm, vm, 64, 24, (u, v) => [a * Math.cosh(v) * Math.cos(u), b * Math.cosh(v) * Math.sin(u), c * Math.sinh(v)], col, g, wire);
                }
                if (kind === 'hyp2') {
                  const vm = Math.acosh(LIM / c);
                  for (const s of [1, -1]) paramMesh(0, 2 * Math.PI, 0, vm, 64, 20, (u, v) => [a * Math.sinh(v) * Math.cos(u), b * Math.sinh(v) * Math.sin(u), s * c * Math.cosh(v)], C.violet, g, wire);
                }
                if (kind === 'eparab') paramMesh(0, 2 * Math.PI, 0, Math.sqrt(LIM), 64, 20, (u, r) => [a * r * Math.cos(u), b * r * Math.sin(u), r * r], C.green, g, wire);
                if (kind === 'hparab') paramMesh(-2.4, 2.4, -2.4, 2.4, 40, 40, (x, y) => [x, y, Math.max(-LIM, Math.min(LIM, (x * x) / (a * a) - (y * y) / (b * b)))], col, g, wire);
                if (kind === 'cone') paramMesh(0, 2 * Math.PI, -LIM / c, LIM / c, 64, 24, (u, t) => [a * t * Math.cos(u), b * t * Math.sin(u), c * t], C.green, g, wire);

                if (cur.ruled && rulings) {
                  const fam = (th: number, sgn: number, T: number): [Vec3, Vec3] | null => {
                    if (kind === 'hyp1') {
                      const p = (t: number): Vec3 => [a * (Math.cos(th) - sgn * t * Math.sin(th)), b * (Math.sin(th) + sgn * t * Math.cos(th)), c * t];
                      return [p(-T), p(T)];
                    }
                    // hyperbolic paraboloid: x/a − y/b = s, z = s(x/a + y/b)  (sgn = 1);  x/a + y/b = s, z = s(x/a − y/b)  (sgn = −1)
                    const s = th;
                    const p = (t: number): Vec3 => (sgn > 0 ? [(a * (t + s)) / 2, (b * (t - s)) / 2, s * t] : [(a * (t + s)) / 2, (b * (s - t)) / 2, s * t]);
                    return [p(-T), p(T)];
                  };
                  const N = 18;
                  for (let k = 0; k < N; k++) {
                    const th = kind === 'hyp1' ? (2 * Math.PI * k) / N : -1.6 + (3.2 * k) / (N - 1);
                    const T = kind === 'hyp1' ? LIM / c : 2.2;
                    const l1 = fam(th, 1, T);
                    const l2 = fam(th, -1, T);
                    if (l1) addFatLine(g, l1, C.red, 1, { opacity: 0.55 });
                    if (l2) addFatLine(g, l2, C.green, 1, { opacity: 0.55 });
                  }
                  // the two rulings through one chosen point
                  if (kind === 'hyp1') {
                    const P: Vec3 = [a * Math.cos(phi), b * Math.sin(phi), 0];
                    addFatLine(g, fam(phi, 1, LIM / c)!, C.red, 4);
                    addFatLine(g, fam(phi, -1, LIM / c)!, C.green, 4);
                    addPoint3D(g, P, C.ink, 0.09);
                  } else {
                    const s = phi - 1.6;
                    const l1 = fam(s, 1, 2.2)!;
                    addFatLine(g, l1, C.red, 4);
                    const l2 = fam(s, -1, 2.2)!;
                    addFatLine(g, l2, C.green, 4);
                    addPoint3D(g, [a * s, 0, s * s], C.ink, 0.09);
                  }
                }

                if (cut) {
                  addPolygon3D(g, [[-LIM, -LIM, h], [LIM, -LIM, h], [LIM, LIM, h], [-LIM, LIM, h]], C.accent, 0.12);
                  addFatLine(g, [[-LIM, -LIM, h], [LIM, -LIM, h], [LIM, LIM, h], [-LIM, LIM, h], [-LIM, -LIM, h]], C.accent, 1, { opacity: 0.6 });
                  sec.curves.forEach((cv) => addFatLine(g, cv.map((p) => [p[0], p[1], h] as Vec3), C.ink, 4));
                  if (sec.point) addPoint3D(g, [0, 0, h], C.ink, 0.1);
                }
              }}
            />
          </Figure>
          {cut && (
            <Figure caption={<>截线 z = {fmt(h)}：{sec.text}</>}>
              <Canvas2D range={LIM} aspect={2} toolbar={false} pannable={false}>
                {({ toSvg }) => (
                  <g>
                    {sec.curves.map((cv, i) => (
                      <polyline key={i} points={cv.map((p) => toSvg(p).join(',')).join(' ')} fill="none" stroke={C.ink} strokeWidth={2.6} />
                    ))}
                    {sec.point && <circle cx={toSvg([0, 0])[0]} cy={toSvg([0, 0])[1]} r={5} fill={C.ink} />}
                  </g>
                )}
              </Canvas2D>
            </Figure>
          )}
        </>
      }
      side={
        <>
          <Panel title="曲面">
            <Segmented ariaLabel="选择曲面" size="sm" wrap value={kind} onChange={setKind} options={SURF.map((s) => ({ value: s.id, label: s.name }))} />
            <MathBox>
              <Tex block math={cur.eq(a, b, c)} />
            </MathBox>
            <SliderField label="a" value={a} min={0.6} max={2.4} step={0.05} onChange={setA} />
            <SliderField label="b" value={b} min={0.6} max={2.4} step={0.05} onChange={setB} />
            {!['eparab', 'hparab'].includes(kind) && <SliderField label="c" value={c} min={0.6} max={2.4} step={0.05} onChange={setC} />}
            <Toggle checked={wire} onChange={setWire}>参数网格线</Toggle>
          </Panel>
          <Panel title="截平面 z = h">
            <Toggle checked={cut} onChange={setCut} color={C.accent}>显示截平面与截线</Toggle>
            {cut && (
              <>
                <SliderField label="h" value={h} min={-LIM} max={LIM} step={0.02} color={C.accent} onChange={setH} />
                <Status tone="info">截线：{sec.text}</Status>
              </>
            )}
          </Panel>
          {cur.ruled && (
            <Panel title="直母线">
              <Toggle checked={rulings} onChange={setRulings} color={C.red}>显示两族直母线</Toggle>
              {rulings && <SliderField label={kind === 'hyp1' ? '腰椭圆上的点（参数 φ）' : '腰线上的点'} value={phi} min={0} max={kind === 'hyp1' ? 6.28 : 3.2} step={0.02} onChange={setPhi} />}
              <p className="text-[14px] text-ink-2">曲面上每一点恰有两条直母线经过（粗线），分别属于两族；同族的两条直线异面，异族的两条直线共面。</p>
            </Panel>
          )}
          <Tasks
            done={done}
            items={[
              { id: 'tangent', label: '椭球面：调 h 使截线退化为一点。' },
              { id: 'empty', label: '双叶双曲面：找到截线为空集的 h。' },
              { id: 'lines', label: '马鞍面：找到截线为一对相交直线的 h。' },
              { id: 'swap', label: '马鞍面：让 h < 0，观察双曲线实轴换了方向。' },
              { id: 'ruled', label: '打开直纹面的两族直母线。' },
            ]}
          />
          <Note>二次曲面的分类（第 11 章）就是把二次型部分正交对角化、一次项配方后，按惯性指数与常数项讨论——与第 10 章完全同构。</Note>
        </>
      }
    />
  );
};
