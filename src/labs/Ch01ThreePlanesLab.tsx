import React, { useState } from 'react';
import { ThreeViewport, addFatLine, addPoint3D, addPolygon3D } from '../components/ThreeViewport';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Status, Swatch, Tasks, Toggle, useLatch } from '../components/ui';
import { computeRref, cross3, dot3, fmt, norm3, nullspaceBasis, type Vec3 } from '../utils/math';
import { C } from '../theme';

type Row = [number, number, number, number];

const PRESETS: { name: string; planes: Row[] }[] = [
  { name: '交于一点', planes: [[1, 0, 0, 0.8], [0, 1, 0, 0.6], [0, 0, 1, 0.9]] },
  { name: '交于一条直线', planes: [[1, 1, 0, 1], [1, -1, 1, 0], [2, 0, 1, 1]] },
  { name: '三棱柱（无解）', planes: [[1, 1, 0, 1.4], [1, -1, 0, 1.4], [2, 0, 0, -1.6]] },
  { name: '两平行一相交', planes: [[0, 0, 1, 1.3], [0, 0, 1, -1.1], [1, 1, 0.4, 0.5]] },
  { name: '三面重合', planes: [[1, 1, 1, 0.8], [2, 2, 2, 1.6], [-1, -1, -1, -0.8]] },
];

const COLORS = [C.blue, C.red, C.green];
const B = 2.8; // half box size for drawing

/** Polygon where plane n·x = d meets the cube [-B,B]^3 */
function planeInBox(n: Vec3, d: number): Vec3[] {
  const pts: Vec3[] = [];
  const corners = [-B, B];
  for (let axis = 0; axis < 3; axis++) {
    const [a1, a2] = [(axis + 1) % 3, (axis + 2) % 3];
    for (const s1 of corners)
      for (const s2 of corners) {
        if (Math.abs(n[axis]) < 1e-9) continue;
        const p: Vec3 = [0, 0, 0];
        p[a1] = s1;
        p[a2] = s2;
        p[axis] = (d - n[a1] * s1 - n[a2] * s2) / n[axis];
        if (Math.abs(p[axis]) <= B + 1e-9) pts.push(p);
      }
  }
  if (pts.length < 3) return [];
  const c: Vec3 = [0, 1, 2].map((i) => pts.reduce((s, p) => s + p[i], 0) / pts.length) as Vec3;
  const e1n = norm3(cross3(n, [1, 0, 0])) > 0.1 ? cross3(n, [1, 0, 0]) : cross3(n, [0, 1, 0]);
  const e2 = cross3(n, e1n);
  return pts
    .map((p) => {
      const r: Vec3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
      return { p, a: Math.atan2(dot3(r, e2), dot3(r, e1n)) };
    })
    .sort((x, y) => x.a - y.a)
    .map((x) => x.p);
}

/** Clip p + t d to the box */
function clipLine(p: Vec3, d: Vec3): [Vec3, Vec3] | null {
  let t0 = -1e9;
  let t1 = 1e9;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-12) {
      if (Math.abs(p[i]) > B) return null;
      continue;
    }
    let a = (-B - p[i]) / d[i];
    let b = (B - p[i]) / d[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
  }
  if (t0 >= t1) return null;
  return [
    [p[0] + t0 * d[0], p[1] + t0 * d[1], p[2] + t0 * d[2]],
    [p[0] + t1 * d[0], p[1] + t1 * d[1], p[2] + t1 * d[2]],
  ];
}

/** Line common to two planes, or null if parallel */
function planePair(a: Row, b: Row): [Vec3, Vec3] | null {
  const n1: Vec3 = [a[0], a[1], a[2]];
  const n2: Vec3 = [b[0], b[1], b[2]];
  const d = cross3(n1, n2);
  if (norm3(d) < 1e-6) return null;
  const { rref, pivots } = computeRref([a, b]);
  const p: Vec3 = [0, 0, 0];
  pivots.forEach((pc, i) => (p[pc] = rref[i][3]));
  return clipLine(p, d);
}

const eqTex = (r: Row) => {
  const t = (c: number, v: string, first: boolean) => {
    if (Math.abs(c) < 1e-9) return '';
    const s = c < 0 ? '-' : first ? '' : '+';
    const m = Math.abs(c) === 1 ? '' : fmt(Math.abs(c));
    return `${s}${m}${v}`;
  };
  let out = '';
  (['x', 'y', 'z'] as const).forEach((v, i) => {
    const part = t(r[i], v, out === '');
    out += part;
  });
  return `${out || '0'} = ${fmt(r[3])}`;
};

export const Ch01ThreePlanesLab: React.FC = () => {
  const [planes, setPlanes] = useState<Row[]>(PRESETS[0].planes);
  const [visible, setVisible] = useState([true, true, true]);
  const [showPairs, setShowPairs] = useState(true);

  const coeff = planes.map((p) => [p[0], p[1], p[2]]);
  const rA = computeRref(coeff).rank;
  const aug = computeRref(planes);
  const rAug = aug.rank;
  const consistent = rA === rAug;

  let solPoint: Vec3 | null = null;
  let solLine: [Vec3, Vec3] | null = null;
  if (consistent) {
    const p: Vec3 = [0, 0, 0];
    aug.pivots.forEach((pc, i) => pc < 3 && (p[pc] = aug.rref[i][3]));
    if (rA === 3) solPoint = p;
    else if (rA === 2) {
      const ns = nullspaceBasis(coeff)[0] as Vec3;
      solLine = clipLine(p, ns);
    }
  }

  const normals = planes.map((p) => [p[0], p[1], p[2]] as Vec3);
  const parallelPairs = [
    [0, 1],
    [0, 2],
    [1, 2],
  ].filter(([i, j]) => norm3(cross3(normals[i], normals[j])) < 1e-6).length;

  const done = useLatch({
    point: rA === 3,
    line: consistent && rA === 2,
    prism: rA === 2 && rAug === 3 && parallelPairs === 0,
    parallel: rAug === 3 && parallelPairs > 0,
  });

  const verdict = !consistent
    ? `rank A = ${rA} < rank Ā = ${rAug}：无解，三张平面没有公共点。`
    : rA === 3
    ? `rank A = rank Ā = 3：唯一解 (${solPoint!.map((x) => fmt(x)).join(', ')})。`
    : `rank A = rank Ā = ${rA}：无穷多解，解集是 ${3 - rA} 维${rA === 2 ? '直线' : '平面'}。`;

  return (
    <LabGrid
      stage={
        <Figure
          caption="平面画在立方体 [−2.8, 2.8]³ 内；细线为两两交线，黑色粗线/点为三者公共部分。"
          legend={
            <>
              {COLORS.map((c, i) => (
                <Swatch key={i} color={c} label={`Π${i + 1}`} />
              ))}
              <Swatch color={C.ink} label="解集" />
            </>
          }
        >
          <ThreeViewport
            deps={[planes, visible, showPairs]}
            gridSize={6}
            cameraPos={[8.4, 6.8, 5.4]}
            buildScene={(g) => {
              planes.forEach((r, i) => {
                if (!visible[i]) return;
                const poly = planeInBox([r[0], r[1], r[2]], r[3]);
                if (poly.length >= 3) {
                  addPolygon3D(g, poly, COLORS[i], 0.28);
                  addFatLine(g, [...poly, poly[0]], COLORS[i], 1.5, { opacity: 0.85 });
                }
              });
              if (showPairs) {
                for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
                  if (!visible[i] || !visible[j]) continue;
                  const seg = planePair(planes[i], planes[j]);
                  if (seg) addFatLine(g, seg, C.ink2, 1.6, { dashed: true, opacity: 0.8 });
                }
              }
              if (solLine) addFatLine(g, solLine, C.ink, 4.5);
              if (solPoint && solPoint.every((x) => Math.abs(x) <= B + 0.5)) addPoint3D(g, solPoint, C.ink, 0.12);
            }}
          />
        </Figure>
      }
      side={
        <>
          <Panel title="增广矩阵 Ā = (A | b)">
            <div className="flex items-start gap-4 flex-wrap">
              <MatrixInput
                ariaLabel="增广矩阵"
                value={planes}
                onChange={(m) => setPlanes(m as Row[])}
                cellClass={(_, c) => (c === 3 ? 'bg-accent-soft' : undefined)}
              />
              <div className="space-y-1 pt-1">
                {planes.map((r, i) => (
                  <Toggle key={i} checked={visible[i]} color={COLORS[i]} onChange={(on) => setVisible((v) => v.map((x, k) => (k === i ? on : x)))}>
                    <span style={{ color: COLORS[i] }} className="font-semibold">Π{i + 1}</span>
                  </Toggle>
                ))}
              </div>
            </div>
            <p className="text-[13px] text-ink-3 -mt-1">每行 (a, b, c | d) 表示平面 ax + by + cz = d。点击数字直接输入，↑/↓ 微调。</p>
            <MathBox>
              {planes.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-0.5 shrink-0" style={{ background: COLORS[i] }} />
                  <Tex math={eqTex(r)} />
                </div>
              ))}
            </MathBox>
            <Status tone={consistent ? 'ok' : 'warn'}>{verdict}</Status>
            <Toggle checked={showPairs} onChange={setShowPairs} color={C.ink2}>显示两两交线</Toggle>
            <Presets items={PRESETS.map((p) => ({ label: p.name, onClick: () => setPlanes(p.planes.map((r) => [...r] as Row)) }))} />
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'point', label: '让三张平面交于唯一一点。' },
              { id: 'line', label: '让解集成为一条直线（三平面共轴）。' },
              { id: 'prism', label: '构造“三棱柱”：两两相交，但三者无公共点。' },
              { id: 'parallel', label: '构造含两张平行平面的无解方程组。' },
            ]}
          />
          <Note>只改常数列 b 时，平面平移而法向不变：rank A 不变，rank Ā 可能改变。这对应第 6 章中“有解当且仅当 b ∈ R(A)”。</Note>
        </>
      }
    />
  );
};
