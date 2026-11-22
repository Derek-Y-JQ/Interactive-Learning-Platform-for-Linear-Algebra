import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Status, Swatch, Tasks, Toggle, useLatch } from '../components/ui';
import { eigen2, fmt, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

const PRESETS: { name: string; A: Mat2 }[] = [
  { name: '对称', A: [[2, 1], [1, 2]] },
  { name: '一般可对角化', A: [[2, 1], [0, 1]] },
  { name: 'Jordan 块', A: [[1.5, 1], [0, 1.5]] },
  { name: '旋转缩放', A: [[0.8, -1.1], [1.1, 0.8]] },
  { name: '反射', A: [[0.6, 0.8], [0.8, -0.6]] },
];

const unit = (p: Vec2): Vec2 => {
  const n = Math.hypot(p[0], p[1]) || 1;
  return [p[0] / n, p[1] / n];
};

export const Ch07EigenExplorerLab: React.FC = () => {
  const [A, setA] = useState<Mat2>(PRESETS[0].A);
  const [theta, setTheta] = useState(0.35);
  const [sweeping, setSweeping] = useState(false);
  const [field, setField] = useState(true);
  const [editCols, setEditCols] = useState(false);
  const [iters, setIters] = useState<Vec2[]>([]);

  useEffect(() => {
    if (!sweeping) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setTheta((t) => (t + dt * 0.6) % (2 * Math.PI));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sweeping]);

  useEffect(() => setIters([]), [A]);

  const v: Vec2 = [Math.cos(theta), Math.sin(theta)];
  const Av = mulMat2Vec(A, v);
  const nAv = Math.hypot(Av[0], Av[1]);
  const sinDiff = nAv > 1e-6 ? Math.abs(v[0] * Av[1] - v[1] * Av[0]) / nAv : 0;
  const lock = sinDiff < 0.03;
  const lambda = v[0] * Av[0] + v[1] * Av[1];
  const eig = eigen2(A);
  const hit = (ev: Vec2) => Math.abs(v[0] * ev[1] - v[1] * ev[0]) < 0.03;
  const isScalar = Math.abs(A[0][1]) < 1e-9 && Math.abs(A[1][0]) < 1e-9 && Math.abs(A[0][0] - A[1][1]) < 1e-9;
  const defective = eig.isReal && eig.vectors.length === 1;

  // dominant eigenvector (if real & strictly dominant)
  const dom = eig.isReal && eig.vectors.length === 2 && Math.abs(Math.abs(eig.values[0].re) - Math.abs(eig.values[1].re)) > 1e-3
    ? eig.vectors[Math.abs(eig.values[0].re) > Math.abs(eig.values[1].re) ? 0 : 1]
    : null;
  const lastIt = iters[iters.length - 1];

  const done = useLatch({
    e1: eig.isReal && !isScalar && eig.vectors[0] !== undefined && hit(eig.vectors[0]),
    e2: eig.isReal && !isScalar && eig.vectors.length === 2 && hit(eig.vectors[1]),
    defective,
    complex: !eig.isReal,
    power: !!dom && !!lastIt && iters.length >= 4 && Math.abs(lastIt[0] * dom[1] - lastIt[1] * dom[0]) < 0.01,
  });

  const step = () => {
    setIters((it) => {
      const x = it.length ? it[it.length - 1] : v;
      const y = mulMat2Vec(A, x);
      const ny = Math.hypot(y[0], y[1]);
      if (ny < 1e-9) return it;
      return [...(it.length ? it : [x]), [y[0] / ny, y[1] / ny] as Vec2].slice(-40);
    });
  };

  const handles = [
    {
      id: 'v',
      pos: v,
      color: lock ? C.green : C.blue,
      label: 'v',
      hideCoords: true,
      onChange: (p: Vec2) => {
        setSweeping(false);
        setTheta(Math.atan2(p[1], p[0]));
      },
      constrain: (p: Vec2) => unit(p),
      snap: 0.0001,
    },
    ...(editCols
      ? [
          { id: 'c1', pos: [A[0][0], A[1][0]] as Vec2, color: C.ochre, label: 'Ae₁', onChange: (p: Vec2) => setA([[p[0], A[0][1]], [p[1], A[1][1]]]) },
          { id: 'c2', pos: [A[0][1], A[1][1]] as Vec2, color: C.ink2, label: 'Ae₂', onChange: (p: Vec2) => setA([[A[0][0], p[0]], [A[1][0], p[1]]]) },
        ]
      : []),
  ];

  return (
    <LabGrid
      stage={
        <Figure
          caption="单位圆上每一点 v 处的小箭头指向 Av 的方向；箭头沿径向时 v 是特征向量。"
          legend={
            <>
              <Swatch color={C.blue} label="v" />
              <Swatch color={C.violet} label="Av" />
              <Swatch color={C.green} dashed label="特征直线" />
            </>
          }
        >
          <Canvas2D range={3.2} handles={handles}>
            {({ toSvg, scale, cx, cy, line }) => {
              const o = toSvg([0, 0]);
              const ell: string[] = [];
              for (let k = 0; k <= 96; k++) {
                const t = (2 * Math.PI * k) / 96;
                ell.push(toSvg(mulMat2Vec(A, [Math.cos(t), Math.sin(t)])).join(','));
              }
              const arrows: React.ReactNode[] = [];
              if (field) {
                for (let k = 0; k < 36; k++) {
                  const t = (2 * Math.PI * k) / 36;
                  const p: Vec2 = [Math.cos(t), Math.sin(t)];
                  const d = unit(mulMat2Vec(A, p));
                  const a = toSvg(p);
                  const radial = Math.abs(p[0] * d[1] - p[1] * d[0]) < 0.06;
                  arrows.push(
                    <SvgArrow key={k} from={a} to={[a[0] + d[0] * 22, a[1] - d[1] * 22]} color={radial ? C.green : C.ink3} width={1.2} opacity={radial ? 1 : 0.6} />
                  );
                }
              }
              return (
                <g>
                  <circle cx={cx} cy={cy} r={scale} fill="none" stroke={C.ruleStrong} strokeWidth={1.2} />
                  <polygon points={ell.join(' ')} fill={C.violet} fillOpacity={0.05} stroke={C.violet} strokeOpacity={0.45} strokeWidth={1.3} />
                  {!isScalar && eig.vectors.map((ev, i) => <line key={i} {...line([0, 0], ev)} stroke={C.green} strokeOpacity={0.6} strokeWidth={1.6} strokeDasharray="7 5" />)}
                  {arrows}
                  {iters.map((p, i) => (
                    <g key={i}>
                      <SvgPoint at={toSvg(p)} color={C.accent} r={i === iters.length - 1 ? 5 : 3} />
                      {i > 0 && i < 8 && <SvgLabel at={toSvg(p)} color={C.accent} size={13} dx={6} dy={-6}>{`x${['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇'][i]}`}</SvgLabel>}
                    </g>
                  ))}
                  <SvgArrow from={o} to={toSvg(Av)} color={lock ? C.green : C.violet} width={2.8} />
                  <SvgArrow from={o} to={toSvg(v)} color={lock ? C.green : C.blue} width={2.8} />
                  <SvgLabel at={toSvg(Av)} color={lock ? C.green : C.violet}>Av</SvgLabel>
                </g>
              );
            }}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel title="矩阵">
            <div className="flex items-center gap-3">
              <Tex math="A =" />
              <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat2)} colColors={[C.ochre, C.ink2]} />
            </div>
            <div className="flex flex-wrap gap-x-5">
              <Toggle checked={field} onChange={setField}>方向场</Toggle>
              <Toggle checked={editCols} onChange={setEditCols} color={C.ochre}>在图中拖动列向量</Toggle>
            </div>
            <Presets items={PRESETS.map((p) => ({ label: p.name, onClick: () => setA(p.A) }))} />
          </Panel>

          <Panel
            title="扫描单位圆"
            actions={
              <Button size="sm" variant={sweeping ? 'secondary' : 'primary'} onClick={() => setSweeping((s) => !s)} icon={sweeping ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}>
                {sweeping ? '停止' : '自动扫描'}
              </Button>
            }
          >
            <Status tone={lock ? 'ok' : 'info'}>
              {lock ? `Av ∥ v：找到特征方向，λ ≈ ${fmt(lambda)}` : `v 与 Av 的夹角正弦 ${fmt(sinDiff, 3)}，θ = ${fmt((theta * 180) / Math.PI, 1)}°`}
            </Status>
            <MathBox>
              {eig.isReal ? (
                <Tex block math={`\\lambda_1 = ${fmt(eig.values[0].re)},\\quad \\lambda_2 = ${fmt(eig.values[1].re)}${defective ? '\\quad(\\text{几何重数 } 1)' : ''}`} />
              ) : (
                <Tex block math={`\\lambda = ${fmt(eig.values[0].re)} \\pm ${fmt(Math.abs(eig.values[0].im))}\\ii\\quad(\\text{无实特征方向})`} />
              )}
              <Tex block math={`\\operatorname{tr}A = ${fmt(A[0][0] + A[1][1])},\\quad \\det A = ${fmt(A[0][0] * A[1][1] - A[0][1] * A[1][0])}`} />
            </MathBox>
          </Panel>

          <Panel
            title="幂迭代 xₖ₊₁ = Axₖ / ‖Axₖ‖"
            actions={
              <>
                <Button size="sm" variant="primary" onClick={step} icon={<StepForward className="w-4 h-4" />}>一步</Button>
                <Button size="sm" variant="ghost" aria-label="清除迭代" onClick={() => setIters([])} icon={<RotateCcw className="w-4 h-4" />} />
              </>
            }
          >
            <p className="text-[14px] text-ink-2">
              从当前 v 出发。{iters.length > 1 ? `已迭代 ${iters.length - 1} 次。` : ''}
              {!eig.isReal ? ' 复特征值时迭代点绕圆旋转，不收敛。' : dom ? ' 迭代点收敛到 |λ| 较大的特征方向。' : ' 两个特征值模相同时不保证收敛。'}
            </p>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'e1', label: '拖动 v，命中第一个特征方向。' },
              { id: 'e2', label: '再命中第二个特征方向。' },
              { id: 'defective', label: '构造只有一条特征直线的矩阵（不可对角化）。' },
              { id: 'complex', label: '构造没有实特征方向的矩阵。' },
              { id: 'power', label: '用幂迭代收敛到主特征方向。' },
            ]}
          />
          <Note>特征值是特征多项式 λ² − (tr A)λ + det A 的根：判别式 (tr A)² − 4 det A &lt; 0 时没有实特征方向，方向场处处“打转”。</Note>
        </>
      }
    />
  );
};
