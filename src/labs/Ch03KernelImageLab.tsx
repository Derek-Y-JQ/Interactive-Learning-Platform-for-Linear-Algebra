import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, Segmented, SliderField, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { computeRref, fmt, nullspaceBasis, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

const fmtLinearTerm = (a: number, b: number) => {
  const parts: string[] = [];
  if (Math.abs(a) > 1e-6) parts.push(Math.abs(a - 1) < 1e-6 ? 'x' : Math.abs(a + 1) < 1e-6 ? '-x' : `${fmt(a)}x`);
  if (Math.abs(b) > 1e-6) {
    const sign = parts.length > 0 ? (b > 0 ? ' + ' : ' - ') : b < 0 ? '-' : '';
    const absB = Math.abs(b);
    parts.push(`${sign}${Math.abs(absB - 1) < 1e-6 ? 'y' : `${fmt(absB)}y`}`);
  }
  return parts.length ? parts.join('') : '0';
};

export const Ch03KernelImageLab: React.FC = () => {
  const [tab, setTab] = useState<'kerim' | 'dual'>('kerim');
  // Pure basis-image representation: φ(e₁) = w₁, φ(e₂) = w₂ (no matrix notation in Chapter 3!)
  const [w1, setW1] = useState<Vec2>([1, 0.5]);
  const [w2, setW2] = useState<Vec2>([2, 1]);
  const [x, setX] = useState<Vec2>([1.5, 0.5]);
  const [slide, setSlide] = useState(0);
  const [slid, setSlid] = useState(0);
  const [f, setF] = useState<Vec2>([1, 0.6]);
  const [v, setV] = useState<Vec2>([1.6, 1.2]);

  const y: Vec2 = [x[0] * w1[0] + x[1] * w2[0], x[0] * w1[1] + x[1] * w2[1]];
  // Internal helper matrix only for computing rank/kernel (never shown as matrix to learner)
  const internalMat: Mat2 = [
    [w1[0], w2[0]],
    [w1[1], w2[1]],
  ];
  const { rank } = computeRref(internalMat);
  const nb = nullspaceBasis(internalMat);
  const k = nb[0] ? (nb[0].map((t) => t / Math.hypot(nb[0][0], nb[0][1])) as Vec2) : null;
  const fv = f[0] * v[0] + f[1] * v[1];

  const done = useLatch({
    rank1: tab === 'kerim' && rank === 1,
    slide: tab === 'kerim' && rank === 1 && slid > 2,
    iso: tab === 'kerim' && rank === 2,
    zero: tab === 'kerim' && rank === 0,
    f3: tab === 'dual' && Math.abs(fv - 3) < 0.05,
    ker: tab === 'dual' && Math.abs(fv) < 0.03 && Math.hypot(v[0], v[1]) > 1,
  });

  const ruleTex = `\\varphi(x, y) = x\\,\\varphi(\\boldsymbol{e}_1) + y\\,\\varphi(\\boldsymbol{e}_2) = \\bigl(${fmtLinearTerm(w1[0], w2[0])},\\; ${fmtLinearTerm(w1[1], w2[1])}\\bigr)`;

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="实验模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'kerim', label: '像与核、商空间' },
          { value: 'dual', label: '对偶空间与等值线' },
        ]}
      />

      {tab === 'kerim' ? (
        <LabGrid
          wideStage
          stage={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Figure caption={<>定义域 V：拖动 <i className="font-serif">x</i></>} legend={<><Swatch color={C.red} label="ker φ" /><Swatch color={C.violet} dashed label="x + ker φ" /></>}>
                <Canvas2D range={3.5} aspect={1} handles={[{ id: 'x', pos: x, color: C.blue, label: 'x', onChange: setX }]} ariaLabel="定义域">
                  {({ toSvg, line, width, height }) => {
                    const o = toSvg([0, 0]);
                    return (
                      <g>
                        {rank === 0 && <rect width={width} height={height} fill={C.red} fillOpacity={0.08} />}
                        {k && rank === 1 && (
                          <>
                            <line {...line([0, 0], k)} stroke={C.red} strokeWidth={2.5} />
                            <line {...line(x, k)} stroke={C.violet} strokeWidth={1.6} strokeDasharray="6 4" />
                          </>
                        )}
                        <SvgArrow from={o} to={toSvg(x)} color={C.blue} width={2.6} />
                      </g>
                    );
                  }}
                </Canvas2D>
              </Figure>
              <Figure caption="陪域 W：拖动基向量像 φ(e₁), φ(e₂) 即确定映射 φ" legend={<Swatch color={C.green} label="im φ" />}>
                <Canvas2D
                  range={3.5}
                  aspect={1}
                  ariaLabel="陪域"
                  handles={[
                    { id: 'w1', pos: w1, color: C.ochre, label: 'φ(e₁)', onChange: setW1 },
                    { id: 'w2', pos: w2, color: C.ink2, label: 'φ(e₂)', onChange: setW2 },
                  ]}
                >
                  {({ toSvg, line, width, height }) => {
                    const o = toSvg([0, 0]);
                    const dir = Math.hypot(w1[0], w1[1]) > 1e-6 ? w1 : w2;
                    return (
                      <g>
                        {rank === 2 && <rect width={width} height={height} fill={C.green} fillOpacity={0.07} />}
                        {rank === 1 && <line {...line([0, 0], dir)} stroke={C.green} strokeWidth={3} strokeOpacity={0.7} />}
                        <SvgArrow from={o} to={toSvg(w1)} color={C.ochre} width={1.8} dashed />
                        <SvgArrow from={o} to={toSvg(w2)} color={C.ink2} width={1.8} dashed />
                        <SvgArrow from={o} to={toSvg(y)} color={C.violet} width={2.8} />
                        <SvgPoint at={toSvg(y)} color={C.violet} r={4} />
                        <SvgLabel at={toSvg(y)} color={C.violet} dy={18}>φ(x)</SvgLabel>
                      </g>
                    );
                  }}
                </Canvas2D>
              </Figure>
            </div>
          }
          side={
            <>
              <Panel title="由基像唯一确定线性映射 φ">
                <VectorInput name="φ(e₁)" color={C.ochre} value={w1} onChange={(p) => setW1(p as Vec2)} />
                <VectorInput name="φ(e₂)" color={C.ink2} value={w2} onChange={(p) => setW2(p as Vec2)} />
                <MathBox>
                  <Tex math={ruleTex} block />
                </MathBox>
                <VectorInput name="x" color={C.blue} value={x} onChange={(p) => setX(p as Vec2)} />
                {k && rank === 1 && (
                  <SliderField
                    label="沿 ker φ 平移 x"
                    value={slide}
                    min={-3}
                    max={3}
                    step={0.1}
                    color={C.violet}
                    onChange={(t) => {
                      const dt = t - slide;
                      setX([x[0] + dt * k[0], x[1] + dt * k[1]]);
                      setSlide(t);
                      setSlid((s) => s + Math.abs(dt));
                    }}
                  />
                )}
                <Presets
                  items={[
                    { label: '压缩到直线（秩 1）', onClick: () => { setW1([1, 0.5]); setW2([2, 1]); } },
                    { label: '向 x 轴投影', onClick: () => { setW1([1, 0]); setW2([0, 0]); } },
                    { label: '可逆同构（秩 2）', onClick: () => { setW1([1.5, 0.4]); setW2([-0.5, 1.4]); } },
                    { label: '零映射（秩 0）', onClick: () => { setW1([0, 0]); setW2([0, 0]); } },
                  ]}
                />
              </Panel>

              <Panel title="秩–零化度定理">
                <MathBox>
                  <Tex math={`\\dim(\\operatorname{im}\\varphi) + \\dim(\\ker\\varphi) = ${rank} + ${2 - rank} = 2 = \\dim V`} block />
                  <Tex math={`\\varphi(\\boldsymbol{x}) = (${fmt(y[0])},\\; ${fmt(y[1])})`} block />
                </MathBox>
                <Status tone={rank === 2 ? 'ok' : 'info'}>
                  {rank === 2 && 'ker φ = {0}：单射且满射，即线性同构。'}
                  {rank === 1 && '一整条紫色陪集 x + ker φ 被压成陪域中同一个点 φ(x)（第一同构定理：V/ker φ ≅ im φ）。'}
                  {rank === 0 && '零映射把整个定义域压成原点。'}
                </Status>
                <Note label="基像定理">
                  线性映射只要给定一组基的像 <Tex math="\varphi(\boldsymbol{e}_1), \varphi(\boldsymbol{e}_2)" /> 就被完全确定，尚无需借助矩阵记号。
                </Note>
              </Panel>

              <Tasks
                done={done}
                items={[
                  { id: 'rank1', label: '在“秩 1”映射下拖动 x 离开核，观察紫色虚线陪集 x + ker φ' },
                  { id: 'slide', label: '拖动“沿 ker φ 平移 x”滑块，确认陪域中的像 φ(x) 纹丝不动' },
                  { id: 'iso', label: '使 φ(e₁) 与 φ(e₂) 线性无关（秩 2），观察核缩为原点、像铺满陪域' },
                  { id: 'zero', label: '切换到零映射，验证 0 + 2 = 2' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          stage={
            <Figure
              caption="线性泛函 f(v) = a x + b y 的几何形象是一族等间距平行等值线，深红线是零核 ker f。"
              legend={<><Swatch color={C.red} label="ker f (f = 0)" /><Swatch color={C.blue} label="v" /></>}
            >
              <Canvas2D
                range={4}
                handles={[{ id: 'v', pos: v, color: C.blue, label: 'v', onChange: setV }]}
                ariaLabel="对偶泛函等值线"
              >
                {({ toSvg, line }) => {
                  const o = toSvg([0, 0]);
                  const n2 = f[0] * f[0] + f[1] * f[1];
                  const dir: Vec2 = [-f[1], f[0]];
                  const lines: React.ReactNode[] = [];
                  if (n2 > 1e-6) {
                    for (let c = -6; c <= 6; c++) {
                      const base: Vec2 = [(c * f[0]) / n2, (c * f[1]) / n2];
                      const isZero = c === 0;
                      lines.push(
                        <line
                          key={c}
                          {...line(base, dir)}
                          stroke={isZero ? C.red : C.violet}
                          strokeWidth={isZero ? 2.4 : 1.1}
                          strokeOpacity={isZero ? 0.9 : 0.45}
                        />
                      );
                      if (Math.abs(c) <= 4) {
                        lines.push(
                          <SvgLabel key={`l${c}`} at={toSvg(base)} color={isZero ? C.red : C.violet} size={11} dy={-4}>
                            {c}
                          </SvgLabel>
                        );
                      }
                    }
                  }
                  return (
                    <g>
                      {lines}
                      <SvgArrow from={o} to={toSvg(v)} color={C.blue} width={2.8} />
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="线性泛函 f ∈ V*">
                <SliderField label="a（x 的系数）" value={f[0]} min={-2} max={2} step={0.1} color={C.violet} onChange={(val) => setF([val, f[1]])} />
                <SliderField label="b（y 的系数）" value={f[1]} min={-2} max={2} step={0.1} color={C.violet} onChange={(val) => setF([f[0], val])} />
                <VectorInput name="v" color={C.blue} value={v} onChange={(p) => setV(p as Vec2)} />
                <MathBox>
                  <Tex math={`f(x,y) = ${fmtLinearTerm(f[0], f[1])}`} block />
                  <Tex math={`f(\\boldsymbol{v}) = ${fmt(fv)}`} block />
                </MathBox>
                <Note>线性泛函把向量“数”成实数：每穿过一条等值线，f(v) 就增加 1。</Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'f3', label: '拖动 v 落在等值线 f(v) = 3 上' },
                  { id: 'ker', label: '将非零向量 v 拖入 ker f（红色直线 f = 0）' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
