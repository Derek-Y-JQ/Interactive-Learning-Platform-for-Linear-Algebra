import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { fmt, invMat2, mat2ToTex, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

type MapPreset = 'rot45' | 'shear' | 'refl' | 'scale' | 'proj';

const MAPS: Record<MapPreset, { label: string; desc: string; apply: (p: Vec2) => Vec2 }> = {
  rot45: {
    label: '旋转 45°',
    desc: '绕原点逆时针旋转 45°',
    apply: ([x, y]) => [Math.SQRT1_2 * (x - y), Math.SQRT1_2 * (x + y)],
  },
  shear: {
    label: '水平错切 τ₁',
    desc: 'φ(x, y) = (x + y, y)',
    apply: ([x, y]) => [x + y, y],
  },
  refl: {
    label: '关于 y = x 反射',
    desc: 'φ(x, y) = (y, x)',
    apply: ([x, y]) => [y, x],
  },
  scale: {
    label: '比例 D_{2, 0.5}',
    desc: 'φ(x, y) = (2x, 0.5y)',
    apply: ([x, y]) => [2 * x, 0.5 * y],
  },
  proj: {
    label: '到 x 轴投影',
    desc: 'φ(x, y) = (x, 0)',
    apply: ([x]) => [x, 0],
  },
};

export const Ch04MapToMatrixLab: React.FC = () => {
  const [mapId, setMapId] = useState<MapPreset>('shear');
  const [a1, setA1] = useState<Vec2>([1, 0]);
  const [a2, setA2] = useState<Vec2>([0, 1]);
  const [b1, setB1] = useState<Vec2>([1, 0.3]);
  const [b2, setB2] = useState<Vec2>([-0.3, 1]);
  const [v, setV] = useState<Vec2>([1.2, 0.9]);

  const map = MAPS[mapId];
  const PA: Mat2 = [
    [a1[0], a2[0]],
    [a1[1], a2[1]],
  ];
  const PB: Mat2 = [
    [b1[0], b2[0]],
    [b1[1], b2[1]],
  ];
  const invA = invMat2(PA);
  const invB = invMat2(PB);

  const fa1 = map.apply(a1);
  const fa2 = map.apply(a2);
  const fv = map.apply(v);

  const col1 = invB ? mulMat2Vec(invB, fa1) : null;
  const col2 = invB ? mulMat2Vec(invB, fa2) : null;
  const M: Mat2 | null =
    col1 && col2
      ? [
          [col1[0], col2[0]],
          [col1[1], col2[1]],
        ]
      : null;

  const coordV = invA ? mulMat2Vec(invA, v) : null;
  const coordFv = M && coordV ? mulMat2Vec(M, coordV) : null;

  const done = useLatch({
    customBasis: Math.abs(a1[1]) + Math.abs(a2[0]) > 0.25,
    customCodomain: Math.abs(b1[1]) + Math.abs(b2[0]) > 0.25,
    otherMap: mapId !== 'shear',
  });

  return (
    <LabGrid
      wideStage
      stage={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Figure
            caption="定义域 V：基 α = (α₁, α₂) 与输入向量 v"
            legend={
              <>
                <Swatch color={C.blue} label="α₁" />
                <Swatch color={C.green} label="α₂" />
                <Swatch color={C.violet} label="v" />
              </>
            }
          >
            <Canvas2D
              range={3.2}
              aspect={1}
              handles={[
                { id: 'a1', pos: a1, color: C.blue, label: 'α₁', onChange: setA1 },
                { id: 'a2', pos: a2, color: C.green, label: 'α₂', onChange: setA2 },
                { id: 'v', pos: v, color: C.violet, label: 'v', onChange: setV },
              ]}
              ariaLabel="定义域与基 α"
            >
              {({ toSvg }) => {
                const o = toSvg([0, 0]);
                return (
                  <g>
                    <SvgArrow from={o} to={toSvg(a1)} color={C.blue} width={2.6} />
                    <SvgArrow from={o} to={toSvg(a2)} color={C.green} width={2.6} />
                    <SvgArrow from={o} to={toSvg(v)} color={C.violet} width={2.4} dashed />
                  </g>
                );
              }}
            </Canvas2D>
          </Figure>

          <Figure
            caption="陪域 W：基 β = (β₁, β₂) 下分解 φ(α₁)、φ(α₂)"
            legend={
              <>
                <Swatch color={C.ochre} label="β₁, β₂" />
                <Swatch color={C.blue} dashed label="φ(α₁)" />
                <Swatch color={C.green} dashed label="φ(α₂)" />
              </>
            }
          >
            <Canvas2D
              range={3.2}
              aspect={1}
              handles={[
                { id: 'b1', pos: b1, color: C.ochre, label: 'β₁', onChange: setB1 },
                { id: 'b2', pos: b2, color: C.red, label: 'β₂', onChange: setB2 },
              ]}
              ariaLabel="陪域与基 β"
            >
              {({ toSvg }) => {
                const o = toSvg([0, 0]);
                return (
                  <g>
                    <SvgArrow from={o} to={toSvg(b1)} color={C.ochre} width={2.6} />
                    <SvgArrow from={o} to={toSvg(b2)} color={C.red} width={2.6} />
                    <SvgArrow from={o} to={toSvg(fa1)} color={C.blue} width={2.2} dashed />
                    <SvgLabel at={toSvg(fa1)} color={C.blue} dy={-12}>φ(α₁)</SvgLabel>
                    <SvgArrow from={o} to={toSvg(fa2)} color={C.green} width={2.2} dashed />
                    <SvgLabel at={toSvg(fa2)} color={C.green} dy={16}>φ(α₂)</SvgLabel>
                    <SvgArrow from={o} to={toSvg(fv)} color={C.violet} width={2.8} />
                    <SvgLabel at={toSvg(fv)} color={C.violet} dy={-12}>φ(v)</SvgLabel>
                  </g>
                );
              }}
            </Canvas2D>
          </Figure>
        </div>
      }
      side={
        <>
          <Panel title="选择线性映射 φ 与两组基 α, β">
            <Presets
              label="几何映射 φ"
              items={(Object.keys(MAPS) as MapPreset[]).map((k) => ({
                label: MAPS[k].label,
                active: k === mapId,
                onClick: () => setMapId(k),
              }))}
            />
            <Presets
              label="基快捷设置"
              items={[
                { label: 'α=β=标准基', onClick: () => { setA1([1, 0]); setA2([0, 1]); setB1([1, 0]); setB2([0, 1]); } },
                { label: '标准 α，斜基 β', onClick: () => { setA1([1, 0]); setA2([0, 1]); setB1([1, 0.4]); setB2([-0.3, 1]); } },
                { label: '两组不同斜基', onClick: () => { setA1([1.2, 0.3]); setA2([-0.2, 1.1]); setB1([1, -0.4]); setB2([0.5, 1]); } },
              ]}
            />
            <VectorInput name="v" color={C.violet} value={v} onChange={(p) => setV(p as Vec2)} />
          </Panel>

          <Panel title="矩阵读出与交换图验证">
            {M && col1 && col2 ? (
              <>
                <MathBox tone="ok">
                  <Tex
                    block
                    math={`\\begin{aligned}
\\varphi(\\bm\\alpha_1) &= ${fmt(col1[0])}\\,\\bm\\beta_1 + ${fmt(col1[1])}\\,\\bm\\beta_2,\\\\
\\varphi(\\bm\\alpha_2) &= ${fmt(col2[0])}\\,\\bm\\beta_1 + ${fmt(col2[1])}\\,\\bm\\beta_2
\\end{aligned}`}
                  />
                  <Tex block math={`[\\varphi]_{\\alpha,\\beta} = \\bigl(\\,[\\varphi(\\bm\\alpha_1)]_\\beta \\;\\big|\\; [\\varphi(\\bm\\alpha_2)]_\\beta\\,\\bigr) = ${mat2ToTex(M)}`} />
                </MathBox>
                {coordV && coordFv && (
                  <MathBox>
                    <Tex
                      block
                      math={`[\\varphi(\\boldsymbol{v})]_\\beta = [\\varphi]_{\\alpha,\\beta}[\\boldsymbol{v}]_\\alpha = ${mat2ToTex(M)}\\begin{pmatrix}${fmt(coordV[0])}\\\\${fmt(coordV[1])}\\end{pmatrix} = \\begin{pmatrix}${fmt(coordFv[0])}\\\\${fmt(coordFv[1])}\\end{pmatrix}`}
                    />
                  </MathBox>
                )}
                <Status tone="info">
                  规则：把每个定义域基向量送过 <Tex math="\varphi" />，在陪域基 <Tex math="\beta" /> 下读出坐标，<strong>竖着写入矩阵各列</strong>。
                </Status>
              </>
            ) : (
              <Status tone="warn">α 或 β 中两个向量线性相关，无法构成基。</Status>
            )}
            <Note label="交换图">
              直接作用 <Tex math="\boldsymbol{v}\mapsto\varphi(\boldsymbol{v})" />，与“先取 <Tex math="\alpha" /> 坐标 → 左乘矩阵 <Tex math="[\varphi]_{\alpha,\beta}" /> → 用 <Tex math="\beta" /> 还原向量”得到完全相同的向量。
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'customBasis', label: '在左侧拖动定义域基 α₁, α₂，观察矩阵各列如何随之改变' },
              { id: 'customCodomain', label: '在右侧拖动陪域基 β₁, β₂，体验同一映射在不同基对下有不同的矩阵表示' },
              { id: 'otherMap', label: '切换另一种几何映射（如旋转或投影），读出它在标准基与斜基下的矩阵' },
            ]}
          />
        </>
      }
    />
  );
};
