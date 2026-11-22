import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Magnet, Maximize2, Minus, Plus } from 'lucide-react';
import type { Vec2 } from '../utils/math';
import { C } from '../theme';

export interface DragHandle {
  id: string;
  pos: Vec2;
  color: string;
  label?: string;
  onChange: (pos: Vec2) => void;
  /** Project a raw pointer position onto an allowed set (circle, axis, ...) */
  constrain?: (p: Vec2) => Vec2;
  /** Fixed snapping step; overrides the toolbar snap toggle */
  snap?: number;
  /** Hide coordinate tooltip while active */
  hideCoords?: boolean;
}

export interface PlaneView {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface PlaneHelpers {
  toSvg: (p: Vec2) => [number, number];
  toWorld: (sx: number, sy: number) => Vec2;
  /** pixels per unit */
  scale: number;
  /** svg coordinates of the origin */
  cx: number;
  cy: number;
  width: number;
  height: number;
  view: PlaneView;
  /** Endpoints (svg coords) of the infinite line p + t d, clipped generously to the view */
  line: (p: Vec2, d: Vec2) => { x1: number; y1: number; x2: number; y2: number };
}

interface Canvas2DProps {
  /** Initial half-extent (in units) of the shorter side */
  range?: number;
  /** width / height */
  aspect?: number;
  handles?: DragHandle[];
  onBackgroundClick?: (pt: Vec2) => void;
  children?: (h: PlaneHelpers) => React.ReactNode;
  pannable?: boolean;
  toolbar?: boolean;
  axisLabels?: [string, string];
  ariaLabel?: string;
  className?: string;
  /** Initial view centre */
  center?: Vec2;
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

function tickText(v: number, step: number): string {
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const s = (Math.abs(v) < step * 1e-6 ? 0 : v).toFixed(d);
  return s.replace('-', '−');
}

const roundTo = (x: number, s: number) => Math.round(x / s) * s;
const fmtCoord = (x: number) => {
  const r = Math.round(x * 100) / 100;
  return (Object.is(r, -0) ? 0 : r).toString().replace('-', '−');
};

export const Canvas2D: React.FC<Canvas2DProps> = ({
  range = 5,
  aspect = 1.25,
  handles = [],
  onBackgroundClick,
  children,
  pannable = true,
  toolbar = true,
  axisLabels = ['x', 'y'],
  ariaLabel = '交互坐标平面',
  className = '',
  center: initialCenter = [0, 0],
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const readoutRef = useRef<HTMLSpanElement | null>(null);

  const [width, setWidth] = useState(640);
  const height = Math.round(Math.max(260, Math.min(640, width / aspect)));

  const [center, setCenter] = useState<Vec2>(initialCenter);
  const [zoom, setZoom] = useState(1);
  const [snapOn, setSnapOn] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const panRef = useRef<{ x: number; y: number; c: Vec2; moved: boolean; id: number } | null>(null);
  const pointers = useRef(new Map<number, [number, number]>());
  const pinchRef = useRef<{ d: number; zoom: number } | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.clientWidth);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    setWidth(Math.round(el.clientWidth) || 640);
    return () => ro.disconnect();
  }, []);

  // Reset view when the lab asks for a different natural range
  useEffect(() => {
    setZoom(1);
    setCenter(initialCenter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const fit = Math.min(width, height) / (2 * range);
  const scale = fit * zoom;
  const ox = width / 2 - center[0] * scale;
  const oy = height / 2 + center[1] * scale;

  const toSvg = useCallback((p: Vec2): [number, number] => [ox + p[0] * scale, oy - p[1] * scale], [ox, oy, scale]);
  const toWorld = useCallback((sx: number, sy: number): Vec2 => [(sx - ox) / scale, (oy - sy) / scale], [ox, oy, scale]);

  const view: PlaneView = {
    xmin: -ox / scale,
    xmax: (width - ox) / scale,
    ymin: (oy - height) / scale,
    ymax: oy / scale,
  };

  const line = (p: Vec2, d: Vec2) => {
    const n = Math.hypot(d[0], d[1]) || 1;
    const L = (Math.hypot(view.xmax - view.xmin, view.ymax - view.ymin) + Math.hypot(p[0] - center[0], p[1] - center[1])) / n;
    const a = toSvg([p[0] - L * d[0], p[1] - L * d[1]]);
    const b = toSvg([p[0] + L * d[0], p[1] + L * d[1]]);
    return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  };

  const clientToSvg = (clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const r = svg.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * width, ((clientY - r.top) / r.height) * height];
  };

  const zoomAt = (factor: number, sx = width / 2, sy = height / 2) => {
    const nz = Math.max(0.15, Math.min(12, zoom * factor));
    const w = toWorld(sx, sy);
    const k = zoom / nz;
    setCenter([w[0] - (w[0] - center[0]) * k, w[1] - (w[1] - center[1]) * k]);
    setZoom(nz);
  };

  // Ctrl/⌘ + wheel or trackpad pinch zooms; plain wheel scrolls the page.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !pannable) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const [sx, sy] = clientToSvg(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * 0.01), sx, sy);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  });

  const applyHandle = (h: DragHandle, raw: Vec2) => {
    let p = raw;
    const m = 0.15 / zoom;
    p = [Math.max(view.xmin + m, Math.min(view.xmax - m, p[0])), Math.max(view.ymin + m, Math.min(view.ymax - m, p[1]))];
    const s = h.snap ?? (snapOn ? 0.5 : 0.1);
    if (h.constrain) {
      p = h.constrain(p);
      if (h.snap) p = [roundTo(p[0], s), roundTo(p[1], s)];
    } else {
      p = [roundTo(p[0], s), roundTo(p[1], s)];
    }
    p = [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6];
    h.onChange(p);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const [sx, sy] = clientToSvg(e.clientX, e.clientY);
    pointers.current.set(e.pointerId, [sx, sy]);
    if (pointers.current.size === 2 && pannable) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), zoom };
      panRef.current = null;
      setDragId(null);
      return;
    }
    const target = e.target as Element;
    const hid = target.closest('[data-handle]')?.getAttribute('data-handle');
    svgRef.current?.setPointerCapture(e.pointerId);
    if (hid) {
      setDragId(hid);
      return;
    }
    panRef.current = { x: sx, y: sy, c: center, moved: false, id: e.pointerId };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const [sx, sy] = clientToSvg(e.clientX, e.clientY);
    if (readoutRef.current) {
      const w = toWorld(sx, sy);
      readoutRef.current.textContent = `(${fmtCoord(w[0])}, ${fmtCoord(w[1])})`;
    }
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, [sx, sy]);

    if (pinchRef.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      setZoom(Math.max(0.15, Math.min(12, (pinchRef.current.zoom * d) / pinchRef.current.d)));
      return;
    }
    if (dragId) {
      const h = handles.find((it) => it.id === dragId);
      if (h) applyHandle(h, toWorld(sx, sy));
      return;
    }
    const pan = panRef.current;
    if (pan && pan.id === e.pointerId) {
      const dx = sx - pan.x;
      const dy = sy - pan.y;
      if (!pan.moved && Math.hypot(dx, dy) > 4) pan.moved = true;
      if (pan.moved && pannable) setCenter([pan.c[0] - dx / scale, pan.c[1] + dy / scale]);
    }
  };

  const endPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    const pan = panRef.current;
    if (pan && pan.id === e.pointerId && !pan.moved && onBackgroundClick && e.type === 'pointerup') {
      const [sx, sy] = clientToSvg(e.clientX, e.clientY);
      onBackgroundClick(toWorld(sx, sy));
    }
    panRef.current = null;
    setDragId(null);
  };

  /* ---------------- grid ---------------- */
  const step = niceStep(80 / scale);
  const lead = Math.round(step / Math.pow(10, Math.floor(Math.log10(step) + 1e-9)));
  const minor = step / (lead === 2 ? 4 : 5);
  const gridEls: React.ReactNode[] = [];
  if (minor * scale >= 9) {
    for (let x = Math.ceil(view.xmin / minor) * minor; x <= view.xmax; x += minor) {
      const X = ox + x * scale;
      gridEls.push(<line key={`mx${x.toFixed(6)}`} x1={X} y1={0} x2={X} y2={height} stroke={C.grid} strokeWidth={1} />);
    }
    for (let y = Math.ceil(view.ymin / minor) * minor; y <= view.ymax; y += minor) {
      const Y = oy - y * scale;
      gridEls.push(<line key={`my${y.toFixed(6)}`} x1={0} y1={Y} x2={width} y2={Y} stroke={C.grid} strokeWidth={1} />);
    }
  }
  const ticks: React.ReactNode[] = [];
  const axY = Math.max(14, Math.min(height - 6, oy + 16));
  const axXRight = ox - 7 < 30;
  const axX = axXRight ? Math.max(6, ox + 7) : Math.min(width - 6, ox - 7);
  for (let x = Math.ceil(view.xmin / step) * step; x <= view.xmax; x += step) {
    const X = ox + x * scale;
    gridEls.push(<line key={`Mx${x.toFixed(6)}`} x1={X} y1={0} x2={X} y2={height} stroke={C.gridMajor} strokeWidth={1} />);
    if (Math.abs(x) > step * 1e-6 && X > 12 && X < width - 12)
      ticks.push(
        <text key={`tx${x.toFixed(6)}`} x={X} y={axY} textAnchor="middle" className="fig-tick">
          {tickText(x, step)}
        </text>
      );
  }
  for (let y = Math.ceil(view.ymin / step) * step; y <= view.ymax; y += step) {
    const Y = oy - y * scale;
    gridEls.push(<line key={`My${y.toFixed(6)}`} x1={0} y1={Y} x2={width} y2={Y} stroke={C.gridMajor} strokeWidth={1} />);
    if (Math.abs(y) > step * 1e-6 && Y > 10 && Y < height - 22)
      ticks.push(
        <text key={`ty${y.toFixed(6)}`} x={axX} y={Y + 4} textAnchor={axXRight ? 'start' : 'end'} className="fig-tick">
          {tickText(y, step)}
        </text>
      );
  }

  const helpers: PlaneHelpers = { toSvg, toWorld, scale, cx: ox, cy: oy, width, height, view, line };

  return (
    <div ref={wrapRef} className={`relative w-full bg-surface ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={`block select-none touch-none ${dragId ? 'cursor-grabbing' : pannable ? 'cursor-move' : onBackgroundClick ? 'cursor-crosshair' : ''}`}
        role="img"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={() => {
          if (readoutRef.current) readoutRef.current.textContent = '';
        }}
      >
        <g>{gridEls}</g>
        {/* axes */}
        {oy >= 0 && oy <= height && <line x1={0} y1={oy} x2={width} y2={oy} stroke={C.axis} strokeWidth={1.25} />}
        {ox >= 0 && ox <= width && <line x1={ox} y1={0} x2={ox} y2={height} stroke={C.axis} strokeWidth={1.25} />}
        <g>{ticks}</g>
        {oy >= 0 && oy <= height && (
          <text x={width - 8} y={oy - 8} textAnchor="end" className="fig-label" fontSize={16} fill={C.ink2}>
            {axisLabels[0]}
          </text>
        )}
        {ox >= 0 && ox <= width && (
          <text x={ox + 8} y={16} className="fig-label" fontSize={16} fill={C.ink2}>
            {axisLabels[1]}
          </text>
        )}

        {children?.(helpers)}

        {handles.map((h) => {
          const [sx, sy] = toSvg(h.pos);
          const active = dragId === h.id || focusId === h.id;
          const hot = active || hoverId === h.id;
          return (
            <g
              key={h.id}
              data-handle={h.id}
              tabIndex={0}
              role="button"
              aria-roledescription="可拖动点"
              aria-label={`${h.label ?? h.id}，坐标 (${fmtCoord(h.pos[0])}, ${fmtCoord(h.pos[1])})。方向键移动，Shift 加大步长`}
              className={`outline-none ${dragId === h.id ? 'cursor-grabbing' : 'cursor-grab'}`}
              onPointerEnter={() => setHoverId(h.id)}
              onPointerLeave={() => setHoverId((v) => (v === h.id ? null : v))}
              onFocus={(e) => {
                if ((e.target as Element).matches(':focus-visible')) setFocusId(h.id);
              }}
              onBlur={() => setFocusId((v) => (v === h.id ? null : v))}
              onKeyDown={(e) => {
                const k = e.shiftKey ? 1 : 0.1;
                const d: Record<string, Vec2> = { ArrowLeft: [-k, 0], ArrowRight: [k, 0], ArrowUp: [0, k], ArrowDown: [0, -k] };
                const dv = d[e.key];
                if (!dv) return;
                e.preventDefault();
                let p: Vec2 = [h.pos[0] + dv[0], h.pos[1] + dv[1]];
                if (h.constrain) {
                  // move along the constraint set
                  p = h.constrain(p);
                }
                h.onChange([Math.round(p[0] * 1e4) / 1e4, Math.round(p[1] * 1e4) / 1e4]);
              }}
            >
              <circle cx={sx} cy={sy} r={22} fill="transparent" />
              {hot && <circle cx={sx} cy={sy} r={14} fill={h.color} fillOpacity={0.14} />}
              {focusId === h.id && <circle cx={sx} cy={sy} r={17} fill="none" stroke={C.primary} strokeWidth={1.5} strokeDasharray="3 2" />}
              <circle cx={sx} cy={sy} r={hot ? 7.5 : 6.5} fill={C.surface} stroke={h.color} strokeWidth={2.5} />
              {h.label && (
                <text x={sx + 11} y={sy - 11} fontSize={17} fill={h.color} className="fig-label pointer-events-none">
                  {h.label}
                </text>
              )}
              {active && !h.hideCoords && (
                <text x={sx + 11} y={sy + 22} fontSize={12} fill={C.ink2} className="fig-tick pointer-events-none" style={{ fontSize: 12 }}>
                  ({fmtCoord(h.pos[0])}, {fmtCoord(h.pos[1])})
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* overlays */}
      <span
        ref={readoutRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-2 bottom-2 font-mono text-[12px] text-ink-3 bg-surface/90 px-1.5 rounded-sm tabular"
      />
      {toolbar && (
        <div className="absolute right-2 top-2 flex items-center gap-1 bg-surface/95 border border-rule rounded-md p-0.5">
          {pannable && (
            <>
              <ToolBtn label="放大" onClick={() => zoomAt(1.25)}>
                <Plus className="w-4 h-4" />
              </ToolBtn>
              <ToolBtn label="缩小" onClick={() => zoomAt(0.8)}>
                <Minus className="w-4 h-4" />
              </ToolBtn>
              <ToolBtn
                label="复位视图"
                onClick={() => {
                  setZoom(1);
                  setCenter(initialCenter);
                }}
              >
                <Maximize2 className="w-4 h-4" />
              </ToolBtn>
            </>
          )}
          {handles.length > 0 && (
            <ToolBtn label={snapOn ? '关闭网格吸附（当前步长 0.5）' : '开启网格吸附（步长 0.5）'} active={snapOn} onClick={() => setSnapOn((s) => !s)}>
              <Magnet className="w-4 h-4" />
            </ToolBtn>
          )}
        </div>
      )}
    </div>
  );
};

const ToolBtn: React.FC<{ label: string; onClick: () => void; active?: boolean; children: React.ReactNode }> = ({
  label,
  onClick,
  active,
  children,
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center rounded-[3px] transition-colors ${
      active ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken hover:text-ink'
    }`}
  >
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Figure primitives                                                   */
/* ------------------------------------------------------------------ */

export const SvgArrow: React.FC<{
  from: [number, number];
  to: [number, number];
  color: string;
  width?: number;
  dashed?: boolean;
  opacity?: number;
}> = ({ from, to, color, width = 2.4, dashed = false, opacity = 1 }) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < 2) return null;
  const ux = dx / len;
  const uy = dy / len;
  const headLen = Math.min(9 + width * 1.8, len * 0.6);
  const headW = 3.2 + width * 1.15;
  const notch = headLen * 0.78;
  const bx = to[0] - ux * headLen;
  const by = to[1] - uy * headLen;
  const nx = to[0] - ux * notch;
  const ny = to[1] - uy * notch;
  const p1: [number, number] = [bx - uy * headW, by + ux * headW];
  const p2: [number, number] = [bx + uy * headW, by - ux * headW];
  return (
    <g opacity={opacity} className="pointer-events-none">
      <line
        x1={from[0]}
        y1={from[1]}
        x2={nx}
        y2={ny}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? `${width * 2.4} ${width * 1.8}` : undefined}
        strokeLinecap={dashed ? 'butt' : 'round'}
      />
      <path d={`M${to[0]},${to[1]} L${p1[0]},${p1[1]} L${nx},${ny} L${p2[0]},${p2[1]} Z`} fill={color} />
    </g>
  );
};

/** Italic serif label with paper halo. */
export const SvgLabel: React.FC<{
  at: [number, number];
  color?: string;
  size?: number;
  dx?: number;
  dy?: number;
  anchor?: 'start' | 'middle' | 'end';
  children: React.ReactNode;
}> = ({ at, color = C.ink, size = 17, dx = 8, dy = -8, anchor = 'start', children }) => (
  <text x={at[0] + dx} y={at[1] + dy} fontSize={size} fill={color} textAnchor={anchor} className="fig-label pointer-events-none">
    {children}
  </text>
);

export const SvgPoint: React.FC<{ at: [number, number]; color: string; r?: number; hollow?: boolean }> = ({
  at,
  color,
  r = 4.5,
  hollow,
}) => (
  <circle
    cx={at[0]}
    cy={at[1]}
    r={r}
    fill={hollow ? C.surface : color}
    stroke={hollow ? color : C.surface}
    strokeWidth={hollow ? 2 : 1.5}
    className="pointer-events-none"
  />
);

/** Angle arc (math orientation, radians) around svg point `at` with pixel radius r. */
export const SvgArc: React.FC<{ at: [number, number]; r: number; a0: number; a1: number; color: string; width?: number; dashed?: boolean }> = ({
  at,
  r,
  a0,
  a1,
  color,
  width = 1.5,
  dashed,
}) => {
  const d = a1 - a0;
  if (Math.abs(d) < 1e-3) return null;
  if (Math.abs(d) >= 2 * Math.PI - 1e-3) {
    return <circle cx={at[0]} cy={at[1]} r={r} fill="none" stroke={color} strokeWidth={width} className="pointer-events-none" />;
  }
  const p0 = [at[0] + r * Math.cos(a0), at[1] - r * Math.sin(a0)];
  const p1 = [at[0] + r * Math.cos(a1), at[1] - r * Math.sin(a1)];
  const large = Math.abs(d) > Math.PI ? 1 : 0;
  const sweep = d > 0 ? 0 : 1;
  return (
    <path
      d={`M${p0[0]},${p0[1]} A${r},${r} 0 ${large} ${sweep} ${p1[0]},${p1[1]}`}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? '4 3' : undefined}
      className="pointer-events-none"
    />
  );
};

/** Small right-angle marker at `at` between unit directions a and b (svg space). */
export const SvgRightAngle: React.FC<{ at: [number, number]; a: Vec2; b: Vec2; size?: number; color?: string }> = ({
  at,
  a,
  b,
  size = 10,
  color = C.ink2,
}) => {
  const na = Math.hypot(a[0], a[1]) || 1;
  const nb = Math.hypot(b[0], b[1]) || 1;
  const ua = [(a[0] / na) * size, (-a[1] / na) * size];
  const ub = [(b[0] / nb) * size, (-b[1] / nb) * size];
  return (
    <path
      d={`M${at[0] + ua[0]},${at[1] + ua[1]} L${at[0] + ua[0] + ub[0]},${at[1] + ua[1] + ub[1]} L${at[0] + ub[0]},${at[1] + ub[1]}`}
      fill="none"
      stroke={color}
      strokeWidth={1.2}
      className="pointer-events-none"
    />
  );
};
