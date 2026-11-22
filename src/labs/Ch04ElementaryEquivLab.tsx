import React, { useState } from 'react';
import { RotateCcw, StepForward } from 'lucide-react';
import { Tex } from '../components/MathText';
import { Button, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, Status, Tasks, useLatch } from '../components/ui';
import { fmt } from '../utils/math';

const cloneM = (M: number[][]) => M.map((r) => [...r]);
const eye = (n: number): number[][] => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
const mulM = (A: number[][], B: number[][]) =>
  A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const toTex = (M: number[][]) => `\\begin{pmatrix}${M.map((r) => r.map((v) => fmt(v)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;

interface OpStep {
  side: 'row' | 'col';
  desc: string;
  E: number[][];
  cur: number[][];
  P: number[][];
  Q: number[][];
}

function buildEquivSteps(A0: number[][]): OpStep[] {
  const m = A0.length;
  const n = A0[0].length;
  const M = cloneM(A0);
  let P = eye(m);
  let Q = eye(n);
  const steps: OpStep[] = [];

  const pushRow = (E: number[][], desc: string) => {
    const next = mulM(E, M);
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) M[i][j] = next[i][j];
    P = mulM(E, P);
    steps.push({ side: 'row', desc, E, cur: cloneM(M), P: cloneM(P), Q: cloneM(Q) });
  };

  const pushCol = (F: number[][], desc: string) => {
    const next = mulM(M, F);
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) M[i][j] = next[i][j];
    Q = mulM(Q, F);
    steps.push({ side: 'col', desc, E: F, cur: cloneM(M), P: cloneM(P), Q: cloneM(Q) });
  };

  let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    // Find pivot in submatrix M[r..m-1][c..n-1]
    let pr = -1, pc = -1, best = 1e-8;
    for (let i = r; i < m; i++) {
      for (let j = c; j < n; j++) {
        if (Math.abs(M[i][j]) > best) {
          best = Math.abs(M[i][j]);
          pr = i;
          pc = j;
        }
      }
    }
    if (pr === -1) break;

    if (pr !== r) {
      const E = eye(m);
      [E[r], E[pr]] = [E[pr], E[r]];
      pushRow(E, `交换第 ${r + 1} 行与第 ${pr + 1} 行（左乘 E）`);
    }
    if (pc !== r) {
      const F = eye(n);
      [F[r], F[pc]] = [F[pc], F[r]];
      pushCol(F, `交换第 ${r + 1} 列与第 ${pc + 1} 列（右乘 F）`);
    }
    if (Math.abs(M[r][r] - 1) > 1e-7) {
      const k = 1 / M[r][r];
      const E = eye(m);
      E[r][r] = k;
      pushRow(E, `第 ${r + 1} 行乘以 ${fmt(k)}（主元归一）`);
    }
    for (let i = 0; i < m; i++) {
      if (i !== r && Math.abs(M[i][r]) > 1e-7) {
        const k = -M[i][r];
        const E = eye(m);
        E[i][r] = k;
        pushRow(E, `第 ${i + 1} 行加上 ${fmt(k)} 倍第 ${r + 1} 行`);
      }
    }
    for (let j = 0; j < n; j++) {
      if (j !== r && Math.abs(M[r][j]) > 1e-7) {
        const k = -M[r][j];
        const F = eye(n);
        F[r][j] = k;
        pushCol(F, `第 ${j + 1} 列加上 ${fmt(k)} 倍第 ${r + 1} 列`);
      }
    }
    r++;
  }
  return steps;
}

function buildGjSteps(A0: number[][]): { desc: string; left: number[][]; right: number[][]; singular: boolean }[] {
  const n = A0.length;
  const L = cloneM(A0);
  const R = eye(n);
  const steps: { desc: string; left: number[][]; right: number[][]; singular: boolean }[] = [
    { desc: '初始增广矩阵 [A | I]', left: cloneM(L), right: cloneM(R), singular: false },
  ];

  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let i = col + 1; i < n; i++) if (Math.abs(L[i][col]) > Math.abs(L[piv][col])) piv = i;
    if (Math.abs(L[piv][col]) < 1e-8) {
      steps.push({ desc: `第 ${col + 1} 列无非零主元：矩阵不可逆！`, left: cloneM(L), right: cloneM(R), singular: true });
      return steps;
    }
    if (piv !== col) {
      [L[col], L[piv]] = [L[piv], L[col]];
      [R[col], R[piv]] = [R[piv], R[col]];
      steps.push({ desc: `交换第 ${col + 1} 行与第 ${piv + 1} 行`, left: cloneM(L), right: cloneM(R), singular: false });
    }
    const pv = L[col][col];
    if (Math.abs(pv - 1) > 1e-7) {
      for (let j = 0; j < n; j++) {
        L[col][j] /= pv;
        R[col][j] /= pv;
      }
      steps.push({ desc: `第 ${col + 1} 行除以 ${fmt(pv)}`, left: cloneM(L), right: cloneM(R), singular: false });
    }
    for (let i = 0; i < n; i++) {
      if (i !== col && Math.abs(L[i][col]) > 1e-7) {
        const f = L[i][col];
        for (let j = 0; j < n; j++) {
          L[i][j] -= f * L[col][j];
          R[i][j] -= f * R[col][j];
        }
        steps.push({ desc: `第 ${i + 1} 行减去 ${fmt(f)} 倍第 ${col + 1} 行`, left: cloneM(L), right: cloneM(R), singular: false });
      }
    }
  }
  return steps;
}

export const Ch04ElementaryEquivLab: React.FC = () => {
  const [tab, setTab] = useState<'equiv' | 'inv'>('equiv');
  const [A, setA] = useState<number[][]>([
    [1, 2, 1],
    [2, 4, 3],
    [1, 2, 2],
  ]);
  const [stepIdx, setStepIdx] = useState(0);

  const equivSteps = buildEquivSteps(A);
  const gjSteps = buildGjSteps(A);

  const safeEqIdx = Math.min(stepIdx, equivSteps.length);
  const eqState =
    safeEqIdx === 0
      ? { desc: '初始矩阵 A（尚未施行初等变换）', cur: A, P: eye(3), Q: eye(3), E: null as number[][] | null, side: 'row' as const }
      : equivSteps[safeEqIdx - 1];

  const safeGjIdx = Math.min(stepIdx, gjSteps.length - 1);
  const gjState = gjSteps[safeGjIdx];

  const done = useLatch({
    reachedEquiv: tab === 'equiv' && equivSteps.length > 0 && safeEqIdx === equivSteps.length,
    reachedInv: tab === 'inv' && safeGjIdx === gjSteps.length - 1 && !gjState.singular,
    seenSingular: tab === 'inv' && gjState.singular,
  });

  const resetA = (M: number[][]) => {
    setA(M);
    setStepIdx(0);
  };

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="实验模式"
        value={tab}
        onChange={(v) => { setTab(v); setStepIdx(0); }}
        options={[
          { value: 'equiv', label: '初等矩阵与相抵标准形 PAQ' },
          { value: 'inv', label: 'Gauss–Jordan 求逆 [A | I] → [I | A⁻¹]' },
        ]}
      />

      <LabGrid
        wideStage
        stage={
          tab === 'equiv' ? (
            <Panel title={`步骤 ${safeEqIdx} / ${equivSteps.length}：${eqState.desc}`}>
              <MathBox tone={safeEqIdx === equivSteps.length ? 'ok' : 'neutral'}>
                {eqState.E && (
                  <Tex
                    block
                    math={
                      eqState.side === 'row'
                        ? `\\text{本步左乘初等矩阵 } E = ${toTex(eqState.E)}`
                        : `\\text{本步右乘初等矩阵 } F = ${toTex(eqState.E)}`
                    }
                  />
                )}
                <Tex block math={`P \\cdot A \\cdot Q = ${toTex(eqState.P)} ${toTex(A)} ${toTex(eqState.Q)} = ${toTex(eqState.cur)}`} />
              </MathBox>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setStepIdx(0)} disabled={safeEqIdx === 0}>
                  重置
                </Button>
                <Button size="sm" variant="primary" icon={<StepForward className="w-3.5 h-3.5" />} onClick={() => setStepIdx((i) => Math.min(equivSteps.length, i + 1))} disabled={safeEqIdx >= equivSteps.length}>
                  下一步初等变换
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setStepIdx(equivSteps.length)} disabled={safeEqIdx >= equivSteps.length}>
                  直达相抵标准形
                </Button>
              </div>
              {safeEqIdx === equivSteps.length && (
                <Status tone="ok">
                  已化为相抵标准形！矩阵的秩等于标准形中 1 的个数，而 P、Q 分别是所有左乘、右乘初等矩阵的乘积。
                </Status>
              )}
            </Panel>
          ) : (
            <Panel title={`步骤 ${safeGjIdx} / ${gjSteps.length - 1}：${gjState.desc}`}>
              <MathBox tone={gjState.singular ? 'warn' : safeGjIdx === gjSteps.length - 1 ? 'ok' : 'neutral'}>
                <Tex
                  block
                  math={`\\left(\\begin{array}{ccc|ccc}${gjState.left
                    .map((row, i) => `${row.map((v) => fmt(v)).join(' & ')} & ${gjState.right[i].map((v) => fmt(v)).join(' & ')}`)
                    .join(' \\\\ ')}\\end{array}\\right)`}
                />
              </MathBox>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setStepIdx(0)} disabled={safeGjIdx === 0}>
                  重置
                </Button>
                <Button size="sm" variant="primary" icon={<StepForward className="w-3.5 h-3.5" />} onClick={() => setStepIdx((i) => Math.min(gjSteps.length - 1, i + 1))} disabled={safeGjIdx >= gjSteps.length - 1}>
                  下一步行变换
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setStepIdx(gjSteps.length - 1)} disabled={safeGjIdx >= gjSteps.length - 1}>
                  直达结果
                </Button>
              </div>
              {safeGjIdx === gjSteps.length - 1 && !gjState.singular && (
                <Status tone="ok">左侧已化为单位矩阵 I，右侧同步记录了全部行变换矩阵的乘积，即为 A⁻¹。</Status>
              )}
              {gjState.singular && <Status tone="warn">出现全零主元列，矩阵不满秩，因此不存在逆矩阵。</Status>}
            </Panel>
          )
        }
        side={
          <>
            <Panel title="输入 3×3 矩阵 A">
              <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => resetA(m)} step={1} />
              <Presets
                items={[
                  { label: '秩 2（不可逆）', onClick: () => resetA([[1, 2, 1], [2, 4, 3], [1, 2, 2]]) },
                  { label: '可逆整数阵', onClick: () => resetA([[1, 2, 0], [0, 1, 1], [2, 3, 2]]) },
                  { label: '需换行可逆阵', onClick: () => resetA([[0, 1, 2], [1, 0, 3], [2, 1, 1]]) },
                  { label: '秩 1 矩阵', onClick: () => resetA([[1, 2, -1], [2, 4, -2], [-1, -2, 1]]) },
                ]}
              />
              <Note label="核心定理">
                一次初等行变换等价于<strong>左乘</strong>对应初等矩阵，一次初等列变换等价于<strong>右乘</strong>对应初等矩阵。
              </Note>
            </Panel>

            <Tasks
              done={done}
              items={[
                { id: 'reachedEquiv', label: '在“相抵标准形”模式中走完全部步骤，观察 P, Q 如何累积' },
                { id: 'reachedInv', label: '切换“可逆整数阵”并用 Gauss–Jordan 求逆' },
                { id: 'seenSingular', label: '在“Gauss–Jordan”模式中测试“秩 2（不可逆）”矩阵' },
              ]}
            />
          </>
        }
      />
    </div>
  );
};
