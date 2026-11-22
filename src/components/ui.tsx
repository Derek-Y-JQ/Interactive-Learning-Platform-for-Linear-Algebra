import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Circle } from 'lucide-react';
import { fmt } from '../utils/math';

const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: 'sm' | 'md';
    active?: boolean;
    icon?: React.ReactNode;
  }
> = ({ variant = 'secondary', size = 'md', active, icon, className, children, ...rest }) => {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors duration-150 disabled:opacity-40 select-none whitespace-nowrap';
  const sizes = size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-10 px-4 text-sm';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: active
      ? 'bg-ink text-white border border-ink'
      : 'bg-surface text-ink border border-rule-strong hover:border-ink',
    ghost: active ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-sunken hover:text-ink',
    quiet: 'text-primary underline-offset-4 hover:underline px-0 h-auto',
  };
  return (
    <button type="button" className={cx(base, sizes, variants[variant], className)} aria-pressed={active} {...rest}>
      {icon}
      {children}
    </button>
  );
};

/** Exclusive choice (tabs / modes). */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  wrap = false,
}: {
  options: readonly { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  wrap?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx(
        'inline-flex border border-rule-strong rounded-md bg-surface p-0.5 gap-0.5 max-w-full',
        wrap ? 'flex-wrap' : 'overflow-x-auto'
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'rounded-[3px] font-medium transition-colors duration-150 whitespace-nowrap',
              size === 'sm' ? 'h-7 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm',
              on ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken hover:text-ink'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Containers                                                          */
/* ------------------------------------------------------------------ */

export const Panel: React.FC<{
  title?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, actions, className, children }) => (
  <section className={cx('bg-surface border border-rule rounded-md', className)}>
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 px-4 h-11 border-b border-rule">
        {title && <h3 className="font-sans text-[14px] font-bold tracking-[0.04em] text-ink-2">{title}</h3>}
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </header>
    )}
    <div className="p-4 space-y-4">{children}</div>
  </section>
);

/** Shaded block for live formulas / readouts. */
export const MathBox: React.FC<{ children: React.ReactNode; className?: string; tone?: 'neutral' | 'ok' | 'warn' }> = ({
  children,
  className,
  tone = 'neutral',
}) => (
  <div
    className={cx(
      'px-3.5 py-2.5 rounded-md border-l-2 text-[15px] overflow-x-auto',
      tone === 'neutral' && 'bg-paper border-rule-strong',
      tone === 'ok' && 'bg-success-soft border-success',
      tone === 'warn' && 'bg-danger-soft border-danger',
      className
    )}
    aria-live="polite"
  >
    {children}
  </div>
);

/** Textbook-style remark: 注 / 定理 / 思考 */
export const Note: React.FC<{ label?: string; children: React.ReactNode }> = ({ label = '注', children }) => (
  <aside className="text-[14px] leading-relaxed text-ink-2 border-t border-rule pt-3">
    <span className="font-serif font-bold text-ink mr-2">{label}</span>
    {children}
  </aside>
);

/** Status line under a figure (e.g. "命中特征方向") */
export const Status: React.FC<{ tone: 'ok' | 'warn' | 'info'; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    role="status"
    className={cx(
      'flex items-start gap-2 text-[14px] font-medium px-3 py-2 rounded-md border',
      tone === 'ok' && 'bg-success-soft border-success/40 text-success',
      tone === 'warn' && 'bg-danger-soft border-danger/30 text-danger',
      tone === 'info' && 'bg-paper border-rule text-ink-2'
    )}
  >
    {children}
  </div>
);

/** Figure frame with caption, like 图 3.2 in the book. */
export const Figure: React.FC<{
  caption?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  legend?: React.ReactNode;
}> = ({ caption, children, className, legend }) => (
  <figure className={cx('bg-surface border border-rule rounded-md overflow-hidden', className)}>
    {children}
    {(caption || legend) && (
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3.5 py-2 border-t border-rule text-[13px] text-ink-2">
        {caption && <span>{caption}</span>}
        {legend && <span className="flex flex-wrap items-center gap-x-3 gap-y-1">{legend}</span>}
      </figcaption>
    )}
  </figure>
);

export const Swatch: React.FC<{ color: string; label: React.ReactNode; dashed?: boolean }> = ({ color, label, dashed }) => (
  <span className="inline-flex items-center gap-1.5">
    <svg width="18" height="8" aria-hidden="true">
      <line x1="1" y1="4" x2="17" y2="4" stroke={color} strokeWidth={2.5} strokeDasharray={dashed ? '3 2' : undefined} />
    </svg>
    {label}
  </span>
);

/** Standard 2-column lab layout: figure on the left, controls on the right. */
export const LabGrid: React.FC<{ stage: React.ReactNode; side: React.ReactNode; wideStage?: boolean }> = ({
  stage,
  side,
  wideStage,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
    <div className={cx('space-y-3 min-w-0', wideStage ? 'lg:col-span-8' : 'lg:col-span-7')}>{stage}</div>
    <div className={cx('space-y-4 min-w-0', wideStage ? 'lg:col-span-4' : 'lg:col-span-5')}>{side}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

/** Free-typing numeric field. Commits on valid parse; ↑/↓ step (Shift ×10). */
export const NumberInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  ariaLabel: string;
  className?: string;
  digits?: number;
  emphasize?: boolean;
}> = ({ value, onChange, step = 0.1, min, max, ariaLabel, className, digits = 2, emphasize }) => {
  const [text, setText] = useState(fmt(value, digits));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(fmt(value, digits));
  }, [value, digits]);

  const clamp = (v: number) => {
    let r = v;
    if (min !== undefined) r = Math.max(min, r);
    if (max !== undefined) r = Math.min(max, r);
    return r;
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={text}
      onFocus={(e) => {
        focused.current = true;
        e.target.select();
      }}
      onBlur={() => {
        focused.current = false;
        setText(fmt(value, digits));
      }}
      onChange={(e) => {
        const raw = e.target.value.replace('−', '-');
        setText(raw);
        const v = Number(raw);
        if (raw.trim() !== '' && raw !== '-' && Number.isFinite(v)) onChange(clamp(v));
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const k = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
          const v = clamp(Math.round((value + k) * 1e6) / 1e6);
          onChange(v);
          setText(fmt(v, digits));
        } else if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cx(
        'h-9 w-16 px-1.5 text-center font-mono text-[14px] tabular rounded-[3px] border bg-surface',
        'border-rule-strong hover:border-ink-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
        emphasize && 'bg-primary-soft border-primary/50 font-semibold',
        className
      )}
    />
  );
};

/** Labelled slider + exact numeric entry. */
export const SliderField: React.FC<{
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  color?: string;
  digits?: number;
  unit?: string;
}> = ({ label, value, min, max, step = 0.1, onChange, color, digits = 2, unit }) => {
  const id = useId();
  const pct = ((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[14px] text-ink-2 min-w-0">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <NumberInput value={value} onChange={onChange} step={step} min={min} max={max} digits={digits} ariaLabel={typeof label === 'string' ? label : '数值'} />
          {unit && <span className="text-[13px] text-ink-3">{unit}</span>}
        </div>
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': `${pct}%`, ...(color ? { '--track-fill': color } : {}) } as React.CSSProperties}
      />
    </div>
  );
};

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; color?: string }> = ({
  checked,
  onChange,
  children,
  color,
}) => (
  <label className="inline-flex items-center gap-2 text-[14px] text-ink-2 cursor-pointer select-none min-h-8">
    <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span
      aria-hidden="true"
      className="w-4 h-4 rounded-[3px] border-[1.5px] border-ink-3 flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 transition-colors"
      style={checked ? { background: color ?? 'var(--color-ink)', borderColor: color ?? 'var(--color-ink)' } : undefined}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
    <span>{children}</span>
  </label>
);

/** Editable matrix with pmatrix brackets. */
export const MatrixInput: React.FC<{
  value: number[][];
  onChange: (m: number[][]) => void;
  step?: number;
  ariaLabel: string;
  cellClass?: (r: number, c: number) => string | undefined;
  colColors?: string[];
  digits?: number;
}> = ({ value, onChange, step = 0.1, ariaLabel, cellClass, colColors, digits = 2 }) => (
  <div role="group" aria-label={ariaLabel} className="inline-block pmatrix">
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${value[0]?.length ?? 1}, minmax(0, auto))` }}>
      {value.map((row, r) =>
        row.map((val, c) => (
          <NumberInput
            key={`${r}-${c}`}
            value={val}
            step={step}
            digits={digits}
            ariaLabel={`${ariaLabel} 第 ${r + 1} 行第 ${c + 1} 列`}
            className={cx('w-[60px]', cellClass?.(r, c))}
            onChange={(v) => {
              const next = value.map((rr) => [...rr]);
              next[r][c] = v;
              onChange(next);
            }}
          />
        ))
      )}
    </div>
    {colColors && (
      <div className="grid gap-1 mt-1" style={{ gridTemplateColumns: `repeat(${colColors.length}, minmax(0, auto))` }} aria-hidden="true">
        {colColors.map((c, i) => (
          <span key={i} className="block h-[3px] w-[60px] rounded-full" style={{ background: c }} />
        ))}
      </div>
    )}
  </div>
);

/** Inline coordinate row:  name = ( x , y [, z] ) */
export const VectorInput: React.FC<{
  name: React.ReactNode;
  value: number[];
  onChange: (v: number[]) => void;
  color?: string;
  step?: number;
  min?: number;
  max?: number;
}> = ({ name, value, onChange, color, step = 0.1, min, max }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <span className="font-serif italic font-bold text-[18px] w-8 shrink-0" style={{ color }}>
      {name}
    </span>
    <span className="text-ink-3">=</span>
    <span className="text-ink-3 text-lg leading-none">(</span>
    {value.map((x, i) => (
      <React.Fragment key={i}>
        <NumberInput
          value={x}
          step={step}
          min={min}
          max={max}
          ariaLabel={`${typeof name === 'string' ? name : '向量'} 第 ${i + 1} 个分量`}
          onChange={(v) => {
            const next = [...value];
            next[i] = v;
            onChange(next);
          }}
          className="w-[58px]"
        />
        {i < value.length - 1 && <span className="text-ink-3">,</span>}
      </React.Fragment>
    ))}
    <span className="text-ink-3 text-lg leading-none">)</span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Presets & guided tasks                                              */
/* ------------------------------------------------------------------ */

export const Presets: React.FC<{
  items: { label: React.ReactNode; onClick: () => void; active?: boolean }[];
  label?: string;
}> = ({ items, label = '预设' }) => (
  <div>
    <div className="eyebrow mb-1.5">{label}</div>
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <Button key={i} size="sm" variant="secondary" active={it.active} onClick={it.onClick}>
          {it.label}
        </Button>
      ))}
    </div>
  </div>
);

/** Remembers which conditions have been satisfied at least once. */
export function useLatch(conds: Record<string, boolean>): Record<string, boolean> {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const key = Object.entries(conds)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join('|');
  useEffect(() => {
    if (!key) return;
    setDone((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of key.split('|')) {
        if (!next[k]) {
          next[k] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [key]);
  return done;
}

export const Tasks: React.FC<{ items: { id: string; label: React.ReactNode }[]; done: Record<string, boolean> }> = ({
  items,
  done,
}) => {
  const n = items.filter((t) => done[t.id]).length;
  return (
    <Panel
      title="探究任务"
      actions={
        <span className="font-mono text-[13px] tabular text-ink-3" aria-label={`已完成 ${n} 项，共 ${items.length} 项`}>
          {n}/{items.length}
        </span>
      }
    >
      <ol className="space-y-2.5 -mt-1">
        {items.map((t, i) => {
          const ok = !!done[t.id];
          return (
            <li key={t.id} className="flex gap-2.5 items-start text-[14px] leading-snug">
              <span className="mt-0.5 shrink-0" aria-hidden="true">
                {ok ? (
                  <span className="w-[18px] h-[18px] rounded-full bg-success flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                ) : (
                  <Circle className="w-[18px] h-[18px] text-rule-strong" />
                )}
              </span>
              <span className={ok ? 'text-ink-3' : 'text-ink'}>
                <span className="font-mono text-[12px] text-ink-3 mr-1.5">{i + 1}.</span>
                {t.label}
                <span className="sr-only">{ok ? '（已完成）' : '（未完成）'}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
};
