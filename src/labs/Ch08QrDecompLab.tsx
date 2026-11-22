import React, { useState } from 'react';
import { Tex } from '../components/MathText';
import { Button, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Status, Tasks, useLatch } from '../components/ui';
import { dot3, fmt, norm3, type Mat3, type Vec3 } from '../utils/math';

const toTex = (M: number[][]) => `\\begin{pmatrix}${M.map((r) => r.map((v) => fmt(v)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;

function computeQR(A: Mat3): { ok: boolean; Q: Mat3; R: Mat3; stepDescs: string[] } {
  const cols: Vec3[] = [0, 1, 2].map((j) => [A[0][j], A[1][j], A[2][j]] as Vec3);
  const qs: Vec3[] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const R: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const stepDescs: string[] = [];

  for (let j = 0; j < 3; j++) {
    let v: Vec3 = [...cols[j]];
    for (let i = 0; i < j; i++) {
      const rij = dot3(qs[i], cols[j]);
      R[i][j] = rij;
      v = [v[0] - rij * qs[i][0], v[1] - rij * qs[i][1], v[2] - rij * qs[i][2]];
    }
    const rjj = norm3(v);
    R[j][j] = rjj;
    if (rjj < 1e-6) return { ok: false, Q: [[0, 0, 0], [0, 0, 0], [0, 0, 0]], R: R as Mat3, stepDescs };
    qs[j] = [v[0] / rjj, v[1] / rjj, v[2] / rjj];
    stepDescs.push(
      j === 0
        ? `第 1 列单位化：r₁₁ = ‖a₁‖ = ${fmt(rjj)}，得 q₁ = a₁ / r₁₁。`
        : j === 1
        ? `第 2 列减去在 q₁ 上的投影 r₁₂ = ⟨q₁, a₂⟩ = ${fmt(R[0][1])}，再单位化得 r₂₂ = ${fmt(rjj)}。`
        : `第 3 列减去在 q₁, q₂ 上的投影 r₁₃ = ${fmt(R[0][2])}, r₂₃ = ${fmt(R[1][2])}，再单位化得 r₃₃ = ${fmt(rjj)}。`
    );
  }

  const Q: Mat3 = [
    [qs[0][0], qs[1][0], qs[2][0]],
    [qs[0][1], qs[1][1], qs[2][1]],
    [qs[0][2], qs[1][2], qs[2][2]],
  ];
  return { ok: true, Q, R: R as Mat3, stepDescs };
}

export const Ch08QrDecompLab: React.FC = () => {
  const [A, setA] = useState<Mat3>([
    [1, 1, 0],
    [1, 0, 1],
    [0, 1, 1],
  ]);
  const [colStep, setColStep] = useState<1 | 2 | 3>(3);

  const { ok, Q, R, stepDescs } = computeQR(A);

  const maskCols = (M: Mat3, k: number) =>
    M.map((row) => row.map((v, j) => (j < k ? fmt(v) : '\\cdot'))).map((r) => r.join(' & ')).join(' \\\\ ');

  const done = useLatch({
    step1: colStep === 1,
    step3: colStep === 3 && ok,
    singular: !ok,
  });

  return (
    <LabGrid
      wideStage
      stage={
        <Panel title={`QR 分解第 ${colStep} 列：A = Q R`}>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3] as const).map((k) => (
              <Button key={k} size="sm" variant="secondary" active={colStep === k} onClick={() => setColStep(k)}>
                处理到第 {k} 列
              </Button>
            ))}
          </div>

          {ok ? (
            <>
              <MathBox tone="ok">
                <Tex block math={`A = ${toTex(A)}`} />
                <Tex block math={`Q = \\begin{pmatrix}${maskCols(Q, colStep)}\\end{pmatrix},\\qquad R = \\begin{pmatrix}${maskCols(R, colStep)}\\end{pmatrix}`} />
              </MathBox>
              <Status tone="info">{stepDescs[colStep - 1]}</Status>
              {colStep === 3 && (
                <MathBox>
                  <Tex block math={`Q^\\top Q = I_3,\\qquad Q R = A,\\qquad r_{jj} > 0\\;\\text{（上三角且对角元为正）}`} />
                </MathBox>
              )}
            </>
          ) : (
            <Status tone="warn">矩阵 A 的列向量线性相关（不满秩），某步投影后残差为零，无法得到唯一满秩 QR 分解。</Status>
          )}
        </Panel>
      }
      side={
        <>
          <Panel title="输入 3×3 矩阵 A">
            <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat3)} step={1} />
            <Presets
              items={[
                { label: '经典整数阵', onClick: () => { setA([[1, 1, 0], [1, 0, 1], [0, 1, 1]]); setColStep(3); } },
                { label: '已正交矩阵（R = I）', onClick: () => { setA([[1, 0, 0], [0, 0, -1], [0, 1, 0]]); setColStep(3); } },
                { label: '上三角正对角阵（Q = I）', onClick: () => { setA([[2, 3, -1], [0, 1, 4], [0, 0, 3]]); setColStep(3); } },
                { label: '列相关（奇异）', onClick: () => { setA([[1, 2, 3], [2, 4, 6], [1, 1, 2]]); setColStep(3); } },
              ]}
            />
            <Note label="教材 §8.2.3">
              QR 分解正是 Gram–Schmidt 正交化的矩阵写法：上三角矩阵 <Tex math="R" /> 的第 <Tex math="j" /> 列记录了原列向量 <Tex math="\boldsymbol{a}_j" /> 在新标准正交基 <Tex math="\boldsymbol{q}_1,\dots,\boldsymbol{q}_j" /> 下的坐标！
            </Note>
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'step1', label: '点击“处理到第 1 列”，观察 R 的第一列如何只保留 r₁₁ = ‖a₁‖' },
              { id: 'step3', label: '推进到第 3 列，验证 QᵀQ = I 且 R 为上三角矩阵' },
              { id: 'singular', label: '测试“列相关（奇异）”矩阵，观察正交化何时因残差为零而中止' },
            ]}
          />
        </>
      }
    />
  );
};
