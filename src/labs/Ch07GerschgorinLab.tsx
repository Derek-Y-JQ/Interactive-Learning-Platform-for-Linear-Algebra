import React, { useState } from 'react';
import { Canvas2D, SvgLabel } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, SliderField, Swatch, Tasks, Toggle, useLatch } from '../components/ui';
import { eigen3Complex, fmt, type Mat3, type Vec2 } from '../utils/math';
import { C } from '../theme';

const COLORS = [C.blue, C.green, C.violet];

const scaleOff = (A: Mat3, e: number): Mat3 => A.map((r, i) => r.map((v, j) => (i === j ? v : v * e))) as Mat3;

export const Ch07GerschgorinLab: React.FC = () => {
  const [A, setA] = useState<Mat3>([
    [-2.5, 0.4, -0.3],
    [0.2, 1.0, 0.5],
    [-0.1, 0.3, 3.2],
  ]);
  const [eps, setEps] = useState(1);
  const [showCols, setShowCols] = useState(false);
  const [showPaths, setShowPaths] = useState(true);

  const Ae = scaleOff(A, eps);
  const rowDisks = [0, 1, 2].map((i) => ({ c: Ae[i][i], r: [0, 1, 2].reduce((s, j) => (j === i ? s : s + Math.abs(Ae[i][j])), 0) }));
  const colDisks = [0, 1, 2].map((j) => ({ c: Ae[j][j], r: [0, 1, 2].reduce((s, i) => (i === j ? s : s + Math.abs(Ae[i][j])), 0) }));
  const eigs = eigen3Complex(Ae);

  const paths = showPaths
    ? Array.from({ length: 41 }, (_, k) => eigen3Complex(scaleOff(A, k / 40)).sort((a, b) => a.re - b.re || a.im - b.im))
    : [];

  const separated = rowDisks.every((d, i) => rowDisks.every((e, j) => i === j || Math.abs(d.c - e.c) > d.r + e.r));
  const hasComplex = eigs.some((e) => Math.abs(e.im) > 1e-3);

  const done = useLatch({
    sep: separated && eps === 1,
    complex: hasComplex && eps === 1,
    eps: eps < 0.3,
    cols: showCols,
  });

  const setDiag = (i: number, x: number) => {
    const n = A.map((r) => [...r]) as Mat3;
    n[i][i] = x;
    setA(n);
  };

  return (
    <LabGrid
      stage={
        <Figure
          caption={<>行圆盘 D(aᵢᵢ, Rᵢ)；× 为特征值。拖动圆心（实轴上的圆点）即修改对角元。</>}
          legend={
            <>
              {COLORS.map((c, i) => <Swatch key={i} color={c} label={`D${i + 1}`} />)}
              <Swatch color={C.red} label="λ" />
              {showPaths && <Swatch color={C.accent} dashed label="ε: 0 → 1 轨迹" />}
            </>
          }
        >
          <Canvas2D
            range={4.5}
            axisLabels={['Re', 'Im']}
            handles={rowDisks.map((d, i) => ({
              id: `c${i}`,
              pos: [A[i][i], 0] as Vec2,
              color: COLORS[i],
              label: `a${['₁₁', '₂₂', '₃₃'][i]}`,
              onChange: (p: Vec2) => setDiag(i, p[0]),
              constrain: (p: Vec2) => [p[0], 0] as Vec2,
              snap: 0.1,
            }))}
          >
            {({ toSvg, scale }) => (
              <g>
                {showCols &&
                  colDisks.map((d, i) => {
                    const [x, y] = toSvg([d.c, 0]);
                    return <circle key={`col${i}`} cx={x} cy={y} r={Math.max(1, d.r * scale)} fill="none" stroke={COLORS[i]} strokeDasharray="5 4" strokeWidth={1.4} />;
                  })}
                {rowDisks.map((d, i) => {
                  const [x, y] = toSvg([d.c, 0]);
                  return <circle key={i} cx={x} cy={y} r={Math.max(1, d.r * scale)} fill={COLORS[i]} fillOpacity={0.1} stroke={COLORS[i]} strokeWidth={1.8} />;
                })}
                {showPaths &&
                  [0, 1, 2].map((k) => (
                    <polyline
                      key={`p${k}`}
                      points={paths.map((ev) => toSvg([ev[k].re, ev[k].im]).join(',')).join(' ')}
                      fill="none"
                      stroke={C.accent}
                      strokeWidth={1.3}
                      strokeDasharray="3 3"
                    />
                  ))}
                {eigs.map((ev, i) => {
                  const [x, y] = toSvg([ev.re, ev.im]);
                  return (
                    <g key={`e${i}`}>
                      <path d={`M${x - 6},${y - 6} L${x + 6},${y + 6} M${x - 6},${y + 6} L${x + 6},${y - 6}`} stroke={C.surface} strokeWidth={5} />
                      <path d={`M${x - 6},${y - 6} L${x + 6},${y + 6} M${x - 6},${y + 6} L${x + 6},${y - 6}`} stroke={C.red} strokeWidth={2.4} />
                      {i === 0 && eps < 1 && <SvgLabel at={[x, y]} color={C.red} size={14}>λ(ε)</SvgLabel>}
                    </g>
                  );
                })}
              </g>
            )}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel title="矩阵">
            <MatrixInput ariaLabel="3×3 矩阵 A" value={A} onChange={(m) => setA(m as Mat3)} cellClass={(r, c) => (r === c ? 'bg-primary-soft font-semibold' : undefined)} />
            <SliderField label="非对角元缩放 ε" value={eps} min={0} max={1} step={0.01} color={C.accent} onChange={setEps} />
            <div className="flex flex-wrap gap-x-5">
              <Toggle checked={showPaths} onChange={setShowPaths} color={C.accent}>特征值轨迹</Toggle>
              <Toggle checked={showCols} onChange={setShowCols}>列圆盘（Aᵀ）</Toggle>
            </div>
            <MathBox>
              {rowDisks.map((d, i) => (
                <div key={i} className="font-mono text-[14px]" style={{ color: COLORS[i] }}>
                  D{i + 1}: 圆心 {fmt(d.c)}，半径 {fmt(d.r)}
                </div>
              ))}
              <div className="border-t border-rule mt-1.5 pt-1.5 font-mono text-[14px]" style={{ color: C.red }}>
                {eigs.map((e, i) => (
                  <div key={i}>
                    λ{i + 1} = {fmt(e.re)}
                    {Math.abs(e.im) > 1e-4 ? ` ${e.im > 0 ? '+' : '−'} ${fmt(Math.abs(e.im))}i` : ''}
                  </div>
                ))}
              </div>
            </MathBox>
            <Presets
              items={[
                { label: '圆盘分离', onClick: () => setA([[-2.5, 0.4, -0.3], [0.2, 1, 0.5], [-0.1, 0.3, 3.2]]) },
                { label: '圆盘相交', onClick: () => setA([[0.5, -1.6, 0.2], [1.6, 0.5, -0.3], [0.1, 0.2, 3]]) },
                { label: '对角占优', onClick: () => setA([[4, 1, 0.5], [0.5, -3, 1], [1, 0.5, 1]]) },
              ]}
            />
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'sep', label: '拖动圆心使三个圆盘两两分离（此时三个特征值都是实数）。' },
              { id: 'complex', label: '让圆盘重叠并出现一对共轭复特征值。' },
              { id: 'eps', label: '把 ε 调到接近 0，观察特征值回到圆心。' },
              { id: 'cols', label: '打开列圆盘，比较两组估计。' },
            ]}
          />
          <Note label="定理">
            每个特征值都在 <Tex math="\bigcup_i D(a_{ii},R_i)" /> 中；若 k 个圆盘的并与其余圆盘不交，则其中恰有 k 个特征值。ε 从 0 增至 1 时特征值连续移动，这正是证明的思路。
          </Note>
        </>
      }
    />
  );
};
