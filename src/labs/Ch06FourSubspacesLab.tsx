import React, { useState } from 'react';
import { Tex } from '../components/MathText';
import { LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, Status, Tasks, useLatch } from '../components/ui';
import { computeRref, fmt, nullspaceBasis, transpose } from '../utils/math';
import { C } from '../theme';

type M = number[][];

const EXAMPLES: { name: string; A: M }[] = [
  { name: '2×3 秩 2', A: [[1, 2, 1], [0, 1, -1]] },
  { name: '3×2 秩 2', A: [[1, 0], [1, 1], [0, 1]] },
  { name: '3×3 秩 1', A: [[1, 2, -1], [2, 4, -2], [-1, -2, 1]] },
  { name: '3×4 秩 2', A: [[1, 2, 0, 1], [2, 4, 1, 3], [3, 6, 1, 4]] },
];

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

function orthonormal(vs: number[][]): number[][] {
  const out: number[][] = [];
  for (const v of vs) {
    let w = [...v];
    for (const e of out) {
      const c = dot(w, e);
      w = w.map((x, i) => x - c * e[i]);
    }
    const n = Math.hypot(...w);
    if (n > 1e-9) out.push(w.map((x) => x / n));
  }
  return out;
}

const projOnto = (x: number[], basis: number[][]) => {
  const on = orthonormal(basis);
  const p = new Array(x.length).fill(0);
  for (const e of on) {
    const c = dot(x, e);
    e.forEach((v, i) => (p[i] += c * v));
  }
  return p;
};

const vecTex = (v: number[]) => `\\begin{pmatrix}${v.map((x) => fmt(x)).join('\\\\')}\\end{pmatrix}`;
const basisTex = (vs: number[][]) =>
  vs.length === 0 ? '\\{\\bm 0\\}' : `\\operatorname{span}\\left\\{${vs.map(vecTex).join(',\\,')}\\right\\}`;

/** Block diagram in the style of Strang's "big picture" */
const BigPicture: React.FC<{ m: number; n: number; r: number }> = ({ m, n, r }) => {
  const H = 220;
  const box = (x: number, total: number, top: number, label: [string, string], colors: [string, string], dims: [number, number]) => {
    const h1 = total === 0 ? 0 : (dims[0] / total) * H;
    return (
      <g>
        <rect x={x} y={top} width={150} height={Math.max(h1, 0)} fill={colors[0]} fillOpacity={0.12} stroke={colors[0]} />
        <rect x={x} y={top + h1} width={150} height={Math.max(H - h1, 0)} fill={colors[1]} fillOpacity={0.12} stroke={colors[1]} />
        {dims[0] > 0 && (
          <text x={x + 75} y={top + h1 / 2 + 5} textAnchor="middle" fontSize={15} fill={colors[0]} className="fig-label">
            {label[0]} · dim {dims[0]}
          </text>
        )}
        {dims[1] > 0 && (
          <text x={x + 75} y={top + h1 + (H - h1) / 2 + 5} textAnchor="middle" fontSize={15} fill={colors[1]} className="fig-label">
            {label[1]} · dim {dims[1]}
          </text>
        )}
      </g>
    );
  };
  const rowH = n === 0 ? 0 : (r / n) * H;
  const colH = m === 0 ? 0 : (r / m) * H;
  return (
    <svg viewBox="0 0 520 280" className="w-full max-w-[560px] mx-auto" role="img" aria-label={`四个子空间示意：定义域 R^${n}，陪域 R^${m}，秩 ${r}`}>
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={C.ink} />
        </marker>
      </defs>
      <text x={95} y={24} textAnchor="middle" fontSize={17} className="fig-label" fill={C.ink}>ℝ{['⁰', '¹', '²', '³', '⁴', '⁵'][n]}（定义域）</text>
      <text x={425} y={24} textAnchor="middle" fontSize={17} className="fig-label" fill={C.ink}>ℝ{['⁰', '¹', '²', '³', '⁴', '⁵'][m]}（陪域）</text>
      {box(20, n, 40, ['R(Aᵀ)', 'N(A)'], [C.blue, C.red], [r, n - r])}
      {box(350, m, 40, ['R(A)', 'N(Aᵀ)'], [C.green, C.violet], [r, m - r])}
      {r > 0 && <line x1={172} y1={40 + rowH / 2} x2={346} y2={40 + colH / 2} stroke={C.ink} strokeWidth={1.6} markerEnd="url(#ah)" />}
      {r > 0 && <text x={259} y={40 + (rowH + colH) / 4 - 6} textAnchor="middle" fontSize={14} className="fig-label" fill={C.ink2}>A：同构</text>}
      {n - r > 0 && (
        <>
          <line x1={172} y1={40 + rowH + (H - rowH) / 2} x2={250} y2={250} stroke={C.red} strokeWidth={1.4} strokeDasharray="5 3" markerEnd="url(#ah)" />
          <circle cx={256} cy={254} r={6} fill={C.surface} stroke={C.ink} />
          <text x={268} y={259} fontSize={14} className="fig-label" fill={C.ink2}>0</text>
        </>
      )}
    </svg>
  );
};

export const Ch06FourSubspacesLab: React.FC = () => {
  const [A, setA] = useState<M>(EXAMPLES[0].A);
  const [x, setX] = useState<number[]>([1, 1, 1]);
  const [b, setB] = useState<number[]>([1, 2]);

  const m = A.length;
  const n = A[0].length;
  const { rref, pivots, rank } = computeRref(A);
  const rowBasis = rref.slice(0, rank);
  const colBasis = pivots.map((pc) => A.map((row) => row[pc]));
  const nullB = nullspaceBasis(A);
  const leftNullB = nullspaceBasis(transpose(A));

  const xs = x.length === n ? x : Array.from({ length: n }, (_, i) => x[i] ?? 0);
  const bs = b.length === m ? b : Array.from({ length: m }, (_, i) => b[i] ?? 0);
  const xn = projOnto(xs, nullB);
  const xr = xs.map((v, i) => v - xn[i]);
  const Ax = A.map((row) => dot(row, xs));
  const bLeft = projOnto(bs, leftNullB);
  const solvable = Math.hypot(...bLeft) < 1e-6;

  const resize = (mm: number, nn: number) => {
    setA(Array.from({ length: mm }, (_, i) => Array.from({ length: nn }, (_, j) => A[i]?.[j] ?? 0)));
    setX(Array.from({ length: nn }, (_, i) => x[i] ?? 0));
    setB(Array.from({ length: mm }, (_, i) => b[i] ?? 0));
  };

  const done = useLatch({
    rank1: rank === 1 && m >= 2 && n >= 2,
    unsolvable: !solvable,
    fullcol: nullB.length === 0 && n >= 2,
    nullx: nullB.length > 0 && Math.hypot(...Ax) < 1e-6 && Math.hypot(...xs) > 0.1,
  });

  return (
    <LabGrid
      wideStage
      stage={
        <>
          <Panel title="A 与它的行最简形">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2">
                <Tex math="A =" />
                <MatrixInput ariaLabel="矩阵 A" value={A} onChange={setA} step={1} />
              </div>
              <div className="flex items-center gap-2">
                <Tex math="\operatorname{rref}(A) =" />
                <div className="pmatrix inline-block">
                  <div className="grid gap-x-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(2.8rem, auto))` }}>
                    {rref.map((r, i) =>
                      r.map((v, j) => (
                        <span
                          key={`${i}${j}`}
                          className={`h-8 flex items-center justify-center font-mono text-[14px] rounded-[3px] ${pivots[i] === j ? 'bg-primary text-white font-bold' : Math.abs(v) < 1e-9 ? 'text-ink-3' : ''}`}
                        >
                          {fmt(v)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[14px] text-ink-2">
              主元列 {pivots.map((p) => p + 1).join(', ') || '—'}，秩 r = {rank}；自由变量 {n - rank} 个。
            </p>
          </Panel>

          <Panel title="全景图">
            <BigPicture m={m} n={n} r={rank} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MathBox><div className="text-[13px] font-bold" style={{ color: C.blue }}>行空间 R(Aᵀ)</div><Tex block math={basisTex(rowBasis)} /></MathBox>
              <MathBox><div className="text-[13px] font-bold" style={{ color: C.green }}>列空间 R(A)</div><Tex block math={basisTex(colBasis)} /></MathBox>
              <MathBox><div className="text-[13px] font-bold" style={{ color: C.red }}>零空间 N(A)</div><Tex block math={basisTex(nullB)} /></MathBox>
              <MathBox><div className="text-[13px] font-bold" style={{ color: C.violet }}>左零空间 N(Aᵀ)</div><Tex block math={basisTex(leftNullB)} /></MathBox>
            </div>
          </Panel>
        </>
      }
      side={
        <>
          <Panel title="尺寸">
            <div className="space-y-2">
              <div className="flex items-center gap-3"><span className="text-[14px] text-ink-2 w-10">行 m</span><Segmented ariaLabel="行数" size="sm" value={m} onChange={(v) => resize(v, n)} options={[1, 2, 3, 4].map((k) => ({ value: k, label: String(k) }))} /></div>
              <div className="flex items-center gap-3"><span className="text-[14px] text-ink-2 w-10">列 n</span><Segmented ariaLabel="列数" size="sm" value={n} onChange={(v) => resize(m, v)} options={[1, 2, 3, 4].map((k) => ({ value: k, label: String(k) }))} /></div>
            </div>
            <Presets items={EXAMPLES.map((e) => ({ label: e.name, onClick: () => { setA(e.A.map((r) => [...r])); setX(new Array(e.A[0].length).fill(1)); setB(new Array(e.A.length).fill(1)); } }))} />
          </Panel>

          <Panel title="分解 x = xᵣ + xₙ">
            <div className="flex items-center gap-2">
              <Tex math="\bm x =" />
              <MatrixInput ariaLabel="向量 x" value={xs.map((v) => [v])} onChange={(mm) => setX(mm.map((r) => r[0]))} step={1} />
            </div>
            <MathBox>
              <Tex block math={`\\bm x = \\underbrace{${vecTex(xr)}}_{\\in R(A^\\top)} + \\underbrace{${vecTex(xn)}}_{\\in N(A)}`} />
              <Tex block math={`A\\bm x = A\\bm x_r = ${vecTex(Ax)}`} />
            </MathBox>
          </Panel>

          <Panel title="Ax = b 是否有解">
            <div className="flex items-center gap-2">
              <Tex math="\bm b =" />
              <MatrixInput ariaLabel="向量 b" value={bs.map((v) => [v])} onChange={(mm) => setB(mm.map((r) => r[0]))} step={1} />
            </div>
            <Status tone={solvable ? 'ok' : 'warn'}>
              {solvable ? 'b ∈ R(A)，即 b ⊥ N(Aᵀ)：方程有解。' : `b 在 N(Aᵀ) 上有非零分量 (${bLeft.map((v) => fmt(v)).join(', ')})，方程无解。`}
            </Status>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'rank1', label: '修改 A，使其秩为 1。' },
              { id: 'unsolvable', label: '输入一个使 Ax = b 无解的 b。' },
              { id: 'nullx', label: '输入一个非零的 x，使 Ax = 0。' },
              { id: 'fullcol', label: '让 N(A) = {0}（列满秩）。' },
            ]}
          />
          <Note>dim R(Aᵀ) + dim N(A) = n，dim R(A) + dim N(Aᵀ) = m，且两组子空间分别互为正交补。</Note>
        </>
      }
    />
  );
};
