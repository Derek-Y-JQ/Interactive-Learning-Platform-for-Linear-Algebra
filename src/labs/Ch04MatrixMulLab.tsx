import React, { useState } from 'react';
import { Tex } from '../components/MathText';
import { LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, Tasks, useLatch } from '../components/ui';
import { fmt } from '../utils/math';
import { C } from '../theme';

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

export const Ch04MatrixMulLab: React.FC = () => {
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

  const AB = matmul(MA, MB);
  const K = MB.length;

  const done = useLatch({
    entry: view === 'dot' && (cell[0] !== 0 || cell[1] !== 1),
    col: view === 'col',
    row: view === 'row',
    outer: view === 'outer',
  });

  return (
    <LabGrid
      wideStage
      stage={
        <Panel title="AB = C：同一乘积的四种结构读法">
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
                <p className="text-[14px] text-ink-2 mb-1">点击右侧结果矩阵中的任一元素，高亮对应的行与列。</p>
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
                  math={Array.from({ length: K }, (_, k) => texM(MA.map((r) => r[k]).map((a) => MB[k].map((b) => a * b)))).join(' + ') + ` = ${texM(AB)}`}
                />
              </>
            )}
          </MathBox>
        </Panel>
      }
      side={
        <>
          <Panel title="预设矩阵">
            <Presets
              items={[
                { label: '默认 2×3 与 3×2', onClick: () => { setMA([[1, 2, 0], [3, -1, 1]]); setMB([[2, -1], [0, 3], [1, 1]]); } },
                { label: '零乘积（非零矩阵相乘为零）', onClick: () => { setMA([[1, -1, 0], [2, -2, 0]]); setMB([[1, 2], [1, 2], [0, 0]]); } },
                { label: '选列矩阵', onClick: () => { setMA([[1, 2, 3], [4, 5, 6]]); setMB([[0, 1], [1, 0], [0, 0]]); } },
              ]}
            />
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'entry', label: '在内积读法下点选另一个元素，验证行·列公式' },
              { id: 'col', label: '切换到“列组合”，理解为何 R(AB) ⊆ R(A)' },
              { id: 'row', label: '切换到“行组合”，理解为何行空间 R((AB)ᵀ) ⊆ R(Bᵀ)' },
              { id: 'outer', label: '切换到“秩 1 之和”读法' },
            ]}
          />
          <Note>四种读法计算同一个乘积，但各自回答不同的结构问题：由②与③立得 rank(AB) ≤ min(rank A, rank B)。</Note>
        </>
      }
    />
  );
};
