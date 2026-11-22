import React, { useState } from 'react';
import { Tex } from '../components/MathText';
import { LabGrid, MatrixInput, Note, Panel, Presets, Tasks, useLatch } from '../components/ui';
import { eigen2, fmt, type Mat2 } from '../utils/math';
import { C } from '../theme';

interface Rel {
  id: string;
  name: string;
  formula: string;
  setting: string;
  invariants: string;
  canonical: string;
  chapter: string;
}

const RELATIONS: Rel[] = [
  {
    id: 'equiv',
    name: '相抵',
    formula: 'B = PAQ',
    setting: '线性映射 V → W，定义域与陪域各自独立换基',
    invariants: '秩',
    canonical: '\\begin{pmatrix} I_r & 0 \\\\ 0 & 0 \\end{pmatrix}',
    chapter: '3–4',
  },
  {
    id: 'similar',
    name: '相似',
    formula: 'B = P^{-1}AP',
    setting: '线性变换 V → V，同一组基换到另一组基',
    invariants: '初等因子组（从而特征多项式、迹、行列式、秩）',
    canonical: 'J\\ (\\text{Jordan 形})',
    chapter: '7',
  },
  {
    id: 'congruent',
    name: '合同',
    formula: 'B = P^{\\top}AP',
    setting: '双线性型 / 二次型，在可逆线性代换下',
    invariants: '秩与正、负惯性指数 (p, q)',
    canonical: '\\operatorname{diag}(I_p, -I_q, 0)',
    chapter: '10',
  },
  {
    id: 'orth',
    name: '正交相似',
    formula: 'B = Q^{\\top}AQ,\\ Q^{\\top}Q = I',
    setting: '内积空间上的自伴算子，在标准正交基之间换基',
    invariants: '全部特征值（计重数）',
    canonical: '\\operatorname{diag}(\\lambda_1,\\dots,\\lambda_n)',
    chapter: '9–10',
  },
  {
    id: 'svd',
    name: '正交相抵',
    formula: 'B = UAV^{\\top},\\ U, V \\text{ 正交}',
    setting: '内积空间之间的线性映射，两侧各取标准正交基',
    invariants: '奇异值',
    canonical: '\\Sigma',
    chapter: '9',
  },
];

const PAIRS: [string, string][] = [
  ['线性空间 V，dim V = n', '坐标空间 Kⁿ'],
  ['线性映射 φ: V → W', '矩阵 A ∈ M_{m×n}(K)'],
  ['复合 ψ ∘ φ', '乘积 BA'],
  ['ker φ', '齐次方程组解空间 N(A)'],
  ['im φ', '列空间 R(A)'],
  ['不变子空间', '分块上三角'],
  ['伴随算子 T*', '共轭转置 A*'],
  ['正交投影', 'P² = P = Pᵀ'],
];

const near = (x: number, y: number) => Math.abs(x - y) < 1e-6;
const det = (m: Mat2) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const tr = (m: Mat2) => m[0][0] + m[1][1];
const rank = (m: Mat2) => (m.flat().every((v) => Math.abs(v) < 1e-9) ? 0 : Math.abs(det(m)) < 1e-9 ? 1 : 2);
const sym = (m: Mat2) => near(m[0][1], m[1][0]);
const isScalar = (m: Mat2) => near(m[0][1], 0) && near(m[1][0], 0) && near(m[0][0], m[1][1]);
const inertia = (m: Mat2) => {
  const e = eigen2(m);
  const v = e.values.map((x) => x.re);
  return [v.filter((x) => x > 1e-9).length, v.filter((x) => x < -1e-9).length];
};
const sv = (m: Mat2) => {
  const p = m[0][0] ** 2 + m[1][0] ** 2;
  const r = m[0][1] ** 2 + m[1][1] ** 2;
  const q = m[0][0] * m[0][1] + m[1][0] * m[1][1];
  const s = Math.sqrt(((p - r) / 2) ** 2 + q * q);
  return [Math.sqrt(Math.max(0, (p + r) / 2 + s)), Math.sqrt(Math.max(0, (p + r) / 2 - s))];
};

function judge(A: Mat2, B: Mat2): Record<string, { ok: boolean | null; why: string }> {
  const disc = tr(A) ** 2 - 4 * det(A);
  const similar = near(tr(A), tr(B)) && near(det(A), det(B)) && (Math.abs(disc) > 1e-9 || isScalar(A) === isScalar(B));
  const bothSym = sym(A) && sym(B);
  const [pa, qa] = inertia(A);
  const [pb, qb] = inertia(B);
  const sa = sv(A);
  const sb = sv(B);
  return {
    equiv: { ok: rank(A) === rank(B), why: `rank A = ${rank(A)}，rank B = ${rank(B)}` },
    similar: {
      ok: similar,
      why: `tr: ${fmt(tr(A))} / ${fmt(tr(B))}，det: ${fmt(det(A))} / ${fmt(det(B))}${Math.abs(disc) < 1e-9 ? '；重特征值，还需比较是否为数量阵' : ''}`,
    },
    congruent: bothSym ? { ok: pa === pb && qa === qb, why: `(p, q) = (${pa}, ${qa}) / (${pb}, ${qb})` } : { ok: null, why: '仅对实对称矩阵讨论' },
    orth: bothSym ? { ok: similar, why: '实对称阵正交相似 ⇔ 特征值相同' } : { ok: null, why: '仅对实对称矩阵讨论' },
    svd: { ok: near(sa[0], sb[0]) && near(sa[1], sb[1]), why: `σ = (${fmt(sa[0])}, ${fmt(sa[1])}) / (${fmt(sb[0])}, ${fmt(sb[1])})` },
  };
}

export const AppendixEquivalenceLab: React.FC = () => {
  const [A, setA] = useState<Mat2>([
    [2, 1],
    [0, 2],
  ]);
  const [B, setB] = useState<Mat2>([
    [2, 0],
    [0, 2],
  ]);
  const res = judge(A, B);
  const pattern = RELATIONS.map((r) => (res[r.id].ok ? 1 : 0)).join('');

  const done = useLatch({
    sameDetNotSim: near(tr(A), tr(B)) && near(det(A), det(B)) && !res.similar.ok,
    congNotSim: res.congruent.ok === true && !res.similar.ok,
    equivOnly: res.equiv.ok === true && !res.similar.ok && !res.svd.ok && pattern !== '',
  });

  return (
    <LabGrid
      wideStage
      stage={
        <>
          <Panel title="五种矩阵关系">
            <div className="overflow-x-auto -mx-4">
              <table className="w-full min-w-[720px] text-[14px] border-collapse">
                <thead>
                  <tr className="text-left text-ink-3 border-b border-ink/70">
                    <th className="font-semibold py-2 px-4">关系</th>
                    <th className="font-semibold py-2 px-2">定义</th>
                    <th className="font-semibold py-2 px-2">对象</th>
                    <th className="font-semibold py-2 px-2">完全不变量</th>
                    <th className="font-semibold py-2 px-2">标准形</th>
                    <th className="font-semibold py-2 px-4 text-right">章</th>
                  </tr>
                </thead>
                <tbody>
                  {RELATIONS.map((r) => {
                    const j = res[r.id];
                    return (
                      <tr key={r.id} className="border-b border-rule align-top">
                        <td className="py-3 px-4 font-serif text-[17px] font-semibold whitespace-nowrap">
                          {r.name}
                          <span
                            className="ml-2 inline-block align-middle text-[12px] font-sans font-bold px-1.5 rounded-[3px]"
                            style={{
                              color: j.ok === null ? C.ink3 : j.ok ? C.green : C.red,
                              border: `1px solid ${j.ok === null ? C.rule : j.ok ? C.green : C.red}`,
                            }}
                            aria-label={j.ok === null ? '不适用' : j.ok ? 'A 与 B 满足此关系' : 'A 与 B 不满足此关系'}
                          >
                            {j.ok === null ? '—' : j.ok ? '是' : '否'}
                          </span>
                        </td>
                        <td className="py-3 px-2"><Tex math={r.formula} /></td>
                        <td className="py-3 px-2 text-ink-2">{r.setting}</td>
                        <td className="py-3 px-2 text-ink-2">{r.invariants}</td>
                        <td className="py-3 px-2"><Tex math={r.canonical} /></td>
                        <td className="py-3 px-4 text-right font-mono text-ink-3">{r.chapter}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-ink-3">“是 / 否”列根据右侧输入的 A、B 实时判定（P, Q 可逆，Q, U, V 正交）。</p>
          </Panel>
          <Panel title="映射语言 ↔ 矩阵语言">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {PAIRS.map(([l, r]) => (
                <div key={l} className="flex justify-between gap-4 py-2 border-b border-rule text-[14px]">
                  <dt className="text-ink">{l}</dt>
                  <dd className="text-ink-2 font-mono text-[13px] text-right">{r}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </>
      }
      side={
        <>
          <Panel title="判定器（2 × 2 实矩阵）">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2"><Tex math="A =" /><MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} step={1} /></div>
              <div className="flex items-center gap-2"><Tex math="B =" /><MatrixInput ariaLabel="矩阵 B" value={B} onChange={(m) => setB(m as Mat2)} step={1} /></div>
            </div>
            <ul className="space-y-1.5 text-[14px]">
              {RELATIONS.map((r) => (
                <li key={r.id} className="flex gap-2">
                  <span className="font-semibold w-16 shrink-0" style={{ color: res[r.id].ok === null ? C.ink3 : res[r.id].ok ? C.green : C.red }}>{r.name}</span>
                  <span className="text-ink-2">{res[r.id].why}</span>
                </li>
              ))}
            </ul>
            <Presets
              items={[
                { label: 'Jordan 块 vs 数量阵', onClick: () => { setA([[2, 1], [0, 2]]); setB([[2, 0], [0, 2]]); } },
                { label: '合同不相似', onClick: () => { setA([[1, 0], [0, 4]]); setB([[2, 0], [0, 3]]); } },
                { label: '旋转 vs 恒等', onClick: () => { setA([[0, -1], [1, 0]]); setB([[1, 0], [0, 1]]); } },
              ]}
            />
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'sameDetNotSim', label: '找两个迹与行列式都相同、却不相似的矩阵。' },
              { id: 'congNotSim', label: '找两个合同但不相似的实对称阵。' },
              { id: 'equivOnly', label: '找两个只相抵、不相似也不正交相抵的矩阵。' },
            ]}
          />
          <Note>关系越强，等价类越小、不变量越多：相抵只看秩；相似看初等因子；正交相似（实对称）看特征值本身。</Note>
        </>
      }
    />
  );
};
