import React, { useState } from 'react';
import { Canvas2D } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { fmt } from '../utils/math';
import { C } from '../theme';

function deriv(c: number[]): number[] {
  return [c[1] ?? 0, 2 * (c[2] ?? 0), 3 * (c[3] ?? 0), 0];
}

function evalP(c: number[], x: number): number {
  return c[0] + c[1] * x + c[2] * x * x + c[3] * x * x * x;
}

function polyTex(c: number[]): string {
  const parts: string[] = [];
  for (let k = 3; k >= 0; k--) {
    const v = c[k] ?? 0;
    if (Math.abs(v) < 1e-6) continue;
    const sign = parts.length > 0 ? (v > 0 ? ' + ' : ' - ') : v < 0 ? '-' : '';
    const av = Math.abs(v);
    const num = k === 0 || Math.abs(av - 1) > 1e-6 ? fmt(av) : '';
    const x = k === 0 ? '' : k === 1 ? 'x' : `x^${k}`;
    parts.push(`${sign}${num}${x}`);
  }
  return parts.length ? parts.join('') : '0';
}

export const Ch03DerivativeNilpotentLab: React.FC = () => {
  const [a0, setA0] = useState(0.5);
  const [a1, setA1] = useState(-1.0);
  const [a2, setA2] = useState(0.5);
  const [a3, setA3] = useState(0.4);
  const [order, setOrder] = useState(1);

  const p0 = [a0, a1, a2, a3];
  const p1 = deriv(p0);
  const p2 = deriv(p1);
  const p3 = deriv(p2);
  const p4 = deriv(p3);
  const chain = [p0, p1, p2, p3, p4];
  const cur = chain[order];
  const isZero = cur.every((v) => Math.abs(v) < 1e-6);

  const done = useLatch({
    d1: order === 1,
    d4: order === 4 && isZero,
    inKerD: Math.abs(a1) < 1e-5 && Math.abs(a2) < 1e-5 && Math.abs(a3) < 1e-5,
  });

  return (
    <LabGrid
      stage={
        <Figure
          caption="浅蓝为原多项式 p(x)，橙色为反复施加求导映射 D 后的像 Dᵏ(p)；不借助矩阵，直接体验无穷维/多项式空间上的幂零线性变换。"
          legend={
            <>
              <Swatch color={C.blue} label="p(x)" />
              <Swatch color={C.accent} label={`D^${order}(p)`} />
            </>
          }
        >
          <Canvas2D range={3.5} aspect={1.35} ariaLabel="多项式求导幂零变换画布">
            {({ toSvg }) => {
              const xs = Array.from({ length: 141 }, (_, i) => -2.5 + (5 * i) / 140);
              const pts0 = xs.map((x) => toSvg([x, evalP(p0, x)]).join(',')).join(' ');
              const ptsCur = xs.map((x) => toSvg([x, evalP(cur, x)]).join(',')).join(' ');
              return (
                <g>
                  <polyline points={pts0} fill="none" stroke={C.blue} strokeWidth={2.2} strokeOpacity={0.55} />
                  <polyline points={ptsCur} fill="none" stroke={C.accent} strokeWidth={3} />
                </g>
              );
            }}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel title="求导算子 D(p) = p′（无矩阵表示）">
            <SliderField label="a₀（常数项）" value={a0} min={-2} max={2} step={0.2} onChange={setA0} />
            <SliderField label="a₁（x 项）" value={a1} min={-2} max={2} step={0.2} onChange={setA1} />
            <SliderField label="a₂（x² 项）" value={a2} min={-2} max={2} step={0.2} onChange={setA2} />
            <SliderField label="a₃（x³ 项）" value={a3} min={-2} max={2} step={0.2} onChange={setA3} />
            <Presets
              label="特殊输入"
              items={[
                { label: '一般三次多项式', onClick: () => { setA0(0.5); setA1(-1); setA2(0.5); setA3(0.4); setOrder(1); } },
                { label: '常数函数 ∈ ker D', onClick: () => { setA0(1.4); setA1(0); setA2(0); setA3(0); setOrder(1); } },
                { label: '二次函数 ∈ ker D²', onClick: () => { setA0(0.2); setA1(0.6); setA2(-0.8); setA3(0); setOrder(2); } },
              ]}
            />
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 2, 3, 4].map((k) => (
                <Button key={k} size="sm" variant="secondary" active={order === k} onClick={() => setOrder(k)}>
                  D^{k}(p)
                </Button>
              ))}
            </div>
          </Panel>

          <Panel title="幂零链：像收缩、核扩张">
            <MathBox tone={isZero ? 'ok' : 'neutral'}>
              <Tex block math={`\\mathrm{D}^0(p) = ${polyTex(p0)}`} />
              <Tex block math={`\\mathrm{D}^1(p) = ${polyTex(p1)}`} />
              <Tex block math={`\\mathrm{D}^2(p) = ${polyTex(p2)}`} />
              <Tex block math={`\\mathrm{D}^3(p) = ${polyTex(p3)}`} />
              <Tex block math={`\\mathrm{D}^4(p) = ${polyTex(p4)}`} />
            </MathBox>
            <Status tone={isZero ? 'ok' : 'info'}>
              {isZero
                ? `D^${order}(p) ≡ 0！对任意 3 次以下多项式，D⁴ 恒为零映射，故 D 是幂零指数为 4 的幂零变换。`
                : `每次求导次数降 1：im(D^${order}) = ℝ_${Math.max(0, 3 - order)}[x]，dim ker(D^${order}) = ${Math.min(4, order)}。`}
            </Status>
            <Note label="教材 §3.3">
              <Tex math="\ker\mathrm{D} \subset \ker\mathrm{D}^2 \subset \ker\mathrm{D}^3 \subset \ker\mathrm{D}^4 = \mathbb{R}_3[x]" />，核空间维数依次为 1, 2, 3, 4，而像空间维数依次为 3, 2, 1, 0。
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'd1', label: '点击 D¹(p)，观察常数项 a₀ 消失（被映入核空间）' },
              { id: 'd4', label: '依次点击至 D⁴(p)，验证任意三次多项式 4 次求导后恒为零' },
              { id: 'inKerD', label: '切换到“常数函数 ∈ ker D”，验证一次求导即归零' },
            ]}
          />
        </>
      }
    />
  );
};
