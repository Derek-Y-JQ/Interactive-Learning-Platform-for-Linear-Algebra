import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { fmt, type Vec2 } from '../utils/math';
import { C } from '../theme';

// 2x2 rank-1 system: A = [[1, -2], [0.5, -1]] or customizable rank-1/rank-2
export const Ch06SolutionStructureLab: React.FC = () => {
  const [mode, setMode] = useState<'rank1' | 'rank2'>('rank1');
  // For rank1: A = [[1, -2], [0.5, -1]] -> im(A) = span((2, 1)), ker(A) = span((2, 1))
  // Better: A = [[1, -2], [-0.5, 1]] -> col1 = (1, -0.5), col2 = (-2, 1), im(A) = span((1, -0.5)), ker(A) = span((2, 1))
  const [b, setB] = useState<Vec2>([2, -1]);
  const [t, setT] = useState(0.5);

  // A for rank1: [[1, -2], [-0.5, 1]]
  // A for rank2: [[1, 0.5], [-0.5, 1]]
  const A: [[number, number], [number, number]] =
    mode === 'rank1'
      ? [
          [1, -2],
          [-0.5, 1],
        ]
      : [
          [1, 0.5],
          [-0.5, 1],
        ];

  const colDir: Vec2 = [1, -0.5];
  const kerDir: Vec2 = [2, 1];

  let consistent = true;
  let x0: Vec2 | null = null;
  let curX: Vec2 | null = null;

  if (mode === 'rank1') {
    // b in im(A) iff b[1] == -0.5 * b[0]
    const dist = Math.abs(b[1] + 0.5 * b[0]);
    consistent = dist < 0.14;
    if (consistent) {
      // Minimum-norm particular solution for x1 - 2x2 = b0: x0 = b0/5 * (1, -2)
      x0 = [(b[0] * 1) / 5, (b[0] * -2) / 5];
      curX = [x0[0] + t * kerDir[0], x0[1] + t * kerDir[1]];
    }
  } else {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    x0 = [(b[0] * A[1][1] - A[0][1] * b[1]) / det, (A[0][0] * b[1] - b[0] * A[1][0]) / det];
    curX = x0;
  }

  const done = useLatch({
    slideT: mode === 'rank1' && consistent && Math.abs(t - 0.5) > 0.3,
    inconsistent: mode === 'rank1' && !consistent,
    unique: mode === 'rank2',
  });

  return (
    <LabGrid
      wideStage
      stage={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Figure
            caption="解空间所在定义域 ℝ²：红色为齐次解空间 ker A，紫色为非齐次通解 x₀ + ker A"
            legend={
              <>
                <Swatch color={C.red} label="ker A (Ax=0)" />
                <Swatch color={C.violet} label="x₀ + ker A (Ax=b)" />
              </>
            }
          >
            <Canvas2D range={4} aspect={1} ariaLabel="解空间结构画布">
              {({ toSvg, line }) => {
                const o = toSvg([0, 0]);
                return (
                  <g>
                    {mode === 'rank1' ? (
                      <>
                        <line {...line([0, 0], kerDir)} stroke={C.red} strokeWidth={2.5} />
                        <SvgLabel at={toSvg([1.6, 0.8])} color={C.red} dy={-12}>ker A</SvgLabel>
                        {consistent && x0 && curX && (
                          <>
                            <line {...line(x0, kerDir)} stroke={C.violet} strokeWidth={2.6} />
                            <SvgArrow from={o} to={toSvg(x0)} color={C.blue} width={2.4} dashed />
                            <SvgLabel at={toSvg(x0)} color={C.blue} dy={16}>特解 x₀</SvgLabel>
                            <SvgArrow from={toSvg(x0)} to={toSvg(curX)} color={C.red} width={2} />
                            <SvgArrow from={o} to={toSvg(curX)} color={C.violet} width={2.8} />
                            <SvgPoint at={toSvg(curX)} color={C.violet} r={4.5} />
                            <SvgLabel at={toSvg(curX)} color={C.violet} dy={-14}>x₀ + tη</SvgLabel>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <SvgPoint at={o} color={C.red} r={4.5} />
                        {x0 && (
                          <>
                            <SvgArrow from={o} to={toSvg(x0)} color={C.violet} width={2.8} />
                            <SvgPoint at={toSvg(x0)} color={C.violet} r={5} />
                            <SvgLabel at={toSvg(x0)} color={C.violet} dy={-14}>唯一解 x₀</SvgLabel>
                          </>
                        )}
                      </>
                    )}
                  </g>
                );
              }}
            </Canvas2D>
          </Figure>

          <Figure
            caption="右端项所在陪域 ℝ²：拖动 b，看它是否落在绿色列空间 im A 中"
            legend={
              <>
                <Swatch color={C.green} label="im A（列空间）" />
                <Swatch color={consistent ? C.accent : C.red} label="b" />
              </>
            }
          >
            <Canvas2D
              range={4}
              aspect={1}
              handles={[{ id: 'b', pos: b, color: consistent ? C.accent : C.red, label: 'b', onChange: setB }]}
              ariaLabel="列空间与右端项 b"
            >
              {({ toSvg, line, width, height }) => {
                const o = toSvg([0, 0]);
                return (
                  <g>
                    {mode === 'rank1' ? (
                      <line {...line([0, 0], colDir)} stroke={C.green} strokeWidth={4} strokeOpacity={0.45} />
                    ) : (
                      <rect width={width} height={height} fill={C.green} fillOpacity={0.08} />
                    )}
                    <SvgArrow from={o} to={toSvg(b)} color={consistent ? C.accent : C.red} width={2.8} />
                  </g>
                );
              }}
            </Canvas2D>
          </Figure>
        </div>
      }
      side={
        <>
          <Panel title="线性方程组 Ax = b">
            <Presets
              label="系数矩阵类型"
              items={[
                { label: '秩 1（无穷多解 / 无解）', active: mode === 'rank1', onClick: () => { setMode('rank1'); setB([2, -1]); } },
                { label: '满秩（唯一解）', active: mode === 'rank2', onClick: () => { setMode('rank2'); setB([1.5, 0.5]); } },
              ]}
            />
            <Presets
              label="右端项 b 快捷设置"
              items={[
                { label: 'b ∈ im A（有解）', onClick: () => setB([2, -1]) },
                { label: 'b = 0（齐次）', onClick: () => setB([0, 0]) },
                { label: 'b ∉ im A（无解）', onClick: () => setB([1.5, 1.5]) },
              ]}
            />
            <VectorInput name="b" color={consistent ? C.accent : C.red} value={b} onChange={(p) => setB(p as Vec2)} />
            {mode === 'rank1' && consistent && (
              <SliderField label="自由变量 t" value={t} min={-1.5} max={1.5} step={0.1} color={C.violet} onChange={setT} />
            )}
            <MathBox tone={consistent ? 'ok' : 'warn'}>
              <Tex
                block
                math={`A = \\begin{pmatrix}${fmt(A[0][0])} & ${fmt(A[0][1])} \\\\ ${fmt(A[1][0])} & ${fmt(A[1][1])}\\end{pmatrix},\\quad \\boldsymbol{b} = \\begin{pmatrix}${fmt(b[0])}\\\\${fmt(b[1])}\\end{pmatrix}`}
              />
              {consistent && x0 ? (
                mode === 'rank1' ? (
                  <Tex block math={`\\boldsymbol{x} = \\boldsymbol{x}_0 + t\\boldsymbol{\\eta} = \\begin{pmatrix}${fmt(x0[0])}\\\\${fmt(x0[1])}\\end{pmatrix} + ${fmt(t)}\\begin{pmatrix}2\\\\1\\end{pmatrix}`} />
                ) : (
                  <Tex block math={`\\boldsymbol{x}_0 = \\begin{pmatrix}${fmt(x0[0])}\\\\${fmt(x0[1])}\\end{pmatrix}\\quad(\\ker A = \\{\\boldsymbol{0}\\})`} />
                )
              ) : (
                <div className="text-danger text-[14px]">b 不在列空间 im A 中：rank(A) = 1 &lt; rank(A | b) = 2，方程组无解！</div>
              )}
            </MathBox>
            <Status tone={consistent ? 'ok' : 'warn'}>
              {consistent
                ? mode === 'rank1'
                  ? '非齐次通解 = 一个特解 x₀ + 齐次解空间 ker A（平行于 ker A 的仿射直线）。'
                  : '系数矩阵满秩，列空间充满 ℝ²，对任意 b 均有唯一解。'
                : '把右侧的 b 拖回绿色直线上，左侧紫色解集就会立即出现。'}
            </Status>
            <Note label="结构定理">
              <Tex math="A\boldsymbol{x}=\boldsymbol{b}" /> 有解当且仅当 <Tex math="\boldsymbol{b}\in\operatorname{im}A" />；一旦有特解 <Tex math="\boldsymbol{x}_0" />，全部解构成仿射子空间 <Tex math="\boldsymbol{x}_0 + \ker A" />。
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'slideT', label: '在“秩 1”有解时拖动自由变量 t，观察解点沿紫色直线滑动而右端 b 不变' },
              { id: 'inconsistent', label: '把右端 b 拖离绿色直线，观察左侧解集消失（无解）' },
              { id: 'unique', label: '切换到“满秩”矩阵，验证 ker A = {0} 且任意 b 对应唯一解' },
            ]}
          />
        </>
      }
    />
  );
};
