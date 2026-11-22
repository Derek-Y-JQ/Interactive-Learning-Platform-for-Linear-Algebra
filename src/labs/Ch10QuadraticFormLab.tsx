import React, { useState } from 'react';
import * as THREE from 'three';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { ThreeViewport, addFatLine, addPoint3D } from '../components/ThreeViewport';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { eigen2, fmt, type Mat2, type Vec2, type Vec3 } from '../utils/math';
import { C } from '../theme';

const K = 0.35; // vertical exaggeration for the surface
const SPAN = 2.4;

export const Ch10QuadraticFormLab: React.FC = () => {
  const [a, setA] = useState(1.2);
  const [b, setB] = useState(0.5);
  const [c, setC] = useState(0.8);
  const [theta, setTheta] = useState(0.5);

  const q = (x: number, y: number) => a * x * x + 2 * b * x * y + c * y * y;
  const A: Mat2 = [
    [a, b],
    [b, c],
  ];
  const eig = eigen2(A);
  const l1 = Math.max(eig.values[0].re, eig.values[1].re);
  const l2 = Math.min(eig.values[0].re, eig.values[1].re);
  const vecs = eig.vectors.length === 2 ? eig.vectors : [[1, 0], [0, 1]] as Vec2[];
  const vmax = eig.values[0].re >= eig.values[1].re ? vecs[0] : vecs[1];
  const vmin = eig.values[0].re >= eig.values[1].re ? vecs[1] : vecs[0];
  const p = [l1, l2].filter((x) => x > 1e-6).length;
  const nq = [l1, l2].filter((x) => x < -1e-6).length;
  const kind =
    p === 2 ? '正定：椭圆抛物面' : nq === 2 ? '负定：开口向下' : p === 1 && nq === 1 ? '不定：马鞍面' : p === 1 ? '半正定：抛物柱面' : nq === 1 ? '半负定' : '零二次型';

  const x: Vec2 = [Math.cos(theta), Math.sin(theta)];
  const R = q(x[0], x[1]);

  const done = useLatch({
    indef: p === 1 && nq === 1,
    semi: p === 1 && nq === 0,
    max: Math.abs(R - l1) < 0.005 && Math.abs(l1 - l2) > 0.2,
    min: Math.abs(R - l2) < 0.005 && Math.abs(l1 - l2) > 0.2,
  });

  const levels = [-3, -2, -1, -0.5, 0.5, 1, 2, 3];

  return (
    <LabGrid
      stage={
        <>
          <Figure
            caption={`曲面 z = ${K}·q(x, y)；彩色曲线为单位圆在曲面上的提升，红点为当前 x。`}
            legend={
              <>
                <Swatch color={C.blue} label="q > 0" />
                <Swatch color={C.red} label="q < 0" />
                <Swatch color={C.violet} label="R(x)" />
              </>
            }
          >
            <ThreeViewport
              deps={[a, b, c, theta]}
              gridSize={6}
              cameraPos={[6.8, -5.8, 5.2]}
              heightClass="h-[360px] sm:h-[420px]"
              buildScene={(g) => {
                const seg = 60;
                const pos: number[] = [];
                const col: number[] = [];
                const idx: number[] = [];
                const cp = new THREE.Color(C.blue);
                const cm = new THREE.Color('#E9E5DC');
                const cn = new THREE.Color(C.red);
                for (let i = 0; i <= seg; i++)
                  for (let j = 0; j <= seg; j++) {
                    const X = -SPAN + (2 * SPAN * j) / seg;
                    const Y = -SPAN + (2 * SPAN * i) / seg;
                    const z = Math.max(-2.8, Math.min(2.8, K * q(X, Y)));
                    pos.push(X, Y, z);
                    const t = Math.max(-1, Math.min(1, z / 2));
                    const cc = t >= 0 ? cm.clone().lerp(cp, t) : cm.clone().lerp(cn, -t);
                    col.push(cc.r, cc.g, cc.b);
                  }
                for (let i = 0; i < seg; i++)
                  for (let j = 0; j < seg; j++) {
                    const i0 = i * (seg + 1) + j;
                    idx.push(i0, i0 + 1, i0 + seg + 2, i0, i0 + seg + 2, i0 + seg + 1);
                  }
                const geom = new THREE.BufferGeometry();
                geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
                geom.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
                geom.setIndex(idx);
                geom.computeVertexNormals();
                g.add(new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7, transparent: true, opacity: 0.9 })));
                // mesh lines
                for (let i = 0; i <= seg; i += 6) {
                  const r1: Vec3[] = [];
                  const r2: Vec3[] = [];
                  for (let j = 0; j <= seg; j++) {
                    const s = -SPAN + (2 * SPAN * j) / seg;
                    const t = -SPAN + (2 * SPAN * i) / seg;
                    r1.push([s, t, Math.max(-2.8, Math.min(2.8, K * q(s, t)))]);
                    r2.push([t, s, Math.max(-2.8, Math.min(2.8, K * q(t, s)))]);
                  }
                  addFatLine(g, r1, C.ink, 0.8, { opacity: 0.25 });
                  addFatLine(g, r2, C.ink, 0.8, { opacity: 0.25 });
                }
                const ring: Vec3[] = [];
                const lift: Vec3[] = [];
                for (let k = 0; k <= 96; k++) {
                  const t = (2 * Math.PI * k) / 96;
                  ring.push([Math.cos(t), Math.sin(t), 0]);
                  lift.push([Math.cos(t), Math.sin(t), K * q(Math.cos(t), Math.sin(t))]);
                }
                addFatLine(g, ring, C.ink2, 1.2, { dashed: true });
                addFatLine(g, lift, C.violet, 3);
                addFatLine(g, [[x[0], x[1], 0], [x[0], x[1], K * R]], C.red, 1.5, { dashed: true });
                addPoint3D(g, [x[0], x[1], K * R], C.red, 0.09);
                for (const [v, colr] of [[vmax, C.blue], [vmin, C.red]] as const) {
                  addFatLine(g, [[-2.6 * v[0], -2.6 * v[1], 0], [2.6 * v[0], 2.6 * v[1], 0]], colr, 2, { opacity: 0.8 });
                }
              }}
            />
          </Figure>
          <Figure caption="等高线 q(x, y) = c（c = ±0.5, ±1, ±2, ±3）与主轴；在单位圆上拖动 x。">
            <Canvas2D
              range={2.4}
              aspect={1.6}
              handles={[{ id: 'x', pos: x, color: C.red, label: 'x', hideCoords: true, onChange: (pp) => setTheta(Math.atan2(pp[1], pp[0])), constrain: (pp) => { const n = Math.hypot(pp[0], pp[1]) || 1; return [pp[0] / n, pp[1] / n]; }, snap: 0.0001 }]}
            >
              {({ toSvg, scale, cx, cy, line, view }) => {
                const o = toSvg([0, 0]);
                const maxR = Math.hypot(view.xmax - view.xmin, view.ymax - view.ymin);
                const curves: React.ReactNode[] = [];
                levels.forEach((lv) => {
                  let seg: string[] = [];
                  const segs: string[][] = [];
                  for (let k = 0; k <= 720; k++) {
                    const t = (2 * Math.PI * k) / 720;
                    const Rt = q(Math.cos(t), Math.sin(t));
                    const ok = Rt * lv > 1e-9 && Math.sqrt(lv / Rt) < maxR;
                    if (ok) {
                      const r = Math.sqrt(lv / Rt);
                      seg.push(toSvg([r * Math.cos(t), r * Math.sin(t)]).join(','));
                    } else if (seg.length) {
                      segs.push(seg);
                      seg = [];
                    }
                  }
                  if (seg.length) segs.push(seg);
                  segs.forEach((s, i) =>
                    curves.push(<polyline key={`${lv}-${i}`} points={s.join(' ')} fill="none" stroke={lv > 0 ? C.blue : C.red} strokeOpacity={0.25 + 0.15 * Math.min(3, Math.abs(lv))} strokeWidth={1.4} />)
                  );
                });
                return (
                  <g>
                    {curves}
                    <line {...line([0, 0], vmax)} stroke={C.blue} strokeDasharray="6 4" strokeOpacity={0.7} />
                    <line {...line([0, 0], vmin)} stroke={C.red} strokeDasharray="6 4" strokeOpacity={0.7} />
                    <circle cx={cx} cy={cy} r={scale} fill="none" stroke={C.ink2} strokeDasharray="3 3" />
                    <SvgArrow from={o} to={toSvg(x)} color={C.red} width={2.4} />
                    <SvgLabel at={toSvg([vmax[0] * 2, vmax[1] * 2])} color={C.blue} size={14}>最大特征值方向</SvgLabel>
                  </g>
                );
              }}
            </Canvas2D>
          </Figure>
        </>
      }
      side={
        <>
          <Panel title="q(x, y) = ax² + 2bxy + cy²">
            <SliderField label="a" value={a} min={-2} max={2} step={0.05} onChange={setA} />
            <SliderField label="b" value={b} min={-2} max={2} step={0.05} onChange={setB} />
            <SliderField label="c" value={c} min={-2} max={2} step={0.05} onChange={setC} />
            <Status tone={p === 2 ? 'ok' : nq > 0 && p > 0 ? 'warn' : 'info'}>
              {kind}；惯性指数 (p, q) = ({p}, {nq})
            </Status>
            <MathBox>
              <Tex block math={`A = \\begin{pmatrix}${fmt(a)} & ${fmt(b)}\\\\ ${fmt(b)} & ${fmt(c)}\\end{pmatrix},\\quad \\Delta_1 = ${fmt(a)},\\ \\Delta_2 = ${fmt(a * c - b * b)}`} />
              <Tex block math={`q = ${fmt(l1)}\\,\\xi^2 ${l2 >= 0 ? '+' : '-'} ${fmt(Math.abs(l2))}\\,\\eta^2\\quad(\\text{正交标准形})`} />
            </MathBox>
            <Presets
              items={[
                { label: '正定', onClick: () => { setA(1.4); setB(0.5); setC(1); } },
                { label: '不定', onClick: () => { setA(1); setB(1.2); setC(-0.5); } },
                { label: '半正定', onClick: () => { setA(1); setB(1); setC(1); } },
                { label: '负定', onClick: () => { setA(-1.2); setB(0.3); setC(-0.9); } },
              ]}
            />
          </Panel>
          <Panel title="Rayleigh 商">
            <MathBox>
              <Tex block math={`R(\\bm x) = \\frac{\\bm x^{\\top}A\\bm x}{\\bm x^{\\top}\\bm x} = ${fmt(R, 3)}`} />
              <Tex block math={`\\lambda_{\\min} = ${fmt(l2, 3)} \\le R(\\bm x) \\le ${fmt(l1, 3)} = \\lambda_{\\max}`} />
            </MathBox>
            <div className="h-2 rounded-full bg-sunken relative" aria-hidden="true">
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-fig-red border-2 border-surface" style={{ left: `calc(${l1 - l2 > 1e-9 ? ((R - l2) / (l1 - l2)) * 100 : 50}% - 6px)` }} />
            </div>
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'indef', label: '调出不定二次型（马鞍面）。' },
              { id: 'semi', label: '调出半正定但不正定的二次型（Δ₂ = 0）。' },
              { id: 'max', label: '在单位圆上拖动 x，使 R(x) 达到最大值。' },
              { id: 'min', label: '再找到最小值点，确认它与最大值方向垂直。' },
            ]}
          />
          <Note>Sylvester 判据：A 正定当且仅当所有顺序主子式 Δₖ &gt; 0。而 (p, q) 在合同变换下不变——无论怎样换元，正、负项的个数都不变。</Note>
        </>
      }
    />
  );
};
