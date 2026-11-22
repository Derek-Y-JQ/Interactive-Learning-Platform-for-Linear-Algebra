import React, { useState } from 'react';
import { Canvas2D } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, Segmented, SliderField, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { fmt } from '../utils/math';
import { C } from '../theme';

// Bernstein basis of degree 3 on [0, 1]
const B3 = [
  (t: number) => (1 - t) ** 3,
  (t: number) => 3 * t * (1 - t) ** 2,
  (t: number) => 3 * t * t * (1 - t),
  (t: number) => t ** 3,
];

export const Ch02PolyBasisEvenOddLab: React.FC = () => {
  const [tab, setTab] = useState<'evenodd' | 'bernstein'>('evenodd');
  // Cubic p(x) = a0 + a1*x + a2*x^2 + a3*x^3
  const [a0, setA0] = useState(0.6);
  const [a1, setA1] = useState(-0.8);
  const [a2, setA2] = useState(0.5);
  const [a3, setA3] = useState(0.4);

  // Bernstein control values b0..b3
  const [b0, setB0] = useState(0.2);
  const [b1, setB1] = useState(1.8);
  const [b2, setB2] = useState(-0.6);
  const [b3, setB3] = useState(1.2);

  // Convert Bernstein coords (b0,b1,b2,b3) to power basis (c0,c1,c2,c3):
  // p(t) = b0(1-3t+3t^2-t^3) + b1(3t-6t^2+3t^3) + b2(3t^2-3t^3) + b3 t^3
  const c0 = b0;
  const c1 = -3 * b0 + 3 * b1;
  const c2 = 3 * b0 - 6 * b1 + 3 * b2;
  const c3 = -b0 + 3 * b1 - 3 * b2 + b3;

  const pEven = (x: number) => a0 + a2 * x * x;
  const pOdd = (x: number) => a1 * x + a3 * x * x * x;
  const pAll = (x: number) => pEven(x) + pOdd(x);

  const pBern = (t: number) => b0 * B3[0](t) + b1 * B3[1](t) + b2 * B3[2](t) + b3 * B3[3](t);

  const done = useLatch({
    pureEven: tab === 'evenodd' && Math.abs(a1) < 0.05 && Math.abs(a3) < 0.05,
    pureOdd: tab === 'evenodd' && Math.abs(a0) < 0.05 && Math.abs(a2) < 0.05,
    bern: tab === 'bernstein' && (Math.abs(b1 - 1.8) > 0.1 || Math.abs(b2 + 0.6) > 0.1),
  });

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="多项式空间模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'evenodd', label: '偶部 ⊕ 奇部直和分解' },
          { value: 'bernstein', label: '幂基 vs Bernstein 基' },
        ]}
      />

      {tab === 'evenodd' ? (
        <LabGrid
          stage={
            <Figure
              caption="任意多项式 p(x) 都可唯一拆分为偶函数部分（关于 y 轴对称）与奇函数部分（关于原点对称）之和。"
              legend={
                <>
                  <Swatch color={C.violet} label="p(x)" />
                  <Swatch color={C.blue} dashed label="偶部 p_even(x)" />
                  <Swatch color={C.green} dashed label="奇部 p_odd(x)" />
                </>
              }
            >
              <Canvas2D range={3} aspect={1.35} ariaLabel="偶部奇部直和分解画布">
                {({ toSvg }) => {
                  const xs = Array.from({ length: 141 }, (_, i) => -2.2 + (4.4 * i) / 140);
                  const line = (fn: (x: number) => number) => xs.map((x) => toSvg([x, fn(x)]).join(',')).join(' ');
                  return (
                    <g>
                      <polyline points={line(pEven)} fill="none" stroke={C.blue} strokeWidth={2} strokeDasharray="6 4" />
                      <polyline points={line(pOdd)} fill="none" stroke={C.green} strokeWidth={2} strokeDasharray="6 4" />
                      <polyline points={line(pAll)} fill="none" stroke={C.violet} strokeWidth={2.8} />
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="调节多项式 p(x) ∈ ℝ₃[x]">
                <SliderField label="a₀（常数项 · 偶）" value={a0} min={-2} max={2} step={0.1} color={C.blue} onChange={setA0} />
                <SliderField label="a₁（一次项 · 奇）" value={a1} min={-2} max={2} step={0.1} color={C.green} onChange={setA1} />
                <SliderField label="a₂（二次项 · 偶）" value={a2} min={-2} max={2} step={0.1} color={C.blue} onChange={setA2} />
                <SliderField label="a₃（三次项 · 奇）" value={a3} min={-2} max={2} step={0.1} color={C.green} onChange={setA3} />
                <Presets
                  items={[
                    { label: '纯偶多项式', onClick: () => { setA0(0.8); setA1(0); setA2(-0.6); setA3(0); } },
                    { label: '纯奇多项式', onClick: () => { setA0(0); setA1(-1.0); setA2(0); setA3(0.5); } },
                    { label: '一般三次多项式', onClick: () => { setA0(0.6); setA1(-0.8); setA2(0.5); setA3(0.4); } },
                  ]}
                />
                <MathBox tone="ok">
                  <Tex block math={`p_{\\text{even}}(x) = \\frac{p(x)+p(-x)}{2} = ${fmt(a0)} + ${fmt(a2)}x^2`} />
                  <Tex block math={`p_{\\text{odd}}(x) = \\frac{p(x)-p(-x)}{2} = ${fmt(a1)}x + ${fmt(a3)}x^3`} />
                </MathBox>
                <Note label="教材例 2.5">
                  偶多项式子空间与奇多项式子空间的交仅为零多项式，故 <Tex math="\mathbb{R}_3[x] = \mathcal{P}_{\text{even}} \oplus \mathcal{P}_{\text{odd}}" />（维数 <Tex math="2 + 2 = 4" />）。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'pureEven', label: '令奇次系数为零，观察曲线关于 y 轴对称' },
                  { id: 'pureOdd', label: '令偶次系数为零，观察曲线关于原点中心对称' },
                  { id: 'bern', label: '切到“Bernstein 基”标签页拖动控制系数 bᵢ，体会同一多项式的不同坐标' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          stage={
            <Figure
              caption="区间 [0, 1] 上，橙色曲线 p(t) = ∑ bᵢ Bᵢ³(t) 始终落在四个 Bernstein 控制点（灰虚折线）的凸包之内。"
              legend={
                <>
                  <Swatch color={C.accent} label="曲线 p(t)" />
                  <Swatch color={C.ink3} dashed label="控制多边形 (i/3, bᵢ)" />
                </>
              }
            >
              <Canvas2D range={2.4} center={[0.5, 0.5]} aspect={1.35} axisLabels={['t', 'y']} ariaLabel="Bernstein 基画布">
                {({ toSvg }) => {
                  const ts = Array.from({ length: 101 }, (_, i) => i / 100);
                  const curve = ts.map((t) => toSvg([t, pBern(t)]).join(',')).join(' ');
                  const ctrl = [
                    [0, b0],
                    [1 / 3, b1],
                    [2 / 3, b2],
                    [1, b3],
                  ].map((p) => toSvg(p as [number, number]));
                  return (
                    <g>
                      {B3.map((bf, idx) => (
                        <polyline
                          key={idx}
                          points={ts.map((t) => toSvg([t, bf(t)]).join(',')).join(' ')}
                          fill="none"
                          stroke={C.blue}
                          strokeWidth={1}
                          strokeOpacity={0.28}
                        />
                      ))}
                      <polyline points={ctrl.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.ink3} strokeDasharray="5 4" strokeWidth={1.5} />
                      {ctrl.map((p, idx) => (
                        <circle key={idx} cx={p[0]} cy={p[1]} r={4.5} fill={C.accent} />
                      ))}
                      <polyline points={curve} fill="none" stroke={C.accent} strokeWidth={3} />
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="同一多项式在两组基下的坐标">
                <SliderField label="b₀（t=0 端点值）" value={b0} min={-2} max={2.5} step={0.1} color={C.accent} onChange={setB0} />
                <SliderField label="b₁" value={b1} min={-2} max={2.5} step={0.1} color={C.accent} onChange={setB1} />
                <SliderField label="b₂" value={b2} min={-2} max={2.5} step={0.1} color={C.accent} onChange={setB2} />
                <SliderField label="b₃（t=1 端点值）" value={b3} min={-2} max={2.5} step={0.1} color={C.accent} onChange={setB3} />
                <MathBox tone="ok">
                  <Tex block math={`[p]_{\\text{Bernstein}} = (${fmt(b0)},\\; ${fmt(b1)},\\; ${fmt(b2)},\\; ${fmt(b3)})^\\top`} />
                  <Tex block math={`[p]_{\\text{幂基}} = (${fmt(c0)},\\; ${fmt(c1)},\\; ${fmt(c2)},\\; ${fmt(c3)})^\\top`} />
                </MathBox>
                <Status tone="info">
                  Bernstein 基是计算机图形学 Bézier 曲线的数学基础：四个基函数非负且恒满足 <Tex math="\sum_{i=0}^3 B_i^3(t) \equiv 1" />。
                </Status>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'pureEven', label: '在“偶部 ⊕ 奇部”标签页测试纯偶多项式' },
                  { id: 'pureOdd', label: '在“偶部 ⊕ 奇部”标签页测试纯奇多项式' },
                  { id: 'bern', label: '调节 Bernstein 系数 b₁, b₂，观察同一条曲线在两组基下坐标的不同' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
