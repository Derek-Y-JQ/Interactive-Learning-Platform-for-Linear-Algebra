/**
 * 课后习题提示与解答库（按习题 id 索引，如 "ch01-1-1"）
 * 后续可按章节分拆文件并在此合并，支持完整 LaTeX 数学公式（KaTeX 渲染）。
 */
export interface ExerciseSolution {
  hint?: string;
  solution?: string;
  updatedAt?: string;
}

export const SOLUTIONS: Record<string, ExerciseSolution> = {
  'ch01-1-1': {
    hint: '利用向量的首尾相接法则 $\\overrightarrow{AB} = \\overrightarrow{AD} + \\overrightarrow{DB}$ 或选取任意参考点 $O$ 将每条有向线段写成位置向量之差 $\\overrightarrow{XY} = \\overrightarrow{OY} - \\overrightarrow{OX}$。',
    solution:
      '任取空间中一点 $O$，将各向量用位置向量表示：\\[' +
      '\\overrightarrow{AB} + \\overrightarrow{CD} = (\\overrightarrow{OB} - \\overrightarrow{OA}) + (\\overrightarrow{OD} - \\overrightarrow{OC}) = (\\overrightarrow{OD} - \\overrightarrow{OA}) + (\\overrightarrow{OB} - \\overrightarrow{OC}) = \\overrightarrow{AD} + \\overrightarrow{CB}.' +
      '\\]同理，对闭折线 $A_1A_2\\cdots A_nA_1$，有\\[' +
      '\\sum_{k=1}^{n}\\overrightarrow{A_kA_{k+1}} = \\sum_{k=1}^{n}(\\overrightarrow{OA_{k+1}} - \\overrightarrow{OA_k}) = \\bm{0}\\quad (A_{n+1}=A_1),' +
      '\\]取 $n=4$ 即得四点闭折线等式。',
    updatedAt: '示例解答',
  },
  'ch01-1-2': {
    hint: '从起点沿平行六面体的棱走到终点，把每一段写成 $\\pm\\bm{a}, \\pm\\bm{b}, \\pm\\bm{c}$ 的线性组合；对分点 $N$ 利用 $\\overrightarrow{BN}=\\frac{2}{3}\\overrightarrow{BD_1}$。',
    solution:
      '由平行六面体的棱向量关系直接读出：\\[' +
      '\\overrightarrow{AC_1} = \\bm{a}+\\bm{b}+\\bm{c},\\quad \\overrightarrow{BD_1} = -\\bm{a}+\\bm{b}+\\bm{c},\\quad \\overrightarrow{A_1C} = \\bm{a}+\\bm{b}-\\bm{c}.' +
      '\\]又 $M$ 为 $C_1D_1$ 中点，故 $\\overrightarrow{AM} = \\overrightarrow{AD} + \\overrightarrow{DD_1} + \\frac{1}{2}\\overrightarrow{D_1C_1} = \\frac{1}{2}\\bm{a} + \\bm{b} + \\bm{c}$。\\[' +
      '\\overrightarrow{AN} = \\overrightarrow{AB} + \\frac{2}{3}\\overrightarrow{BD_1} = \\bm{a} + \\frac{2}{3}(-\\bm{a}+\\bm{b}+\\bm{c}) = \\frac{1}{3}\\bm{a}+\\frac{2}{3}\\bm{b}+\\frac{2}{3}\\bm{c},' +
      '\\]因此 $\\overrightarrow{MN} = \\overrightarrow{AN} - \\overrightarrow{AM} = -\\frac{1}{6}\\bm{a} - \\frac{1}{3}\\bm{b} - \\frac{1}{3}\\bm{c}$。',
    updatedAt: '示例解答',
  },
  'ch01-1-3': {
    hint: '(1) 利用分配律 $k\\bm{0} = k(\\bm{0}+\\bm{0}) = k\\bm{0}+k\\bm{0}$；第二部分在 $k\\ne 0$ 时两边同乘 $k^{-1}$。',
    solution:
      '(1) 由数乘对加法的分配律，$k\\bm{0} = k(\\bm{0}+\\bm{0}) = k\\bm{0} + k\\bm{0}$，两边加上 $-k\\bm{0}$ 即得 $k\\bm{0} = \\bm{0}$。若 $k\\bm{v}=\\bm{0}$ 且 $k\\ne 0$，两边同乘 $k^{-1}$ 得 $\\bm{v} = 1\\cdot\\bm{v} = k^{-1}(k\\bm{v}) = k^{-1}\\bm{0} = \\bm{0}$。\n\n' +
      '(2) 由 $k\\bm{u}=k\\bm{v}$ 得 $k(\\bm{u}-\\bm{v})=\\bm{0}$，结合 $k\\ne 0$ 与 (1) 得 $\\bm{u}=\\bm{v}$；同理 $(k-l)\\bm{v}=\\bm{0}$ 且 $\\bm{v}\\ne\\bm{0}$ 推出 $k=l$。\n\n' +
      '(3) 代入 $\\bm{x}=\\bm{b}-\\bm{a}$ 满足方程；若 $\\bm{x}+\\bm{a}=\\bm{b}$，两边同时加上 $-\\bm{a}$ 即得唯一解 $\\bm{x}=\\bm{b}-\\bm{a}$。',
    updatedAt: '示例解答',
  },
};
