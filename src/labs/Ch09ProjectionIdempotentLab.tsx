import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { fmt, mat2ToTex, mulMat2, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

export const Ch09ProjectionIdempotentLab: React.FC = () => {
  const [imgDeg, setImgDeg] = useState(20); // direction of im P
  const [kerDeg, setKerDeg] = useState(75); // direction of ker P (orthogonal when |kerDeg - imgDeg| = 90°)
  const [v, setV] = useState<Vec2>([1.6, 2.0]);

  const radU = (imgDeg * Math.PI) / 180;
  const radK = (kerDeg * Math.PI) / 180;
  const u: Vec2 = [Math.cos(radU), Math.sin(radU)];
  const k: Vec2 = [Math.cos(radK), Math.sin(radK)];

  // Projection onto span(u) along span(k):
  // v = c1 * u + c2 * k => P(v) = c1 * u
  // Solve [u, k] [c1; c2] = v -> det = u0*k1 - u1*k0
  const det = u[0] * k[1] - u[1] * k[0];
  const valid = Math.abs(det) > 0.08;

  // P = u * (1/det) * [k1, -k0]
  const P: Mat2 | null = valid
    ? [
        [(u[0] * k[1]) / det, (-u[0] * k[0]) / det],
        [(u[1] * k[1]) / det, (-u[1] * k[0]) / det],
      ]
    : null;

  const Pv = P ? mulMat2Vec(P, v) : ([0, 0] as Vec2);
  const P2 = P ? mulMat2(P, P) : null;
  const PT: Mat2 | null = P
    ? [
        [P[0][0], P[1][0]],
        [P[0][1], P[1][1]],
      ]
    : null;

  const angleDiff = Math.abs((((kerDeg - imgDeg) % 180) + 180) % 180);
  const isOrth = valid && Math.abs(angleDiff - 90) < 1.5;
  const symErr = P && PT ? Math.hypot(P[0][1] - PT[0][1], P[1][0] - PT[1][0]) : 0;

  const done = useLatch({
    oblique: valid && !isOrth,
    orth: isOrth,
    selfAdj: isOrth && symErr < 0.03,
  });

  return (
    <LabGrid
      stage={
        <Figure
          caption="绿色直线是像空间 im P，红色直线是核空间 ker P；任意向量 v 沿平行于 ker P 的方向被投到 im P 上。"
          legend={
            <>
              <Swatch color={C.green} label="im P" />
              <Swatch color={C.red} label="ker P（投射方向）" />
              <Swatch color={C.blue} label="v" />
              <Swatch color={C.violet} label="Pv = P²v" />
            </>
          }
        >
          <Canvas2D range={3.5} handles={[{ id: 'v', pos: v, color: C.blue, label: 'v', onChange: setV }]} ariaLabel="幂等算子与正交投影画布">
            {({ toSvg, line }) => {
              const o = toSvg([0, 0]);
              return (
                <g>
                  <line {...line([0, 0], u)} stroke={C.green} strokeWidth={2.6} />
                  <SvgLabel at={toSvg([u[0] * 2.7, u[1] * 2.7])} color={C.green} dy={-10}>im P</SvgLabel>
                  <line {...line([0, 0], k)} stroke={C.red} strokeWidth={2} strokeDasharray="6 4" />
                  <SvgLabel at={toSvg([k[0] * 2.5, k[1] * 2.5])} color={C.red} dy={-10}>ker P</SvgLabel>

                  {valid && (
                    <>
                      {/* Projection ray from v to Pv parallel to ker P */}
                      <line x1={toSvg(v)[0]} y1={toSvg(v)[1]} x2={toSvg(Pv)[0]} y2={toSvg(Pv)[1]} stroke={C.red} strokeWidth={1.8} strokeDasharray="4 3" />
                      <SvgArrow from={o} to={toSvg(v)} color={C.blue} width={2.6} />
                      <SvgArrow from={o} to={toSvg(Pv)} color={C.violet} width={3} />
                      <SvgPoint at={toSvg(Pv)} color={C.violet} r={4.5} />
                      <SvgLabel at={toSvg(Pv)} color={C.violet} dy={18}>Pv = P²v</SvgLabel>
                    </>
                  )}
                </g>
              );
            }}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel title="调节像空间与投射方向">
            <SliderField label="im P 方向角" value={imgDeg} min={-90} max={90} step={5} digits={0} unit="°" color={C.green} onChange={setImgDeg} />
            <SliderField label="ker P 方向角" value={kerDeg} min={-90} max={180} step={5} digits={0} unit="°" color={C.red} onChange={setKerDeg} />
            <Presets
              items={[
                { label: '斜投影（教材反例）', onClick: () => { setImgDeg(0); setKerDeg(45); } },
                { label: '正交投影（im P ⊥ ker P）', onClick: () => { setImgDeg(20); setKerDeg(110); } },
                { label: 'x 轴正交投影', onClick: () => { setImgDeg(0); setKerDeg(90); } },
              ]}
            />
            <VectorInput name="v" color={C.blue} value={v} onChange={(p) => setV(p as Vec2)} />
          </Panel>

          <Panel title="幂等性与自伴性检验">
            {P && P2 && PT ? (
              <>
                <MathBox tone={isOrth ? 'ok' : 'neutral'}>
                  <Tex block math={`P = ${mat2ToTex(P)},\\quad P^2 = ${mat2ToTex(P2)} = P`} />
                  <Tex block math={`P^\\top = ${mat2ToTex(PT)},\\quad \\|P^\\top - P\\|_F = ${fmt(symErr)}`} />
                </MathBox>
                <Status tone={isOrth ? 'ok' : 'info'}>
                  {isOrth ? (
                    <span>
                      <strong>正交投影！</strong> 此时 <Tex math="\operatorname{im}P \perp \ker P" />（夹角 90°），恰好等价于 <Tex math="P^2 = P = P^\top" />（自伴幂等算子）。
                    </span>
                  ) : (
                    <span>
                      <strong>斜投影（非正交幂等算子）</strong>：满足 <Tex math="P^2 = P" />，但夹角为 {fmt(angleDiff, 0)}° ≠ 90°，故 <Tex math="P^\top \ne P" />，且 <Tex math="\|Pv\|" /> 甚至可能大于 <Tex math="\|v\|" />！
                    </span>
                  )}
                </Status>
              </>
            ) : (
              <Status tone="warn">im P 与 ker P 重合，无法形成直和分解 ℝ² = im P ⊕ ker P。</Status>
            )}
            <Note label="定理 9.2">
              线性算子 <Tex math="P" /> 是正交投影，当且仅当它同时满足<strong>幂等</strong>（<Tex math="P^2 = P" />）与<strong>自伴</strong>（<Tex math="P^* = P" />）。
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'oblique', label: '在斜投影下确认 P² = P 但 Pᵀ ≠ P' },
              { id: 'orth', label: '把 ker P 方向角调至与 im P 垂直（差 90°）' },
              { id: 'selfAdj', label: '观察垂足出现的同时，矩阵 P 恰好变为对称矩阵 Pᵀ = P' },
            ]}
          />
        </>
      }
    />
  );
};
