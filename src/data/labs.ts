import { lazy, type ComponentType } from 'react';
const Ch00ComplexLab = lazy(() => import('../labs/Ch00ComplexLab').then((m) => ({ default: m.Ch00ComplexLab })));
const Ch00PolynomialGcdLab = lazy(() => import('../labs/Ch00PolynomialGcdLab').then((m) => ({ default: m.Ch00PolynomialGcdLab })));
const Ch01Vectors3DLab = lazy(() => import('../labs/Ch01Vectors3DLab').then((m) => ({ default: m.Ch01Vectors3DLab })));
const Ch01ThreePlanesLab = lazy(() => import('../labs/Ch01ThreePlanesLab').then((m) => ({ default: m.Ch01ThreePlanesLab })));
const Ch01ColumnPictureLab = lazy(() => import('../labs/Ch01ColumnPictureLab').then((m) => ({ default: m.Ch01ColumnPictureLab })));
const Ch02SpanBasisLab = lazy(() => import('../labs/Ch02SpanBasisLab').then((m) => ({ default: m.Ch02SpanBasisLab })));
const Ch02SubspaceTestLab = lazy(() => import('../labs/Ch02SubspaceTestLab').then((m) => ({ default: m.Ch02SubspaceTestLab })));
const Ch02SubspaceOpsLab = lazy(() => import('../labs/Ch02SubspaceOpsLab').then((m) => ({ default: m.Ch02SubspaceOpsLab })));
const Ch02PolyBasisEvenOddLab = lazy(() => import('../labs/Ch02PolyBasisEvenOddLab').then((m) => ({ default: m.Ch02PolyBasisEvenOddLab })));
const Ch03LinearMapGalleryLab = lazy(() => import('../labs/Ch03LinearMapGalleryLab').then((m) => ({ default: m.Ch03LinearMapGalleryLab })));
const Ch03KernelImageLab = lazy(() => import('../labs/Ch03KernelImageLab').then((m) => ({ default: m.Ch03KernelImageLab })));
const Ch03MapOperationsLab = lazy(() => import('../labs/Ch03MapOperationsLab').then((m) => ({ default: m.Ch03MapOperationsLab })));
const Ch03DerivativeNilpotentLab = lazy(() => import('../labs/Ch03DerivativeNilpotentLab').then((m) => ({ default: m.Ch03DerivativeNilpotentLab })));
const Ch04MapToMatrixLab = lazy(() => import('../labs/Ch04MapToMatrixLab').then((m) => ({ default: m.Ch04MapToMatrixLab })));
const Ch04MatrixMulLab = lazy(() => import('../labs/Ch04MatrixMulLab').then((m) => ({ default: m.Ch04MatrixMulLab })));
const Ch04MulOrderGeometryLab = lazy(() => import('../labs/Ch04MulOrderGeometryLab').then((m) => ({ default: m.Ch04MulOrderGeometryLab })));
const Ch04ElementaryEquivLab = lazy(() => import('../labs/Ch04ElementaryEquivLab').then((m) => ({ default: m.Ch04ElementaryEquivLab })));
const Ch04BlockSchurRank1Lab = lazy(() => import('../labs/Ch04BlockSchurRank1Lab').then((m) => ({ default: m.Ch04BlockSchurRank1Lab })));
const Ch04EliminationLab = lazy(() => import('../labs/Ch04EliminationLab').then((m) => ({ default: m.Ch04EliminationLab })));
const Ch05DeterminantLab = lazy(() => import('../labs/Ch05DeterminantLab').then((m) => ({ default: m.Ch05DeterminantLab })));
const Ch05VolumeLaplaceLab = lazy(() => import('../labs/Ch05VolumeLaplaceLab').then((m) => ({ default: m.Ch05VolumeLaplaceLab })));
const Ch05DetProductCauchyBinetLab = lazy(() => import('../labs/Ch05DetProductCauchyBinetLab').then((m) => ({ default: m.Ch05DetProductCauchyBinetLab })));
const Ch05AdjugateCramerLab = lazy(() => import('../labs/Ch05AdjugateCramerLab').then((m) => ({ default: m.Ch05AdjugateCramerLab })));
const Ch06FourSubspacesLab = lazy(() => import('../labs/Ch06FourSubspacesLab').then((m) => ({ default: m.Ch06FourSubspacesLab })));
const Ch06SolutionStructureLab = lazy(() => import('../labs/Ch06SolutionStructureLab').then((m) => ({ default: m.Ch06SolutionStructureLab })));
const Ch07SimilarityBasisLab = lazy(() => import('../labs/Ch07SimilarityBasisLab').then((m) => ({ default: m.Ch07SimilarityBasisLab })));
const Ch07EigenExplorerLab = lazy(() => import('../labs/Ch07EigenExplorerLab').then((m) => ({ default: m.Ch07EigenExplorerLab })));
const Ch07MarkovFibonacciLab = lazy(() => import('../labs/Ch07MarkovFibonacciLab').then((m) => ({ default: m.Ch07MarkovFibonacciLab })));
const Ch07CayleyHamiltonLab = lazy(() => import('../labs/Ch07CayleyHamiltonLab').then((m) => ({ default: m.Ch07CayleyHamiltonLab })));
const Ch07JordanDynamicsLab = lazy(() => import('../labs/Ch07JordanDynamicsLab').then((m) => ({ default: m.Ch07JordanDynamicsLab })));
const Ch07GerschgorinLab = lazy(() => import('../labs/Ch07GerschgorinLab').then((m) => ({ default: m.Ch07GerschgorinLab })));
const Ch08GramSchmidtLab = lazy(() => import('../labs/Ch08GramSchmidtLab').then((m) => ({ default: m.Ch08GramSchmidtLab })));
const Ch08QrDecompLab = lazy(() => import('../labs/Ch08QrDecompLab').then((m) => ({ default: m.Ch08QrDecompLab })));
const Ch08ProjectionApproxLab = lazy(() => import('../labs/Ch08ProjectionApproxLab').then((m) => ({ default: m.Ch08ProjectionApproxLab })));
const Ch09ProjectionIdempotentLab = lazy(() => import('../labs/Ch09ProjectionIdempotentLab').then((m) => ({ default: m.Ch09ProjectionIdempotentLab })));
const Ch09SpectralPolarLab = lazy(() => import('../labs/Ch09SpectralPolarLab').then((m) => ({ default: m.Ch09SpectralPolarLab })));
const Ch09SvdTheaterLab = lazy(() => import('../labs/Ch09SvdTheaterLab').then((m) => ({ default: m.Ch09SvdTheaterLab })));
const Ch09SvdImageLab = lazy(() => import('../labs/Ch09SvdImageLab').then((m) => ({ default: m.Ch09SvdImageLab })));
const Ch10QuadraticFormLab = lazy(() => import('../labs/Ch10QuadraticFormLab').then((m) => ({ default: m.Ch10QuadraticFormLab })));
const Ch10CongruenceSylvesterLab = lazy(() => import('../labs/Ch10CongruenceSylvesterLab').then((m) => ({ default: m.Ch10CongruenceSylvesterLab })));
const Ch10NormalModesLab = lazy(() => import('../labs/Ch10NormalModesLab').then((m) => ({ default: m.Ch10NormalModesLab })));
const Ch11QuadricSurfacesLab = lazy(() => import('../labs/Ch11QuadricSurfacesLab').then((m) => ({ default: m.Ch11QuadricSurfacesLab })));
const Ch11ConicClassificationLab = lazy(() => import('../labs/Ch11ConicClassificationLab').then((m) => ({ default: m.Ch11ConicClassificationLab })));
const Ch11IsometryAffineLab = lazy(() => import('../labs/Ch11IsometryAffineLab').then((m) => ({ default: m.Ch11IsometryAffineLab })));
const AppendixEquivalenceLab = lazy(() => import('../labs/AppendixEquivalenceLab').then((m) => ({ default: m.AppendixEquivalenceLab })));
const AppendixDecompositionsLab = lazy(() => import('../labs/AppendixDecompositionsLab').then((m) => ({ default: m.AppendixDecompositionsLab })));

export interface LabDefinition {
  id: string;
  chapter: number; // 0..11, 99 for Appendix
  /** running number inside the site, e.g. "7.2" */
  number: string;
  chapterLabel: string;
  title: string;
  subtitle: string;
  kind: '2D' | '3D' | '演算' | '图谱';
  featured?: boolean;
  component: ComponentType;
}

export const CHAPTER_TITLES: Record<number, string> = {
  0: '数域与复数',
  1: '几何向量',
  2: '线性空间',
  3: '线性映射',
  4: '矩阵',
  5: '行列式',
  6: '线性方程组',
  7: '特征值与 Jordan 标准形',
  8: '内积空间',
  9: '内积空间上的算子',
  10: '二次型',
  11: '空间解析几何',
  99: '附录',
};

export const LABS: LabDefinition[] = [
  {
    id: 'ch00-complex',
    chapter: 0,
    number: '0.1',
    chapterLabel: '第 0 章',
    title: '复平面上的乘法、乘方与开方',
    subtitle: '乘法即旋转加伸缩；de Moivre 螺线；任意复数的 n 次方根',
    kind: '2D',
    component: Ch00ComplexLab,
  },
  {
    id: 'ch00-polynomial-gcd',
    chapter: 0,
    number: '0.2',
    chapterLabel: '第 0 章',
    title: '一元多项式带余除法与 Euclid 辗转相除',
    subtitle: '逐步展示带余除法、最大公因式 gcd(f, g) 与 Bézout 组合 uf + vg = d',
    kind: '演算',
    component: Ch00PolynomialGcdLab,
  },
  {
    id: 'ch01-vectors3d',
    chapter: 1,
    number: '1.1',
    chapterLabel: '第 1 章',
    title: '内积、外积与混合积',
    subtitle: '在空间中直接拖动向量，读出投影、面积与有向体积',
    kind: '3D',
    featured: true,
    component: Ch01Vectors3DLab,
  },
  {
    id: 'ch01-three-planes',
    chapter: 1,
    number: '1.2',
    chapterLabel: '第 1 章',
    title: '三元方程组与三张平面',
    subtitle: '自由编辑方程系数，观察交线、交点与秩的对应',
    kind: '3D',
    featured: true,
    component: Ch01ThreePlanesLab,
  },
  {
    id: 'ch01-column-picture',
    chapter: 1,
    number: '1.3',
    chapterLabel: '第 1 章',
    title: '三元方程组的“列视角”与向量线性组合',
    subtitle: '在三维空间中调节 x₁, x₂, x₃，用列向量首尾相接拼出目标向量 b',
    kind: '3D',
    component: Ch01ColumnPictureLab,
  },
  {
    id: 'ch02-span-basis',
    chapter: 2,
    number: '2.1',
    chapterLabel: '第 2 章',
    title: '基、坐标与张成',
    subtitle: '拖动基向量看斜坐标网，输入坐标反求向量',
    kind: '2D',
    component: Ch02SpanBasisLab,
  },
  {
    id: 'ch02-subspace-test',
    chapter: 2,
    number: '2.2',
    chapterLabel: '第 2 章',
    title: '子空间判定实验室',
    subtitle: '拖动向量检验含零元、加法封闭与数乘封闭三条判据',
    kind: '2D',
    component: Ch02SubspaceTestLab,
  },
  {
    id: 'ch02-subspace-ops',
    chapter: 2,
    number: '2.3',
    chapterLabel: '第 2 章',
    title: '子空间的交、和、直和与维数公式',
    subtitle: '三维可视化 U ∩ W 与 U + W，验证维数公式与直和分解唯一性',
    kind: '3D',
    component: Ch02SubspaceOpsLab,
  },
  {
    id: 'ch02-poly-basis-even-odd',
    chapter: 2,
    number: '2.4',
    chapterLabel: '第 2 章',
    title: '多项式空间中的基与偶部/奇部直和分解',
    subtitle: '对比幂基与 Bernstein 基坐标；将任意多项式唯一拆为偶部与奇部',
    kind: '2D',
    component: Ch02PolyBasisEvenOddLab,
  },
  {
    id: 'ch03-linear-map-gallery',
    chapter: 3,
    number: '3.1',
    chapterLabel: '第 3 章',
    title: '线性映射图鉴与线性性检验',
    subtitle: '教材开篇旋转、反射、比例、错切与投影示例（不依赖矩阵）',
    kind: '2D',
    featured: true,
    component: Ch03LinearMapGalleryLab,
  },
  {
    id: 'ch03-kernel-image',
    chapter: 3,
    number: '3.2',
    chapterLabel: '第 3 章',
    title: '像、核、陪集与对偶泛函',
    subtitle: '由基像 φ(e₁), φ(e₂) 确定映射；定义域中的陪集被压成陪域中的一点',
    kind: '2D',
    featured: true,
    component: Ch03KernelImageLab,
  },
  {
    id: 'ch03-map-operations',
    chapter: 3,
    number: '3.3',
    chapterLabel: '第 3 章',
    title: '线性映射的运算：和、数乘、复合与逆',
    subtitle: '逐点线性组合 λφ + μψ；分步演示 ψ ∘ φ ≠ φ ∘ ψ 与逆映射',
    kind: '2D',
    component: Ch03MapOperationsLab,
  },
  {
    id: 'ch03-derivative-nilpotent',
    chapter: 3,
    number: '3.4',
    chapterLabel: '第 3 章',
    title: '多项式求导算子与幂零变换',
    subtitle: '在 ℝ₃[x] 上反复施加求导 D，观察像链收缩与核链扩张直至归零',
    kind: '2D',
    component: Ch03DerivativeNilpotentLab,
  },
  {
    id: 'ch04-map-to-matrix',
    chapter: 4,
    number: '4.1',
    chapterLabel: '第 4 章',
    title: '从线性映射到矩阵：交换图与基像读出',
    subtitle: '调整定义域基 α 与陪域基 β，观察 φ(αⱼ) 的坐标如何竖着填入矩阵',
    kind: '2D',
    featured: true,
    component: Ch04MapToMatrixLab,
  },
  {
    id: 'ch04-matrix-mul',
    chapter: 4,
    number: '4.2',
    chapterLabel: '第 4 章',
    title: '矩阵乘法的四种读法',
    subtitle: '行·列内积、列组合、行组合与秩 1 矩阵之和',
    kind: '演算',
    component: Ch04MatrixMulLab,
  },
  {
    id: 'ch04-mul-order-geometry',
    chapter: 4,
    number: '4.3',
    chapterLabel: '第 4 章',
    title: '矩阵乘法的几何复合次序',
    subtitle: '并排对比 AB 与 BA 对单位圆的作用（如先拉伸再旋转 vs 先旋转再拉伸）',
    kind: '2D',
    component: Ch04MulOrderGeometryLab,
  },
  {
    id: 'ch04-elementary-equiv',
    chapter: 4,
    number: '4.4',
    chapterLabel: '第 4 章',
    title: '初等矩阵、相抵标准形与 Gauss–Jordan 求逆',
    subtitle: '同步追踪左乘/右乘初等矩阵与 PAQ 标准形，直观演示 [A | I] → [I | A⁻¹]',
    kind: '演算',
    component: Ch04ElementaryEquivLab,
  },
  {
    id: 'ch04-block-schur-rank1',
    chapter: 4,
    number: '4.5',
    chapterLabel: '第 4 章',
    title: '分块矩阵、Schur 补与秩 1 分解',
    subtitle: '分块消元验证 det M = det A · det(D − CA⁻¹B)；将秩 2 矩阵拆为秩 1 之和',
    kind: '演算',
    component: Ch04BlockSchurRank1Lab,
  },
  {
    id: 'ch04-elimination',
    chapter: 4,
    number: '4.6',
    chapterLabel: '第 4 章',
    title: '高斯消元与 LU 分解',
    subtitle: '输入任意方阵，逐步消元，乘子落入 L，必要时换行得 PA = LU',
    kind: '演算',
    component: Ch04EliminationLab,
  },
  {
    id: 'ch05-determinant',
    chapter: 5,
    number: '5.1',
    chapterLabel: '第 5 章',
    title: '行列式：有向面积与定向',
    subtitle: '从恒等变换连续过渡到 A，看面积如何穿过零而翻转',
    kind: '2D',
    component: Ch05DeterminantLab,
  },
  {
    id: 'ch05-volume-laplace',
    chapter: 5,
    number: '5.2',
    chapterLabel: '第 5 章',
    title: '三阶有向体积、行列式性质与 Laplace 展开',
    subtitle: '三维平行六面体验证交换变号与错切保体积；交互按任意行/列展开',
    kind: '3D',
    component: Ch05VolumeLaplaceLab,
  },
  {
    id: 'ch05-det-product-cb',
    chapter: 5,
    number: '5.3',
    chapterLabel: '第 5 章',
    title: '乘积行列式与 Cauchy–Binet 几何面积',
    subtitle: '验证 det(AB) = det A · det B 以及空间平行四边形投影面积勾股定理',
    kind: '2D',
    component: Ch05DetProductCauchyBinetLab,
  },
  {
    id: 'ch05-adjugate-cramer',
    chapter: 5,
    number: '5.4',
    chapterLabel: '第 5 章',
    title: '伴随矩阵、逆矩阵公式与 Cramer 法则',
    subtitle: '点选 A* 任意元素高亮转置余子式；用有向面积比直观证明 Cramer 法则',
    kind: '演算',
    component: Ch05AdjugateCramerLab,
  },
  {
    id: 'ch06-four-subspaces',
    chapter: 6,
    number: '6.1',
    chapterLabel: '第 6 章',
    title: '四个基本子空间',
    subtitle: '任意 m×n 矩阵的 RREF、四个子空间的基与维数关系',
    kind: '图谱',
    featured: true,
    component: Ch06FourSubspacesLab,
  },
  {
    id: 'ch06-solution-structure',
    chapter: 6,
    number: '6.2',
    chapterLabel: '第 6 章',
    title: '齐次与非齐次方程组的解结构',
    subtitle: '双视图对比 ker A 与仿射解集 x₀ + ker A，拖动 b 检验有解条件',
    kind: '2D',
    component: Ch06SolutionStructureLab,
  },
  {
    id: 'ch07-similarity-basis',
    chapter: 7,
    number: '7.1',
    chapterLabel: '第 7 章',
    title: '同一变换在不同基下的矩阵（矩阵相似）',
    subtitle: '固定线性变换、拖动基向量，观察 P⁻¹AP 如何化为上三角或对角阵',
    kind: '2D',
    featured: true,
    component: Ch07SimilarityBasisLab,
  },
  {
    id: 'ch07-eigen-explorer',
    chapter: 7,
    number: '7.2',
    chapterLabel: '第 7 章',
    title: '寻找特征方向',
    subtitle: '扫过单位圆捕捉 Av ∥ v；幂迭代收敛到主特征向量',
    kind: '2D',
    featured: true,
    component: Ch07EigenExplorerLab,
  },
  {
    id: 'ch07-markov-fibonacci',
    chapter: 7,
    number: '7.3',
    chapterLabel: '第 7 章',
    title: '离散动力系统：Markov 链与 Fibonacci 数列',
    subtitle: '用相似对角化解释状态分布收敛到稳态，以及黄金比例通项公式',
    kind: '演算',
    component: Ch07MarkovFibonacciLab,
  },
  {
    id: 'ch07-cayley-hamilton',
    chapter: 7,
    number: '7.4',
    chapterLabel: '第 7 章',
    title: 'Cayley–Hamilton 定理与极小多项式演算器',
    subtitle: '实时验证 f_A(A) = O，并用低次幂直接计算 A⁴ 与逆矩阵 A⁻¹',
    kind: '演算',
    component: Ch07CayleyHamiltonLab,
  },
  {
    id: 'ch07-jordan-dynamics',
    chapter: 7,
    number: '7.5',
    chapterLabel: '第 7 章',
    title: '不变子空间、对角化与 Jordan 块的几何行为',
    subtitle: '对比可对角化、复特征值旋转与 Jordan 块错切漂移的离散轨线',
    kind: '2D',
    component: Ch07JordanDynamicsLab,
  },
  {
    id: 'ch07-gerschgorin',
    chapter: 7,
    number: '7.6',
    chapterLabel: '第 7 章',
    title: 'Gerschgorin 圆盘',
    subtitle: '拖动对角元移动圆心，观察特征值始终落在圆盘之并内',
    kind: '2D',
    component: Ch07GerschgorinLab,
  },
  {
    id: 'ch08-gram-schmidt',
    chapter: 8,
    number: '8.1',
    chapterLabel: '第 8 章',
    title: 'Gram–Schmidt 正交化与最小二乘',
    subtitle: '三维中逐步减去投影；平面上拟合多项式并检查残差正交性',
    kind: '3D',
    component: Ch08GramSchmidtLab,
  },
  {
    id: 'ch08-qr-decomp',
    chapter: 8,
    number: '8.2',
    chapterLabel: '第 8 章',
    title: 'QR 分解逐步可视化',
    subtitle: '逐列追踪正交化过程，看投影系数如何填入上三角矩阵 R',
    kind: '演算',
    component: Ch08QrDecompLab,
  },
  {
    id: 'ch08-projection-approx',
    chapter: 8,
    number: '8.3',
    chapterLabel: '第 8 章',
    title: '正交分解、最佳逼近与函数空间投影',
    subtitle: '三维勾股最佳逼近，以及 C[-1,1] 中用 Legendre 正交多项式逼近 eˣ',
    kind: '3D',
    component: Ch08ProjectionApproxLab,
  },
  {
    id: 'ch09-projection-idempotent',
    chapter: 9,
    number: '9.1',
    chapterLabel: '第 9 章',
    title: '正交投影 vs 斜投影（幂等算子）',
    subtitle: '对比 P² = P 与 P² = P = Pᵀ，观察 im P ⊥ ker P 与自伴性的等价关系',
    kind: '2D',
    component: Ch09ProjectionIdempotentLab,
  },
  {
    id: 'ch09-spectral-polar',
    chapter: 9,
    number: '9.2',
    chapterLabel: '第 9 章',
    title: '实对称矩阵的谱定理与极分解',
    subtitle: '正交特征主轴分解 λ₁u₁u₁ᵀ + λ₂u₂u₂ᵀ；极分解 A = QS 两阶段动画',
    kind: '2D',
    component: Ch09SpectralPolarLab,
  },
  {
    id: 'ch09-svd-theater',
    chapter: 9,
    number: '9.3',
    chapterLabel: '第 9 章',
    title: '奇异值分解的三步几何',
    subtitle: 'Vᵀ 旋转、Σ 伸缩、U 旋转或反射，连续播放并可逐帧拖动',
    kind: '2D',
    featured: true,
    component: Ch09SvdTheaterLab,
  },
  {
    id: 'ch09-svd-image',
    chapter: 9,
    number: '9.4',
    chapterLabel: '第 9 章',
    title: '低秩逼近与图像压缩',
    subtitle: '上传或手绘图像，逐项叠加 σᵢuᵢvᵢᵀ',
    kind: '演算',
    component: Ch09SvdImageLab,
  },
  {
    id: 'ch10-quadratic-forms',
    chapter: 10,
    number: '10.1',
    chapterLabel: '第 10 章',
    title: '二次型的曲面、等高线与 Rayleigh 商',
    subtitle: '三维曲面与二维等高线联动，惯性指数随系数实时变化',
    kind: '3D',
    featured: true,
    component: Ch10QuadraticFormLab,
  },
  {
    id: 'ch10-congruence-sylvester',
    chapter: 10,
    number: '10.2',
    chapterLabel: '第 10 章',
    title: '合同变换、配方法与 Sylvester 惯性定理',
    subtitle: '修改可逆合同矩阵 C，验证惯性指数守恒、Lagrange 配方与顺序主子式',
    kind: '2D',
    component: Ch10CongruenceSylvesterLab,
  },
  {
    id: 'ch10-normal-modes',
    chapter: 10,
    number: '10.3',
    chapterLabel: '第 10 章',
    title: '同时合同对角化与双弹簧简正模式',
    subtitle: '实时动画展示同相/反相简正模式与耦合振子的二次型解耦',
    kind: '2D',
    component: Ch10NormalModesLab,
  },
  {
    id: 'ch11-quadric-surfaces',
    chapter: 11,
    number: '11.1',
    chapterLabel: '第 11 章',
    title: '二次曲面与截线',
    subtitle: '用平面 z = h 切割曲面；单叶双曲面与马鞍面的两族直母线',
    kind: '3D',
    featured: true,
    component: Ch11QuadricSurfacesLab,
  },
  {
    id: 'ch11-conic-classification',
    chapter: 11,
    number: '11.2',
    chapterLabel: '第 11 章',
    title: '平面二次曲线分类与转轴/移轴化简',
    subtitle: '调节一般二元二次方程系数，分步转轴消 xy、移轴化标准形并检验不变量',
    kind: '2D',
    component: Ch11ConicClassificationLab,
  },
  {
    id: 'ch11-isometry-affine',
    chapter: 11,
    number: '11.3',
    chapterLabel: '第 11 章',
    title: '空间等距变换与仿射变换',
    subtitle: '三维对比旋转、镜面反射、螺旋运动、旋转反射与一般仿射变换',
    kind: '3D',
    component: Ch11IsometryAffineLab,
  },
  {
    id: 'appendix-equivalence',
    chapter: 99,
    number: 'A.1',
    chapterLabel: '附录',
    title: '相抵、相似与合同',
    subtitle: '三种矩阵关系的定义、不变量与标准形对照',
    kind: '图谱',
    component: AppendixEquivalenceLab,
  },
  {
    id: 'appendix-decompositions',
    chapter: 99,
    number: 'A.2',
    chapterLabel: '附录',
    title: '矩阵分解全景图谱',
    subtitle: '输入同一矩阵，色带图示横向对比 LU、QR、特征、谱、极分解与 SVD',
    kind: '图谱',
    component: AppendixDecompositionsLab,
  },
];
