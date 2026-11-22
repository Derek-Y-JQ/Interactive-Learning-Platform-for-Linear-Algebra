import React, { useState } from 'react';
import { Tex } from '../components/MathText';
import { LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Status, Tasks, useLatch } from '../components/ui';
import { det2, fmt, invMat2, mat2ToTex, mulMat2, type Mat2 } from '../utils/math';

const addM = (A: Mat2, B: Mat2): Mat2 => [
  [A[0][0] + B[0][0], A[0][1] + B[0][1]],
  [A[1][0] + B[1][0], A[1][1] + B[1][1]],
];
const scM = (c: number, A: Mat2): Mat2 => [
  [c * A[0][0], c * A[0][1]],
  [c * A[1][0], c * A[1][1]],
];
const I2: Mat2 = [[1, 0], [0, 1]];

export const Ch07CayleyHamiltonLab: React.FC = () => {
  const [A, setA] = useState<Mat2>([
    [3, 1],
    [2, 2],
  ]);

  const tr = A[0][0] + A[1][1];
  const dt = det2(A);
  const A2 = mulMat2(A, A);
  // f_A(A) = A^2 - tr(A)*A + det(A)*I
  const fOfA = addM(addM(A2, scM(-tr, A)), scM(dt, I2));

  // Express A^4 = alpha * A + beta * I using A^2 = tr*A - dt*I
  // A^2 = c1 A + c0 I
  const c1_2 = tr, c0_2 = -dt;
  // A^3 = c1_2 A^2 + c0_2 A = (c1_2*tr + c0_2) A + (c1_2*(-dt)) I
  const c1_3 = c1_2 * tr + c0_2, c0_3 = -c1_2 * dt;
  // A^4 = c1_3 A^2 + c0_3 A
  const c1_4 = c1_3 * tr + c0_3, c0_4 = -c1_3 * dt;
  const A4_ch = addM(scM(c1_4, A), scM(c0_4, I2));

  // Inverse via CH: A^{-1} = (1/det A) * (tr(A)*I - A)
  const invA = invMat2(A);
  const isScalar = Math.abs(A[0][1]) < 1e-6 && Math.abs(A[1][0]) < 1e-6 && Math.abs(A[0][0] - A[1][1]) < 1e-6;
  const isIdem = Math.hypot(A2[0][0] - A[0][0], A2[0][1] - A[0][1], A2[1][0] - A[1][0], A2[1][1] - A[1][1]) < 1e-5;
  const isNilp = Math.hypot(A2[0][0], A2[0][1], A2[1][0], A2[1][1]) < 1e-5;

  const done = useLatch({
    verified: Math.hypot(fOfA[0][0], fOfA[0][1], fOfA[1][0], fOfA[1][1]) < 1e-5,
    scalarMin: isScalar,
    nilp: isNilp && !isScalar,
  });

  return (
    <LabGrid
      wideStage
      stage={
        <Panel title="Cayley–Hamilton 定理：每个方阵都满足自身的特征方程 f_A(A) = O">
          <MathBox tone="ok">
            <Tex block math={`f_A(\\lambda) = \\lambda^2 - (\\operatorname{tr}A)\\lambda + \\det A = \\lambda^2 ${tr >= 0 ? '-' : '+'} ${fmt(Math.abs(tr))}\\lambda ${dt >= 0 ? '+' : '-'} ${fmt(Math.abs(dt))}`} />
            <Tex
              block
              math={`f_A(A) = A^2 ${tr >= 0 ? '-' : '+'} ${fmt(Math.abs(tr))}A ${dt >= 0 ? '+' : '-'} ${fmt(Math.abs(dt))}I = ${mat2ToTex(A2)} ${tr >= 0 ? '-' : '+'} ${fmt(Math.abs(tr))}${mat2ToTex(A)} ${dt >= 0 ? '+' : '-'} ${fmt(Math.abs(dt))}${mat2ToTex(I2)} = ${mat2ToTex(fOfA)}`}
            />
          </MathBox>

          <MathBox>
            <div className="text-[13px] font-semibold text-ink-2 mb-1">应用 ①：用低次幂降次计算高次幂 A⁴</div>
            <Tex block math={`A^2 = ${fmt(c1_2)}A ${c0_2 >= 0 ? '+' : '-'} ${fmt(Math.abs(c0_2))}I \\implies A^4 = ${fmt(c1_4)}A ${c0_4 >= 0 ? '+' : '-'} ${fmt(Math.abs(c0_4))}I = ${mat2ToTex(A4_ch)}`} />
          </MathBox>

          <MathBox tone={invA ? 'neutral' : 'warn'}>
            <div className="text-[13px] font-semibold text-ink-2 mb-1">应用 ②：用 Cayley–Hamilton 求逆矩阵（教材例 7.5）</div>
            {invA ? (
              <Tex
                block
                math={`A^{-1} = \\frac{1}{\\det A}\\bigl((\\operatorname{tr}A)I - A\\bigr) = \\frac{1}{${fmt(dt)}}\\bigl(${fmt(tr)}I - A\\bigr) = ${mat2ToTex(invA)}`}
              />
            ) : (
              <div className="text-danger text-[14px]">det A = 0，常数项为零，矩阵不可逆。</div>
            )}
          </MathBox>

          <Status tone="info">
            {isScalar
              ? `纯量阵：极小多项式为一次 m_A(λ) = λ − ${fmt(A[0][0])}，严格整除二次特征多项式 f_A(λ)。`
              : isIdem
              ? '幂等阵（A² = A）：特征多项式与极小多项式均整除 λ(λ − 1)。'
              : isNilp
              ? '幂零阵（A² = O）：特征多项式与极小多项式均为 λ²。'
              : '一般 2×2 非纯量阵：极小多项式等于特征多项式 m_A(λ) = f_A(λ)。'}
          </Status>
        </Panel>
      }
      side={
        <>
          <Panel title="编辑 2×2 矩阵 A">
            <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} step={1} />
            <Presets
              items={[
                { label: '一般可逆阵', onClick: () => setA([[3, 1], [2, 2]]) },
                { label: '纯量阵 2I（极小 1 次）', onClick: () => setA([[2, 0], [0, 2]]) },
                { label: '幂零阵（A² = O）', onClick: () => setA([[0, 1], [0, 0]]) },
                { label: '幂等阵（A² = A）', onClick: () => setA([[1, 2], [0, 0]]) },
              ]}
            />
            <Note label="极小多项式">
              特征多项式 <Tex math="f_A(\lambda)" /> 总是零化多项式；而首一次数最低的零化多项式称为<strong>极小多项式</strong> <Tex math="m_A(\lambda)" />，必有 <Tex math="m_A(\lambda) \mid f_A(\lambda)" />。
            </Note>
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'verified', label: '任意修改 A，验证 f_A(A) 始终精确等于零矩阵' },
              { id: 'scalarMin', label: '切换到“纯量阵 2I”，观察极小多项式降为一次' },
              { id: 'nilp', label: '切换到“幂零阵”，观察 f_A(λ) = λ² 且 A² = O' },
            ]}
          />
        </>
      }
    />
  );
};
