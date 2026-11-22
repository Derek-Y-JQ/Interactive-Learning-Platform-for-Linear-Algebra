import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { fmt, invMat2, mat2ToTex, mulMat2, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

/** pmatrix tex with optional per-entry colour */
const texM = (M: number[][], color?: (i: number, j: number) => string | undefined) =>
  `\\begin{pmatrix}${M.map((r, i) =>
    r
      .map((v, j) => {
        const c = color?.(i, j);
        return c ? `\\textcolor{${c}}{\\mathbf{${fmt(v)}}}` : fmt(v);
      })
      .join(' & ')
  ).join(' \\\\ ')}\\end{pmatrix}`;

const matmul = (A: number[][], B: number[][]) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));

export const Ch04BasisShadowLab: React.FC = () => {
  const [tab, setTab] = useState<'shadow' | 'mul'>('shadow');
  const [A, setA] = useState<Mat2>([
    [1.5, 0.5],
    [0.5, 1.5],
  ]);
  const [b1, setB1] = useState<Vec2>([1, 0.3]);
  const [b2, setB2] = useState<Vec2>([-0.4, 1]);

  const [MA, setMA] = useState<number[][]>([
    [1, 2, 0],
    [3, -1, 1],
  ]);
  const [MB, setMB] = useState<number[][]>([
    [2, -1],
    [0, 3],
    [1, 1],
  ]);
  const [view, setView] = useState<'dot' | 'col' | 'row' | 'outer'>('dot');
  const [cell, setCell] = useState<[number, number]>([0, 1]);

  const P: Mat2 = [
    [b1[0], b2[0]],
    [b1[1], b2[1]],
  ];
  const invP = invMat2(P);
  const B = invP ? mulMat2(mulMat2(invP, A), P) : null;
  const Ab1 = mulMat2Vec(A, b1);
  const Ab2 = mulMat2Vec(A, b2);
  const isDiag = !!B && Math.abs(B[0][1]) < 0.03 && Math.abs(B[1][0]) < 0.03;
  const isUpper = !!B && Math.abs(B[1][0]) < 0.03;

  const done = useLatch({
    upper: tab === 'shadow' && isUpper && !isDiag,
    diag: tab === 'shadow' && isDiag && Math.abs(b1[1]) + Math.abs(b2[0]) > 0.2,
    entry: tab === 'mul' && view === 'dot' && (cell[0] !== 0 || cell[1] !== 1),
    outer: tab === 'mul' && view === 'outer',
  });

  const AB = matmul(MA, MB);
  const K = MB.length;

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="实验模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'shadow', label: '换基：P⁻¹AP' },
          { value: 'mul', label: '矩阵乘法的四种读法' },
        ]}
      />
      {tab === 'shadow' ? (
        <LabGrid
          stage={
            <Figure
              caption="虚线椭圆是单位圆在 φ 下的像，与基的选取无关；虚线箭头是 φ(β₁)、φ(β₂) 在基 β 下的分解。"
              legend={
                <>
                  <Swatch color={C.blue} label="β₁" />
                  <Swatch color={C.red} label="β₂" />
                  <Swatch color={C.violet} dashed label="φ(单位圆)" />
                </>
              }
            >
              <Canvas2D
                range={3.2}
                handles={[
                  { id: 'b1', pos: b1, color: C.blue, label: 'β₁', onChange: setB1 },
                  { id: 'b2', pos: b2, color: C.red, label: 'β₂', onChange: setB2 },
                ]}
              >
                {({ toSvg, scale, cx, cy }) => {
                  const o = toSvg([0, 0]);
                  const pts: string[] = [];
                  for (let k = 0; k <= 96; k++) {
                    const t = (2 * Math.PI * k) / 96;
                    pts.push(toSvg(mulMat2Vec(A, [Math.cos(t), Math.sin(t)])).join(','));
                  }
                  const dec = (img: Vec2, coef: [number, number], col: string) => {
                    const mid: Vec2 = [coef[0] * b1[0], coef[0] * b1[1]];
                    return (
                      <g>
                        <SvgArrow from={o} to={toSvg(mid)} color={C.blue} width={1.4} opacity={0.55} />
                        <SvgArrow from={toSvg(mid)} to={toSvg(img)} color={C.red} width={1.4} opacity={0.55} />
                        <SvgArrow from={o} to={toSvg(img)} color={col} width={2.2} dashed />
                      </g>
                    );
                  };
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={scale} fill="none" stroke={C.ruleStrong} strokeDasharray="3 3" />
                      <polygon points={pts.join(' ')} fill={C.violet} fillOpacity={0.06} stroke={C.violet} strokeDasharray="6 4" strokeWidth={1.5} />
                      {B && dec(Ab1, [B[0][0], B[1][0]], C.blue)}
                      {B && dec(Ab2, [B[0][1], B[1][1]], C.red)}
                      <SvgArrow from={o} to={toSvg(b1)} color={C.blue} width={2.8} />
                      <SvgArrow from={o} to={toSvg(b2)} color={C.red} width={2.8} />
                      <SvgLabel at={toSvg(Ab1)} color={C.blue} size={15}>φ(β₁)</SvgLabel>
                      <SvgLabel at={toSvg(Ab2)} color={C.red} size={15}>φ(β₂)</SvgLabel>
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="变换与基">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[14px] text-ink-2">标准基下</span>
                  <Tex math="A =" />
                  <MatrixInput ariaLabel="标准基下的矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} />
                </div>
                <VectorInput name="β₁" color={C.blue} value={b1} onChange={(p) => setB1(p as Vec2)} />
                <VectorInput name="β₂" color={C.red} value={b2} onChange={(p) => setB2(p as Vec2)} />
                <MathBox tone={isDiag ? 'ok' : 'neutral'}>
                  <Tex block math={`P = ${mat2ToTex(P)}`} />
                  {B ? <Tex block math={`B = P^{-1}AP = ${mat2ToTex(B)}`} /> : <div className="text-danger text-[14px]">β₁, β₂ 线性相关，P 不可逆。</div>}
                </MathBox>
                {B && (
                  <Status tone={isDiag ? 'ok' : 'info'}>
                    {isDiag
                      ? 'B 是对角阵：β₁, β₂ 都是特征向量，φ 只沿它们伸缩。'
                      : isUpper
                      ? 'B 是上三角阵：β₁ 是特征向量（φ(β₁) 只含 β₁ 分量）。'
                      : 'B 的第 j 列 = φ(βⱼ) 在基 β 下的坐标，见图中虚线分解。'}
                  </Status>
                )}
                <Presets
                  items={[
                    { label: '标准基', onClick: () => { setB1([1, 0]); setB2([0, 1]); } },
                    { label: '斜基', onClick: () => { setB1([1.5, 0.3]); setB2([-0.4, 1.2]); } },
                    { label: '剪切 A', onClick: () => setA([[1, 1], [0, 1]]) },
                    { label: '旋转 A', onClick: () => setA([[0.8, -0.6], [0.6, 0.8]]) },
                  ]}
                />
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'upper', label: '只拖动 β₁，使 B 成为上三角（但不对角）。' },
                  { id: 'diag', label: '再拖动 β₂，使 B 成为对角阵。' },
                ]}
              />
              <Note>把 A 改为“旋转 A”后再试：找不到使 B 对角的实基——实矩阵未必能在实数域上对角化（第 7 章）。</Note>
            </>
          }
        />
      ) : (
        <LabGrid
          wideStage
          stage={
            <Panel title="AB = C">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Tex math="A =" />
                  <MatrixInput ariaLabel="矩阵 A" value={MA} onChange={setMA} step={1} />
                </div>
                <div className="flex items-center gap-2">
                  <Tex math="B =" />
                  <MatrixInput ariaLabel="矩阵 B" value={MB} onChange={setMB} step={1} />
                </div>
                <div className="flex items-center gap-2">
                  <Tex math="AB =" />
                  <div className="pmatrix inline-block">
                    <div className="grid grid-cols-2 gap-1">
                      {AB.map((r, i) =>
                        r.map((val, j) => {
                          const on = view === 'dot' && cell[0] === i && cell[1] === j;
                          return (
                            <button
                              key={`${i}${j}`}
                              type="button"
                              onClick={() => {
                                setCell([i, j]);
                                setView('dot');
                              }}
                              aria-label={`选择 C 的第 ${i + 1} 行第 ${j + 1} 列`}
                              className={`h-9 w-[60px] font-mono text-[14px] rounded-[3px] border transition-colors ${
                                on ? 'bg-accent text-white border-accent' : 'border-rule hover:border-ink-3 bg-surface'
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
              <Segmented
                ariaLabel="读法"
                value={view}
                onChange={setView}
                wrap
                options={[
                  { value: 'dot', label: '① 行·列内积' },
                  { value: 'col', label: '② 列组合' },
                  { value: 'row', label: '③ 行组合' },
                  { value: 'outer', label: '④ 秩 1 之和' },
                ]}
              />
              <MathBox className="text-[16px]">
                {view === 'dot' && (
                  <>
                    <p className="text-[14px] text-ink-2 mb-1">点击右侧结果矩阵中的任一元素。</p>
                    <Tex
                      block
                      math={`${texM(MA, (i) => (i === cell[0] ? C.accent : undefined))}${texM(MB, (_, j) => (j === cell[1] ? C.blue : undefined))}`}
                    />
                    <Tex
                      block
                      math={`c_{${cell[0] + 1}${cell[1] + 1}} = ${MA[cell[0]].map((a, k) => `(${fmt(a)})(${fmt(MB[k][cell[1]])})`).join(' + ')} = ${fmt(AB[cell[0]][cell[1]])}`}
                    />
                  </>
                )}
                {view === 'col' && (
                  <>
                    <p className="text-[14px] text-ink-2 mb-1">C 的第 j 列 = A 的各列以 B 的第 j 列为系数的线性组合。</p>
                    {[0, 1].map((j) => (
                      <Tex
                        key={j}
                        block
                        math={`\\bm c_{${j + 1}} = ${MA[0]
                          .map((_, k) => `${fmt(MB[k][j])}\\begin{pmatrix}${MA.map((r) => fmt(r[k])).join('\\\\')}\\end{pmatrix}`)
                          .join(' + ')} = \\begin{pmatrix}${AB.map((r) => fmt(r[j])).join('\\\\')}\\end{pmatrix}`}
                      />
                    ))}
                  </>
                )}
                {view === 'row' && (
                  <>
                    <p className="text-[14px] text-ink-2 mb-1">C 的第 i 行 = B 的各行以 A 的第 i 行为系数的线性组合。</p>
                    {MA.map((r, i) => (
                      <Tex
                        key={i}
                        block
                        math={`\\bm r_{${i + 1}} = ${r.map((a, k) => `${fmt(a)}\\,(${MB[k].map((x) => fmt(x)).join(',\\ ')})`).join(' + ')} = (${AB[i].map((x) => fmt(x)).join(',\\ ')})`}
                      />
                    ))}
                  </>
                )}
                {view === 'outer' && (
                  <>
                    <p className="text-[14px] text-ink-2 mb-1">A 的第 k 列乘 B 的第 k 行，得到 {K} 个秩 ≤ 1 的矩阵，求和即 AB。这正是谱分解与 SVD 的形式。</p>
                    <Tex
                      block
                      math={Array.from({ length: K }, (_, k) =>
                        texM(MA.map((r) => r[k]).map((a) => MB[k].map((b) => a * b)))
                      ).join(' + ') + ` = ${texM(AB)}`}
                    />
                  </>
                )}
              </MathBox>
            </Panel>
          }
          side={
            <>
              <Tasks
                done={done}
                items={[
                  { id: 'entry', label: '在内积读法下点选另一个元素，验证行·列公式。' },
                  { id: 'outer', label: '切换到秩 1 之和读法。' },
                ]}
              />
              <Note>四种读法计算同一个乘积，但各自回答不同的问题：②说明 R(AB) ⊆ R(A)，③说明行空间 R((AB)ᵀ) ⊆ R(Bᵀ)，从而 rank AB ≤ min(rank A, rank B)。</Note>
            </>
          }
        />
      )}
    </div>
  );
};
