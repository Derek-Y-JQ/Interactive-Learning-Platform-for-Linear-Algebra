/**
 * 课后习题提示与解答库（按章节按需动态加载，按习题 id 索引，如 "ch01-1-1"）
 * 解答数据由 scripts/sync_solutions.py 从教材 solutions/ch01-solutions.md .. ch11-solutions.md 自动同步。
 */
export interface ExerciseSolution {
  hint?: string;
  solution?: string;
}

const HINTS: Record<string, string> = {
  'ch01-1-1':
    '利用向量的首尾相接法则 $\\overrightarrow{AB} = \\overrightarrow{AD} + \\overrightarrow{DB}$ 或选取任意参考点 $O$ 将每条有向线段写成位置向量之差 $\\overrightarrow{XY} = \\overrightarrow{OY} - \\overrightarrow{OX}$。',
  'ch01-1-2':
    '从起点沿平行六面体的棱走到终点，把每一段写成 $\\pm\\bm{a}, \\pm\\bm{b}, \\pm\\bm{c}$ 的线性组合；对分点 $N$ 利用 $\\overrightarrow{BN}=\\frac{2}{3}\\overrightarrow{BD_1}$。',
  'ch01-1-3':
    '(1) 利用分配律 $k\\bm{0} = k(\\bm{0}+\\bm{0}) = k\\bm{0}+k\\bm{0}$；第二部分在 $k\\ne 0$ 时两边同乘 $k^{-1}$。',
};

const LOADERS: Record<number, () => Promise<{ default: Record<string, string> }>> = {
  1: () => import('./solutions/ch01.json'),
  2: () => import('./solutions/ch02.json'),
  3: () => import('./solutions/ch03.json'),
  4: () => import('./solutions/ch04.json'),
  5: () => import('./solutions/ch05.json'),
  6: () => import('./solutions/ch06.json'),
  7: () => import('./solutions/ch07.json'),
  8: () => import('./solutions/ch08.json'),
  9: () => import('./solutions/ch09.json'),
  10: () => import('./solutions/ch10.json'),
  11: () => import('./solutions/ch11.json'),
};

const cache = new Map<number, Record<string, ExerciseSolution>>();

export function getCachedChapterSolutions(chapter: number): Record<string, ExerciseSolution> | undefined {
  return cache.get(chapter);
}

export async function loadChapterSolutions(chapter: number): Promise<Record<string, ExerciseSolution>> {
  const hit = cache.get(chapter);
  if (hit) return hit;

  const loader = LOADERS[chapter];
  if (!loader) return {};

  const mod = await loader();
  const raw = mod.default ?? (mod as unknown as Record<string, string>);
  const out: Record<string, ExerciseSolution> = {};
  for (const [id, solution] of Object.entries(raw)) {
    out[id] = { solution, hint: HINTS[id] };
  }
  cache.set(chapter, out);
  return out;
}
