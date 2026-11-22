import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, Swatch, Tasks, useLatch } from '../components/ui';
import { det2, fmt, mat2ToTex, mulMat2Vec, svd2, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

const PRESETS: { name: string; A: Mat2 }[] = [
  { name: '一般', A: [[1.6, 0.8], [-0.4, 1.2]] },
  { name: '剪切', A: [[1, 1.3], [0, 1]] },
  { name: '对称', A: [[1.8, 0.6], [0.6, 1.2]] },
  { name: '含反射', A: [[0.4, 1.4], [1.2, 0.3]] },
  { name: '秩 1', A: [[1.5, 1], [0.75, 0.5]] },
];

const GLYPH: Vec2[] = [
  [-0.35, -0.55], [-0.35, 0.55], [0.4, 0.55], [0.4, 0.38], [-0.15, 0.38], [-0.15, 0.1], [0.28, 0.1], [0.28, -0.07], [-0.15, -0.07], [-0.15, -0.55],
];

export const Ch09SvdTheaterLab: React.FC = () => {
  const [A, setA] = useState<Mat2>(PRESETS[0].A);
  const [stage, setStage] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);

  const res = svd2(A);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const s = Math.min(3, ((now - start) / 1000) * 0.7);
      setStage(s);
      if (s >= 3) {
        setPlaying(false);
        setWatched(true);
      } else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const T = (p: Vec2, t: number): Vec2 => {
    const t1 = Math.max(0, Math.min(1, t));
    const t2 = Math.max(0, Math.min(1, t - 1));
    const t3 = Math.max(0, Math.min(1, t - 2));
    const a = res.thetaV * t1;
    const x1 = p[0] * Math.cos(a) - p[1] * Math.sin(a);
    const y1 = p[0] * Math.sin(a) + p[1] * Math.cos(a);
    const x2 = x1 * (1 + (res.S[0] - 1) * t2);
    const y2 = y1 * (1 + (res.S[1] - 1) * t2);
    if (t3 <= 0) return [x2, y2];
    if (res.reflectU) {
      const tg = mulMat2Vec(res.U, [x2, y2]);
      return [x2 + (tg[0] - x2) * t3, y2 + (tg[1] - y2) * t3];
    }
    const b = res.thetaU * t3;
    return [x2 * Math.cos(b) - y2 * Math.sin(b), x2 * Math.sin(b) + y2 * Math.cos(b)];
  };

  const v1: Vec2 = [res.Vt[0][0], res.Vt[0][1]];
  const v2: Vec2 = [res.Vt[1][0], res.Vt[1][1]];
  const phase = stage < 0.02 ? 0 : stage <= 1 ? 1 : stage <= 2 ? 2 : 3;
  const desc = ['单位圆与右奇异向量 v₁, v₂。', 'Vᵀ：旋转，使 v₁, v₂ 对齐坐标轴。', 'Σ：沿坐标轴分别伸缩 σ₁, σ₂ 倍。', `U：${res.reflectU ? '反射' : '旋转'}到最终位置，σᵢvᵢ ↦ σᵢuᵢ。`][phase];

  const done = useLatch({
    watch: watched,
    rank1: res.S[1] < 0.02,
    conformal: Math.abs(res.S[0] - res.S[1]) < 0.03 && res.S[0] > 0.2,
    reflect: det2(A) < -0.1,
  });

  const setCol = (j: 0 | 1, p: Vec2) => {
    const n: Mat2 = [[...A[0]], [...A[1]]] as Mat2;
    n[0][j] = p[0];
    n[1][j] = p[1];
    setA(n);
    setStage(3);
    setPlaying(false);
  };

  return (
    <LabGrid
      stage={
        <Figure
          caption={desc}
          legend={
            <>
              <Swatch color={C.red} label="v₁ → σ₁u₁" />
              <Swatch color={C.green} label="v₂ → σ₂u₂" />
            </>
          }
        >
          <Canvas2D
            range={2.6}
            handles={
              stage >= 2.999
                ? [
                    { id: 'a1', pos: [A[0][0], A[1][0]] as Vec2, color: C.ochre, label: 'Ae₁', onChange: (p: Vec2) => setCol(0, p) },
                    { id: 'a2', pos: [A[0][1], A[1][1]] as Vec2, color: C.ink2, label: 'Ae₂', onChange: (p: Vec2) => setCol(1, p) },
                  ]
                : []
            }
          >
            {({ toSvg, scale, cx, cy }) => {
              const o = toSvg([0, 0]);
              const ring: string[] = [];
              for (let k = 0; k <= 96; k++) {
                const t = (2 * Math.PI * k) / 96;
                ring.push(toSvg(T([Math.cos(t), Math.sin(t)], stage)).join(','));
              }
              const spokes = Array.from({ length: 12 }, (_, k) => {
                const t = (2 * Math.PI * k) / 12;
                return toSvg(T([Math.cos(t), Math.sin(t)], stage));
              });
              const glyph = GLYPH.map((p) => toSvg(T(p, stage)).join(',')).join(' ');
              const tv1 = T(v1, stage);
              const tv2 = T(v2, stage);
              return (
                <g>
                  <circle cx={cx} cy={cy} r={scale} fill="none" stroke={C.ruleStrong} strokeDasharray="3 3" />
                  <polygon points={ring.join(' ')} fill={C.blue} fillOpacity={0.08} stroke={C.blue} strokeWidth={2} />
                  {spokes.map((p, k) => <line key={k} x1={o[0]} y1={o[1]} x2={p[0]} y2={p[1]} stroke={C.blue} strokeOpacity={0.15} />)}
                  <polygon points={glyph} fill={C.ink} fillOpacity={0.7} />
                  <SvgArrow from={o} to={toSvg(tv1)} color={C.red} width={2.8} />
                  <SvgArrow from={o} to={toSvg(tv2)} color={C.green} width={2.8} />
                  <SvgLabel at={toSvg(tv1)} color={C.red}>{stage < 1.5 ? 'v₁' : 'σ₁u₁'}</SvgLabel>
                  <SvgLabel at={toSvg(tv2)} color={C.green}>{stage < 1.5 ? 'v₂' : 'σ₂u₂'}</SvgLabel>
                </g>
              );
            }}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel
            title="播放"
            actions={
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (!playing) setStage(0);
                  setPlaying((p) => !p);
                }}
                icon={playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              >
                {playing ? '暂停' : '从头播放'}
              </Button>
            }
          >
            <Segmented
              ariaLabel="阶段"
              size="sm"
              wrap
              value={phase}
              onChange={(p) => { setPlaying(false); setStage(p); }}
              options={[
                { value: 0, label: '0 原像' },
                { value: 1, label: '1 Vᵀ' },
                { value: 2, label: '2 Σ' },
                { value: 3, label: '3 U' },
              ]}
            />
            <input
              type="range"
              className="slider"
              min={0}
              max={3}
              step={0.01}
              value={stage}
              aria-label="动画进度"
              onChange={(e) => { setPlaying(false); setStage(Number(e.target.value)); }}
              style={{ '--fill': `${(stage / 3) * 100}%` } as React.CSSProperties}
            />
          </Panel>
          <Panel title="A = UΣVᵀ">
            <div className="flex items-center gap-3">
              <Tex math="A =" />
              <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => { setA(m as Mat2); setStage(3); }} colColors={[C.ochre, C.ink2]} />
            </div>
            <MathBox>
              <Tex block math={`U = ${mat2ToTex(res.U)},\\ \\Sigma = \\begin{pmatrix}${fmt(res.S[0])} & 0\\\\ 0 & ${fmt(res.S[1])}\\end{pmatrix},\\ V^{\\top} = ${mat2ToTex(res.Vt)}`} />
              <Tex block math={`\\kappa_2(A) = \\sigma_1/\\sigma_2 = ${res.S[1] > 1e-6 ? fmt(res.S[0] / res.S[1]) : '\\infty'},\\quad |\\det A| = \\sigma_1\\sigma_2 = ${fmt(res.S[0] * res.S[1])}`} />
            </MathBox>
            <Presets items={PRESETS.map((p) => ({ label: p.name, onClick: () => { setA(p.A); setStage(3); } }))} />
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'watch', label: '完整播放一次三步动画。' },
              { id: 'rank1', label: '拖动 Ae₂，使 σ₂ = 0（椭圆退化为线段）。' },
              { id: 'conformal', label: '让 σ₁ = σ₂：A 是旋转（或反射）乘以数量。' },
              { id: 'reflect', label: '构造 det A < 0，观察字母 F 在第 3 步被翻转。' },
            ]}
          />
          <Note>任何 2×2 实矩阵都把单位圆映为椭圆（可能退化），半轴长恰是奇异值，半轴方向是左奇异向量 uᵢ。</Note>
        </>
      }
    />
  );
};
