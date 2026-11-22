import React, { useState } from 'react';
import { Tex } from '../components/MathText';
import { LabGrid, MathBox, Note, NumberInput, Panel, Presets, Status, Tasks, useLatch } from '../components/ui';
import { fmt } from '../utils/math';

// Polynomial represented as ascending coefficients [a0, a1, a2, ...]
type Poly = number[];

function trim(p: Poly): Poly {
  const res = [...p];
  while (res.length > 1 && Math.abs(res[res.length - 1]) < 1e-8) res.pop();
  return res.length ? res : [0];
}

function deg(p: Poly): number {
  const t = trim(p);
  return t.length === 1 && Math.abs(t[0]) < 1e-8 ? -1 : t.length - 1;
}

function addP(a: Poly, b: Poly): Poly {
  const n = Math.max(a.length, b.length);
  const res = Array.from({ length: n }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0));
  return trim(res);
}

function subP(a: Poly, b: Poly): Poly {
  const n = Math.max(a.length, b.length);
  const res = Array.from({ length: n }, (_, i) => (a[i] ?? 0) - (b[i] ?? 0));
  return trim(res);
}

function mulP(a: Poly, b: Poly): Poly {
  const res = Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) res[i + j] += a[i] * b[j];
  return trim(res);
}

function scaleP(a: Poly, c: number): Poly {
  return trim(a.map((v) => v * c));
}

function divmodP(a: Poly, b: Poly): { q: Poly; r: Poly } {
  const r = trim(a);
  const d = trim(b);
  if (deg(d) < 0) return { q: [0], r };
  const q = Array(Math.max(1, r.length - d.length + 1)).fill(0);
  const lc = d[d.length - 1];
  while (deg(r) >= deg(d)) {
    const shift = deg(r) - deg(d);
    const coef = r[r.length - 1] / lc;
    q[shift] += coef;
    for (let i = 0; i < d.length; i++) r[i + shift] -= coef * d[i];
    while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-8) r.pop();
  }
  return { q: trim(q), r: trim(r) };
}

interface EuclidStep {
  a: Poly;
  b: Poly;
  q: Poly;
  r: Poly;
}

function extendedEuclid(f: Poly, g: Poly): { steps: EuclidStep[]; gcd: Poly; u: Poly; v: Poly } {
  let r0 = trim(f), r1 = trim(g);
  let u0: Poly = [1], u1: Poly = [0];
  let v0: Poly = [0], v1: Poly = [1];
  const steps: EuclidStep[] = [];
  let guard = 0;
  while (deg(r1) >= 0 && guard++ < 10) {
    const { q, r } = divmodP(r0, r1);
    steps.push({ a: r0, b: r1, q, r });
    const u2 = subP(u0, mulP(q, u1));
    const v2 = subP(v0, mulP(q, v1));
    r0 = r1; r1 = r;
    u0 = u1; u1 = u2;
    v0 = v1; v1 = v2;
  }
  // Normalize gcd to monic
  const lead = r0[r0.length - 1];
  if (Math.abs(lead) > 1e-8) {
    return { steps, gcd: scaleP(r0, 1 / lead), u: scaleP(u0, 1 / lead), v: scaleP(v0, 1 / lead) };
  }
  return { steps, gcd: r0, u: u0, v: v0 };
}

function polyTex(p: Poly): string {
  const t = trim(p);
  const terms: string[] = [];
  for (let k = t.length - 1; k >= 0; k--) {
    const c = t[k];
    if (Math.abs(c) < 1e-6) continue;
    const sign = terms.length > 0 ? (c > 0 ? ' + ' : ' - ') : c < 0 ? '-' : '';
    const ac = Math.abs(c);
    const numStr = k === 0 || Math.abs(ac - 1) > 1e-6 ? fmt(ac) : '';
    const xStr = k === 0 ? '' : k === 1 ? 'x' : `x^${k}`;
    terms.push(`${sign}${numStr}${xStr}`);
  }
  return terms.length ? terms.join('') : '0';
}

export const Ch00PolynomialGcdLab: React.FC = () => {
  // f(x) = x^3 - 3x^2 + 2x = x(x-1)(x-2), g(x) = x^2 - 1 = (x-1)(x+1)
  const [f, setF] = useState<Poly>([0, 2, -3, 1]);
  const [g, setG] = useState<Poly>([-1, 0, 1]);

  const { steps, gcd, u, v } = extendedEuclid(f, g);
  const check = addP(mulP(u, f), mulP(v, g));
  const isCoprime = deg(gcd) === 0;

  const done = useLatch({
    commonFactor: deg(gcd) >= 1,
    coprime: isCoprime,
    divisible: steps.length === 1 && deg(steps[0].r) < 0,
  });

  const upd = (arr: Poly, setter: (p: Poly) => void, idx: number, val: number) => {
    const next = [...arr];
    next[idx] = val;
    setter(next);
  };

  return (
    <LabGrid
      wideStage
      stage={
        <Panel title="Euclid 辗转相除与 Bézout 等式">
          <MathBox>
            <Tex block math={`f(x) = ${polyTex(f)},\\qquad g(x) = ${polyTex(g)}`} />
          </MathBox>

          <div className="space-y-2">
            <div className="eyebrow">带余除法逐步演算</div>
            {steps.map((st, idx) => (
              <MathBox key={idx}>
                <Tex
                  block
                  math={`\\text{第 ${idx + 1} 步：}\\bigl(${polyTex(st.a)}\\bigr) = \\bigl(${polyTex(st.q)}\\bigr)\\bigl(${polyTex(st.b)}\\bigr) + \\bigl(${polyTex(st.r)}\\bigr)`}
                />
              </MathBox>
            ))}
          </div>

          <MathBox tone="ok">
            <Tex block math={`\\gcd(f, g) = ${polyTex(gcd)} \\quad\\text{（首一最大公因式）}`} />
            <Tex block math={`u(x) = ${polyTex(u)},\\qquad v(x) = ${polyTex(v)}`} />
            <Tex block math={`u(x)f(x) + v(x)g(x) = ${polyTex(check)}`} />
          </MathBox>

          <Status tone={isCoprime ? 'ok' : 'info'}>
            {isCoprime
              ? 'gcd(f, g) = 1：f(x) 与 g(x) 互素！存在多项式 u, v 使 uf + vg = 1。'
              : `存在非平凡公因式 ${polyTex(gcd)}（次数 ${deg(gcd)}）。`}
          </Status>
        </Panel>
      }
      side={
        <>
          <Panel title="编辑多项式系数">
            <Presets
              label="典型例子"
              items={[
                { label: '有公因式 (x−1)', onClick: () => { setF([0, 2, -3, 1]); setG([-1, 0, 1]); } },
                { label: '互素多项式', onClick: () => { setF([1, 0, 0, 1]); setG([1, 1, 1]); } },
                { label: '整除 g | f', onClick: () => { setF([-1, 0, 0, 1]); setG([-1, 1, 0]); } },
                { label: '二次公因式 (x²+1)', onClick: () => { setF([1, 1, 1, 1]); setG([1, 0, 1]); } },
              ]}
            />
            <div className="space-y-2">
              <div className="text-[13px] font-semibold text-ink-2">f(x) = a₃x³ + a₂x² + a₁x + a₀</div>
              <div className="flex flex-wrap gap-2">
                {[3, 2, 1, 0].map((k) => (
                  <label key={k} className="flex items-center gap-1 text-[13px]">
                    <span>x^{k}:</span>
                    <NumberInput value={f[k] ?? 0} step={1} digits={1} ariaLabel={`f 的 x^${k} 系数`} onChange={(val) => upd(f, setF, k, val)} className="w-14" />
                  </label>
                ))}
              </div>
              <div className="text-[13px] font-semibold text-ink-2 pt-2">g(x) = b₂x² + b₁x + b₀</div>
              <div className="flex flex-wrap gap-2">
                {[2, 1, 0].map((k) => (
                  <label key={k} className="flex items-center gap-1 text-[13px]">
                    <span>x^{k}:</span>
                    <NumberInput value={g[k] ?? 0} step={1} digits={1} ariaLabel={`g 的 x^${k} 系数`} onChange={(val) => upd(g, setG, k, val)} className="w-14" />
                  </label>
                ))}
              </div>
            </div>
            <Note label="Bézout 定理">
              对任意不全为零的多项式 <Tex math="f, g" />，必存在 <Tex math="u, v" /> 使得 <Tex math="uf+vg=\gcd(f,g)" />；这是第 7 章极小多项式与不变子空间分解的重要代数工具。
            </Note>
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'commonFactor', label: '测试“有公因式 (x−1)”，观察辗转相除何时停下' },
              { id: 'coprime', label: '切换到“互素多项式”，验证 Bézout 组合等于常数 1' },
              { id: 'divisible', label: '切换到“整除 g | f”，观察余式一步为零' },
            ]}
          />
        </>
      }
    />
  );
};
