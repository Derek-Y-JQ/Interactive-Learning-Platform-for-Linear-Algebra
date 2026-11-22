import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { det2, det3, fmt, type Mat3, type Vec2 } from '../utils/math';
import { C } from '../theme';

function minor3(A: Mat3, delR: number, delC: number): number {
  const sub: number[][] = [];
  for (let i = 0; i < 3; i++) {
    if (i === delR) continue;
    const row: number[] = [];
    for (let j = 0; j < 3; j++) if (j !== delC) row.push(A[i][j]);
    sub.push(row);
  }
  return sub[0][0] * sub[1][1] - sub[0][1] * sub[1][0];
}

function adj3(A: Mat3): Mat3 {
  const res: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      // (i, j) entry of A* is cofactor A_{j,i} = (-1)^{i+j} M_{j,i} (TRANSPOSED!)
      const sign = (i + j) % 2 === 0 ? 1 : -1;
      res[i][j] = sign * minor3(A, j, i);
    }
  }
  return res as Mat3;
}

const mat3Tex = (M: number[][]) => `\\begin{pmatrix}${M.map((r) => r.map((v) => fmt(v)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;

export const Ch05AdjugateCramerLab: React.FC = () => {
  const [tab, setTab] = useState<'adj' | 'cramer'>('adj');
  const [A, setA] = useState<Mat3>([
    [2, 1, 0],
    [1, 3, -1],
    [0, 2, 1],
  ]);
  const [pick, setPick] = useState<[number, number]>([0, 1]); // (i, j) in A*

  // 2D Cramer geometric state
  const [a1, setA1] = useState<Vec2>([2.0, 0.5]);
  const [a2, setA2] = useState<Vec2>([0.4, 1.8]);
  const [b, setB] = useState<Vec2>([2.2, 2.5]);

  const dA = det3(A);
  const Adj = adj3(A);
  const [pi, pj] = pick; // A*[pi][pj] = A_{pj, pi} = (-1)^{pi+pj} M_{pj, pi}
  const sign = (pi + pj) % 2 === 0 ? 1 : -1;
  const subRows = [0, 1, 2].filter((r) => r !== pj);
  const subCols = [0, 1, 2].filter((c) => c !== pi);
  const mVal = minor3(A, pj, pi);
  const cVal = sign * mVal;
  const invA = Math.abs(dA) > 1e-7 ? Adj.map((r) => r.map((v) => v / dA)) : null;

  // 2D Cramer computation
  const D = det2([[a1[0], a2[0]], [a1[1], a2[1]]]);
  const D1 = det2([[b[0], a2[0]], [b[1], a2[1]]]);
  const D2 = det2([[a1[0], b[0]], [a1[1], b[1]]]);
  const x1 = Math.abs(D) > 1e-6 ? D1 / D : null;
  const x2 = Math.abs(D) > 1e-6 ? D2 / D : null;

  const done = useLatch({
    offDiag: tab === 'adj' && pi !== pj,
    singularAdj: tab === 'adj' && Math.abs(dA) < 1e-6,
    cramerDrag: tab === 'cramer' && x1 !== null && (Math.abs(b[0] - 2.2) > 0.2 || Math.abs(b[1] - 2.5) > 0.2),
  });

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="实验模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'adj', label: '伴随矩阵 A* 与逆矩阵公式' },
          { value: 'cramer', label: 'Cramer 法则的几何面积证明' },
        ]}
      />

      {tab === 'adj' ? (
        <LabGrid
          wideStage
          stage={
            <Panel title="点击伴随矩阵 A* 的任意位置 (i, j)，看它在原矩阵 A 中划去第 j 行第 i 列（转置！）">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <div className="eyebrow mb-1.5">原矩阵 A（红框为被划去的第 {pj + 1} 行、第 {pi + 1} 列）</div>
                  <div className="pmatrix inline-block">
                    <div className="grid grid-cols-3 gap-1">
                      {A.map((row, r) =>
                        row.map((val, c) => {
                          const crossed = r === pj || c === pi;
                          return (
                            <div
                              key={`${r}-${c}`}
                              className={`h-9 w-[56px] flex items-center justify-center font-mono text-[14px] rounded-[3px] border ${
                                crossed
                                  ? 'bg-danger-soft text-danger/60 border-danger/30 line-through'
                                  : 'bg-primary-soft text-primary font-bold border-primary/50'
                              }`}
                            >
                              {fmt(val)}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="eyebrow mb-1.5">伴随矩阵 A*（点选任意元素）</div>
                  <div className="pmatrix inline-block">
                    <div className="grid grid-cols-3 gap-1">
                      {Adj.map((row, i) =>
                        row.map((val, j) => {
                          const on = i === pi && j === pj;
                          return (
                            <button
                              key={`${i}-${j}`}
                              type="button"
                              onClick={() => setPick([i, j])}
                              className={`h-9 w-[56px] font-mono text-[14px] rounded-[3px] border transition-colors ${
                                on ? 'bg-accent text-white border-accent font-bold' : 'bg-surface border-rule hover:border-ink-3'
                              }`}
                            >
                              {fmt(val)}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <MathBox>
                <Tex
                  block
                  math={`(A^*)_{${pi + 1},${pj + 1}} = A_{${pj + 1},${pi + 1}} = (-1)^{${pj + 1}+${pi + 1}} \\begin{vmatrix} ${fmt(A[subRows[0]][subCols[0]])} & ${fmt(A[subRows[0]][subCols[1]])} \\\\ ${fmt(A[subRows[1]][subCols[0]])} & ${fmt(A[subRows[1]][subCols[1]])} \\end{vmatrix} = (${sign > 0 ? '+' : '-'}1)\\cdot (${fmt(mVal)}) = ${fmt(cVal)}`}
                />
              </MathBox>

              <MathBox tone={invA ? 'ok' : 'warn'}>
                <Tex block math={`\\det A = ${fmt(dA)}, \\qquad A A^* = A^* A = (${fmt(dA)})\\,I_3`} />
                {invA ? (
                  <Tex block math={`A^{-1} = \\frac{1}{\\det A} A^* = \\frac{1}{${fmt(dA)}} ${mat3Tex(Adj)} = ${mat3Tex(invA)}`} />
                ) : (
                  <div className="text-danger text-[14px]">det A = 0，矩阵不可逆；此时 AA* = 0，但伴随矩阵 A* 本身依然存在！</div>
                )}
              </MathBox>
            </Panel>
          }
          side={
            <>
              <Panel title="编辑原矩阵 A">
                <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat3)} step={1} />
                <Presets
                  items={[
                    { label: '默认可逆阵', onClick: () => setA([[2, 1, 0], [1, 3, -1], [0, 2, 1]]) },
                    { label: 'det A = 1（整数逆）', onClick: () => setA([[1, 2, 0], [0, 1, 1], [0, 0, 1]]) },
                    { label: '奇异阵（det = 0，A* ≠ 0）', onClick: () => setA([[1, 2, 3], [2, 4, 6], [1, 0, 1]]) },
                  ]}
                />
                <Note label="易错提醒">
                  伴随矩阵的第 <Tex math="(i,j)" /> 元是 <Tex math="A_{j,i}" />（<strong>先求代数余子式，再转置</strong>）。唯有转置后，第 <Tex math="i" /> 行与第 <Tex math="k" /> 列相乘才对应“按行展开”或“异行乘积为零”的恒等式 <Tex math="AA^* = (\det A)I" />。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'offDiag', label: '点击 A* 的非对角元素（如第 1 行第 2 列），确认 A 中被划去的是第 2 行第 1 列' },
                  { id: 'singularAdj', label: '切换到“奇异阵”，观察 det A = 0 时 AA* = 0 但 A* 仍非零' },
                  { id: 'cramerDrag', label: '切到“Cramer 法则”标签页并拖动目标向量 b' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          stage={
            <Figure
              caption="浅蓝平行四边形面积为 det(a₁, a₂)，紫色平行四边形面积为 det(b, a₂) = det(x₁a₁ + x₂a₂, a₂) = x₁·det(a₁, a₂)。"
              legend={
                <>
                  <Swatch color={C.blue} label="det(a₁, a₂)" />
                  <Swatch color={C.violet} label="det(b, a₂)" />
                  <Swatch color={C.accent} label="b" />
                </>
              }
            >
              <Canvas2D
                range={4}
                handles={[
                  { id: 'a1', pos: a1, color: C.blue, label: 'a₁', onChange: setA1 },
                  { id: 'a2', pos: a2, color: C.green, label: 'a₂', onChange: setA2 },
                  { id: 'b', pos: b, color: C.accent, label: 'b', onChange: setB },
                ]}
                ariaLabel="Cramer 法则几何画布"
              >
                {({ toSvg }) => {
                  const o = toSvg([0, 0]);
                  const p12 = toSvg([a1[0] + a2[0], a1[1] + a2[1]]);
                  const pb2 = toSvg([b[0] + a2[0], b[1] + a2[1]]);
                  const basePoly = [o, toSvg(a1), p12, toSvg(a2)].map((p) => p.join(',')).join(' ');
                  const repPoly = [o, toSvg(b), pb2, toSvg(a2)].map((p) => p.join(',')).join(' ');
                  return (
                    <g>
                      <polygon points={basePoly} fill={C.blue} fillOpacity={0.14} stroke={C.blue} strokeWidth={1.6} />
                      <polygon points={repPoly} fill={C.violet} fillOpacity={0.18} stroke={C.violet} strokeWidth={1.8} strokeDasharray="5 3" />
                      <SvgArrow from={o} to={toSvg(a1)} color={C.blue} width={2.6} />
                      <SvgArrow from={o} to={toSvg(a2)} color={C.green} width={2.6} />
                      <SvgArrow from={o} to={toSvg(b)} color={C.accent} width={2.8} />
                      {x1 !== null && (
                        <SvgLabel at={toSvg([b[0] * 0.5 + a2[0] * 0.5, b[1] * 0.5 + a2[1] * 0.5])} color={C.violet}>
                          面积比 = x₁ = {fmt(x1)}
                        </SvgLabel>
                      )}
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="Cramer 法则：x₁a₁ + x₂a₂ = b">
                <VectorInput name="a₁" color={C.blue} value={a1} onChange={(p) => setA1(p as Vec2)} />
                <VectorInput name="a₂" color={C.green} value={a2} onChange={(p) => setA2(p as Vec2)} />
                <VectorInput name="b" color={C.accent} value={b} onChange={(p) => setB(p as Vec2)} />
                <MathBox tone={x1 !== null ? 'ok' : 'warn'}>
                  <Tex block math={`D = \\det(\\boldsymbol{a}_1, \\boldsymbol{a}_2) = ${fmt(D)}`} />
                  {x1 !== null && x2 !== null ? (
                    <Tex
                      block
                      math={`x_1 = \\frac{\\det(\\boldsymbol{b},\\boldsymbol{a}_2)}{D} = \\frac{${fmt(D1)}}{${fmt(D)}} = ${fmt(x1)}, \\quad x_2 = \\frac{\\det(\\boldsymbol{a}_1,\\boldsymbol{b})}{D} = \\frac{${fmt(D2)}}{${fmt(D)}} = ${fmt(x2)}`}
                    />
                  ) : (
                    <div className="text-danger text-[14px]">D = 0：两列向量共线，Cramer 法则不适用。</div>
                  )}
                </MathBox>
                <Note label="几何洞察">
                  把 <Tex math="\boldsymbol{b} = x_1\boldsymbol{a}_1 + x_2\boldsymbol{a}_2" /> 替换第一列后，加上 <Tex math="x_2\boldsymbol{a}_2" /> 相当于平行于 <Tex math="\boldsymbol{a}_2" /> 的错切，不改变面积，故 <Tex math="\det(\boldsymbol{b},\boldsymbol{a}_2) = x_1\det(\boldsymbol{a}_1,\boldsymbol{a}_2)" />！
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'offDiag', label: '在“伴随矩阵”标签页点选非对角元验证转置规则' },
                  { id: 'singularAdj', label: '在“伴随矩阵”标签页测试奇异阵' },
                  { id: 'cramerDrag', label: '拖动向量 b，观察紫色与蓝色平行四边形的有向面积之比恰等于解分量 x₁' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
