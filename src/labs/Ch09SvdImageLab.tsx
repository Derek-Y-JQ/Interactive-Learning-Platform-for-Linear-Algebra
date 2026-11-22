import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eraser, Upload } from 'lucide-react';
import { Tex } from '../components/MathText';
import { Button, LabGrid, MathBox, Note, Panel, Segmented, SliderField, Tasks, useLatch } from '../components/ui';
import { fmt } from '../utils/math';
import { C } from '../theme';

const N = 64;
type Img = number[][];
type Source = 'rings' | 'letter' | 'checker' | 'draw' | 'upload';

function pattern(kind: 'rings' | 'letter' | 'checker'): Img {
  return Array.from({ length: N }, (_, y) =>
    Array.from({ length: N }, (_, x) => {
      const nx = (x - N / 2) / (N / 2);
      const ny = (y - N / 2) / (N / 2);
      if (kind === 'rings') {
        const r = Math.hypot(nx, ny);
        return 128 + 115 * Math.cos(r * 10) * Math.exp(-r * 0.6);
      }
      if (kind === 'checker') {
        const b = (Math.floor(x / 11) + Math.floor(y / 11)) % 2 === 0 ? 225 : 40;
        return Math.abs(x - y) < 4 ? 130 : b;
      }
      const s = N / 48;
      const X = x / s;
      const Y = y / s;
      const inL = (X >= 7 && X <= 12 && Y >= 10 && Y <= 38) || (X >= 7 && X <= 21 && Y >= 33 && Y <= 38);
      const inA =
        (Math.abs(X - (32 - (Y - 10) * 0.32)) < 2.6 && Y >= 10 && Y <= 38) ||
        (Math.abs(X - (32 + (Y - 10) * 0.32)) < 2.6 && Y >= 10 && Y <= 38) ||
        (Y >= 26 && Y <= 30 && X >= 26 && X <= 38);
      return inL || inA ? 35 : 242;
    })
  );
}

const blank = (): Img => Array.from({ length: N }, () => new Array(N).fill(245));

interface Factor {
  sigma: number;
  u: number[];
  v: number[];
}

function topSvd(M: Img, maxK = 40): Factor[] {
  const R = M.map((r) => [...r]);
  const out: Factor[] = [];
  for (let k = 0; k < maxK; k++) {
    let v = Array.from({ length: N }, (_, i) => Math.sin(i * 1.7 + k + 1));
    let nv = Math.hypot(...v) || 1;
    v = v.map((x) => x / nv);
    const u = new Array(N).fill(0);
    let s = 0;
    for (let it = 0; it < 30; it++) {
      for (let i = 0; i < N; i++) {
        let acc = 0;
        const row = R[i];
        for (let j = 0; j < N; j++) acc += row[j] * v[j];
        u[i] = acc;
      }
      s = Math.hypot(...u);
      if (s < 1e-6) break;
      for (let i = 0; i < N; i++) u[i] /= s;
      const nvv = new Array(N).fill(0);
      for (let i = 0; i < N; i++) {
        const ui = u[i];
        const row = R[i];
        for (let j = 0; j < N; j++) nvv[j] += row[j] * ui;
      }
      nv = Math.hypot(...nvv) || 1;
      for (let j = 0; j < N; j++) v[j] = nvv[j] / nv;
    }
    if (s < 1e-3) break;
    out.push({ sigma: s, u: [...u], v: [...v] });
    for (let i = 0; i < N; i++) {
      const su = s * u[i];
      for (let j = 0; j < N; j++) R[i][j] -= su * v[j];
    }
  }
  return out;
}

function paint(canvas: HTMLCanvasElement | null, M: Img, map: (x: number) => number = (x) => x) {
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const val = Math.max(0, Math.min(255, Math.round(map(M[y][x]))));
      const i = (y * N + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
}

const Pane: React.FC<{ title: React.ReactNode; sub?: React.ReactNode; refEl: React.Ref<HTMLCanvasElement>; draw?: boolean } & Omit<React.HTMLAttributes<HTMLCanvasElement>, 'title'>> = ({
  title,
  sub,
  refEl,
  draw,
  ...rest
}) => (
  <figure className="space-y-1.5">
    <figcaption className="text-[13px] text-ink-2 font-semibold">{title}</figcaption>
    <canvas
      ref={refEl}
      width={N}
      height={N}
      className={`w-full aspect-square border border-rule rounded-[3px] [image-rendering:pixelated] bg-surface ${draw ? 'cursor-crosshair touch-none' : ''}`}
      {...rest}
    />
    {sub && <div className="text-[12px] text-ink-3 font-mono">{sub}</div>}
  </figure>
);

export const Ch09SvdImageLab: React.FC = () => {
  const [source, setSource] = useState<Source>('rings');
  const [drawn, setDrawn] = useState<Img>(() => pattern('letter'));
  const [uploaded, setUploaded] = useState<Img | null>(null);
  const [k, setK] = useState(4);
  const [brush, setBrush] = useState<'ink' | 'erase'>('ink');
  const [strokes, setStrokes] = useState(0);

  const origRef = useRef<HTMLCanvasElement | null>(null);
  const approxRef = useRef<HTMLCanvasElement | null>(null);
  const residRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const M = useMemo<Img>(() => {
    if (source === 'draw') return drawn;
    if (source === 'upload') return uploaded ?? blank();
    return pattern(source);
  }, [source, drawn, uploaded]);

  // while the user is painting, postpone SVD until the stroke ends
  const [svdInput, setSvdInput] = useState<Img>(M);
  useEffect(() => {
    if (!drawing.current) setSvdInput(M);
  }, [M]);
  const factors = useMemo(() => topSvd(svdInput), [svdInput]);
  const kk = Math.min(k, Math.max(1, factors.length));

  const { approx, layer } = useMemo(() => {
    const a = Array.from({ length: N }, () => new Array(N).fill(0));
    const l = Array.from({ length: N }, () => new Array(N).fill(0));
    factors.slice(0, kk).forEach(({ sigma, u, v }, idx) => {
      for (let i = 0; i < N; i++) {
        const su = sigma * u[i];
        for (let j = 0; j < N; j++) {
          a[i][j] += su * v[j];
          if (idx === kk - 1) l[i][j] = su * v[j];
        }
      }
    });
    return { approx: a, layer: l };
  }, [factors, kk]);

  const total = factors.reduce((s, f) => s + f.sigma ** 2, 0) || 1;
  const kept = factors.slice(0, kk).reduce((s, f) => s + f.sigma ** 2, 0);
  const relErr = Math.sqrt(Math.max(0, 1 - kept / total));
  const storage = ((kk * (2 * N + 1)) / (N * N)) * 100;
  const layerMax = Math.max(1e-6, ...layer.flat().map(Math.abs));

  useEffect(() => {
    paint(origRef.current, M);
    paint(approxRef.current, approx);
    paint(residRef.current, svdInput.map((r, i) => r.map((v, j) => v - approx[i][j])), (x) => 128 + x * 1.5);
    paint(layerRef.current, layer, (x) => 128 + (x / layerMax) * 120);
  }, [M, approx, layer, layerMax, svdInput]);

  const done = useLatch({
    k1: kk === 1,
    err: relErr < 0.05 && storage < 40,
    upload: source === 'upload' && !!uploaded,
    draw: source === 'draw' && strokes > 0,
  });

  const paintAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = ((e.clientX - r.left) / r.width) * N;
    const cy = ((e.clientY - r.top) / r.height) * N;
    setDrawn((prev) => {
      const next = prev.map((row) => [...row]);
      for (let y = Math.floor(cy - 3); y <= cy + 3; y++)
        for (let x = Math.floor(cx - 3); x <= cx + 3; x++)
          if (x >= 0 && y >= 0 && x < N && y < N && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= 2.6) next[y][x] = brush === 'ink' ? 25 : 245;
      return next;
    });
  };

  const onFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = N;
      cv.height = N;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const s = Math.min(im.width, im.height);
      ctx.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, N, N);
      const d = ctx.getImageData(0, 0, N, N).data;
      setUploaded(Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => {
        const i = (y * N + x) * 4;
        return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      })));
      setSource('upload');
      URL.revokeObjectURL(url);
    };
    im.src = url;
  };

  return (
    <LabGrid
      wideStage
      stage={
        <>
          <Panel title={`64 × 64 灰度矩阵，保留前 k = ${kk} 项`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Pane
                title={source === 'draw' ? '原图 A（可在此绘制）' : '原图 A'}
                refEl={origRef}
                draw={source === 'draw'}
                onPointerDown={(e) => {
                  if (source !== 'draw') return;
                  drawing.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  paintAt(e);
                }}
                onPointerMove={(e) => source === 'draw' && drawing.current && paintAt(e)}
                onPointerUp={() => {
                  if (!drawing.current) return;
                  drawing.current = false;
                  setSvdInput(drawn);
                  setStrokes((s) => s + 1);
                }}
              />
              <Pane title={<>逼近 A<sub>{kk}</sub></>} sub={`相对误差 ${fmt(relErr * 100, 1)}%`} refEl={approxRef} />
              <Pane title={<>残差 A − A<sub>{kk}</sub></>} sub="灰 = 0，放大 1.5 倍" refEl={residRef} />
              <Pane title={<>第 {kk} 层 σ<sub>{kk}</sub>u<sub>{kk}</sub>v<sub>{kk}</sub>ᵀ</>} sub={`σ${kk} = ${fmt(factors[kk - 1]?.sigma ?? 0, 1)}`} refEl={layerRef} />
            </div>
            <SliderField label="保留项数 k" value={kk} min={1} max={Math.max(1, factors.length)} step={1} digits={0} onChange={setK} />
          </Panel>

          <Panel title="奇异值谱（点击柱子设定 k）">
            <svg viewBox="0 0 640 140" className="w-full" role="img" aria-label="奇异值柱状图">
              {factors.map((f, i) => {
                const w = 640 / factors.length;
                const h = (f.sigma / (factors[0]?.sigma || 1)) * 118;
                return (
                  <g key={i} onClick={() => setK(i + 1)} className="cursor-pointer">
                    <title>{`σ${i + 1} = ${fmt(f.sigma, 1)}`}</title>
                    <rect x={i * w} y={0} width={w} height={130} fill="transparent" />
                    <rect x={i * w + 1} y={128 - h} width={Math.max(1, w - 2)} height={Math.max(1, h)} fill={i < kk ? C.primary : C.ruleStrong} />
                  </g>
                );
              })}
              <line x1={0} y1={128.5} x2={640} y2={128.5} stroke={C.ink3} />
            </svg>
            <div className="flex flex-wrap justify-between text-[13px] text-ink-2 font-mono">
              <span>保留能量 {fmt((kept / total) * 100, 1)}%</span>
              <span>存储 k(2n+1) / n² = {fmt(storage, 1)}%</span>
            </div>
          </Panel>
        </>
      }
      side={
        <>
          <Panel title="图像来源">
            <Segmented
              ariaLabel="图像来源"
              size="sm"
              wrap
              value={source}
              onChange={setSource}
              options={[
                { value: 'rings', label: '波纹' },
                { value: 'letter', label: '字母' },
                { value: 'checker', label: '棋盘' },
                { value: 'draw', label: '手绘' },
                { value: 'upload', label: '上传' },
              ]}
            />
            {source === 'draw' && (
              <div className="flex flex-wrap gap-2">
                <Segmented ariaLabel="画笔" size="sm" value={brush} onChange={setBrush} options={[{ value: 'ink', label: '画笔' }, { value: 'erase', label: '橡皮' }]} />
                <Button size="sm" icon={<Eraser className="w-4 h-4" />} onClick={() => { const b = blank(); setDrawn(b); setSvdInput(b); }}>清空</Button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <Button size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => fileRef.current?.click()}>
              选择本地图片
            </Button>
            <p className="text-[13px] text-ink-3">图片只在浏览器本地处理，不会上传到任何服务器。</p>
          </Panel>
          <Panel title="Eckart–Young">
            <MathBox>
              <Tex block math={`A_k = \\sum_{i=1}^{k}\\sigma_i\\bm u_i\\bm v_i^{\\top},\\qquad \\frac{\\|A - A_k\\|_F}{\\|A\\|_F} = \\sqrt{\\frac{\\sum_{i>k}\\sigma_i^2}{\\sum_i\\sigma_i^2}}`} />
            </MathBox>
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'k1', label: '把 k 调到 1，观察秩 1 矩阵“行列可分离”的样子。' },
              { id: 'err', label: '找到相对误差 < 5% 且存储 < 40% 的 k。' },
              { id: 'draw', label: '手绘一个图形：横平竖直的图案需要几项？斜线呢？' },
              { id: 'upload', label: '上传一张自己的照片。' },
            ]}
          />
          <Note>棋盘图案的秩很低（行只有两种），而对角线条纹会让奇异值衰减变慢——低秩近似擅长的是“行列结构”而不是“空间平滑”。</Note>
        </>
      }
    />
  );
};
