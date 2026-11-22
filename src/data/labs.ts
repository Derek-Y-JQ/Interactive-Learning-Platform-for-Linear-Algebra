import { lazy, type ComponentType } from 'react';
const Ch00ComplexLab = lazy(() => import('../labs/Ch00ComplexLab').then((m) => ({ default: m.Ch00ComplexLab })));
const Ch01Vectors3DLab = lazy(() => import('../labs/Ch01Vectors3DLab').then((m) => ({ default: m.Ch01Vectors3DLab })));
const Ch01ThreePlanesLab = lazy(() => import('../labs/Ch01ThreePlanesLab').then((m) => ({ default: m.Ch01ThreePlanesLab })));
const Ch02SpanBasisLab = lazy(() => import('../labs/Ch02SpanBasisLab').then((m) => ({ default: m.Ch02SpanBasisLab })));
const Ch03KernelImageLab = lazy(() => import('../labs/Ch03KernelImageLab').then((m) => ({ default: m.Ch03KernelImageLab })));
const Ch04BasisShadowLab = lazy(() => import('../labs/Ch04BasisShadowLab').then((m) => ({ default: m.Ch04BasisShadowLab })));
const Ch04EliminationLab = lazy(() => import('../labs/Ch04EliminationLab').then((m) => ({ default: m.Ch04EliminationLab })));
const Ch05DeterminantLab = lazy(() => import('../labs/Ch05DeterminantLab').then((m) => ({ default: m.Ch05DeterminantLab })));
const Ch06FourSubspacesLab = lazy(() => import('../labs/Ch06FourSubspacesLab').then((m) => ({ default: m.Ch06FourSubspacesLab })));
const Ch07EigenExplorerLab = lazy(() => import('../labs/Ch07EigenExplorerLab').then((m) => ({ default: m.Ch07EigenExplorerLab })));
const Ch07GerschgorinLab = lazy(() => import('../labs/Ch07GerschgorinLab').then((m) => ({ default: m.Ch07GerschgorinLab })));
const Ch08GramSchmidtLab = lazy(() => import('../labs/Ch08GramSchmidtLab').then((m) => ({ default: m.Ch08GramSchmidtLab })));
const Ch09SvdTheaterLab = lazy(() => import('../labs/Ch09SvdTheaterLab').then((m) => ({ default: m.Ch09SvdTheaterLab })));
const Ch09SvdImageLab = lazy(() => import('../labs/Ch09SvdImageLab').then((m) => ({ default: m.Ch09SvdImageLab })));
const Ch10QuadraticFormLab = lazy(() => import('../labs/Ch10QuadraticFormLab').then((m) => ({ default: m.Ch10QuadraticFormLab })));
const Ch11QuadricSurfacesLab = lazy(() => import('../labs/Ch11QuadricSurfacesLab').then((m) => ({ default: m.Ch11QuadricSurfacesLab })));
const AppendixEquivalenceLab = lazy(() => import('../labs/AppendixEquivalenceLab').then((m) => ({ default: m.AppendixEquivalenceLab })));

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
    id: 'ch03-kernel-image',
    chapter: 3,
    number: '3.1',
    chapterLabel: '第 3 章',
    title: '像、核、陪集与对偶泛函',
    subtitle: '双视图联动：定义域中的陪集被压成陪域中的一个点',
    kind: '2D',
    featured: true,
    component: Ch03KernelImageLab,
  },
  {
    id: 'ch04-basis-shadow',
    chapter: 4,
    number: '4.1',
    chapterLabel: '第 4 章',
    title: '同一映射在不同基下的矩阵',
    subtitle: '固定变换、移动基，观察 P⁻¹AP；矩阵乘法的四种读法',
    kind: '2D',
    featured: true,
    component: Ch04BasisShadowLab,
  },
  {
    id: 'ch04-elimination',
    chapter: 4,
    number: '4.2',
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
    id: 'ch07-eigen-explorer',
    chapter: 7,
    number: '7.1',
    chapterLabel: '第 7 章',
    title: '寻找特征方向',
    subtitle: '扫过单位圆捕捉 Av ∥ v；幂迭代收敛到主特征向量',
    kind: '2D',
    featured: true,
    component: Ch07EigenExplorerLab,
  },
  {
    id: 'ch07-gerschgorin',
    chapter: 7,
    number: '7.2',
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
    id: 'ch09-svd-theater',
    chapter: 9,
    number: '9.1',
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
    number: '9.2',
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
    id: 'appendix-equivalence',
    chapter: 99,
    number: 'A.1',
    chapterLabel: '附录',
    title: '相抵、相似与合同',
    subtitle: '三种矩阵关系的定义、不变量与标准形对照',
    kind: '图谱',
    component: AppendixEquivalenceLab,
  },
];
