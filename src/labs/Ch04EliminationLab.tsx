import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { Button, LabGrid, MatrixInput, Note, Panel, Presets, Segmented, Status, Tasks, useLatch } from '../components/ui';
import { Tex } from '../components/MathText';

type M = number[][];

interface Step {
  kind: 'init' | 'swap' | 'elim' | 'skip' | 'done';
  text: string;
  tex?: string;
  U: M;
  L: M;
  perm: number[];
  pivot?: [number, number];
  row?: number;
  lcell?: [number, number];
}

const EPS = 1e-10;

/** Rational display for small denominators, otherwise decimals. */
function frac(x: number): string {
  if (Math.abs(x) < 1e-9) return '0';
  for (let d = 1; d <= 24; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-9) return d === 1 ? `${n}`.replace('-', '−') : `${n < 0 ? '−' : ''}${Math.abs(n)}/${d}`;
  }
  return x.toFixed(3).replace(/0+$/, '').replace('-', '−');
}
const fracTex = (x: number) => {
  const s = frac(x).replace('−', '-');
  if (!s.includes('/')) return s;
  const neg = s.startsWith('-');
  const [n, d] = s.replace('-', '').split('/');
  return `${neg ? '-' : ''}\\tfrac{${n}}{${d}}`;
};

function lu(A0: M, partial: boolean): Step[] {
  const n = A0.length;
  const U = A0.map((r) => [...r]);
  const L: M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  const perm = Array.from({ length: n }, (_, i) => i);
  const snap = (s: Omit<Step, 'U' | 'L' | 'perm'>): Step => ({ ...s, U: U.map((r) => [...r]), L: L.map((r) => [...r]), perm: [...perm] });
  const steps: Step[] = [snap({ kind: 'init', text: '初始：U = A，L = I，P = I。' })];

  for (let k = 0; k < n - 1; k++) {
    let p = -1;
    if (partial) {
      let best = EPS;
      for (let i = k; i < n; i++) if (Math.abs(U[i][k]) > best) { best = Math.abs(U[i][k]); p = i; }
    } else {
      for (let i = k; i < n; i++) if (Math.abs(U[i][k]) > EPS) { p = i; break; }
    }
    if (p < 0) {
      steps.push(snap({ kind: 'skip', text: `第 ${k + 1} 列在第 ${k + 1} 行及以下全为 0，没有主元，跳过此列。`, pivot: [k, k] }));
      continue;
    }
    if (p !== k) {
      [U[k], U[p]] = [U[p], U[k]];
      [perm[k], perm[p]] = [perm[p], perm[k]];
      for (let j = 0; j < k; j++) [L[k][j], L[p][j]] = [L[p][j], L[k][j]];
      steps.push(
        snap({
          kind: 'swap',
          text: partial ? `选第 ${k + 1} 列中绝对值最大的元为主元：交换 R${k + 1} 与 R${p + 1}（同时记入 P）。` : `主元为 0，交换 R${k + 1} 与 R${p + 1}（同时记入 P）。`,
          tex: `R_{${k + 1}} \\leftrightarrow R_{${p + 1}}`,
          pivot: [k, k],
          row: p,
        })
      );
    }
    for (let i = k + 1; i < n; i++) {
      const m = U[i][k] / U[k][k];
      if (Math.abs(m) < EPS) continue;
      L[i][k] = m;
      for (let j = 0; j < n; j++) {
        U[i][j] -= m * U[k][j];
        if (Math.abs(U[i][j]) < 1e-11) U[i][j] = 0;
      }
      U[i][k] = 0;
      steps.push(
        snap({
          kind: 'elim',
          text: `消去 U(${i + 1},${k + 1})：乘子 ℓ = ${frac(m)} 记入 L(${i + 1},${k + 1})。`,
          tex: `R_{${i + 1}} \\leftarrow R_{${i + 1}} - (${fracTex(m)})\\,R_{${k + 1}}`,
          pivot: [k, k],
          row: i,
          lcell: [i, k],
        })
      );
    }
  }
  steps.push(snap({ kind: 'done', text: '完成：U 为上三角阵，PA = LU。' }));
  return steps;
}

const PRESETS: { name: string; A: M }[] = [
  { name: '无需换行', A: [[2, 1, 1], [4, -6, 0], [-2, 7, 2]] },
  { name: '需要换行', A: [[0, 2, 1], [1, 1, 1], [2, 1, 3]] },
  { name: '奇异阵', A: [[1, 2, 3], [2, 4, 6], [1, 3, 5]] },
  { name: '4 × 4', A: [[2, 1, 0, 1], [4, 3, 1, 2], [-2, 1, 4, 0], [6, 2, 1, 5]] },
];

const MatView: React.FC<{ title: string; M: M; tone?: (i: number, j: number) => string | undefined; note?: string }> = ({ title, M, tone, note }) => (
  <div className="text-center">
    <div className="text-[14px] font-semibold text-ink-2 mb-2">{title}</div>
    <div className="pmatrix inline-block">
      <div className="grid gap-x-1 gap-y-0.5" style={{ gridTemplateColumns: `repeat(${M.length}, minmax(3.2rem, auto))` }}>
        {M.map((r, i) =>
          r.map((v, j) => (
            <span key={`${i}-${j}`} className={`h-8 px-1.5 flex items-center justify-center font-mono text-[14px] tabular rounded-[3px] transition-colors duration-200 ${tone?.(i, j) ?? ''}`}>
              {frac(v)}
            </span>
          ))
        )}
      </div>
    </div>
    {note && <div className="text-[12px] text-ink-3 mt-1">{note}</div>}
  </div>
);

export const Ch04EliminationLab: React.FC = () => {
  const [A, setA] = useState<M>(PRESETS[0].A);
  const [partial, setPartial] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps = useMemo(() => lu(A, partial), [A, partial]);
  const cur = steps[Math.min(idx, steps.length - 1)];
  const n = A.length;

  useEffect(() => setIdx(0), [A, partial]);
  useEffect(() => {
    if (!playing) return;
    if (idx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIdx((i) => i + 1), 1100);
    return () => clearTimeout(t);
  }, [playing, idx, steps.length]);

  const Pm: M = cur.perm.map((p) => Array.from({ length: n }, (_, j) => (j === p ? 1 : 0)));
  const PA = cur.perm.map((p) => A[p]);
  const LUm = cur.L.map((r) => cur.U[0].map((_, j) => r.reduce((s, l, k) => s + l * cur.U[k][j], 0)));
  const ok = cur.kind === 'done' && PA.every((r, i) => r.every((v, j) => Math.abs(v - LUm[i][j]) < 1e-8));
  const hasSwap = steps.some((s) => s.kind === 'swap');
  const rankU = cur.kind === 'done' ? cur.U.filter((r) => r.some((v) => Math.abs(v) > 1e-9)).length : null;

  const done = useLatch({
    finish: cur.kind === 'done',
    swap: cur.kind === 'done' && hasSwap,
    custom: cur.kind === 'done' && !PRESETS.some((p) => JSON.stringify(p.A) === JSON.stringify(A)),
  });

  const resize = (k: number) => {
    setA(Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => A[i]?.[j] ?? (i === j ? 1 : 0))));
  };

  return (
    <LabGrid
      wideStage
      stage={
        <>
          <Panel
            title={`第 ${idx} / ${steps.length - 1} 步`}
            actions={
              <>
                <Button size="sm" variant="ghost" aria-label="回到开头" onClick={() => { setPlaying(false); setIdx(0); }} icon={<SkipBack className="w-4 h-4" />} />
                <Button size="sm" variant="ghost" aria-label="上一步" disabled={idx === 0} onClick={() => { setPlaying(false); setIdx((i) => Math.max(0, i - 1)); }} icon={<ChevronLeft className="w-4 h-4" />} />
                <Button size="sm" variant="primary" onClick={() => { if (idx >= steps.length - 1) setIdx(0); setPlaying((p) => !p); }} icon={playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}>
                  {playing ? '暂停' : '播放'}
                </Button>
                <Button size="sm" variant="ghost" aria-label="下一步" disabled={idx >= steps.length - 1} onClick={() => { setPlaying(false); setIdx((i) => Math.min(steps.length - 1, i + 1)); }} icon={<ChevronRight className="w-4 h-4" />} />
                <Button size="sm" variant="ghost" aria-label="跳到结尾" onClick={() => { setPlaying(false); setIdx(steps.length - 1); }} icon={<SkipForward className="w-4 h-4" />} />
              </>
            }
          >
            <div className="min-h-[3.25rem] border-l-2 border-accent pl-3" aria-live="polite">
              <div className="text-[15px] text-ink">{cur.text}</div>
              {cur.tex && <Tex math={cur.tex} className="text-ink-2" />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start py-2 overflow-x-auto">
              <MatView title="P" M={Pm} tone={(i, j) => (Pm[i][j] === 1 ? 'text-ink font-bold' : 'text-ink-3')} />
              <MatView
                title="L（乘子）"
                M={cur.L}
                tone={(i, j) => (cur.lcell && cur.lcell[0] === i && cur.lcell[1] === j ? 'bg-accent text-white' : i > j && cur.L[i][j] !== 0 ? 'bg-accent-soft' : i < j ? 'text-ink-3' : undefined)}
              />
              <MatView
                title="U（当前）"
                M={cur.U}
                tone={(i, j) =>
                  cur.pivot && cur.pivot[0] === i && cur.pivot[1] === j
                    ? 'ring-2 ring-primary font-bold'
                    : cur.row === i
                    ? 'bg-primary-soft'
                    : i > j && Math.abs(cur.U[i][j]) < 1e-12
                    ? 'text-ink-3'
                    : undefined
                }
              />
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={steps.length - 1}
              step={1}
              value={idx}
              aria-label="步骤进度"
              onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }}
              style={{ '--fill': `${(idx / Math.max(1, steps.length - 1)) * 100}%` } as React.CSSProperties}
            />
            {cur.kind === 'done' && (
              <Status tone={ok ? 'ok' : 'warn'}>
                {ok ? `已验证 PA = LU。rank A = ${rankU}${rankU! < n ? '，U 有零行，A 奇异。' : '。'}` : '数值误差过大，请检查输入。'}
              </Status>
            )}
          </Panel>

          <Panel title="操作记录">
            <ol className="space-y-0.5 max-h-56 overflow-y-auto -mx-1">
              {steps.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => { setPlaying(false); setIdx(i); }}
                    className={`w-full text-left px-2 py-1 rounded-[3px] text-[14px] flex gap-2 ${i === idx ? 'bg-ink text-white' : i < idx ? 'text-ink-2 hover:bg-sunken' : 'text-ink-3 hover:bg-sunken'}`}
                  >
                    <span className="font-mono w-6 shrink-0 tabular">{i}</span>
                    <span>{s.tex ? <Tex math={s.tex} /> : s.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          </Panel>
        </>
      }
      side={
        <>
          <Panel title="输入矩阵 A">
            <Segmented ariaLabel="阶数" size="sm" value={n} onChange={resize} options={[2, 3, 4].map((k) => ({ value: k, label: `${k} × ${k}` }))} />
            <MatrixInput ariaLabel="矩阵 A" value={A} onChange={setA} step={1} />
            <Segmented
              ariaLabel="选主元策略"
              size="sm"
              value={partial ? 'p' : 'n'}
              onChange={(v) => setPartial(v === 'p')}
              options={[
                { value: 'n', label: '仅在主元为 0 时换行' },
                { value: 'p', label: '列主元' },
              ]}
            />
            <Presets items={PRESETS.map((p) => ({ label: p.name, onClick: () => setA(p.A.map((r) => [...r])) }))} />
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'finish', label: '把任一矩阵消元到底，确认 PA = LU。' },
              { id: 'swap', label: '完成一次需要换行的分解。' },
              { id: 'custom', label: '自己输入一个矩阵并完成分解。' },
            ]}
          />
          <Note label="为什么">
            每次消元等于左乘 E = I − ℓ eᵢeₖᵀ，其逆只需把 ℓ 变号；按消元次序把这些逆乘起来时互不干扰，于是乘子原样落在 L 的对应位置。
          </Note>
        </>
      }
    />
  );
};
