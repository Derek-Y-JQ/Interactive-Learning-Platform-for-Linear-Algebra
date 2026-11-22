import React, { useState } from 'react';
import { Canvas2D } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { fmt, type Vec2 } from '../utils/math';
import { C } from '../theme';

// General conic: A x^2 + 2 B x y + C y^2 + 2 D x + 2 E y + F = 0
interface ConicParams {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
}

function evalConic(p: ConicParams, x: number, y: number): number {
  return p.A * x * x + 2 * p.B * x * y + p.C * y * y + 2 * p.D * x + 2 * p.E * y + p.F;
}

// Marching squares contour at f(x, y) = 0 for crisp implicit conic plotting
function conicSegments(p: ConicParams, xmin: number, xmax: number, ymin: number, ymax: number, N = 72): [Vec2, Vec2][] {
  const dx = (xmax - xmin) / N;
  const dy = (ymax - ymin) / N;
  const vals: number[][] = [];
  for (let j = 0; j <= N; j++) {
    const row: number[] = [];
    const y = ymin + j * dy;
    for (let i = 0; i <= N; i++) row.push(evalConic(p, xmin + i * dx, y));
    vals.push(row);
  }
  const segs: [Vec2, Vec2][] = [];
  const interp = (a: Vec2, b: Vec2, va: number, vb: number): Vec2 => {
    const t = Math.abs(vb - va) < 1e-9 ? 0.5 : -va / (vb - va);
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  };
  for (let j = 0; j < N; j++) {
    const y0 = ymin + j * dy;
    const y1 = y0 + dy;
    for (let i = 0; i < N; i++) {
      const x0 = xmin + i * dx;
      const x1 = x0 + dx;
      const v00 = vals[j][i], v10 = vals[j][i + 1], v11 = vals[j + 1][i + 1], v01 = vals[j + 1][i];
      const pts: Vec2[] = [];
      if ((v00 < 0) !== (v10 < 0)) pts.push(interp([x0, y0], [x1, y0], v00, v10));
      if ((v10 < 0) !== (v11 < 0)) pts.push(interp([x1, y0], [x1, y1], v10, v11));
      if ((v11 < 0) !== (v01 < 0)) pts.push(interp([x1, y1], [x0, y1], v11, v01));
      if ((v01 < 0) !== (v00 < 0)) pts.push(interp([x0, y1], [x0, y0], v01, v00));
      if (pts.length === 2) segs.push([pts[0], pts[1]]);
      else if (pts.length === 4) {
        segs.push([pts[0], pts[1]], [pts[2], pts[3]]);
      }
    }
  }
  return segs;
}

export const Ch11ConicClassificationLab: React.FC = () => {
  const [p, setP] = useState<ConicParams>({ A: 2, B: 1, C: 2, D: -2, E: -1, F: -1 });
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0: original, 1: rotated, 2: rotated + translated

  // Invariants I1, I2, I3
  const I1 = p.A + p.C;
  const I2 = p.A * p.C - p.B * p.B;
  const I3 =
    p.A * (p.C * p.F - p.E * p.E) -
    p.B * (p.B * p.F - p.E * p.D) +
    p.D * (p.B * p.E - p.C * p.D);

  // Rotation angle theta to eliminate xy term: tan(2theta) = 2B / (A - C)
  const theta = Math.abs(p.B) < 1e-6 ? 0 : 0.5 * Math.atan2(2 * p.B, p.A - p.C);
  const ct = Math.cos(theta), st = Math.sin(theta);

  // Coefficients after rotation x = ct*x' - st*y', y = st*x' + ct*y'
  const A1 = p.A * ct * ct + 2 * p.B * ct * st + p.C * st * st;
  const C1 = p.A * st * st - 2 * p.B * ct * st + p.C * ct * ct;
  const D1 = p.D * ct + p.E * st;
  const E1 = -p.D * st + p.E * ct;
  const rotParams: ConicParams = { A: A1, B: 0, C: C1, D: D1, E: E1, F: p.F };

  // Center translation (when I2 != 0) or vertex shift (parabola)
  let dx = 0, dy = 0;
  if (Math.abs(A1) > 1e-5) dx = -D1 / A1;
  if (Math.abs(C1) > 1e-5) dy = -E1 / C1;
  const F2 = A1 * dx * dx + C1 * dy * dy + 2 * D1 * dx + 2 * E1 * dy + p.F;
  const transParams: ConicParams = {
    A: A1,
    B: 0,
    C: C1,
    D: Math.abs(A1) > 1e-5 ? 0 : D1,
    E: Math.abs(C1) > 1e-5 ? 0 : E1,
    F: F2,
  };

  const activeParams = step === 0 ? p : step === 1 ? rotParams : transParams;

  // Classification by invariants
  let kind = '';
  if (I2 > 1e-5) {
    if (Math.abs(I3) < 1e-4) kind = '退化：一点（相交虚直线）';
    else if (I1 * I3 < 0) kind = '椭圆（实椭圆）';
    else kind = '虚椭圆（无实点）';
  } else if (I2 < -1e-5) {
    kind = Math.abs(I3) < 1e-4 ? '退化：两条相交直线' : '双曲线';
  } else {
    kind = Math.abs(I3) > 1e-4 ? '抛物线' : '退化：平行/重合直线';
  }

  const done = useLatch({
    rotated: step === 1,
    canonical: step === 2,
    parabola: Math.abs(I2) < 1e-4 && Math.abs(I3) > 1e-4,
    hyperbola: I2 < -1e-4 && Math.abs(I3) > 1e-4,
  });

  const upd = (k: keyof ConicParams) => (v: number) => setP((old) => ({ ...old, [k]: v }));

  return (
    <LabGrid
      stage={
        <Figure
          caption={
            step === 0
              ? '原始一般方程（含交叉项 xy 与一次项）'
              : step === 1
              ? `第 1 步：逆时针转轴 θ = ${fmt((theta * 180) / Math.PI, 1)}°，消去交叉项 2Bxy`
              : '第 2 步：平移坐标原点至中心/顶点，得到标准形！'
          }
          legend={
            <>
              <Swatch color={C.blue} label="当前曲线" />
              {step === 0 && <Swatch color={C.accent} dashed label="旋转后的主轴方向" />}
            </>
          }
        >
          <Canvas2D range={4.5} ariaLabel="平面二次曲线分类画布">
            {({ toSvg, line, view }) => {
              const segs = conicSegments(activeParams, view.xmin, view.xmax, view.ymin, view.ymax, 76);
              return (
                <g>
                  {step === 0 && (
                    <g stroke={C.accent} strokeWidth={1.3} strokeDasharray="5 4" strokeOpacity={0.7}>
                      <line {...line([0, 0], [ct, st])} />
                      <line {...line([0, 0], [-st, ct])} />
                    </g>
                  )}
                  {segs.map(([a, b], idx) => {
                    const pa = toSvg(a);
                    const pb = toSvg(b);
                    return <line key={idx} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={C.blue} strokeWidth={2.4} strokeLinecap="round" />;
                  })}
                </g>
              );
            }}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel title="二元二次方程 Ax² + 2Bxy + Cy² + 2Dx + 2Ey + F = 0">
            <Presets
              label="典型二次曲线"
              items={[
                { label: '斜椭圆', onClick: () => { setP({ A: 2, B: 1, C: 2, D: -2, E: -1, F: -1 }); setStep(0); } },
                { label: '斜双曲线', onClick: () => { setP({ A: 1, B: 2, C: 1, D: -1, E: 1, F: -2 }); setStep(0); } },
                { label: '斜抛物线', onClick: () => { setP({ A: 1, B: 1, C: 1, D: -2, E: 1, F: 0 }); setStep(0); } },
                { label: '相交两直线', onClick: () => { setP({ A: 1, B: 0, C: -1, D: 0, E: 0, F: 0 }); setStep(0); } },
              ]}
            />
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <SliderField label="A" value={p.A} min={-3} max={3} step={0.5} onChange={upd('A')} />
              <SliderField label="B (xy项)" value={p.B} min={-3} max={3} step={0.5} onChange={upd('B')} />
              <SliderField label="C" value={p.C} min={-3} max={3} step={0.5} onChange={upd('C')} />
              <SliderField label="D (x项)" value={p.D} min={-3} max={3} step={0.5} onChange={upd('D')} />
              <SliderField label="E (y项)" value={p.E} min={-3} max={3} step={0.5} onChange={upd('E')} />
              <SliderField label="F (常数)" value={p.F} min={-4} max={4} step={0.5} onChange={upd('F')} />
            </div>
            <Presets
              label="直角坐标化简步骤"
              items={[
                { label: '0. 原方程', active: step === 0, onClick: () => setStep(0) },
                { label: '1. 转轴消 xy', active: step === 1, onClick: () => setStep(1) },
                { label: '2. 移轴化标准形', active: step === 2, onClick: () => setStep(2) },
              ]}
            />
          </Panel>

          <Panel title="不变量与分类判定">
            <MathBox tone="ok">
              <Tex block math={`I_1 = A + C = ${fmt(I1)},\\quad I_2 = AC - B^2 = ${fmt(I2)},\\quad I_3 = ${fmt(I3)}`} />
              <Tex
                block
                math={`\\text{当前方程：}${fmt(activeParams.A)}x^2 ${activeParams.B !== 0 ? `+ ${fmt(2 * activeParams.B)}xy` : ''} ${activeParams.C >= 0 ? '+' : '-'} ${fmt(Math.abs(activeParams.C))}y^2 ${activeParams.D !== 0 ? `${activeParams.D > 0 ? '+' : '-'} ${fmt(Math.abs(2 * activeParams.D))}x` : ''} ${activeParams.E !== 0 ? `${activeParams.E > 0 ? '+' : '-'} ${fmt(Math.abs(2 * activeParams.E))}y` : ''} ${activeParams.F >= 0 ? '+' : '-'} ${fmt(Math.abs(activeParams.F))} = 0`}
              />
            </MathBox>
            <Status tone="ok">
              分类结果：<strong>{kind}</strong>（在转轴与移轴下，不变量 <Tex math="I_1, I_2, I_3" /> 严格不变！）
            </Status>
            <Note label="化简口诀">
              先用正交转轴把二次项矩阵对角化（消去 <Tex math="2Bxy" />），再通过配方移轴消去一次项，曲线的几何形状完全由不变量 <Tex math="I_1, I_2, I_3" /> 决定。
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'rotated', label: '点击“1. 转轴消 xy”，观察斜曲线如何对齐坐标轴' },
              { id: 'canonical', label: '点击“2. 移轴化标准形”，得到中心在原点的标准方程' },
              { id: 'parabola', label: '切换到“斜抛物线”，验证此时 I₂ = AC − B² = 0' },
              { id: 'hyperbola', label: '切换到“斜双曲线”，验证此时 I₂ < 0' },
            ]}
          />
        </>
      }
    />
  );
};
