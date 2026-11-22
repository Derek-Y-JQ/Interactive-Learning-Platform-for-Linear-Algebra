import React, { useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, addFatLine, addLabel3D, addPoint3D, addPolygon3D, addVector3D } from '../components/ThreeViewport';
import { Canvas2D } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, Segmented, SliderField, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { fmt, norm3, type Vec3 } from '../utils/math';
import { C } from '../theme';

type TargetFn = 'exp' | 'abs' | 'step';

const TARGETS: Record<TargetFn, { label: string; tex: string; fn: (x: number) => number }> = {
  exp: { label: 'eˣ（教材例 8.3）', tex: 'f(x) = \\mathrm{e}^x', fn: (x) => Math.exp(x) },
  abs: { label: '|x|', tex: 'f(x) = |x|', fn: (x) => Math.abs(x) },
  step: { label: '符号函数 sgn(x)', tex: 'f(x) = \\operatorname{sgn}(x)', fn: (x) => (x < 0 ? -1 : 1) },
};

// Legendre polynomials P_0 .. P_5 on [-1, 1]
function legendre(n: number, x: number): number {
  if (n === 0) return 1;
  if (n === 1) return x;
  let p0 = 1, p1 = x;
  for (let k = 2; k <= n; k++) {
    const pk = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k;
    p0 = p1;
    p1 = pk;
  }
  return p1;
}

// Numerical inner product <f, g> = \int_{-1}^1 f(x)g(x) dx via Simpson rule
function innerL2(f: (x: number) => number, g: (x: number) => number, N = 120): number {
  const h = 2 / N;
  let sum = f(-1) * g(-1) + f(1) * g(1);
  for (let i = 1; i < N; i++) {
    const x = -1 + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * f(x) * g(x);
  }
  return (sum * h) / 3;
}

export const Ch08ProjectionApproxLab: React.FC = () => {
  const [tab, setTab] = useState<'geo' | 'func'>('geo');

  // 3D geometric mode: W = xOy plane (z = 0)
  const [v, setV] = useState<Vec3>([1.6, 1.2, 2.0]);
  const [w, setW] = useState<Vec3>([-0.6, 1.8, 0]);

  // Function space mode
  const [fnId, setFnId] = useState<TargetFn>('exp');
  const [deg, setDeg] = useState(1);

  const vW: Vec3 = [v[0], v[1], 0];
  const vPerp: Vec3 = [0, 0, v[2]];
  const wClamped: Vec3 = [w[0], w[1], 0];
  const distBest = Math.abs(v[2]);
  const distW = norm3([v[0] - wClamped[0], v[1] - wClamped[1], v[2]]);
  const diffBase = norm3([vW[0] - wClamped[0], vW[1] - wClamped[1], 0]);

  // Legendre projection coefficients
  const target = TARGETS[fnId];
  const coeffs: number[] = [];
  for (let k = 0; k <= deg; k++) {
    // ||P_k||^2 = 2 / (2k + 1)
    const ip = innerL2(target.fn, (x) => legendre(k, x));
    coeffs.push((ip * (2 * k + 1)) / 2);
  }
  const approx = (x: number) => coeffs.reduce((s, c, k) => s + c * legendre(k, x), 0);
  const l2Err = Math.sqrt(Math.max(0, innerL2((x) => target.fn(x) - approx(x), (x) => target.fn(x) - approx(x))));

  const done = useLatch({
    matchProj: tab === 'geo' && diffBase < 0.25,
    funcDeg1: tab === 'func' && fnId === 'exp' && deg === 1,
    funcHigh: tab === 'func' && deg >= 4,
  });

  const buildScene = (group: THREE.Group) => {
    const plane: Vec3[] = [
      [-3, -3, 0],
      [3, -3, 0],
      [3, 3, 0],
      [-3, 3, 0],
    ];
    addPolygon3D(group, plane, C.blue, 0.16);
    addFatLine(group, [...plane, plane[0]], C.blue, 1.5, { opacity: 0.55 });
    addLabel3D(group, 'W (xOy 平面)', [2.4, 2.4, 0.1], C.blue);

    addVector3D(group, [0, 0, 0], v, C.violet, { label: 'v' });
    addVector3D(group, [0, 0, 0], vW, C.green, { label: 'v_W' });
    addVector3D(group, vW, v, C.red, { radius: 0.028, label: 'v_⊥' });
    addPoint3D(group, wClamped, C.ochre, 0.11);
    addLabel3D(group, 'w ∈ W', [wClamped[0], wClamped[1], -0.3], C.ochre);

    // Right-triangle legs: v -> w and vW -> w
    addFatLine(group, [v, wClamped], C.ochre, 2.5, { dashed: true });
    addFatLine(group, [vW, wClamped], C.ink2, 2, { dashed: true });
  };

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="正交投影模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'geo', label: '三维正交分解与最佳逼近' },
          { value: 'func', label: '函数空间 C[-1,1] 中的 Legendre 正交投影' },
        ]}
      />

      {tab === 'geo' ? (
        <LabGrid
          stage={
            <Figure
              caption="拖动紫色向量 v 或平面内的黄色点 w，观察直角三角形勾股关系 ‖v − w‖² = ‖v − v_W‖² + ‖v_W − w‖²。"
              legend={
                <>
                  <Swatch color={C.violet} label="v" />
                  <Swatch color={C.green} label="正交投影 v_W" />
                  <Swatch color={C.red} label="残差 v_⊥" />
                  <Swatch color={C.ochre} dashed label="任意候选 w ∈ W" />
                </>
              }
            >
              <ThreeViewport
                buildScene={buildScene}
                deps={[v, wClamped]}
                handles={[
                  { id: 'v', pos: v, color: C.violet, label: 'v', onChange: setV },
                  { id: 'w', pos: wClamped, color: C.ochre, label: 'w', onChange: (p) => setW([p[0], p[1], 0]) },
                ]}
                ariaLabel="三维正交分解视图"
              />
            </Figure>
          }
          side={
            <>
              <Panel title="正交分解与距离对比">
                <VectorInput name="v" color={C.violet} value={v} onChange={(p) => setV(p as Vec3)} min={-3} max={3} />
                <VectorInput name="w" color={C.ochre} value={wClamped} onChange={(p) => setW([p[0], p[1], 0])} min={-3} max={3} />
                <MathBox tone={diffBase < 0.25 ? 'ok' : 'neutral'}>
                  <Tex block math={`\\boldsymbol{v}_W = (${fmt(vW[0])}, ${fmt(vW[1])}, 0), \\quad \\boldsymbol{v}_\\perp = (0, 0, ${fmt(vPerp[2])})`} />
                  <Tex block math={`\\|\\boldsymbol{v} - \\boldsymbol{w}\\|^2 = ${fmt(distW * distW)} = \\underbrace{${fmt(distBest * distBest)}}_{\\|\\boldsymbol{v}-\\boldsymbol{v}_W\\|^2} + \\underbrace{${fmt(diffBase * diffBase)}}_{\\|\\boldsymbol{v}_W-\\boldsymbol{w}\\|^2}`} />
                </MathBox>
                <Status tone={diffBase < 0.25 ? 'ok' : 'info'}>
                  {diffBase < 0.25 ? '命中最佳逼近！w 与正交投影 v_W 重合，距离达到最小值。' : `当前 ‖v − w‖ = ${fmt(distW)} > ‖v − v_W‖ = ${fmt(distBest)}。`}
                </Status>
                <Note label="最佳逼近定理">
                  由于 <Tex math="(\boldsymbol{v}-\boldsymbol{v}_W)\perp(\boldsymbol{v}_W-\boldsymbol{w})" />，由勾股定理立得正交投影 <Tex math="\boldsymbol{v}_W" /> 是子空间 <Tex math="W" /> 中离 <Tex math="\boldsymbol{v}" /> 唯一的最近点。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'matchProj', label: '在平面 W 内拖动 w，使其逼近正交投影点 v_W，观察距离取最小' },
                  { id: 'funcDeg1', label: '切到“函数空间”标签页，查看教材用一次多项式逼近 eˣ 的经典例题' },
                  { id: 'funcHigh', label: '在“函数空间”中将次数调至 4 以上，观察 L² 误差急剧下降' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          stage={
            <Figure
              caption="区间 [-1, 1] 上，内积 ⟨f, g⟩ = ∫₋₁¹ f(x)g(x) dx；橙色曲线为 f 在 n 次多项式子空间上的正交投影。"
              legend={
                <>
                  <Swatch color={C.blue} label="目标函数 f(x)" />
                  <Swatch color={C.accent} label={`最佳逼近 p_${deg}(x)`} />
                </>
              }
            >
              <Canvas2D range={2.2} aspect={1.35} axisLabels={['x', 'y']} ariaLabel="函数空间正交逼近画布">
                {({ toSvg }) => {
                  const xs: number[] = [];
                  for (let i = 0; i <= 160; i++) xs.push(-1 + (2 * i) / 160);
                  const fPts = xs.map((x) => toSvg([x, target.fn(x)]).join(',')).join(' ');
                  const pPts = xs.map((x) => toSvg([x, approx(x)]).join(',')).join(' ');
                  // Shaded error band between f and approx
                  const band = [...xs.map((x) => toSvg([x, target.fn(x)]).join(',')), ...[...xs].reverse().map((x) => toSvg([x, approx(x)]).join(','))].join(' ');
                  const xL = toSvg([-1, 0])[0];
                  const xR = toSvg([1, 0])[0];
                  return (
                    <g>
                      <line x1={xL} y1={0} x2={xL} y2={640} stroke={C.ruleStrong} strokeDasharray="4 4" />
                      <line x1={xR} y1={0} x2={xR} y2={640} stroke={C.ruleStrong} strokeDasharray="4 4" />
                      <polygon points={band} fill={C.red} fillOpacity={0.12} />
                      <polyline points={fPts} fill="none" stroke={C.blue} strokeWidth={2.5} />
                      <polyline points={pPts} fill="none" stroke={C.accent} strokeWidth={2.6} />
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="函数空间中的正交投影">
                <Presets
                  label="目标函数 f(x)"
                  items={(Object.keys(TARGETS) as TargetFn[]).map((k) => ({
                    label: TARGETS[k].label,
                    active: k === fnId,
                    onClick: () => setFnId(k),
                  }))}
                />
                <SliderField label="多项式次数 n" value={deg} min={0} max={5} step={1} digits={0} color={C.accent} onChange={setDeg} />
                <MathBox tone="ok">
                  <Tex block math={`p_${deg}(x) = \\sum_{k=0}^{${deg}} c_k P_k(x), \\quad c_k = \\frac{\\langle f, P_k\\rangle}{\\langle P_k, P_k\\rangle}`} />
                  <Tex block math={`\\|f - p_${deg}\\|_{L^2} = \\sqrt{\\int_{-1}^1 (f(x)-p_${deg}(x))^2\\,\\mathrm{d}x} = ${fmt(l2Err, 4)}`} />
                </MathBox>
                <div className="text-[13px] text-ink-2 space-y-1">
                  <div className="font-semibold text-ink">各阶 Legendre 展开系数：</div>
                  <div className="flex flex-wrap gap-2 font-mono">
                    {coeffs.map((c, k) => (
                      <span key={k} className="px-2 py-0.5 rounded bg-paper border border-rule">
                        c{k} = {fmt(c, 3)}
                      </span>
                    ))}
                  </div>
                </div>
                <Note label="正交基的威力">
                  提高次数 <Tex math="n" /> 时，已算出的低阶系数 <Tex math="c_0,\dots,c_{n-1}" /> <strong>完全不需要重新计算</strong>——这正是使用 Legendre 正交基（而非普通幂基 <Tex math="1,x,x^2,\dots" />）的核心优势。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'matchProj', label: '在“三维正交分解”中把 w 拖到最佳逼近点' },
                  { id: 'funcDeg1', label: '选择 eˣ 且次数 n = 1，对比教材一次多项式最佳逼近' },
                  { id: 'funcHigh', label: '将次数增至 4 或 5，观察系数稳定与红色误差带收缩' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
