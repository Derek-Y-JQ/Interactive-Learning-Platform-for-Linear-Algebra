import React, { useState } from 'react';
import { Canvas2D } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { det2, fmt, mat2ToTex, mulMat2, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

const SQ: Vec2[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

export const Ch05DetProductCauchyBinetLab: React.FC = () => {
  const [tab, setTab] = useState<'prod' | 'cb'>('prod');
  const [A, setA] = useState<Mat2>([
    [1.4, 0.5],
    [-0.3, 1.2],
  ]);
  const [B, setB] = useState<Mat2>([
    [1.5, -0.4],
    [0.6, 1.0],
  ]);

  // Cauchy-Binet: 2x3 matrix P (two vectors in R^3), det(P P^T) = sum of squared 2x2 minors
  const [P, setP] = useState<number[][]>([
    [2, 1, 1],
    [0, 2, -1],
  ]);

  const AB = mulMat2(A, B);
  const dA = det2(A);
  const dB = det2(B);
  const dAB = det2(AB);

  // 2x2 minors of 2x3 matrix P: columns (1,2), (1,3), (2,3)
  const m12 = P[0][0] * P[1][1] - P[0][1] * P[1][0];
  const m13 = P[0][0] * P[1][2] - P[0][2] * P[1][0];
  const m23 = P[0][1] * P[1][2] - P[0][2] * P[1][1];
  const gram: Mat2 = [
    [P[0][0] ** 2 + P[0][1] ** 2 + P[0][2] ** 2, P[0][0] * P[1][0] + P[0][1] * P[1][1] + P[0][2] * P[1][2]],
    [P[0][0] * P[1][0] + P[0][1] * P[1][1] + P[0][2] * P[1][2], P[1][0] ** 2 + P[1][1] ** 2 + P[1][2] ** 2],
  ];
  const detGram = det2(gram);
  const sumSq = m12 * m12 + m13 * m13 + m23 * m23;

  const done = useLatch({
    flipSign: tab === 'prod' && dA * dB < 0,
    cbSeen: tab === 'cb',
    cbEdit: tab === 'cb' && (P[0][0] !== 2 || P[1][2] !== -1),
  });

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="行列式乘积模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'prod', label: '乘积行列式 det(AB) = det A · det B' },
          { value: 'cb', label: 'Cauchy–Binet 公式与三维面积勾股定理' },
        ]}
      />

      {tab === 'prod' ? (
        <LabGrid
          stage={
            <Figure
              caption="单位正方形（面积 1）先经 B 变为面积 |det B| 的平行四边形，再经 A 变为面积 |det A|·|det B| 的平行四边形。"
              legend={
                <>
                  <Swatch color={C.ink3} dashed label="单位正方形 (1)" />
                  <Swatch color={C.blue} label={`B 后 (${fmt(dB)})`} />
                  <Swatch color={C.violet} label={`AB 后 (${fmt(dAB)})`} />
                </>
              }
            >
              <Canvas2D range={3.5} ariaLabel="乘积行列式面积缩放画布">
                {({ toSvg }) => {
                  const p0 = SQ.map((p) => toSvg(p).join(',')).join(' ');
                  const pB = SQ.map((p) => toSvg(mulMat2Vec(B, p)).join(',')).join(' ');
                  const pAB = SQ.map((p) => toSvg(mulMat2Vec(AB, p)).join(',')).join(' ');
                  return (
                    <g>
                      <polygon points={p0} fill={C.ink3} fillOpacity={0.08} stroke={C.ink3} strokeDasharray="4 3" />
                      <polygon points={pB} fill={C.blue} fillOpacity={0.16} stroke={C.blue} strokeWidth={2} />
                      <polygon points={pAB} fill={C.violet} fillOpacity={0.2} stroke={C.violet} strokeWidth={2.2} />
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="方阵 A 与 B">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Tex math="A =" />
                    <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tex math="B =" />
                    <MatrixInput ariaLabel="矩阵 B" value={B} onChange={(m) => setB(m as Mat2)} />
                  </div>
                </div>
                <Presets
                  items={[
                    { label: '同向缩放', onClick: () => { setA([[1.4, 0.5], [-0.3, 1.2]]); setB([[1.5, -0.4], [0.6, 1]]); } },
                    { label: '含一次反射（乘积为负）', onClick: () => { setA([[1, 0], [0, -1]]); setB([[1.5, 0.5], [0, 1.2]]); } },
                    { label: '两次反射（负负得正）', onClick: () => { setA([[1, 0], [0, -1]]); setB([[0, 1], [1, 0]]); } },
                  ]}
                />
                <MathBox tone="ok">
                  <Tex block math={`AB = ${mat2ToTex(AB)}`} />
                  <Tex block math={`\\det(AB) = ${fmt(dAB)} = (${fmt(dA)})\\cdot(${fmt(dB)}) = \\det A \\cdot \\det B`} />
                </MathBox>
                <Note>线性变换把平面上<strong>任意</strong>图形的有向面积统一乘以 det；连续做两次变换，面积缩放因子自然相乘！</Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'flipSign', label: '切换到“含一次反射”，验证 det(AB) 与 det A·det B 同为负值' },
                  { id: 'cbSeen', label: '切到“Cauchy–Binet 公式”标签页查看三维平行四边形投影面积关系' },
                  { id: 'cbEdit', label: '修改 2×3 矩阵 P，验证三维空间中的“面积勾股定理”' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          wideStage
          stage={
            <Panel title="Cauchy–Binet 公式（特例 B = Pᵀ）：空间平行四边形面积的勾股定理">
              <div className="flex items-center gap-3 flex-wrap">
                <Tex math="P_{2\times 3} =" />
                <MatrixInput ariaLabel="2×3 矩阵 P" value={P} onChange={setP} step={1} />
              </div>
              <MathBox tone="ok">
                <Tex block math={`P P^\\top = ${mat2ToTex(gram)},\\qquad \\det(P P^\\top) = \\text{Area}^2 = ${fmt(detGram)}`} />
                <Tex
                  block
                  math={`\\underbrace{(M_{12})^2}_{xOy\\text{投影}^2} + \\underbrace{(M_{13})^2}_{xOz\\text{投影}^2} + \\underbrace{(M_{23})^2}_{yOz\\text{投影}^2} = (${fmt(m12)})^2 + (${fmt(m13)})^2 + (${fmt(m23)})^2 = ${fmt(sumSq)}`}
                />
              </MathBox>
              <Status tone="ok">
                三维空间中由 P 的两行张成的平行四边形面积 <Tex math={`S = \\sqrt{${fmt(detGram)}} = ${fmt(Math.sqrt(Math.max(0, detGram)), 3)}`} />，其平方恰等于它在三个坐标平面上投影面积的平方和！
              </Status>
            </Panel>
          }
          side={
            <>
              <Panel title="预设空间平行四边形">
                <Presets
                  items={[
                    { label: '一般空间倾斜面', onClick: () => setP([[2, 1, 1], [0, 2, -1]]) },
                    { label: '正交边（面积易心算）', onClick: () => setP([[1, 1, 0], [0, 0, 2]]) },
                    { label: '共线退化（面积为 0）', onClick: () => setP([[1, 2, 3], [2, 4, 6]]) },
                  ]}
                />
                <Note label="教材 §5.5.2">
                  当长方矩阵 <Tex math="P \in \mathbb{R}^{2\times 3}" /> 与 <Tex math="Q \in \mathbb{R}^{3\times 2}" /> 相乘时，Cauchy–Binet 公式给出 <Tex math="\det(PQ) = \sum_{1\le i<j\le 3} \det P_{\cdot, ij} \det Q_{ij, \cdot}" />；取 <Tex math="Q = P^\top" /> 即得高维勾股定理。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'flipSign', label: '在“乘积行列式”中测试一次反射使乘积为负' },
                  { id: 'cbSeen', label: '在“Cauchy–Binet”中核对三个二阶子式平方和等于 det(PPᵀ)' },
                  { id: 'cbEdit', label: '编辑 P 的任意元素，确认恒等式始终成立' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
