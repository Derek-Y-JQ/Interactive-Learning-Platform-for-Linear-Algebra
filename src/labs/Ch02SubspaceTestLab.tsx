import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { fmt, type Vec2 } from '../utils/math';
import { C } from '../theme';

type SubsetId = 'line0' | 'affine' | 'quad1' | 'axes' | 'disk' | 'parabola';

interface SubsetDef {
  id: SubsetId;
  name: string;
  formula: string;
  isSubspace: boolean;
  hasZero: boolean;
  contains: (p: Vec2) => boolean;
  constrain: (p: Vec2) => Vec2;
  initU: Vec2;
  initV: Vec2;
  initLam: number;
  note: string;
}

const EPS = 0.06;

const SUBSETS: SubsetDef[] = [
  {
    id: 'line0',
    name: '过原点直线',
    formula: 'W = \\{(x,y) \\in \\mathbb{R}^2 \\mid y = 0.6x\\}',
    isSubspace: true,
    hasZero: true,
    contains: ([x, y]) => Math.abs(y - 0.6 * x) < EPS,
    constrain: ([x]) => {
      const cx = Math.max(-2.6, Math.min(2.6, x));
      return [cx, 0.6 * cx];
    },
    initU: [1.5, 0.9],
    initV: [-1.0, -0.6],
    initLam: -1.2,
    note: '含零向量，且对加法与数乘均封闭，是 ℝ² 的一维子空间。',
  },
  {
    id: 'affine',
    name: '不过原点直线',
    formula: 'S = \\{(x,y) \\in \\mathbb{R}^2 \\mid y = 0.5x + 1\\}',
    isSubspace: false,
    hasZero: false,
    contains: ([x, y]) => Math.abs(y - (0.5 * x + 1)) < EPS,
    constrain: ([x]) => {
      const cx = Math.max(-2.6, Math.min(2.6, x));
      return [cx, 0.5 * cx + 1];
    },
    initU: [-1.0, 0.5],
    initV: [1.2, 1.6],
    initLam: 1.5,
    note: '不含零向量 (0,0)，且任意两向量之和、非 1 倍数乘都会离开该直线。',
  },
  {
    id: 'quad1',
    name: '第一象限',
    formula: 'S = \\{(x,y) \\in \\mathbb{R}^2 \\mid x \\ge 0,\\; y \\ge 0\\}',
    isSubspace: false,
    hasZero: true,
    contains: ([x, y]) => x >= -EPS && y >= -EPS,
    constrain: ([x, y]) => [Math.max(0, Math.min(3, x)), Math.max(0, Math.min(3, y))],
    initU: [1.6, 0.8],
    initV: [0.6, 1.8],
    initLam: -0.8,
    note: '含零向量且对加法封闭，但取负标量 λ < 0 时 λu 落入第三象限，数乘不封闭。',
  },
  {
    id: 'axes',
    name: '两坐标轴之并',
    formula: 'S = \\{(x,y) \\in \\mathbb{R}^2 \\mid xy = 0\\}',
    isSubspace: false,
    hasZero: true,
    contains: ([x, y]) => Math.abs(x) < EPS || Math.abs(y) < EPS,
    constrain: ([x, y]) => (Math.abs(x) >= Math.abs(y) ? [Math.max(-3, Math.min(3, x)), 0] : [0, Math.max(-3, Math.min(3, y))]),
    initU: [2.0, 0],
    initV: [0, 1.6],
    initLam: -1.0,
    note: '含零向量且对数乘封闭，但 x 轴向量与 y 轴向量相加会跳到象限内部，加法不封闭。这说明子空间之并一般不是子空间。',
  },
  {
    id: 'disk',
    name: '闭圆盘',
    formula: 'S = \\{(x,y) \\in \\mathbb{R}^2 \\mid x^2 + y^2 \\le 4\\}',
    isSubspace: false,
    hasZero: true,
    contains: ([x, y]) => x * x + y * y <= 4 + 0.12,
    constrain: ([x, y]) => {
      const r = Math.hypot(x, y);
      return r > 2 ? [(x / r) * 2, (y / r) * 2] : [x, y];
    },
    initU: [1.6, 0.8],
    initV: [1.2, 1.2],
    initLam: 1.5,
    note: '虽然含零向量，但向量相加或放大倍数后会超出半径 2 的圆盘，加法与数乘均不封闭。',
  },
  {
    id: 'parabola',
    name: '抛物线',
    formula: 'S = \\{(x,y) \\in \\mathbb{R}^2 \\mid y = 0.5x^2\\}',
    isSubspace: false,
    hasZero: true,
    contains: ([x, y]) => Math.abs(y - 0.5 * x * x) < 0.09,
    constrain: ([x]) => {
      const cx = Math.max(-2.3, Math.min(2.3, x));
      return [cx, 0.5 * cx * cx];
    },
    initU: [1.4, 0.98],
    initV: [-1.0, 0.5],
    initLam: 1.6,
    note: '虽过原点，但二次曲线是弯曲的：u + v 和 λu 一般都不再落在抛物线上。',
  },
];

export const Ch02SubspaceTestLab: React.FC = () => {
  const [sid, setSid] = useState<SubsetId>('axes');
  const sub = SUBSETS.find((s) => s.id === sid)!;
  const [u, setU] = useState<Vec2>(sub.initU);
  const [v, setV] = useState<Vec2>(sub.initV);
  const [lam, setLam] = useState<number>(sub.initLam);

  const selectSubset = (id: SubsetId) => {
    const next = SUBSETS.find((s) => s.id === id)!;
    setSid(id);
    setU(next.initU);
    setV(next.initV);
    setLam(next.initLam);
  };

  const sum: Vec2 = [u[0] + v[0], u[1] + v[1]];
  const scaled: Vec2 = [lam * u[0], lam * u[1]];

  const addIn = sub.contains(sum);
  const scaleIn = sub.contains(scaled);

  const done = useLatch({
    valid: sid === 'line0' && addIn && scaleIn,
    failAdd: !sub.isSubspace && !addIn,
    failScale: !sub.isSubspace && !scaleIn,
    failZero: !sub.hasZero,
  });

  const renderRegion = (toSvg: (p: Vec2) => [number, number], line: (p: Vec2, d: Vec2) => { x1: number; y1: number; x2: number; y2: number }, scale: number, cx: number, cy: number, width: number) => {
    switch (sid) {
      case 'line0':
        return <line {...line([0, 0], [1, 0.6])} stroke={C.blue} strokeWidth={3.5} strokeOpacity={0.35} />;
      case 'affine':
        return <line {...line([0, 1], [1, 0.5])} stroke={C.blue} strokeWidth={3.5} strokeOpacity={0.35} />;
      case 'quad1': {
        const o = toSvg([0, 0]);
        return <rect x={o[0]} y={0} width={Math.max(0, width - o[0])} height={Math.max(0, o[1])} fill={C.blue} fillOpacity={0.11} stroke={C.blue} strokeOpacity={0.35} />;
      }
      case 'axes':
        return (
          <g stroke={C.blue} strokeWidth={4} strokeOpacity={0.35}>
            <line {...line([0, 0], [1, 0])} />
            <line {...line([0, 0], [0, 1])} />
          </g>
        );
      case 'disk':
        return <circle cx={cx} cy={cy} r={2 * scale} fill={C.blue} fillOpacity={0.11} stroke={C.blue} strokeWidth={2} strokeOpacity={0.5} />;
      case 'parabola': {
        const pts: string[] = [];
        for (let k = -40; k <= 40; k++) {
          const x = (k / 40) * 3.2;
          pts.push(toSvg([x, 0.5 * x * x]).join(','));
        }
        return <polyline points={pts.join(' ')} fill="none" stroke={C.blue} strokeWidth={3.2} strokeOpacity={0.45} />;
      }
    }
  };

  return (
    <LabGrid
      stage={
        <Figure
          caption="在集合 S 内拖动向量 u、v 并调节 λ，观察 u+v 与 λu 是否仍留在 S 中。"
          legend={
            <>
              <Swatch color={C.blue} label="u, v ∈ S" />
              <Swatch color={addIn ? C.green : C.red} label="u + v" />
              <Swatch color={scaleIn ? C.violet : C.ochre} dashed label="λu" />
            </>
          }
        >
          <Canvas2D
            range={3.5}
            handles={[
              { id: 'u', pos: u, color: C.blue, label: 'u', onChange: setU, constrain: sub.constrain },
              { id: 'v', pos: v, color: C.ink2, label: 'v', onChange: setV, constrain: sub.constrain },
            ]}
            ariaLabel="子空间判定画布"
          >
            {({ toSvg, line, scale, cx, cy, width }) => {
              const o = toSvg([0, 0]);
              const pU = toSvg(u);
              const pV = toSvg(v);
              const pSum = toSvg(sum);
              const pSc = toSvg(scaled);
              return (
                <g>
                  {renderRegion(toSvg, line, scale, cx, cy, width)}
                  {/* parallelogram guides for u + v */}
                  <line x1={pU[0]} y1={pU[1]} x2={pSum[0]} y2={pSum[1]} stroke={C.ruleStrong} strokeDasharray="4 3" />
                  <line x1={pV[0]} y1={pV[1]} x2={pSum[0]} y2={pSum[1]} stroke={C.ruleStrong} strokeDasharray="4 3" />

                  <SvgArrow from={o} to={pU} color={C.blue} width={2.6} />
                  <SvgArrow from={o} to={pV} color={C.ink2} width={2.4} />
                  <SvgArrow from={o} to={pSum} color={addIn ? C.green : C.red} width={2.8} />
                  <SvgPoint at={pSum} color={addIn ? C.green : C.red} r={4.5} />
                  <SvgLabel at={pSum} color={addIn ? C.green : C.red} dy={-12}>
                    u + v {addIn ? '∈ S' : '∉ S'}
                  </SvgLabel>

                  <SvgArrow from={o} to={pSc} color={scaleIn ? C.violet : C.ochre} width={2.4} dashed />
                  <SvgPoint at={pSc} color={scaleIn ? C.violet : C.ochre} r={4} />
                  <SvgLabel at={pSc} color={scaleIn ? C.violet : C.ochre} dy={16}>
                    λu {scaleIn ? '∈ S' : '∉ S'}
                  </SvgLabel>

                  {/* Origin check marker */}
                  <circle cx={o[0]} cy={o[1]} r={5} fill="none" stroke={sub.hasZero ? C.green : C.red} strokeWidth={2} />
                </g>
              );
            }}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel title="选择候选子集 S ⊆ ℝ²">
            <Presets
              label="典型集合"
              items={SUBSETS.map((s) => ({
                label: s.name,
                active: s.id === sid,
                onClick: () => selectSubset(s.id),
              }))}
            />
            <MathBox>
              <Tex math={sub.formula} block />
            </MathBox>
            <SliderField label={<>标量 <Tex math="\lambda" /></>} value={lam} min={-2} max={2} step={0.1} color={C.violet} onChange={setLam} />
          </Panel>

          <Panel title="子空间三条判据实时检验">
            <div className="space-y-2 text-[14px]">
              <Status tone={sub.hasZero ? 'ok' : 'warn'}>
                <span>1. 含零向量 <Tex math="\boldsymbol{0} \in S" />：{sub.hasZero ? '满足' : '不满足'}</span>
              </Status>
              <Status tone={addIn ? 'ok' : 'warn'}>
                <span>
                  2. 加法封闭 <Tex math={`\\boldsymbol{u}+\\boldsymbol{v}=(${fmt(sum[0])},\\,${fmt(sum[1])})`} />：
                  {addIn ? '当前留在 S 内' : '跳出 S！反例成立'}
                </span>
              </Status>
              <Status tone={scaleIn ? 'ok' : 'warn'}>
                <span>
                  3. 数乘封闭 <Tex math={`\\lambda\\boldsymbol{u}=(${fmt(scaled[0])},\\,${fmt(scaled[1])})`} />：
                  {scaleIn ? '当前留在 S 内' : '跳出 S！反例成立'}
                </span>
              </Status>
            </div>
            <Note label={sub.isSubspace ? '结论：是子空间' : '结论：不是子空间'}>{sub.note}</Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'valid', label: '在“过原点直线”上拖动 u, v 与 λ，验证三条判据始终成立' },
              { id: 'failZero', label: '切换到不含零向量的集合，观察原点如何暴露反例' },
              { id: 'failAdd', label: '在“两坐标轴之并”或“抛物线”中找到使 u + v ∉ S 的反例' },
              { id: 'failScale', label: '在“第一象限”或“闭圆盘”中调节 λ，找到使 λu ∉ S 的反例' },
            ]}
          />
        </>
      }
    />
  );
};
