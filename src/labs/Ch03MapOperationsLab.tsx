import React, { useEffect, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, Note, Panel, Presets, Segmented, SliderField, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { fmt, type Vec2 } from '../utils/math';
import { C } from '../theme';

type PrimId = 'rot' | 'refl' | 'shear' | 'scale' | 'proj';

interface PrimMap {
  id: PrimId;
  name: string;
  symbol: string;
  invertible: boolean;
  apply: (p: Vec2) => Vec2;
  inv?: (p: Vec2) => Vec2;
}

const F_SHAPE: Vec2[] = [
  [0.2, 0.15],
  [0.2, 1.2],
  [0.95, 1.2],
  [0.95, 1.0],
  [0.42, 1.0],
  [0.42, 0.72],
  [0.82, 0.72],
  [0.82, 0.54],
  [0.42, 0.54],
  [0.42, 0.15],
];

const PRIMS: Record<PrimId, PrimMap> = {
  rot: {
    id: 'rot',
    name: '旋转 ρ_{45°}',
    symbol: '\\bm{\\rho}_{45^\\circ}',
    invertible: true,
    apply: ([x, y]) => {
      const c = Math.SQRT1_2;
      return [c * (x - y), c * (x + y)];
    },
    inv: ([x, y]) => {
      const c = Math.SQRT1_2;
      return [c * (x + y), c * (-x + y)];
    },
  },
  refl: {
    id: 'refl',
    name: '关于 x 轴反射 ψ_x',
    symbol: '\\bm{\\psi}_x',
    invertible: true,
    apply: ([x, y]) => [x, -y],
    inv: ([x, y]) => [x, -y],
  },
  shear: {
    id: 'shear',
    name: '水平错切 τ_1',
    symbol: '\\bm{\\tau}_1',
    invertible: true,
    apply: ([x, y]) => [x + y, y],
    inv: ([x, y]) => [x - y, y],
  },
  scale: {
    id: 'scale',
    name: '比例 D_{1.6, 0.6}',
    symbol: '\\mathrm{D}_{1.6,0.6}',
    invertible: true,
    apply: ([x, y]) => [1.6 * x, 0.6 * y],
    inv: ([x, y]) => [x / 1.6, y / 0.6],
  },
  proj: {
    id: 'proj',
    name: '到 x 轴投影 proj_x',
    symbol: '\\operatorname{proj}_x',
    invertible: false,
    apply: ([x]) => [x, 0],
  },
};

const lerpV = (a: Vec2, b: Vec2, t: number): Vec2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export const Ch03MapOperationsLab: React.FC = () => {
  const [tab, setTab] = useState<'linear' | 'compose'>('linear');
  const [phiId, setPhiId] = useState<PrimId>('rot');
  const [psiId, setPsiId] = useState<PrimId>('shear');
  const [lam, setLam] = useState(1);
  const [mu, setMu] = useState(1);
  const [v, setV] = useState<Vec2>([1.3, 0.9]);
  const [stageT, setStageT] = useState(2); // 0: v, 1: φ(v), 2: ψ(φ(v))
  const [playing, setPlaying] = useState(false);
  const [showInv, setShowInv] = useState(false);

  const phi = PRIMS[phiId];
  const psi = PRIMS[psiId];

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(2, ((now - start) / 1000) * 0.85);
      setStageT(t);
      if (t >= 2) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Linear combination mode
  const phiV = phi.apply(v);
  const psiV = psi.apply(v);
  const lPhiV: Vec2 = [lam * phiV[0], lam * phiV[1]];
  const mPsiV: Vec2 = [mu * psiV[0], mu * psiV[1]];
  const sumV: Vec2 = [lPhiV[0] + mPsiV[0], lPhiV[1] + mPsiV[1]];

  // Composition mode
  const psiOfPhi = (p: Vec2) => psi.apply(phi.apply(p));
  const phiOfPsi = (p: Vec2) => phi.apply(psi.apply(p));
  const animPoint = (p: Vec2, order: 'psi_phi' | 'phi_psi'): Vec2 => {
    const first = order === 'psi_phi' ? phi.apply(p) : psi.apply(p);
    const second = order === 'psi_phi' ? psi.apply(first) : phi.apply(first);
    if (stageT <= 1) return lerpV(p, first, stageT);
    return lerpV(first, second, stageT - 1);
  };

  const c1 = psiOfPhi(v);
  const c2 = phiOfPsi(v);
  const commutes = Math.hypot(c1[0] - c2[0], c1[1] - c2[1]) < 1e-4 &&
    Math.hypot(psiOfPhi([1, 0])[0] - phiOfPsi([1, 0])[0], psiOfPhi([1, 0])[1] - phiOfPsi([1, 0])[1]) < 1e-4 &&
    Math.hypot(psiOfPhi([0, 1])[0] - phiOfPsi([0, 1])[0], psiOfPhi([0, 1])[1] - phiOfPsi([0, 1])[1]) < 1e-4;

  const done = useLatch({
    reflFromProj: tab === 'linear' && phiId === 'proj' && Math.abs(lam - 2) < 0.05 && Math.abs(mu + 1) < 0.05,
    noncommute: tab === 'compose' && !commutes,
    invDemo: tab === 'compose' && showInv && phi.invertible,
  });

  const primList = Object.values(PRIMS);

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="映射运算模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'linear', label: '映射的线性运算 λφ + μψ' },
          { value: 'compose', label: '映射的复合 ψ ∘ φ 与逆映射' },
        ]}
      />

      {tab === 'linear' ? (
        <LabGrid
          stage={
            <Figure
              caption="拖动蓝色向量 v，观察 (λφ + μψ)(v) 如何逐点由 λφ(v) 与 μψ(v) 按平行四边形法则合成。"
              legend={
                <>
                  <Swatch color={C.blue} label="v" />
                  <Swatch color={C.ochre} dashed label="λφ(v)" />
                  <Swatch color={C.green} dashed label="μψ(v)" />
                  <Swatch color={C.violet} label="(λφ+μψ)(v)" />
                </>
              }
            >
              <Canvas2D range={4} handles={[{ id: 'v', pos: v, color: C.blue, label: 'v', onChange: setV }]} ariaLabel="映射线性运算画布">
                {({ toSvg }) => {
                  const o = toSvg([0, 0]);
                  const p1 = toSvg(lPhiV);
                  const p2 = toSvg(mPsiV);
                  const pS = toSvg(sumV);
                  return (
                    <g>
                      <line x1={p1[0]} y1={p1[1]} x2={pS[0]} y2={pS[1]} stroke={C.ruleStrong} strokeDasharray="4 3" />
                      <line x1={p2[0]} y1={p2[1]} x2={pS[0]} y2={pS[1]} stroke={C.ruleStrong} strokeDasharray="4 3" />
                      <SvgArrow from={o} to={toSvg(v)} color={C.blue} width={2.6} />
                      <SvgArrow from={o} to={p1} color={C.ochre} width={2.2} dashed />
                      <SvgLabel at={p1} color={C.ochre} dy={-10}>λφ(v)</SvgLabel>
                      <SvgArrow from={o} to={p2} color={C.green} width={2.2} dashed />
                      <SvgLabel at={p2} color={C.green} dy={16}>μψ(v)</SvgLabel>
                      <SvgArrow from={o} to={pS} color={C.violet} width={3} />
                      <SvgPoint at={pS} color={C.violet} r={4.5} />
                      <SvgLabel at={pS} color={C.violet} dy={-14}>(λφ+μψ)(v)</SvgLabel>
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="选择 φ、ψ 与系数">
                <Presets
                  label="教材经典组合"
                  items={[
                    { label: '旋转 + 错切', onClick: () => { setPhiId('rot'); setPsiId('shear'); setLam(1); setMu(1); } },
                    { label: '2·proj_x − id = 反射', onClick: () => { setPhiId('proj'); setPsiId('scale'); setLam(2); setMu(-1); } },
                  ]}
                />
                <Presets label="映射 φ" items={primList.map((m) => ({ label: m.name, active: m.id === phiId, onClick: () => setPhiId(m.id) }))} />
                <Presets label="映射 ψ" items={primList.map((m) => ({ label: m.name, active: m.id === psiId, onClick: () => setPsiId(m.id) }))} />
                <SliderField label="系数 λ" value={lam} min={-2} max={2} step={0.2} color={C.ochre} onChange={setLam} />
                <SliderField label="系数 μ" value={mu} min={-2} max={2} step={0.2} color={C.green} onChange={setMu} />
                <VectorInput name="v" color={C.blue} value={v} onChange={(p) => setV(p as Vec2)} />
                <MathBox>
                  <Tex math={`(${fmt(lam)}\\,${phi.symbol} + ${fmt(mu)}\\,${psi.symbol})(\\boldsymbol{v}) = (${fmt(sumV[0])},\\; ${fmt(sumV[1])})`} block />
                </MathBox>
                <Note label="教材例 3.3">
                  全体线性映射 <Tex math="\operatorname{Hom}(V, W)" /> 按逐点加法与数乘自身构成线性空间；例如 <Tex math="2\operatorname{proj}_\ell - \mathrm{id} = \bm{\psi}_\ell" /> 恰好给出镜面反射。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'reflFromProj', label: '设置 φ = proj_x、λ = 2、μ = -1，观察如何合成反射效果' },
                  { id: 'noncommute', label: '切到“复合”标签页，体验 ψ ∘ φ ≠ φ ∘ ψ' },
                  { id: 'invDemo', label: '在“复合”标签页点击查看逆映射 φ⁻¹ 如何还原图形' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          wideStage
          stage={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Figure
                caption={<>先 <Tex math="\varphi" /> 后 <Tex math="\psi" />：<Tex math="(\psi \circ \varphi)(\boldsymbol{v}) = \psi(\varphi(\boldsymbol{v}))" /></>}
                legend={<><Swatch color={C.blue} label="原图" /><Swatch color={C.violet} label="ψ(φ(·))" /></>}
              >
                <Canvas2D range={3.5} aspect={1} handles={[{ id: 'v1', pos: v, color: C.blue, label: 'v', onChange: setV }]} ariaLabel="先φ后ψ">
                  {({ toSvg }) => {
                    const o = toSvg([0, 0]);
                    const curShape = F_SHAPE.map((p) => toSvg(animPoint(p, 'psi_phi')).join(',')).join(' ');
                    const origShape = F_SHAPE.map((p) => toSvg(p).join(',')).join(' ');
                    const mid = phi.apply(v);
                    const curV = animPoint(v, 'psi_phi');
                    const invV = showInv && phi.inv ? phi.inv(mid) : null;
                    return (
                      <g>
                        <polygon points={origShape} fill={C.blue} fillOpacity={0.1} stroke={C.blue} strokeDasharray="3 3" />
                        <polygon points={curShape} fill={C.violet} fillOpacity={0.2} stroke={C.violet} strokeWidth={2} />
                        <SvgArrow from={o} to={toSvg(v)} color={C.blue} width={2} />
                        <SvgArrow from={o} to={toSvg(mid)} color={C.ochre} width={1.6} dashed />
                        <SvgArrow from={o} to={toSvg(curV)} color={C.violet} width={2.8} />
                        {invV && <SvgPoint at={toSvg(invV)} color={C.green} r={5.5} />}
                      </g>
                    );
                  }}
                </Canvas2D>
              </Figure>

              <Figure
                caption={<>先 <Tex math="\psi" /> 后 <Tex math="\varphi" />：<Tex math="(\varphi \circ \psi)(\boldsymbol{v}) = \varphi(\psi(\boldsymbol{v}))" /></>}
                legend={<><Swatch color={C.blue} label="原图" /><Swatch color={C.accent} label="φ(ψ(·))" /></>}
              >
                <Canvas2D range={3.5} aspect={1} handles={[{ id: 'v2', pos: v, color: C.blue, label: 'v', onChange: setV }]} ariaLabel="先ψ后φ">
                  {({ toSvg }) => {
                    const o = toSvg([0, 0]);
                    const curShape = F_SHAPE.map((p) => toSvg(animPoint(p, 'phi_psi')).join(',')).join(' ');
                    const origShape = F_SHAPE.map((p) => toSvg(p).join(',')).join(' ');
                    const mid = psi.apply(v);
                    const curV = animPoint(v, 'phi_psi');
                    return (
                      <g>
                        <polygon points={origShape} fill={C.blue} fillOpacity={0.1} stroke={C.blue} strokeDasharray="3 3" />
                        <polygon points={curShape} fill={C.accent} fillOpacity={0.2} stroke={C.accent} strokeWidth={2} />
                        <SvgArrow from={o} to={toSvg(v)} color={C.blue} width={2} />
                        <SvgArrow from={o} to={toSvg(mid)} color={C.green} width={1.6} dashed />
                        <SvgArrow from={o} to={toSvg(curV)} color={C.accent} width={2.8} />
                      </g>
                    );
                  }}
                </Canvas2D>
              </Figure>
            </div>
          }
          side={
            <>
              <Panel title="复合次序与分步动画">
                <Presets
                  label="经典对比"
                  items={[
                    { label: '旋转 与 反射', onClick: () => { setPhiId('rot'); setPsiId('refl'); setStageT(2); } },
                    { label: '错切 与 比例', onClick: () => { setPhiId('shear'); setPsiId('scale'); setStageT(2); } },
                    { label: '投影 与 旋转', onClick: () => { setPhiId('proj'); setPsiId('rot'); setStageT(2); } },
                  ]}
                />
                <Presets label="映射 φ" items={primList.map((m) => ({ label: m.name, active: m.id === phiId, onClick: () => setPhiId(m.id) }))} />
                <Presets label="映射 ψ" items={primList.map((m) => ({ label: m.name, active: m.id === psiId, onClick: () => setPsiId(m.id) }))} />
                <SliderField label="分步进度 (0→1 第一步，1→2 第二步)" value={stageT} min={0} max={2} step={0.05} color={C.violet} onChange={setStageT} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" icon={<Play className="w-3.5 h-3.5" />} onClick={() => { setStageT(0); setPlaying(true); }}>
                    播放两步复合
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    active={showInv}
                    disabled={!phi.invertible}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => setShowInv((s) => !s)}
                  >
                    {phi.invertible ? '验证 φ⁻¹(φ(v)) = v' : 'φ 不可逆（投影丢信息）'}
                  </Button>
                </div>
                <Status tone={commutes ? 'ok' : 'warn'}>
                  {commutes ? (
                    <span>这两个映射碰巧可交换：<Tex math="\psi \circ \varphi = \varphi \circ \psi" />。</span>
                  ) : (
                    <span>
                      不可交换！<Tex math={`(\\psi\\circ\\varphi)(\\boldsymbol{v})=(${fmt(c1[0])},${fmt(c1[1])})`} />，而{' '}
                      <Tex math={`(\\varphi\\circ\\psi)(\\boldsymbol{v})=(${fmt(c2[0])},${fmt(c2[1])})`} />。
                    </span>
                  )}
                </Status>
                <Note>注意复合的书写顺序：ψ ∘ φ 表示先作用右边的 φ，再作用左边的 ψ。这也正是第 4 章矩阵乘法不满足交换律的根源。</Note>
              </Panel>

              <Tasks
                done={done}
                items={[
                  { id: 'reflFromProj', label: '在“线性运算”标签页验证 2·proj_x − id 合成反射' },
                  { id: 'noncommute', label: '在“复合”标签页对比旋转与反射的两种次序，确认结果不同' },
                  { id: 'invDemo', label: '点击“验证 φ⁻¹(φ(v)) = v”，并切换到 proj_x 观察不可逆提示' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
