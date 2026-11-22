import React, { useState } from 'react';
import { Canvas2D, SvgArc, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, Segmented, SliderField, Swatch, Tasks, Toggle, VectorInput, useLatch } from '../components/ui';
import { fmt, type Vec2 } from '../utils/math';
import { C } from '../theme';

type Mode = 'mul' | 'pow' | 'roots';

const cmul = (a: Vec2, b: Vec2): Vec2 => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cabs = (a: Vec2) => Math.hypot(a[0], a[1]);
const carg = (a: Vec2) => Math.atan2(a[1], a[0]);
const deg = (r: number) => (r * 180) / Math.PI;
const ctex = (z: Vec2) => {
  const re = fmt(z[0]);
  const im = fmt(Math.abs(z[1]));
  if (Math.abs(z[1]) < 1e-9) return re;
  if (Math.abs(z[0]) < 1e-9) return `${z[1] < 0 ? '-' : ''}${im === '1' ? '' : im}\\ii`;
  return `${re} ${z[1] < 0 ? '-' : '+'} ${im === '1' ? '' : im}\\ii`;
};

export const Ch00ComplexLab: React.FC = () => {
  const [mode, setMode] = useState<Mode>('mul');
  const [z1, setZ1] = useState<Vec2>([1.6, 0.6]);
  const [z2, setZ2] = useState<Vec2>([0.7, 1.2]);
  const [showSum, setShowSum] = useState(false);
  const [z, setZ] = useState<Vec2>([1.05, 0.35]);
  const [nPow, setNPow] = useState(8);
  const [w, setW] = useState<Vec2>([1, 0]);
  const [nRoot, setNRoot] = useState(6);

  const prod = cmul(z1, z2);
  const sum: Vec2 = [z1[0] + z2[0], z1[1] + z2[1]];

  const powers: Vec2[] = [[1, 0]];
  for (let k = 1; k <= nPow; k++) powers.push(cmul(powers[k - 1], z));
  const z6 = [1, 2, 3, 4, 5, 6].reduce<Vec2>((acc) => cmul(acc, z), [1, 0]);

  const rw = cabs(w);
  const tw = carg(w);
  const rootR = Math.pow(rw, 1 / nRoot);
  const roots: Vec2[] = Array.from({ length: nRoot }, (_, k) => {
    const a = (tw + 2 * Math.PI * k) / nRoot;
    return [rootR * Math.cos(a), rootR * Math.sin(a)];
  });

  const done = useLatch({
    real: mode === 'mul' && Math.abs(prod[1]) < 0.06 && prod[0] > 0.2,
    unit: mode === 'mul' && Math.abs(cabs(prod) - 1) < 0.04 && Math.abs(cabs(z1) - 1) > 0.25,
    conj: mode === 'mul' && Math.hypot(z2[0] - z1[0], z2[1] + z1[1]) < 0.06 && Math.abs(z1[1]) > 0.3,
    root6: mode === 'pow' && Math.hypot(z6[0] - 1, z6[1]) < 0.08 && Math.hypot(z[0] - 1, z[1]) > 0.2,
    cube: mode === 'roots' && nRoot === 3 && Math.hypot(w[0] + 8, w[1]) < 0.1,
  });

  const range = mode === 'mul' ? 3.2 : mode === 'pow' ? 2.4 : 2.2;

  const handles =
    mode === 'mul'
      ? [
          { id: 'z1', pos: z1, color: C.blue, label: 'z₁', onChange: setZ1 },
          { id: 'z2', pos: z2, color: C.red, label: 'z₂', onChange: setZ2 },
        ]
      : mode === 'pow'
      ? [{ id: 'z', pos: z, color: C.blue, label: 'z', onChange: setZ, snap: 0.01 }]
      : [{ id: 'w', pos: w, color: C.red, label: 'w', onChange: setW }];

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="实验模式"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'mul', label: '乘法 = 旋转 × 伸缩' },
          { value: 'pow', label: '乘方与 de Moivre' },
          { value: 'roots', label: 'n 次方根' },
        ]}
      />
      <LabGrid
        stage={
          <Figure
            caption={
              mode === 'mul'
                ? '辐角相加、模相乘。圆弧标出各自的辐角。'
                : mode === 'pow'
                ? '1, z, z², …, zⁿ 依次连成折线；|z| ≠ 1 时为等角螺线。'
                : `wⁿ 的 ${nRoot} 个方根均匀分布在半径为 |w|^{1/n} 的圆上。`
            }
            legend={
              mode === 'mul' ? (
                <>
                  <Swatch color={C.blue} label="z₁" />
                  <Swatch color={C.red} label="z₂" />
                  <Swatch color={C.violet} label="z₁z₂" />
                </>
              ) : null
            }
          >
            <Canvas2D range={range} handles={handles} axisLabels={['Re', 'Im']} ariaLabel="复平面">
              {({ toSvg, scale, cx, cy }) => {
                const o = toSvg([0, 0]);
                const unit = <circle cx={cx} cy={cy} r={scale} fill="none" stroke={C.ruleStrong} strokeDasharray="4 4" />;
                if (mode === 'mul') {
                  const a1 = carg(z1);
                  const a2 = carg(z2);
                  return (
                    <g>
                      {unit}
                      {showSum && (
                        <>
                          <polygon points={`${o} ${toSvg(z1)} ${toSvg(sum)} ${toSvg(z2)}`} fill={C.green} fillOpacity={0.07} stroke={C.green} strokeDasharray="4 3" />
                          <SvgArrow from={o} to={toSvg(sum)} color={C.green} width={2} />
                          <SvgLabel at={toSvg(sum)} color={C.green} size={15}>z₁+z₂</SvgLabel>
                        </>
                      )}
                      <SvgArc at={o} r={26} a0={0} a1={a1} color={C.blue} width={2} />
                      <SvgArc at={o} r={36} a0={a1} a1={a1 + a2} color={C.red} width={2} />
                      <SvgArc at={o} r={46} a0={0} a1={a1 + a2} color={C.violet} width={1.2} dashed />
                      <SvgArrow from={o} to={toSvg(z1)} color={C.blue} width={2.6} />
                      <SvgArrow from={o} to={toSvg(z2)} color={C.red} width={2.6} />
                      <SvgArrow from={o} to={toSvg(prod)} color={C.violet} width={3} />
                      <SvgLabel at={toSvg(prod)} color={C.violet}>z₁z₂</SvgLabel>
                    </g>
                  );
                }
                if (mode === 'pow') {
                  const pts = powers.map((p) => toSvg(p));
                  return (
                    <g>
                      {unit}
                      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.violet} strokeWidth={1.6} strokeOpacity={0.6} />
                      {pts.map((p, k) => (
                        <g key={k}>
                          <SvgPoint at={p} color={k === nPow ? C.violet : C.ink2} r={k === nPow ? 5.5 : 3.5} />
                          {k > 1 && k <= 12 && (
                            <SvgLabel at={p} color={C.ink2} size={13} dx={6} dy={14}>
                              {`z${['', '', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰', '¹¹', '¹²'][k]}`}
                            </SvgLabel>
                          )}
                        </g>
                      ))}
                      <SvgArrow from={o} to={pts[nPow]} color={C.violet} width={2.4} />
                      <SvgArrow from={o} to={toSvg(z)} color={C.blue} width={2.6} />
                    </g>
                  );
                }
                const poly = roots.map((r) => toSvg(r).join(',')).join(' ');
                return (
                  <g>
                    {unit}
                    <circle cx={cx} cy={cy} r={rootR * scale} fill="none" stroke={C.violet} strokeOpacity={0.5} />
                    <polygon points={poly} fill={C.violet} fillOpacity={0.08} stroke={C.violet} strokeWidth={1.6} />
                    {roots.map((r, k) => (
                      <g key={k}>
                        <SvgArrow from={o} to={toSvg(r)} color={C.violet} width={1.6} opacity={0.75} />
                        <SvgPoint at={toSvg(r)} color={C.violet} r={4.5} />
                        <SvgLabel at={toSvg([r[0] * 1.18, r[1] * 1.18])} color={C.ink2} size={14} dx={0} dy={5} anchor="middle">
                          {`ζ${['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₁₀', '₁₁'][k]}`}
                        </SvgLabel>
                      </g>
                    ))}
                    <SvgArrow from={o} to={toSvg(w)} color={C.red} width={2.4} />
                  </g>
                );
              }}
            </Canvas2D>
          </Figure>
        }
        side={
          <>
            {mode === 'mul' && (
              <Panel title="输入">
                <VectorInput name="z₁" color={C.blue} value={z1} onChange={(v) => setZ1(v as Vec2)} />
                <VectorInput name="z₂" color={C.red} value={z2} onChange={(v) => setZ2(v as Vec2)} />
                <Toggle checked={showSum} onChange={setShowSum} color={C.green}>
                  同时显示加法 z₁ + z₂（平行四边形法则）
                </Toggle>
                <MathBox>
                  <Tex block math={`z_1 = ${fmt(cabs(z1))}\\,\\e^{\\ii\\,${fmt(deg(carg(z1)), 1)}^\\circ},\\quad z_2 = ${fmt(cabs(z2))}\\,\\e^{\\ii\\,${fmt(deg(carg(z2)), 1)}^\\circ}`} />
                  <Tex block math={`z_1z_2 = ${ctex(prod)} = ${fmt(cabs(z1) * cabs(z2))}\\,\\e^{\\ii\\,${fmt(deg(carg(z1) + carg(z2)), 1)}^\\circ}`} />
                </MathBox>
                <Presets
                  items={[
                    { label: '乘以 i', onClick: () => { setZ1([1.8, 0.6]); setZ2([0, 1]); } },
                    { label: '乘以 −1', onClick: () => { setZ1([1.4, 0.9]); setZ2([-1, 0]); } },
                    { label: '共轭相乘', onClick: () => { setZ1([1.2, 0.9]); setZ2([1.2, -0.9]); } },
                  ]}
                />
              </Panel>
            )}
            {mode === 'pow' && (
              <Panel title="输入">
                <VectorInput name="z" color={C.blue} value={z} step={0.01} onChange={(v) => setZ(v as Vec2)} />
                <SliderField label="指数 n" value={nPow} min={1} max={24} step={1} digits={0} onChange={setNPow} />
                <MathBox>
                  <Tex block math={`z^{${nPow}} = r^{${nPow}}(\\cos ${nPow}\\theta + \\ii\\sin ${nPow}\\theta) = ${ctex(powers[nPow])}`} />
                  <Tex block math={`r = ${fmt(cabs(z), 3)},\\quad \\theta = ${fmt(deg(carg(z)), 1)}^\\circ`} />
                </MathBox>
                <Presets
                  items={[
                    { label: '|z| = 1', onClick: () => { const a = carg(z); setZ([Math.cos(a), Math.sin(a)]); } },
                    { label: '向外螺旋', onClick: () => setZ([1.0, 0.3]) },
                    { label: '向内螺旋', onClick: () => setZ([0.85, 0.35]) },
                  ]}
                />
              </Panel>
            )}
            {mode === 'roots' && (
              <Panel title="输入">
                <VectorInput name="w" color={C.red} value={w} onChange={(v) => setW(v as Vec2)} />
                <SliderField label="次数 n" value={nRoot} min={2} max={12} step={1} digits={0} onChange={setNRoot} />
                <MathBox>
                  <Tex block math={`\\zeta_k = |w|^{1/${nRoot}}\\,\\e^{\\ii\\frac{\\arg w + 2k\\pi}{${nRoot}}},\\quad k = 0,\\dots,${nRoot - 1}`} />
                  <Tex block math={`|w|^{1/${nRoot}} = ${fmt(rootR, 3)},\\qquad \\textstyle\\sum_k \\zeta_k = 0`} />
                </MathBox>
                <Presets
                  items={[
                    { label: 'w = 1（单位根）', onClick: () => setW([1, 0]) },
                    { label: 'w = i', onClick: () => setW([0, 1]) },
                    { label: 'w = −1', onClick: () => setW([-1, 0]) },
                  ]}
                />
              </Panel>
            )}
            <Tasks
              done={done}
              items={[
                { id: 'real', label: '乘法模式：调整 z₂，使积 z₁z₂ 落在正实轴上。' },
                { id: 'unit', label: '乘法模式：在 |z₁| ≠ 1 的情况下让 |z₁z₂| = 1。' },
                { id: 'conj', label: '乘法模式：让 z₂ = z̄₁，观察积是否为实数。' },
                { id: 'root6', label: '乘方模式：找一个 z ≠ 1，使 z⁶ = 1。' },
                { id: 'cube', label: '方根模式：取 n = 3，求 −8 的三个立方根。' },
              ]}
            />
            <Note>
              复数乘法给出平面上的相似变换：乘以 z 等于旋转 arg z 再伸缩 |z| 倍。在第 7 章中，实 2×2 矩阵 (a −b; b a) 的特征值正是 a ± bi。
            </Note>
          </>
        }
      />
    </div>
  );
};
