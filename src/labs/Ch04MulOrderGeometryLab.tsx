import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { fmt, mat2ToTex, mulMat2, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

const UNIT_PTS: Vec2[] = Array.from({ length: 97 }, (_, k) => {
  const t = (2 * Math.PI * k) / 96;
  return [Math.cos(t), Math.sin(t)];
});

export const Ch04MulOrderGeometryLab: React.FC = () => {
  // Default: A = rotation 45 deg, B = anisotropic scaling diag(2, 0.5)
  const [A, setA] = useState<Mat2>([
    [0.71, -0.71],
    [0.71, 0.71],
  ]);
  const [B, setB] = useState<Mat2>([
    [2.0, 0],
    [0, 0.5],
  ]);

  const AB = mulMat2(A, B);
  const BA = mulMat2(B, A);
  const diffNorm = Math.hypot(
    AB[0][0] - BA[0][0],
    AB[0][1] - BA[0][1],
    AB[1][0] - BA[1][0],
    AB[1][1] - BA[1][1]
  );
  const commutes = diffNorm < 0.02;

  const done = useLatch({
    noncomm: !commutes,
    comm: commutes,
    shearStretch: Math.abs(A[0][1] - 1) < 0.05 && Math.abs(B[0][0] - 2) < 0.05,
  });

  const renderPanel = (M: Mat2, color: string, label: string) => (
    <Canvas2D range={2.8} aspect={1} ariaLabel={label}>
      {({ toSvg, scale, cx, cy }) => {
        const o = toSvg([0, 0]);
        const ell = UNIT_PTS.map((p) => toSvg(mulMat2Vec(M, p)).join(',')).join(' ');
        const e1 = mulMat2Vec(M, [1, 0]);
        const e2 = mulMat2Vec(M, [0, 1]);
        return (
          <g>
            <circle cx={cx} cy={cy} r={scale} fill="none" stroke={C.ruleStrong} strokeDasharray="4 3" />
            <polygon points={ell} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={2.2} />
            <SvgArrow from={o} to={toSvg(e1)} color={C.blue} width={2.4} />
            <SvgArrow from={o} to={toSvg(e2)} color={C.red} width={2.4} />
            <SvgLabel at={toSvg(e1)} color={C.blue} dy={-10}>e₁ 像</SvgLabel>
            <SvgLabel at={toSvg(e2)} color={C.red} dy={14}>e₂ 像</SvgLabel>
          </g>
        );
      }}
    </Canvas2D>
  );

  return (
    <LabGrid
      wideStage
      stage={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Figure
            caption={<>先 <Tex math="B" /> 后 <Tex math="A" />：乘积 <Tex math="AB" /> 把单位圆映成的椭圆</>}
            legend={<Swatch color={C.violet} label="AB(单位圆)" />}
          >
            {renderPanel(AB, C.violet, 'AB 几何效果')}
          </Figure>
          <Figure
            caption={<>先 <Tex math="A" /> 后 <Tex math="B" />：乘积 <Tex math="BA" /> 把单位圆映成的椭圆</>}
            legend={<Swatch color={C.accent} label="BA(单位圆)" />}
          >
            {renderPanel(BA, C.accent, 'BA 几何效果')}
          </Figure>
        </div>
      }
      side={
        <>
          <Panel title="矩阵乘法的几何次序">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Tex math="A =" />
                <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} />
              </div>
              <div className="flex items-center gap-1.5">
                <Tex math="B =" />
                <MatrixInput ariaLabel="矩阵 B" value={B} onChange={(m) => setB(m as Mat2)} />
              </div>
            </div>
            <Presets
              label="教材经典对比"
              items={[
                { label: '旋转 × 拉伸（斜椭圆 vs 正椭圆）', onClick: () => { setA([[0.71, -0.71], [0.71, 0.71]]); setB([[2, 0], [0, 0.5]]); } },
                { label: '错切 × 拉伸', onClick: () => { setA([[1, 1], [0, 1]]); setB([[2, 0], [0, 0.5]]); } },
                { label: '两对角阵（可交换）', onClick: () => { setA([[1.5, 0], [0, 0.8]]); setB([[0.8, 0], [0, 1.8]]); } },
                { label: '两旋转阵（可交换）', onClick: () => { setA([[0.8, -0.6], [0.6, 0.8]]); setB([[0.6, -0.8], [0.8, 0.6]]); } },
              ]}
            />
            <MathBox tone={commutes ? 'ok' : 'warn'}>
              <Tex block math={`AB = ${mat2ToTex(AB)},\\qquad BA = ${mat2ToTex(BA)}`} />
              <Tex block math={`\\|AB - BA\\|_F = ${fmt(diffNorm)}`} />
            </MathBox>
            <Status tone={commutes ? 'ok' : 'warn'}>
              {commutes
                ? 'AB = BA：这两个矩阵可交换，两图完全重合！'
                : 'AB ≠ BA！例如“先拉伸再旋转”得到斜椭圆，而“先旋转再拉伸”只沿坐标轴拉伸，得到正椭圆！'}
            </Status>
            <Note label="教材例 4.3">
              矩阵乘法的顺序从右到左对应线性映射的复合顺序；即使两者都是简单变换，调换次序也会彻底改变最终几何图形。
            </Note>
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'noncomm', label: '对比“旋转 × 拉伸”下 AB（斜椭圆）与 BA（正椭圆）的差异' },
              { id: 'shearStretch', label: '切换到“错切 × 拉伸”，观察两者非对角元为何相差 4 倍' },
              { id: 'comm', label: '切换到“两对角阵”或“两旋转阵”，验证此时 AB = BA' },
            ]}
          />
        </>
      }
    />
  );
};
