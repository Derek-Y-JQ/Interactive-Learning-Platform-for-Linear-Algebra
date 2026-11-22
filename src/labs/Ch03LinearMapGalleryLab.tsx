import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, Toggle, VectorInput, useLatch } from '../components/ui';
import { fmt, type Vec2 } from '../utils/math';
import { C } from '../theme';

type MapId = 'rot' | 'refl' | 'scale' | 'shear' | 'proj' | 'homothety' | 'translate' | 'parabola';

const SHAPE: Vec2[] = [
  [0, 0],
  [1.4, 0],
  [1.4, 0.9],
  [0.5, 0.9],
  [0.5, 0.45],
  [0, 0.45],
];

export const Ch03LinearMapGalleryLab: React.FC = () => {
  const [mapId, setMapId] = useState<MapId>('rot');
  const [theta, setTheta] = useState(45);
  const [alpha, setAlpha] = useState(30);
  const [a, setA] = useState(1.6);
  const [b, setB] = useState(0.7);
  const [k, setK] = useState(0.9);
  const [c, setC] = useState(1.4);

  const [u, setU] = useState<Vec2>([1.2, 0.4]);
  const [v, setV] = useState<Vec2>([0.4, 1.3]);
  const [lam, setLam] = useState(1);
  const [mu, setMu] = useState(1);
  const [showTest, setShowTest] = useState(true);

  const radT = (theta * Math.PI) / 180;
  const radA = (alpha * Math.PI) / 180;
  const dirA: Vec2 = [Math.cos(radA), Math.sin(radA)];

  const applyMap = (p: Vec2): Vec2 => {
    const [x, y] = p;
    switch (mapId) {
      case 'rot':
        return [x * Math.cos(radT) - y * Math.sin(radT), x * Math.sin(radT) + y * Math.cos(radT)];
      case 'refl': {
        const dot = x * dirA[0] + y * dirA[1];
        return [2 * dot * dirA[0] - x, 2 * dot * dirA[1] - y];
      }
      case 'scale':
        return [a * x, b * y];
      case 'shear':
        return [x + k * y, y];
      case 'proj': {
        const dot = x * dirA[0] + y * dirA[1];
        return [dot * dirA[0], dot * dirA[1]];
      }
      case 'homothety':
        return [c * x, c * y];
      case 'translate':
        return [x + 1, y + 0.8];
      case 'parabola':
        return [x, 0.45 * x * x + 0.4 * y];
    }
  };

  const isLinear = mapId !== 'translate' && mapId !== 'parabola';

  const comb: Vec2 = [lam * u[0] + mu * v[0], lam * u[1] + mu * v[1]];
  const lhs = applyMap(comb);
  const fu = applyMap(u);
  const fv = applyMap(v);
  const rhs: Vec2 = [lam * fu[0] + mu * fv[0], lam * fu[1] + mu * fv[1]];
  const diff = Math.hypot(lhs[0] - rhs[0], lhs[1] - rhs[1]);
  const linearHold = diff < 1e-4;

  // For reflection/projection, decompose u into parallel & perpendicular parts
  const uDotA = u[0] * dirA[0] + u[1] * dirA[1];
  const uPar: Vec2 = [uDotA * dirA[0], uDotA * dirA[1]];

  const formulaTex = (): string => {
    switch (mapId) {
      case 'rot':
        return `\\bm{\\rho}_{${theta}^\\circ}(x,y) = (x\\cos ${theta}^\\circ - y\\sin ${theta}^\\circ,\\; x\\sin ${theta}^\\circ + y\\cos ${theta}^\\circ)`;
      case 'refl':
        return `\\bm{\\psi}_\\ell(\\boldsymbol{v}) = \\boldsymbol{v}_\\parallel - \\boldsymbol{v}_\\perp = 2\\frac{\\boldsymbol{v}\\cdot\\boldsymbol{a}}{\\boldsymbol{a}\\cdot\\boldsymbol{a}}\\boldsymbol{a} - \\boldsymbol{v}`;
      case 'scale':
        return `\\mathrm{D}_{${fmt(a)},${fmt(b)}}(x,y) = (${fmt(a)}x,\\; ${fmt(b)}y)`;
      case 'shear':
        return `\\bm{\\tau}_{${fmt(k)}}(x,y) = (x + ${fmt(k)}y,\\; y)`;
      case 'proj':
        return `\\operatorname{proj}_\\ell(\\boldsymbol{v}) = \\frac{\\boldsymbol{v}\\cdot\\boldsymbol{a}}{\\boldsymbol{a}\\cdot\\boldsymbol{a}}\\boldsymbol{a}`;
      case 'homothety':
        return `(${fmt(c)}\\,\\mathrm{id})(x,y) = (${fmt(c)}x,\\; ${fmt(c)}y)`;
      case 'translate':
        return `T(x,y) = (x + 1,\\; y + 0.8)\\quad\\text{（非线性：}T(\\boldsymbol{0}) \\ne \\boldsymbol{0}\\text{）}`;
      case 'parabola':
        return `F(x,y) = (x,\\; 0.45x^2 + 0.4y)\\quad\\text{（非线性：直线变弯曲）}`;
    }
  };

  const done = useLatch({
    rot: mapId === 'rot' && theta !== 45,
    refl: mapId === 'refl',
    shear: mapId === 'shear',
    nonlin: !isLinear && !linearHold,
  });

  return (
    <LabGrid
      stage={
        <Figure
          caption="浅蓝为原图形，橙色为映射后的像；打开线性性检验可同屏对比 φ(λu+μv) 与 λφ(u)+μφ(v)。"
          legend={
            <>
              <Swatch color={C.blue} label="原图形 / u, v" />
              <Swatch color={C.accent} label="像图形" />
              {showTest && (
                <>
                  <Swatch color={C.green} label="φ(λu+μv)" />
                  <Swatch color={C.red} dashed label="λφ(u)+μφ(v)" />
                </>
              )}
            </>
          }
        >
          <Canvas2D
            range={4}
            handles={
              showTest
                ? [
                    { id: 'u', pos: u, color: C.blue, label: 'u', onChange: setU },
                    { id: 'v', pos: v, color: C.ink2, label: 'v', onChange: setV },
                  ]
                : []
            }
            ariaLabel="线性映射图鉴画布"
          >
            {({ toSvg, line }) => {
              const o = toSvg([0, 0]);
              const origPts = SHAPE.map((p) => toSvg(p).join(',')).join(' ');
              // Subdivide edges so parabola curves smoothly
              const mappedPts: string[] = [];
              for (let i = 0; i < SHAPE.length; i++) {
                const p0 = SHAPE[i];
                const p1 = SHAPE[(i + 1) % SHAPE.length];
                for (let s = 0; s < 12; s++) {
                  const t = s / 12;
                  const pt: Vec2 = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
                  mappedPts.push(toSvg(applyMap(pt)).join(','));
                }
              }

              return (
                <g>
                  {(mapId === 'refl' || mapId === 'proj') && (
                    <line {...line([0, 0], dirA)} stroke={C.violet} strokeWidth={2} strokeDasharray="6 4" />
                  )}

                  {/* Original and mapped shapes */}
                  <polygon points={origPts} fill={C.blue} fillOpacity={0.12} stroke={C.blue} strokeWidth={1.8} />
                  <polygon points={mappedPts.join(' ')} fill={C.accent} fillOpacity={0.18} stroke={C.accent} strokeWidth={2} />

                  {/* Reflection decomposition for u */}
                  {(mapId === 'refl' || mapId === 'proj') && showTest && (
                    <g>
                      <line x1={toSvg(u)[0]} y1={toSvg(u)[1]} x2={toSvg(fu)[0]} y2={toSvg(fu)[1]} stroke={C.ruleStrong} strokeDasharray="4 3" />
                      <SvgArrow from={o} to={toSvg(uPar)} color={C.violet} width={2} />
                      <SvgLabel at={toSvg(uPar)} color={C.violet} dy={16}>
                        u∥
                      </SvgLabel>
                    </g>
                  )}

                  {showTest && (
                    <g>
                      <SvgArrow from={o} to={toSvg(u)} color={C.blue} width={2.2} />
                      <SvgArrow from={o} to={toSvg(v)} color={C.ink2} width={2.2} />
                      <SvgArrow from={o} to={toSvg(comb)} color={C.gray} width={1.6} dashed />
                      <SvgLabel at={toSvg(comb)} color={C.ink3} dy={-10}>
                        λu+μv
                      </SvgLabel>

                      <SvgArrow from={o} to={toSvg(lhs)} color={C.green} width={3} />
                      <SvgPoint at={toSvg(lhs)} color={C.green} r={4.5} />
                      <SvgLabel at={toSvg(lhs)} color={C.green} dy={-14}>
                        φ(λu+μv)
                      </SvgLabel>

                      <SvgArrow from={o} to={toSvg(rhs)} color={C.red} width={2.2} dashed />
                      <SvgPoint at={toSvg(rhs)} color={C.red} r={3.5} />
                      {!linearHold && (
                        <SvgLabel at={toSvg(rhs)} color={C.red} dy={18}>
                          λφ(u)+μφ(v)
                        </SvgLabel>
                      )}
                    </g>
                  )}
                </g>
              );
            }}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel title="教材 §3.1 经典映射（不使用矩阵）">
            <Presets
              label="线性映射"
              items={[
                { label: '旋转 ρ_θ', active: mapId === 'rot', onClick: () => setMapId('rot') },
                { label: '镜面反射 ψ_ℓ', active: mapId === 'refl', onClick: () => setMapId('refl') },
                { label: '比例 D_{a,b}', active: mapId === 'scale', onClick: () => setMapId('scale') },
                { label: '错切 τ_k', active: mapId === 'shear', onClick: () => setMapId('shear') },
                { label: '直线投影 proj_ℓ', active: mapId === 'proj', onClick: () => setMapId('proj') },
                { label: '位似 c·id', active: mapId === 'homothety', onClick: () => setMapId('homothety') },
              ]}
            />
            <Presets
              label="非线性反例"
              items={[
                { label: '平移 (x+1, y+0.8)', active: mapId === 'translate', onClick: () => setMapId('translate') },
                { label: '抛物弯曲 (x, 0.45x²+0.4y)', active: mapId === 'parabola', onClick: () => setMapId('parabola') },
              ]}
            />

            {mapId === 'rot' && <SliderField label="旋转角 θ" value={theta} min={-180} max={180} step={5} unit="°" color={C.accent} onChange={setTheta} digits={0} />}
            {(mapId === 'refl' || mapId === 'proj') && (
              <SliderField label="直线 ℓ 倾角" value={alpha} min={-90} max={90} step={5} unit="°" color={C.violet} onChange={setAlpha} digits={0} />
            )}
            {mapId === 'scale' && (
              <>
                <SliderField label="水平比例 a" value={a} min={-2} max={2.5} step={0.1} color={C.blue} onChange={setA} />
                <SliderField label="竖直比例 b" value={b} min={-2} max={2.5} step={0.1} color={C.green} onChange={setB} />
              </>
            )}
            {mapId === 'shear' && <SliderField label="错切系数 k" value={k} min={-2} max={2} step={0.1} color={C.accent} onChange={setK} />}
            {mapId === 'homothety' && <SliderField label="比例因子 c" value={c} min={-2} max={2.5} step={0.1} color={C.accent} onChange={setC} />}

            <MathBox>
              <Tex math={formulaTex()} block />
            </MathBox>
          </Panel>

          <Panel title="线性性检验：φ(λu + μv) ≟ λφ(u) + μφ(v)">
            <Toggle checked={showTest} onChange={setShowTest} color={C.green}>
              显示线性性检验向量
            </Toggle>
            {showTest && (
              <>
                <VectorInput name="u" color={C.blue} value={u} onChange={(p) => setU(p as Vec2)} />
                <VectorInput name="v" color={C.ink2} value={v} onChange={(p) => setV(p as Vec2)} />
                <div className="grid grid-cols-2 gap-3">
                  <SliderField label="λ" value={lam} min={-2} max={2} step={0.2} onChange={setLam} />
                  <SliderField label="μ" value={mu} min={-2} max={2} step={0.2} onChange={setMu} />
                </div>
                <Status tone={linearHold ? 'ok' : 'warn'}>
                  {linearHold ? (
                    <span>
                      完全重合！<Tex math={`\\varphi(\\lambda\\boldsymbol{u}+\\mu\\boldsymbol{v}) = \\lambda\\varphi(\\boldsymbol{u})+\\mu\\varphi(\\boldsymbol{v}) = (${fmt(lhs[0])},\\,${fmt(lhs[1])})`} />
                    </span>
                  ) : (
                    <span>
                      分离！差值距离 <Tex math={fmt(diff)} />：<Tex math={`(${fmt(lhs[0])},${fmt(lhs[1])}) \\ne (${fmt(rhs[0])},${fmt(rhs[1])})`} />
                    </span>
                  )}
                </Status>
              </>
            )}
            <Note label="提示">
              本章直接用几何与坐标规则刻画线性映射，尚不引入矩阵。注意观察：线性映射一定把原点映到原点、把直线映为直线（或点）。
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'rot', label: '调节旋转角 θ，确认“先线性组合再旋转”与“先旋转再组合”始终重合' },
              { id: 'refl', label: '切换到镜面反射 ψ_ℓ，观察 u 在直线上的平行分量 u∥' },
              { id: 'shear', label: '切换到水平错切 τ_k，观察水平线高度不变、矩形变为平行四边形' },
              { id: 'nonlin', label: '切换到平移或抛物弯曲，亲眼看到两条箭头分离（破坏线性性）' },
            ]}
          />
        </>
      }
    />
  );
};
