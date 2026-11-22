# 线性代数：从几何向量到谱理论 · 交互学习平台

**Interactive Learning Platform for Linear Algebra**

本站是中山大学出版社《线性代数：从几何向量到谱理论》（尹俊淇、杨毅 著，预计 2027 年 2 月出版）的配套学习网站。

在线访问：<https://derek-y-jq.github.io/Interactive-Learning-Platform-for-Linear-Algebra/>

## 内容

### 交互实验（17 个，覆盖第 0–11 章与附录）

书中的核心对象在这里都可以拖动、编辑和逐步演算。每个实验配有若干“探究任务”，学生完成条件时自动打勾。

| 编号 | 实验 | 编号 | 实验 |
|---|---|---|---|
| 0.1 | 复平面上的乘法、乘方与开方 | 7.1 | 寻找特征方向（方向场、幂迭代） |
| 1.1 | 内积、外积与混合积（3D） | 7.2 | Gerschgorin 圆盘 |
| 1.2 | 三元方程组与三张平面（3D） | 8.1 | Gram–Schmidt 正交化与最小二乘 |
| 2.1 | 基、坐标与张成 | 9.1 | 奇异值分解的三步几何 |
| 3.1 | 像、核、陪集与对偶泛函 | 9.2 | 低秩逼近与图像压缩（可上传或手绘） |
| 4.1 | 同一映射在不同基下的矩阵；矩阵乘法四种读法 | 10.1 | 二次型的曲面、等高线与 Rayleigh 商 |
| 4.2 | 高斯消元与 PA = LU 分解 | 11.1 | 二次曲面、截线与直母线 |
| 5.1 | 行列式：有向面积与定向 | A.1 | 相抵、相似与合同（含判定器） |
| 6.1 | 四个基本子空间 | | |

交互方式：

- 2D 图：拖动点、平移、Ctrl/⌘ + 滚轮或双指缩放、网格吸附；也可用方向键移动（Shift 加大步长）。
- 3D 图：拖动彩色球体改变向量（水平改 x, y，按住 Shift 改 z），多视角切换与自动旋转。
- 矩阵与向量均可直接输入数值，↑/↓ 微调。

### 课后习题

收录全书 1,080 道课后习题，可按章节、难度、题型、关键词筛选；学习进度与收藏仅保存在本机浏览器。提示与解答持续补充中。

## 本地开发

需要 Node.js 20 及以上。

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建，输出到 dist/
```

技术栈：Vite、React 19、TypeScript、Tailwind CSS 4、three.js、KaTeX。

## 目录结构

```
src/
  components/   Canvas2D（2D 坐标平面）、ThreeViewport（3D 视图）、ui（通用控件）、MathText（KaTeX）
  labs/         各章交互实验
  pages/        首页、实验页、习题页
  data/         实验目录 labs.ts、习题 exercises.json、解答 solutions.ts
  theme.ts      图形配色（与 index.css 中的设计令牌保持一致）
```

### 补充习题解答

在 `src/data/solutions.ts` 中按习题 id（如 `"ch01-1-4"`）添加 `hint` 与 `solution`，支持 LaTeX 公式（`$…$`、`\[…\]`）。

### 同步习题（维护者）

仅在本地同时存有教材源文件（上级目录 `../exercises/`）时使用：

```bash
npm run sync-exercises
```

## 部署

推送到 `main` 分支后，GitHub Actions（`.github/workflows/deploy.yml`）会自动构建并发布到 GitHub Pages。

## 版权

网站代码随本仓库开源。习题文本版权归教材作者与中山大学出版社所有。
