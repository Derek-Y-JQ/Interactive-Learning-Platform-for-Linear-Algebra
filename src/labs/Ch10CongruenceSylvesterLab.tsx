import React, { useState } from 'react';
import { Canvas2D } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { det2, eigen2, fmt, mat2ToTex, mulMat2, type Mat2 } from '../utils/math';
import { C } from '../theme';

function inertia2(A: Mat2): { pos: number; neg: number; zero: number; l1: number; l2: number } {
  const e = eigen2(A);
  const vals = [e.values[0].re, e.values[1].re];
  let pos = 0, neg = 0, zero = 0;
  for (const v of vals) {
    if (v > 1e-5) pos++;
    else if (v < -1e-5) neg++;
    else zero++;
  }
  return { pos, neg, zero, l1: vals[0], l2: vals[1] };
}

function quadContours(A: Mat2, toSvg: (p: [number, number]) => [number, number], levels: number[], colorPos: string, colorNeg: string) {
  // Draw level curves x^T A x = c via polar rays for fast, crisp SVG rendering
  const els: React.ReactNode[] = [];
  for (const c of levels) {
    const segs: string[][] = [];
    let cur: string[] = [];
    const N = 180;
    for (let k = 0; k <= N; k++) {
      const th = (2 * Math.PI * k) / N;
      const ux = Math.cos(th), uy = Math.sin(th);
      const q = A[0][0] * ux * ux + 2 * A[0][1] * ux * uy + A[1][1] * uy * uy;
      if (q * c > 1e-5) {
        const r = Math.sqrt(c / q);
        if (r <= 4.5) {
          cur.push(toSvg([r * ux, r * uy]).join(','));
          continue;
        }
      }
      if (cur.length > 1) segs.push(cur);
      cur = [];
    }
    if (cur.length > 1) segs.push(cur);
    segs.forEach((pts, idx) => {
      els.push(
        <polyline
          key={`${c}-${idx}`}
          points={pts.join(' ')}
          fill="none"
          stroke={c > 0 ? colorPos : colorNeg}
          strokeWidth={Math.abs(c) === 1 ? 2.2 : 1.3}
          strokeOpacity={Math.abs(c) === 1 ? 0.9 : 0.45}
        />
      );
    });
  }
  return els;
}

export const Ch10CongruenceSylvesterLab: React.FC = () => {
  const [A, setA] = useState<Mat2>([
    [2, 1],
    [1, 1],
  ]);
  const [Cmat, setCmat] = useState<Mat2>([
    [1, -0.5],
    [0.3, 1.2],
  ]);

  // Keep A symmetric
  const setSymA = (m: number[][]) => {
    const b = m[0][1] !== A[0][1] ? m[0][1] : m[1][0];
    setA([
      [m[0][0], b],
      [b, m[1][1]],
    ]);
  };

  const detC = det2(Cmat);
  const invValid = Math.abs(detC) > 1e-4;
  const CT: Mat2 = [
    [Cmat[0][0], Cmat[1][0]],
    [Cmat[0][1], Cmat[1][1]],
  ];
  const B = mulMat2(mulMat2(CT, A), Cmat);

  const inA = inertia2(A);
  const inB = inertia2(B);

  // Leading principal minors of A
  const d1 = A[0][0];
  const d2 = det2(A);
  const isPosDef = d1 > 1e-5 && d2 > 1e-5;

  // Lagrange completion of squares for A = [[a, b], [b, c]]
  const a11 = A[0][0], a12 = A[0][1], a22 = A[1][1];
  let lagrangeTex = '';
  if (Math.abs(a11) > 1e-5) {
    const rem = a22 - (a12 * a12) / a11;
    lagrangeTex = `${fmt(a11)}\\left(x_1 + ${fmt(a12 / a11)}x_2\\right)^2 ${rem >= 0 ? '+' : '-'} ${fmt(Math.abs(rem))}x_2^2`;
  } else if (Math.abs(a22) > 1e-5) {
    const rem = a11 - (a12 * a12) / a22;
    lagrangeTex = `${fmt(a22)}\\left(x_2 + ${fmt(a12 / a22)}x_1\\right)^2 ${rem >= 0 ? '+' : '-'} ${fmt(Math.abs(rem))}x_1^2`;
  } else if (Math.abs(a12) > 1e-5) {
    lagrangeTex = `${fmt(2 * a12)}\\,x_1 x_2 = ${fmt(a12 / 2)}(y_1^2 - y_2^2)`;
  } else {
    lagrangeTex = '0';
  }

  const done = useLatch({
    editedC: invValid && (Math.abs(Cmat[0][0] - 1) > 0.1 || Math.abs(Cmat[0][1] + 0.5) > 0.1),
    indef: inA.pos === 1 && inA.neg === 1,
    singularC: !invValid,
  });

  return (
    <LabGrid
      wideStage
      stage={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Figure
            caption={<>原二次型 <Tex math="q(\boldsymbol{x}) = \boldsymbol{x}^\top A\boldsymbol{x}" /> 等高线</>}
            legend={<><Swatch color={C.blue} label="q > 0" /><Swatch color={C.red} label="q < 0" /></>}
          >
            <Canvas2D range={3.5} aspect={1} ariaLabel="原二次型等高线">
              {({ toSvg }) => <g>{quadContours(A, toSvg, [-2, -1, 1, 2], C.blue, C.red)}</g>}
            </Canvas2D>
          </Figure>

          <Figure
            caption={<>合同变换后 <Tex math="\tilde q(\boldsymbol{y}) = \boldsymbol{y}^\top (C^\top A C)\boldsymbol{y}" /> 等高线</>}
            legend={<><Swatch color={C.green} label="q̃ > 0" /><Swatch color={C.accent} label="q̃ < 0" /></>}
          >
            <Canvas2D range={3.5} aspect={1} ariaLabel="合同变换后等高线">
              {({ toSvg }) => <g>{quadContours(B, toSvg, [-2, -1, 1, 2], C.green, C.accent)}</g>}
            </Canvas2D>
          </Figure>
        </div>
      }
      side={
        <>
          <Panel title="对称矩阵 A 与可逆合同矩阵 C">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Tex math="A =" />
                <MatrixInput ariaLabel="对称矩阵 A" value={A} onChange={setSymA} />
              </div>
              <div className="flex items-center gap-2">
                <Tex math="C =" />
                <MatrixInput ariaLabel="合同矩阵 C" value={Cmat} onChange={(m) => setCmat(m as Mat2)} />
              </div>
            </div>
            <Presets
              label="典型二次型"
              items={[
                { label: '正定 (2,0)', onClick: () => setA([[2, 1], [1, 1]]) },
                { label: '不定 / 马鞍 (1,1)', onClick: () => setA([[1, 2], [2, 1]]) },
                { label: '半正定 (1,0)', onClick: () => setA([[1, 1], [1, 1]]) },
                { label: '负定 (0,2)', onClick: () => setA([[-2, 0.5], [0.5, -1]]) },
              ]}
            />
            <Presets
              label="测试 C"
              items={[
                { label: '可逆剪切 C', onClick: () => setCmat([[1, -0.5], [0.3, 1.2]]) },
                { label: '退化（不可逆）C', onClick: () => setCmat([[1, 2], [0.5, 1]]) },
              ]}
            />
          </Panel>

          <Panel title="Sylvester 惯性定理与顺序主子式">
            <MathBox tone={invValid ? 'ok' : 'warn'}>
              <Tex block math={`B = C^\\top A C = ${mat2ToTex(B)},\\quad \\det C = ${fmt(detC)}`} />
              <Tex block math={`\\text{惯性指数 }(p, q, r):\\quad A \\mapsto (${inA.pos}, ${inA.neg}, ${inA.zero}),\\quad B \\mapsto (${inB.pos}, ${inB.neg}, ${inB.zero})`} />
            </MathBox>
            <MathBox>
              <div className="text-[13px] text-ink-2 mb-1">Lagrange 配方法标准形：</div>
              <Tex block math={`q(x_1, x_2) = ${lagrangeTex}`} />
              <Tex block math={`\\text{顺序主子式：}\\Delta_1 = ${fmt(d1)},\\quad \\Delta_2 = \\det A = ${fmt(d2)}`} />
            </MathBox>
            <Status tone={invValid ? (isPosDef ? 'ok' : 'info') : 'warn'}>
              {!invValid
                ? '警告：det C = 0，C 不可逆！此时 B 与 A 不合同，惯性指数不再守恒。'
                : isPosDef
                ? 'Δ₁ > 0 且 Δ₂ > 0：正定二次型！无论怎样改变可逆矩阵 C，正惯性指数始终为 2。'
                : `det C ≠ 0：A 与 B 合同，正负惯性指数 (${inA.pos}, ${inA.neg}) 严格不变！`}
            </Status>
            <Note label="Sylvester 惯性定理">
              实二次型经任意可逆线性替换 <Tex math="\boldsymbol{x}=C\boldsymbol{y}" /> 化为标准形，正平方项个数 <Tex math="p" /> 与负平方项个数 <Tex math="q" /> 均唯一确定。
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'editedC', label: '修改可逆矩阵 C 的元素，验证等高线形状改变但惯性指数 (p, q, r) 不变' },
              { id: 'indef', label: '切换到“不定 / 马鞍”，观察双曲线族与 (1, 1, 0) 惯性指数' },
              { id: 'singularC', label: '点击“退化（不可逆）C”，观察为何 C 不可逆会破坏惯性不变性' },
            ]}
          />
        </>
      }
    />
  );
};
