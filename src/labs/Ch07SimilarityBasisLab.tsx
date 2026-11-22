import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { invMat2, mat2ToTex, mulMat2, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

export const Ch07SimilarityBasisLab: React.FC = () => {
  const [A, setA] = useState<Mat2>([
    [1.5, 0.5],
    [0.5, 1.5],
  ]);
  const [b1, setB1] = useState<Vec2>([1, 0.3]);
  const [b2, setB2] = useState<Vec2>([-0.4, 1]);

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
    upper: isUpper && !isDiag,
    diag: isDiag && Math.abs(b1[1]) + Math.abs(b2[0]) > 0.2,
  });

  return (
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
            ariaLabel="相似矩阵与基变换画布"
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
          <Panel title="线性变换与基变换（矩阵相似）">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[14px] text-ink-2">标准基下</span>
              <Tex math="A =" />
              <MatrixInput ariaLabel="标准基下的矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} />
            </div>
            <VectorInput name="β₁" color={C.blue} value={b1} onChange={(p) => setB1(p as Vec2)} />
            <VectorInput name="β₂" color={C.red} value={b2} onChange={(p) => setB2(p as Vec2)} />
            <MathBox tone={isDiag ? 'ok' : 'neutral'}>
              <Tex block math={`P = ${mat2ToTex(P)}`} />
              {B ? <Tex block math={`B = P^{-1}AP = ${mat2ToTex(B)}`} /> : <div className="text-danger text-[14px]">β₁, β₂ 线性相关，过渡矩阵 P 不可逆。</div>}
            </MathBox>
            {B && (
              <Status tone={isDiag ? 'ok' : 'info'}>
                {isDiag
                  ? 'B 是对角阵：β₁, β₂ 都是特征向量，φ 只沿它们伸缩。'
                  : isUpper
                  ? 'B 是上三角阵：β₁ 张成一维不变子空间（即特征向量）。'
                  : 'B 的第 j 列 = φ(βⱼ) 在新基 β 下的坐标，A 与 B 互为相似矩阵。'}
              </Status>
            )}
            <Presets
              items={[
                { label: '标准基', onClick: () => { setB1([1, 0]); setB2([0, 1]); } },
                { label: '斜基', onClick: () => { setB1([1.5, 0.3]); setB2([-0.4, 1.2]); } },
                { label: '剪切 A（不可对角化）', onClick: () => setA([[1, 1], [0, 1]]) },
                { label: '旋转 A（无实特征值）', onClick: () => setA([[0.8, -0.6], [0.6, 0.8]]) },
              ]}
            />
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'upper', label: '只拖动 β₁，使 B 成为上三角（但不对角）' },
              { id: 'diag', label: '再拖动 β₂，使 B 成为对角阵（实现相似对角化）' },
            ]}
          />
          <Note>把 A 改为“旋转 A”后再试：在实数域中找不到使 B 上三角或对角的实基——这引出了复特征值与后续 Jordan 标准形理论。</Note>
        </>
      }
    />
  );
};
