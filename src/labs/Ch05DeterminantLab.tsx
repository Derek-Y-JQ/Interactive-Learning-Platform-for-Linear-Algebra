import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, Toggle, useLatch } from '../components/ui';
import { det2, fmt, invMat2, mat2ToTex, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

const lerpM = (A: Mat2, t: number): Mat2 => [
  [1 + (A[0][0] - 1) * t, A[0][1] * t],
  [A[1][0] * t, 1 + (A[1][1] - 1) * t],
];

// An asymmetric glyph ("F") so reflections are visible
const GLYPH: Vec2[] = [
  [0.2, 0.15],
  [0.2, 0.85],
  [0.7, 0.85],
  [0.7, 0.72],
  [0.34, 0.72],
  [0.34, 0.55],
  [0.6, 0.55],
  [0.6, 0.42],
  [0.34, 0.42],
  [0.34, 0.15],
];

export const Ch05DeterminantLab: React.FC = () => {
  const [A, setA] = useState<Mat2>([
    [2, 0.6],
    [0.4, 1.5],
  ]);
  const [t, setT] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const n = Math.min(1, ((now - start) / 1000) * 0.4);
      setT(n);
      if (n >= 1) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const M = lerpM(A, t);
  const d = det2(M);
  const dA = det2(A);
  const col = (m: Mat2, j: 0 | 1): Vec2 => [m[0][j], m[1][j]];
  const tone = Math.abs(d) < 0.03 ? C.gray : d > 0 ? C.blue : C.red;
  const inv = invMat2(A);
  const adj: Mat2 = [
    [A[1][1], -A[0][1]],
    [-A[1][0], A[0][0]],
  ];
  const orth = Math.abs(A[0][0] * A[0][1] + A[1][0] * A[1][1]) < 0.03 && Math.abs(Math.hypot(A[0][0], A[1][0]) - 1) < 0.03;

  // det along the straight path I → A is a quadratic in t; find sign changes
  const samples = Array.from({ length: 61 }, (_, k) => det2(lerpM(A, k / 60)));
  const crosses = samples.some((v, k) => k > 0 && Math.sign(v) !== Math.sign(samples[k - 1]) && Math.abs(v) > 1e-9);

  const done = useLatch({
    zero: t === 1 && Math.abs(dA) < 0.02 && Math.hypot(A[0][0], A[1][0]) > 0.3 && Math.hypot(A[0][1], A[1][1]) > 0.3,
    neg: t === 1 && dA < -0.3,
    shear: t === 1 && Math.abs(dA - 1) < 0.02 && !orth && Math.abs(A[0][1]) + Math.abs(A[1][0]) > 0.3,
    cross: crosses && dA < 0 && t > 0.05 && t < 0.95 && Math.abs(d) < 0.05,
  });

  const setCol = (j: 0 | 1, p: Vec2) => {
    const n: Mat2 = [[...A[0]], [...A[1]]] as Mat2;
    n[0][j] = p[0];
    n[1][j] = p[1];
    setA(n);
    setT(1);
  };

  // sparkline geometry
  const W = 260;
  const H = 64;
  const maxAbs = Math.max(1, ...samples.map(Math.abs));
  const sy = (v: number) => H / 2 - (v / maxAbs) * (H / 2 - 6);
  const spark = samples.map((v, k) => `${(k / 60) * W},${sy(v)}`).join(' ');

  return (
    <LabGrid
      stage={
        <Figure
          caption={<>显示 M(t) = (1 − t)I + tA。拖动列向量即改写 A；拖动 t 从恒等变换连续过渡。</>}
          legend={
            <>
              <Swatch color={C.blue} label="det > 0" />
              <Swatch color={C.red} label="det < 0" />
            </>
          }
        >
          <Canvas2D
            range={3}
            handles={[
              { id: 'a1', pos: col(A, 0), color: C.blue, label: 'Ae₁', onChange: (p) => setCol(0, p) },
              { id: 'a2', pos: col(A, 1), color: C.green, label: 'Ae₂', onChange: (p) => setCol(1, p) },
            ]}
          >
            {({ toSvg, view }) => {
              const o = toSvg([0, 0]);
              const els: React.ReactNode[] = [];
              if (showGrid) {
                const R = Math.ceil(Math.max(Math.abs(view.xmin), Math.abs(view.xmax), Math.abs(view.ymin), Math.abs(view.ymax)) * 1.5) + 2;
                for (let k = -R; k <= R && R < 60; k++) {
                  const a = toSvg(mulMat2Vec(M, [k, -R]));
                  const b = toSvg(mulMat2Vec(M, [k, R]));
                  const c = toSvg(mulMat2Vec(M, [-R, k]));
                  const e = toSvg(mulMat2Vec(M, [R, k]));
                  els.push(<line key={`v${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={tone} strokeOpacity={k === 0 ? 0.5 : 0.16} />);
                  els.push(<line key={`h${k}`} x1={c[0]} y1={c[1]} x2={e[0]} y2={e[1]} stroke={tone} strokeOpacity={k === 0 ? 0.5 : 0.16} />);
                }
              }
              const sq = ([[0, 0], [1, 0], [1, 1], [0, 1]] as Vec2[]).map((p) => toSvg(mulMat2Vec(M, p)).join(',')).join(' ');
              const glyph = GLYPH.map((p) => toSvg(mulMat2Vec(M, p)).join(',')).join(' ');
              const c1 = toSvg(col(M, 0));
              const c2 = toSvg(col(M, 1));
              return (
                <g>
                  {els}
                  <polygon points={sq} fill={tone} fillOpacity={0.18} stroke={tone} strokeWidth={2} />
                  <polygon points={glyph} fill={C.ink} fillOpacity={0.75} />
                  <SvgArrow from={o} to={c1} color={C.blue} width={2.8} />
                  <SvgArrow from={o} to={c2} color={C.green} width={2.8} />
                  {t < 1 && <SvgLabel at={c1} color={C.blue} size={14} dy={18}>M(t)e₁</SvgLabel>}
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
              <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => { setA(m as Mat2); setT(1); }} colColors={[C.blue, C.green]} />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <SliderField label="过渡参数 t" value={t} min={0} max={1} step={0.01} onChange={(v) => { setPlaying(false); setT(v); }} />
              </div>
              <Button
                size="sm"
                variant="primary"
                className="mb-1"
                onClick={() => {
                  if (!playing) setT(0);
                  setPlaying((p) => !p);
                }}
                icon={playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              >
                {playing ? '暂停' : 'I → A'}
              </Button>
            </div>
            <div>
              <div className="flex justify-between text-[13px] text-ink-3 mb-1">
                <span>det M(t)，t 从 0 到 1</span>
                <span className="font-mono">{crosses ? '途中穿过 0' : '不变号'}</span>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16 bg-paper border border-rule rounded-[3px]" aria-hidden="true">
                <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={C.ruleStrong} />
                <polyline points={spark} fill="none" stroke={C.ink2} strokeWidth={1.5} />
                <line x1={t * W} y1={0} x2={t * W} y2={H} stroke={C.accent} strokeWidth={1} />
                <circle cx={t * W} cy={sy(d)} r={3.5} fill={tone} />
              </svg>
            </div>
            <Toggle checked={showGrid} onChange={setShowGrid}>显示变换后的网格</Toggle>
            <MathBox tone={Math.abs(d) < 0.03 ? 'warn' : 'neutral'}>
              <Tex block math={`\\det M(t) = ${fmt(d)},\\qquad \\det A = ${fmt(dA)}`} />
              <Tex block math={`A^{*} = ${mat2ToTex(adj)}${inv ? `,\\quad A^{-1} = \\tfrac{1}{\\det A}A^{*} = ${mat2ToTex(inv)}` : ''}`} />
            </MathBox>
            <Status tone={Math.abs(dA) < 0.03 ? 'warn' : 'info'}>
              {Math.abs(dA) < 0.03
                ? 'A 奇异：平面被压到一条直线（或一点），不可逆。'
                : dA > 0
                ? `A 保持定向，面积放大 ${fmt(Math.abs(dA))} 倍。`
                : `A 翻转定向（看字母 F 被镜像），面积放大 ${fmt(Math.abs(dA))} 倍。`}
            </Status>
            <Presets
              items={[
                { label: '剪切', onClick: () => { setA([[1, 1.2], [0, 1]]); setT(1); } },
                { label: '交换两列', onClick: () => { setA([[A[0][1], A[0][0]], [A[1][1], A[1][0]]]); setT(1); } },
                { label: '反射', onClick: () => { setA([[1, 0], [0, -1]]); setT(1); } },
                { label: '奇异', onClick: () => { setA([[2, 1], [1, 0.5]]); setT(1); } },
              ]}
            />
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'zero', label: '拖动列向量使 det A = 0（两列都不为零）。' },
              { id: 'neg', label: '构造 det A < 0 的矩阵。' },
              { id: 'shear', label: '构造 det A = 1 但不是旋转的矩阵。' },
              { id: 'cross', label: '对 det A < 0 的 A，拖动 t 找到面积恰为 0 的时刻。' },
            ]}
          />
          <Note>任何从 I 连续变到 det A &lt; 0 的路径都必须经过一个奇异矩阵：可逆矩阵按行列式符号分成两个连通分支。</Note>
        </>
      }
    />
  );
};
