import React, { useState } from 'react';
import { Tex } from '../components/MathText';
import { LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Status, Tasks, useLatch } from '../components/ui';
import { det2, eigen2, fmt, mat2ToTex, mulMat2, svd2, type Mat2 } from '../utils/math';
import { C } from '../theme';

type DecompKey = 'lu' | 'qr' | 'eig' | 'spec' | 'polar' | 'svd';

interface DecompCard {
  key: DecompKey;
  title: string;
  formula: string;
  condition: string;
  applicable: boolean;
  detailTex: string;
  meaning: string;
  bands: { label: string; color: string; shape: 'full' | 'lower' | 'upper' | 'diag' | 'orth' }[];
}

const BandIcon: React.FC<{ shape: 'full' | 'lower' | 'upper' | 'diag' | 'orth'; color: string; label: string }> = ({ shape, color, label }) => (
  <div className="flex flex-col items-center gap-1">
    <svg width="36" height="36" viewBox="0 0 36 36" className="rounded border border-rule bg-surface">
      {shape === 'full' && <rect x="4" y="4" width="28" height="28" fill={color} fillOpacity={0.28} stroke={color} strokeWidth={1.5} />}
      {shape === 'lower' && <polygon points="4,4 32,32 4,32" fill={color} fillOpacity={0.32} stroke={color} strokeWidth={1.5} />}
      {shape === 'upper' && <polygon points="4,4 32,4 32,32" fill={color} fillOpacity={0.32} stroke={color} strokeWidth={1.5} />}
      {shape === 'diag' && <line x1="6" y1="6" x2="30" y2="30" stroke={color} strokeWidth={5} strokeLinecap="round" />}
      {shape === 'orth' && (
        <>
          <rect x="4" y="4" width="28" height="28" fill={color} fillOpacity={0.14} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
          <line x1="18" y1="8" x2="18" y2="28" stroke={color} strokeWidth={1.8} />
          <line x1="8" y1="18" x2="28" y2="18" stroke={color} strokeWidth={1.8} />
        </>
      )}
    </svg>
    <span className="font-mono text-[11px] text-ink-2">{label}</span>
  </div>
);

export const AppendixDecompositionsLab: React.FC = () => {
  const [A, setA] = useState<Mat2>([
    [2, 1],
    [1, 1.5],
  ]);
  const [focus, setFocus] = useState<DecompKey>('svd');

  const isSym = Math.abs(A[0][1] - A[1][0]) < 1e-4;
  const d = det2(A);
  const eig = eigen2(A);

  // LU (without pivoting)
  const luOk = Math.abs(A[0][0]) > 1e-6;
  const L: Mat2 = luOk ? [[1, 0], [A[1][0] / A[0][0], 1]] : [[1, 0], [0, 1]];
  const Ulu: Mat2 = luOk ? [[A[0][0], A[0][1]], [0, A[1][1] - (A[1][0] / A[0][0]) * A[0][1]]] : A;

  // QR (2x2 Gram-Schmidt)
  const n1 = Math.hypot(A[0][0], A[1][0]);
  const qrOk = n1 > 1e-6 && Math.abs(d) > 1e-6;
  const q1: [number, number] = qrOk ? [A[0][0] / n1, A[1][0] / n1] : [1, 0];
  const r12 = q1[0] * A[0][1] + q1[1] * A[1][1];
  const v2: [number, number] = [A[0][1] - r12 * q1[0], A[1][1] - r12 * q1[1]];
  const r22 = Math.hypot(v2[0], v2[1]);
  const q2: [number, number] = r22 > 1e-6 ? [v2[0] / r22, v2[1] / r22] : [-q1[1], q1[0]];
  const Qqr: Mat2 = [[q1[0], q2[0]], [q1[1], q2[1]]];
  const Rqr: Mat2 = [[n1, r12], [0, r22]];

  // Real eigendecomposition
  const realDiagOk = eig.isReal && eig.vectors.length === 2;

  // SVD & Polar (always applicable!)
  const sv = svd2(A);
  const Sig: Mat2 = [[sv.S[0], 0], [0, sv.S[1]]];
  const V: Mat2 = [[sv.Vt[0][0], sv.Vt[1][0]], [sv.Vt[0][1], sv.Vt[1][1]]];
  const Qpol = mulMat2(sv.U, sv.Vt);
  const Spol = mulMat2(mulMat2(V, Sig), sv.Vt);

  const cards: DecompCard[] = [
    {
      key: 'lu',
      title: 'LU 分解（第 4 章）',
      formula: 'A = LU',
      condition: '顺序主子式非零（否则需换行 PA = LU）',
      applicable: luOk,
      detailTex: luOk ? `A = ${mat2ToTex(L)}${mat2ToTex(Ulu)}` : '\\text{主元 } a_{11}=0\\text{，需先换行得 } PA=LU',
      meaning: '记录高斯消元：乘子填入下三角 L，阶梯形留在上三角 U。',
      bands: [
        { label: 'L', color: C.blue, shape: 'lower' },
        { label: 'U', color: C.green, shape: 'upper' },
      ],
    },
    {
      key: 'qr',
      title: 'QR 分解（第 8 章）',
      formula: 'A = QR',
      condition: '列满秩矩阵',
      applicable: qrOk,
      detailTex: qrOk ? `A = ${mat2ToTex(Qqr)}${mat2ToTex(Rqr)}` : '\\text{列向量线性相关，不满秩}',
      meaning: 'Gram–Schmidt 正交化：Q 标准正交，R 记录原列在正交基下的坐标。',
      bands: [
        { label: 'Q', color: C.violet, shape: 'orth' },
        { label: 'R', color: C.green, shape: 'upper' },
      ],
    },
    {
      key: 'eig',
      title: '实相似对角化（第 7 章）',
      formula: 'A = P\\Lambda P^{-1}',
      condition: '存在 n 个线性无关实特征向量',
      applicable: realDiagOk,
      detailTex: realDiagOk
        ? `\\Lambda = \\operatorname{diag}(${fmt(eig.values[0].re)},\\; ${fmt(eig.values[1].re)})`
        : !eig.isReal
        ? '\\text{有复特征值，在 }\\mathbb{R}\\text{ 上不可对角化}'
        : '\\text{亏损（Jordan 块），不可对角化}',
      meaning: '换到特征向量基下，变换化为沿各特征方向的独立伸缩。',
      bands: [
        { label: 'P', color: C.ochre, shape: 'full' },
        { label: 'Λ', color: C.accent, shape: 'diag' },
        { label: 'P⁻¹', color: C.ochre, shape: 'full' },
      ],
    },
    {
      key: 'spec',
      title: '实谱分解（第 9 章）',
      formula: 'A = Q\\Lambda Q^\\top',
      condition: '实对称矩阵（A = Aᵀ）',
      applicable: isSym,
      detailTex: isSym
        ? `\\Lambda = \\operatorname{diag}(${fmt(eig.values[0].re)},\\; ${fmt(eig.values[1].re)})\\;\\text{（正交特征基）}`
        : '\\text{A 非对称，不适用实对称谱定理}',
      meaning: '最优雅的分解：正交基对角化，等价于正交投影算子加权和。',
      bands: [
        { label: 'Q', color: C.violet, shape: 'orth' },
        { label: 'Λ', color: C.accent, shape: 'diag' },
        { label: 'Qᵀ', color: C.violet, shape: 'orth' },
      ],
    },
    {
      key: 'polar',
      title: '极分解（第 9 章）',
      formula: 'A = QS',
      condition: '任意方阵恒存在',
      applicable: true,
      detailTex: `Q = ${mat2ToTex(Qpol)},\\quad S = ${mat2ToTex(Spol)}`,
      meaning: '矩阵版“极坐标”：先沿正交主轴做半正定拉伸 S，再做刚体正交变换 Q。',
      bands: [
        { label: 'Q', color: C.violet, shape: 'orth' },
        { label: 'S', color: C.blue, shape: 'full' },
      ],
    },
    {
      key: 'svd',
      title: '奇异值分解 SVD（第 9 章）',
      formula: 'A = U\\Sigma V^\\top',
      condition: '任意 m×n 矩阵无条件存在！',
      applicable: true,
      detailTex: `\\Sigma = \\operatorname{diag}(${fmt(sv.S[0])},\\; ${fmt(sv.S[1])}),\\quad U = ${mat2ToTex(sv.U)},\\; V^\\top = ${mat2ToTex(sv.Vt)}`,
      meaning: '全书终极分解：输入与输出空间各取一组正交基，任何线性映射都只是旋转→伸缩→旋转。',
      bands: [
        { label: 'U', color: C.violet, shape: 'orth' },
        { label: 'Σ', color: C.accent, shape: 'diag' },
        { label: 'Vᵀ', color: C.violet, shape: 'orth' },
      ],
    },
  ];

  const active = cards.find((c) => c.key === focus)!;

  const done = useLatch({
    symAll: isSym && qrOk,
    defective: eig.isReal && eig.vectors.length === 1,
    rankDef: Math.abs(d) < 1e-4,
  });

  return (
    <LabGrid
      wideStage
      stage={
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {cards.map((c) => {
              const on = c.key === focus;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFocus(c.key)}
                  className={`text-left p-3.5 rounded-md border transition-colors ${
                    on ? 'border-primary bg-primary-soft/50' : 'border-rule bg-surface hover:border-ink-3'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-[14px] text-ink">{c.title}</span>
                    <span
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                        c.applicable ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                      }`}
                    >
                      {c.applicable ? '适用' : '不适用'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 my-2">
                    {c.bands.map((b, i) => (
                      <BandIcon key={i} shape={b.shape} color={b.color} label={b.label} />
                    ))}
                  </div>
                  <div className="text-[12px] text-ink-3">{c.condition}</div>
                </button>
              );
            })}
          </div>

          <Panel title={`当前选中：${active.title}`}>
            <MathBox tone={active.applicable ? 'ok' : 'warn'}>
              <Tex block math={`${active.formula} \\quad\\Longrightarrow\\quad ${active.detailTex}`} />
            </MathBox>
            <Status tone={active.applicable ? 'ok' : 'warn'}>{active.meaning}</Status>
          </Panel>
        </div>
      }
      side={
        <>
          <Panel title="输入同一个矩阵 A，横向对比六大分解">
            <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} />
            <Presets
              label="不同类别的矩阵"
              items={[
                { label: '实对称正定（6 种全通！）', onClick: () => setA([[2, 1], [1, 1.5]]) },
                { label: '旋转矩阵（无实特征值）', onClick: () => setA([[0, -1], [1, 0]]) },
                { label: 'Jordan 剪切阵（不可对角化）', onClick: () => setA([[1, 1], [0, 1]]) },
                { label: '秩 1 奇异阵（仅极/SVD 无条件适用）', onClick: () => setA([[1, 2], [0.5, 1]]) },
              ]}
            />
            <Note label="附录：线性代数的艺术">
              从最挑剔的实对称谱分解，到对任意长方阵无条件成立的 SVD，六大矩阵分解构成了整部教材的知识脊梁。
            </Note>
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'symAll', label: '测试“实对称正定”，确认六种分解全部亮起绿色“适用”' },
              { id: 'defective', label: '切换到“Jordan 剪切阵”，观察为何特征/谱分解失效但 QR、极分解、SVD 依然稳固' },
              { id: 'rankDef', label: '切换到“秩 1 奇异阵”，感受 SVD 为何是“终极分解”' },
            ]}
          />
        </>
      }
    />
  );
};
