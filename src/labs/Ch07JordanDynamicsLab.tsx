import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { det2, eigen2, fmt, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

type Regime = 'diag' | 'jordan' | 'complex' | 'scalar';

export const Ch07JordanDynamicsLab: React.FC = () => {
  const [A, setA] = useState<Mat2>([
    [0.85, 0.5],
    [0, 0.85],
  ]);
  const [v0, setV0] = useState<Vec2>([0.6, 1.4]);
  const [steps, setSteps] = useState(8);

  const tr = A[0][0] + A[1][1];
  const dt = det2(A);
  const eig = eigen2(A);

  let regime: Regime = 'diag';
  if (!eig.isReal) {
    regime = 'complex';
  } else if (Math.abs(eig.values[0].re - eig.values[1].re) < 1e-4) {
    regime = eig.vectors.length === 1 ? 'jordan' : 'scalar';
  }

  // Compute discrete orbit v_0, A v_0, A^2 v_0, ..., A^steps v_0
  const orbit: Vec2[] = [v0];
  let cur = v0;
  for (let k = 0; k < steps; k++) {
    cur = mulMat2Vec(A, cur);
    if (!Number.isFinite(cur[0]) || !Number.isFinite(cur[1]) || Math.hypot(cur[0], cur[1]) > 40) break;
    orbit.push(cur);
  }

  const charPoly = `\\lambda^2 ${tr >= 0 ? '-' : '+'} ${fmt(Math.abs(tr))}\\lambda ${dt >= 0 ? '+' : '-'} ${fmt(Math.abs(dt))}`;
  let minPoly = charPoly;
  if (regime === 'scalar') {
    const l = eig.values[0].re;
    minPoly = `\\lambda ${l >= 0 ? '-' : '+'} ${fmt(Math.abs(l))}`;
  } else if (regime === 'jordan') {
    const l = eig.values[0].re;
    minPoly = `(\\lambda ${l >= 0 ? '-' : '+'} ${fmt(Math.abs(l))})^2`;
  }

  const done = useLatch({
    jordan: regime === 'jordan',
    diag: regime === 'diag',
    complex: regime === 'complex',
  });

  return (
    <LabGrid
      stage={
        <Figure
          caption="橙色折线展示离散轨线 v₀ → Av₀ → A²v₀ → …；实特征子空间（一维不变子空间）以实线标出。"
          legend={
            <>
              <Swatch color={C.blue} label="实不变子空间（特征线）" />
              <Swatch color={C.accent} label="轨线 Aᵏv₀" />
            </>
          }
        >
          <Canvas2D
            range={4}
            handles={[{ id: 'v0', pos: v0, color: C.violet, label: 'v₀', onChange: setV0 }]}
            ariaLabel="不变子空间与 Jordan 块相图"
          >
            {({ toSvg, line }) => {
              const o = toSvg([0, 0]);
              return (
                <g>
                  {/* Real 1D invariant subspaces */}
                  {eig.isReal &&
                    eig.vectors.map((ev, idx) => (
                      <g key={idx}>
                        <line {...line([0, 0], ev)} stroke={idx === 0 ? C.blue : C.green} strokeWidth={2.2} strokeOpacity={0.7} />
                        <SvgLabel at={toSvg([ev[0] * 2.8, ev[1] * 2.8])} color={idx === 0 ? C.blue : C.green}>
                          V(λ{idx + 1})
                        </SvgLabel>
                      </g>
                    ))}

                  {/* Orbit segments and points */}
                  {orbit.map((pt, k) => {
                    const pSvg = toSvg(pt);
                    const nextSvg = k < orbit.length - 1 ? toSvg(orbit[k + 1]) : null;
                    return (
                      <g key={k}>
                        {nextSvg && <SvgArrow from={pSvg} to={nextSvg} color={C.accent} width={1.8} opacity={0.85} />}
                        <SvgPoint at={pSvg} color={k === 0 ? C.violet : C.accent} r={k === 0 ? 5 : 3.5} />
                      </g>
                    );
                  })}
                  <SvgArrow from={o} to={toSvg(v0)} color={C.violet} width={2.2} dashed />
                </g>
              );
            }}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel title="对比三种相似标准形">
            <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} />
            <Presets
              label="典型结构"
              items={[
                { label: 'Jordan 块（不可对角化）', active: regime === 'jordan', onClick: () => setA([[0.85, 0.5], [0, 0.85]]) },
                { label: '可对角化（双曲鞍点）', onClick: () => setA([[1.2, 0.2], [0.2, 0.7]]) },
                { label: '可对角化（汇点）', onClick: () => setA([[0.8, 0.15], [0.15, 0.5]]) },
                { label: '复特征值（旋转螺线）', active: regime === 'complex', onClick: () => setA([[0.85, -0.45], [0.45, 0.85]]) },
                { label: '纯量阵 λI（极小多项式 1 次）', active: regime === 'scalar', onClick: () => setA([[0.8, 0], [0, 0.8]]) },
              ]}
            />
            <VectorInput name="v₀" color={C.violet} value={v0} onChange={(p) => setV0(p as Vec2)} />
            <SliderField label="迭代步数 k" value={steps} min={1} max={18} step={1} digits={0} color={C.accent} onChange={setSteps} />
          </Panel>

          <Panel title="重数、多项式与标准形诊断">
            <MathBox tone={regime === 'jordan' ? 'warn' : 'neutral'}>
              <Tex block math={`f_A(\\lambda) = ${charPoly}`} />
              <Tex block math={`m_A(\\lambda) = ${minPoly}`} />
              {eig.isReal ? (
                <Tex block math={`\\lambda_1 = ${fmt(eig.values[0].re)},\\quad \\lambda_2 = ${fmt(eig.values[1].re)}`} />
              ) : (
                <Tex block math={`\\lambda_{1,2} = ${fmt(eig.values[0].re)} \\pm ${fmt(eig.values[0].im)}\\mathrm{i}`} />
              )}
            </MathBox>
            <Status tone={regime === 'diag' || regime === 'scalar' ? 'ok' : regime === 'jordan' ? 'warn' : 'info'}>
              {regime === 'jordan' && '不可对角化（Jordan 块）：代数重数 2 > 几何重数 1！只有唯一一条实特征线，离开特征线的轨线沿该直线方向发生错切漂移。'}
              {regime === 'diag' && '可在 ℝ 上对角化：存在两条线性无关的一维不变子空间，任意轨线按两个特征方向独立伸缩。'}
              {regime === 'complex' && '一对共轭复特征值：在 ℝ² 中没有一维实不变子空间，轨线呈旋转/螺线运动。'}
              {regime === 'scalar' && '纯量阵：过原点的每条直线都是不变子空间，极小多项式为一次。'}
            </Status>
            <Note label="Jordan 判据">
              矩阵可在复数域上对角化，当且仅当每个特征值的几何重数等于代数重数，也等价于极小多项式 <Tex math="m_A(\lambda)" /> 无重根。
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'jordan', label: '在“Jordan 块”下拖动 v₀，观察为何只剩一条特征线并出现错切漂移' },
              { id: 'diag', label: '切换到“可对角化”，观察两条不变直线如何把平面分成象限区域' },
              { id: 'complex', label: '切换到“复特征值”，观察螺线轨线与实不变直线的消失' },
            ]}
          />
        </>
      }
    />
  );
};
