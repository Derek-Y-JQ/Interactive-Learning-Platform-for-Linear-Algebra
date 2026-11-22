import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, SliderField, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { computeRref, fmt, mulMat2Vec, nullspaceBasis, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

export const Ch03KernelImageLab: React.FC = () => {
  const [tab, setTab] = useState<'kerim' | 'dual'>('kerim');
  const [A, setA] = useState<Mat2>([
    [1, 2],
    [0.5, 1],
  ]);
  const [x, setX] = useState<Vec2>([1.5, 0.5]);
  const [slide, setSlide] = useState(0);
  const [slid, setSlid] = useState(0);
  const [f, setF] = useState<Vec2>([1, 0.6]);
  const [v, setV] = useState<Vec2>([1.6, 1.2]);

  const y = mulMat2Vec(A, x);
  const { rank } = computeRref(A);
  const nb = nullspaceBasis(A);
  const k = nb[0] ? (nb[0].map((t) => t / Math.hypot(nb[0][0], nb[0][1])) as Vec2) : null;
  const a1: Vec2 = [A[0][0], A[1][0]];
  const a2: Vec2 = [A[0][1], A[1][1]];
  const fv = f[0] * v[0] + f[1] * v[1];

  const done = useLatch({
    rank1: tab === 'kerim' && rank === 1,
    slide: tab === 'kerim' && rank === 1 && slid > 2,
    iso: tab === 'kerim' && rank === 2,
    zero: tab === 'kerim' && rank === 0,
    f3: tab === 'dual' && Math.abs(fv - 3) < 0.05,
    ker: tab === 'dual' && Math.abs(fv) < 0.03 && Math.hypot(v[0], v[1]) > 1,
  });

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
              <Figure caption="陪域 W：拖动 Ae₁, Ae₂ 即改写 A" legend={<Swatch color={C.green} label="im φ" />}>
                <Canvas2D
                  range={3.5}
                  aspect={1}
                  ariaLabel="陪域"
                  handles={[
                    { id: 'a1', pos: a1, color: C.ochre, label: 'Ae₁', onChange: (p) => setA([[p[0], A[0][1]], [p[1], A[1][1]]]) },
                    { id: 'a2', pos: a2, color: C.ink2, label: 'Ae₂', onChange: (p) => setA([[A[0][0], p[0]], [A[1][0], p[1]]]) },
                  ]}
                >
                  {({ toSvg, line, width, height }) => {
                    const o = toSvg([0, 0]);
                    const dir = Math.hypot(a1[0], a1[1]) > 1e-6 ? a1 : a2;
                    return (
                      <g>
                        {rank === 2 && <rect width={width} height={height} fill={C.green} fillOpacity={0.07} />}
                        {rank === 1 && <line {...line([0, 0], dir)} stroke={C.green} strokeWidth={3} strokeOpacity={0.7} />}
                        <SvgArrow from={o} to={toSvg(a1)} color={C.ochre} width={1.8} dashed />
                        <SvgArrow from={o} to={toSvg(a2)} color={C.ink2} width={1.8} dashed />
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
              <Panel title="线性映射 φ(x) = Ax">
                <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} colColors={[C.ochre, C.ink2]} />
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
                <MathBox>
                  <Tex block math={`\\dim\\operatorname{im}\\varphi + \\dim\\ker\\varphi = ${rank} + ${2 - rank} = 2`} />
                  <Tex block math={`\\varphi(\\bm x) = (${fmt(y[0])},\\ ${fmt(y[1])})^{\\top}`} />
                </MathBox>
                <Status tone={rank === 2 ? 'ok' : 'info'}>
                  {rank === 2 ? 'φ 是同构：ker φ = {0}，im φ = W。' : rank === 1 ? '秩 1：每条与核平行的直线（陪集）被压成 im φ 上的一个点。' : '零映射：ker φ = V。'}
                </Status>
                <Presets
                  items={[
                    { label: '秩 1', onClick: () => setA([[1, 2], [0.5, 1]]) },
                    { label: '投影到 x 轴', onClick: () => setA([[1, 0], [0, 0]]) },
                    { label: '同构', onClick: () => setA([[1.2, -0.6], [0.5, 1.1]]) },
                    { label: '零映射', onClick: () => setA([[0, 0], [0, 0]]) },
                  ]}
                />
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'rank1', label: '在右图拖动 Ae₂ 使它与 Ae₁ 共线，得到秩 1 映射。' },
                  { id: 'slide', label: '秩 1 时，用滑块让 x 沿陪集移动，确认 φ(x) 不动。' },
                  { id: 'iso', label: '恢复为同构（秩 2）。' },
                  { id: 'zero', label: '构造零映射。' },
                ]}
              />
              <Note label="定理">
                <Tex math="V/\ker\varphi \cong \operatorname{im}\varphi" />：陪集 <Tex math="\bm x + \ker\varphi" /> 与像中的点一一对应。
              </Note>
            </>
          }
        />
      ) : (
        <LabGrid
          stage={
            <Figure
              caption="f 的等值线 f = c（c 取整数）；v 穿过的条数就是 f(v)。"
              legend={<><Swatch color={C.violet} label="ker f" /><Swatch color={C.blue} label="v" /></>}
            >
              <Canvas2D
                range={4}
                ariaLabel="线性泛函等值线"
                handles={[
                  { id: 'v', pos: v, color: C.blue, label: 'v', onChange: setV },
                  { id: 'f', pos: f, color: C.violet, label: 'f 的梯度', onChange: setF },
                ]}
              >
                {({ toSvg, line, view }) => {
                  const o = toSvg([0, 0]);
                  const n2 = f[0] * f[0] + f[1] * f[1];
                  const els: React.ReactNode[] = [];
                  if (n2 > 0.01) {
                    const cs = [view.xmin * f[0], view.xmax * f[0]].sort((a, b) => a - b);
                    const ds = [view.ymin * f[1], view.ymax * f[1]].sort((a, b) => a - b);
                    const lo = Math.floor(cs[0] + ds[0]);
                    const hi = Math.ceil(cs[1] + ds[1]);
                    for (let c = lo; c <= hi && hi - lo < 200; c++) {
                      const p: Vec2 = [(c * f[0]) / n2, (c * f[1]) / n2];
                      els.push(
                        <line key={c} {...line(p, [-f[1], f[0]])} stroke={C.violet} strokeOpacity={c === 0 ? 0.9 : 0.28} strokeWidth={c === 0 ? 2.2 : 1.1} />
                      );
                      const lp = toSvg(p);
                      if (c !== 0 && Math.abs(c) <= 8) els.push(<text key={`t${c}`} x={lp[0] + 4} y={lp[1] - 4} className="fig-tick" fill={C.violet}>{c}</text>);
                    }
                  }
                  return (
                    <g>
                      {els}
                      <SvgArrow from={o} to={toSvg(f)} color={C.violet} width={2} dashed />
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
                <VectorInput name="f" color={C.violet} value={f} onChange={(p) => setF(p as Vec2)} />
                <VectorInput name="v" color={C.blue} value={v} onChange={(p) => setV(p as Vec2)} />
                <MathBox>
                  <Tex block math={`f(x,y) = ${fmt(f[0])}x ${f[1] >= 0 ? '+' : '-'} ${fmt(Math.abs(f[1]))}y,\\qquad f(\\bm v) = ${fmt(fv)}`} />
                </MathBox>
                <p className="text-[14px] text-ink-2">
                  f 越“大”，等值线越密。f 加倍时等值线间距减半——对偶空间中的伸缩与 V 中的伸缩方向相反。
                </p>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'f3', label: '移动 v，使 f(v) = 3。' },
                  { id: 'ker', label: '找一个长度大于 1 的 v，使 f(v) = 0。' },
                ]}
              />
              <Note>粗线是 ker f，它是 V 中的超平面（这里是直线）；不同的 f 若核相同，则只相差一个非零倍数。</Note>
            </>
          }
        />
      )}
    </div>
  );
};
