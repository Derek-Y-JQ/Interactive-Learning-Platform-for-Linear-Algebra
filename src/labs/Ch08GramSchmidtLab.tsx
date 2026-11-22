import React, { useState } from 'react';
import { Canvas2D } from '../components/Canvas2D';
import { ThreeViewport, addFatLine, addPolygon3D, addVector3D } from '../components/ThreeViewport';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, Note, Panel, Presets, Segmented, Status, Swatch, Tasks, Toggle, VectorInput, useLatch } from '../components/ui';
import { dot3, fmt, norm3, type Vec2, type Vec3 } from '../utils/math';
import { C } from '../theme';

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (k: number, a: Vec3): Vec3 => [k * a[0], k * a[1], k * a[2]];
const addv = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

function solve(M: number[][], b: number[]): number[] | null {
  const n = b.length;
  const A = M.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    if (Math.abs(A[p][c]) < 1e-10) return null;
    [A[c], A[p]] = [A[p], A[c]];
    for (let i = 0; i < n; i++) {
      if (i === c) continue;
      const f = A[i][c] / A[c][c];
      for (let j = c; j <= n; j++) A[i][j] -= f * A[c][j];
    }
  }
  return A.map((r, i) => r[n] / r[i]);
}

const SUP = ['', 'x', 'x^2', 'x^3'];

export const Ch08GramSchmidtLab: React.FC = () => {
  const [tab, setTab] = useState<'gs' | 'lsq'>('gs');
  const [V, setV] = useState<[Vec3, Vec3, Vec3]>([
    [2, 0.5, 0.3],
    [1.2, 1.8, 0.4],
    [0.6, 0.8, 1.8],
  ]);
  const [step, setStep] = useState(1);

  const [pts, setPts] = useState<Vec2[]>([
    [-2.5, -1.3],
    [-1.2, -0.2],
    [0, 0.4],
    [1.1, 1.5],
    [2.4, 2.1],
  ]);
  const [deg, setDeg] = useState(1);
  const [squares, setSquares] = useState(false);

  /* ---------- Gram–Schmidt ---------- */
  const [v1, v2, v3] = V;
  const n1 = norm3(v1);
  const e1: Vec3 = n1 > 1e-9 ? scl(1 / n1, v1) : [0, 0, 0];
  const p21 = scl(dot3(v2, e1), e1);
  const u2 = sub(v2, p21);
  const n2 = norm3(u2);
  const e2: Vec3 = n2 > 1e-6 ? scl(1 / n2, u2) : [0, 0, 0];
  const p3 = addv(scl(dot3(v3, e1), e1), scl(dot3(v3, e2), e2));
  const u3 = sub(v3, p3);
  const n3 = norm3(u3);
  const e3: Vec3 = n3 > 1e-6 ? scl(1 / n3, u3) : [0, 0, 0];
  const R = [
    [n1, dot3(v2, e1), dot3(v3, e1)],
    [0, n2, dot3(v3, e2)],
    [0, 0, n3],
  ];

  /* ---------- least squares ---------- */
  const k = deg + 1;
  const AtA = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => pts.reduce((s, p) => s + p[0] ** (i + j), 0)));
  const Atb = Array.from({ length: k }, (_, i) => pts.reduce((s, p) => s + p[0] ** i * p[1], 0));
  const coef = pts.length >= k ? solve(AtA, Atb) : null;
  const f = (x: number) => (coef ? coef.reduce((s, c, i) => s + c * x ** i, 0) : 0);
  const res = pts.map((p) => p[1] - f(p[0]));
  const sse = res.reduce((s, r) => s + r * r, 0);
  const Atr = Array.from({ length: k }, (_, i) => pts.reduce((s, p, j) => s + p[0] ** i * res[j], 0));

  const done = useLatch({
    full: tab === 'gs' && step === 3,
    dep: tab === 'gs' && n3 < 0.05 && n2 > 0.3,
    orth: tab === 'gs' && Math.abs(dot3(v1, v2)) < 0.05 && Math.abs(dot3(v1, v3)) < 0.05 && Math.abs(dot3(v2, v3)) < 0.05,
    fit: tab === 'lsq' && !!coef && pts.length >= 4 && sse < 0.05,
    cubic: tab === 'lsq' && deg === 3 && !!coef,
    outlier: tab === 'lsq' && res.some((r) => Math.abs(r) > 2),
  });

  const polyTex = coef
    ? coef
        .map((c, i) => ({ c, i }))
        .reverse()
        .map(({ c, i }, idx) => `${idx === 0 ? (c < 0 ? '-' : '') : c < 0 ? ' - ' : ' + '}${fmt(Math.abs(c))}${SUP[i]}`)
        .join('')
    : '';

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="实验模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'gs', label: 'Gram–Schmidt（三维）' },
          { value: 'lsq', label: '最小二乘拟合' },
        ]}
      />
      {tab === 'gs' ? (
        <LabGrid
          stage={
            <Figure
              caption={
                step === 0
                  ? '原始向量组 v₁, v₂, v₃。'
                  : step === 1
                  ? 'e₁ = v₁ / ‖v₁‖。'
                  : step === 2
                  ? 'v₂ 减去它在 e₁ 上的投影（虚线），得到 u₂ ⊥ e₁。'
                  : 'v₃ 减去它在平面 span(e₁, e₂) 上的投影，得到 u₃。'
              }
              legend={
                <>
                  <Swatch color={C.gray} label="vₖ" />
                  <Swatch color={C.blue} label="e₁" />
                  <Swatch color={C.red} label="e₂" />
                  <Swatch color={C.green} label="e₃" />
                </>
              }
            >
              <ThreeViewport
                deps={[V, step]}
                gridSize={6}
                handles={[
                  { id: 'v1', pos: v1, color: C.blue, onChange: (p) => setV([p, v2, v3]) },
                  { id: 'v2', pos: v2, color: C.red, onChange: (p) => setV([v1, p, v3]) },
                  { id: 'v3', pos: v3, color: C.green, onChange: (p) => setV([v1, v2, p]) },
                ]}
                buildScene={(g) => {
                  const O: Vec3 = [0, 0, 0];
                  addVector3D(g, O, v1, C.gray, { radius: 0.022, opacity: 0.8, label: 'v₁', labelColor: C.blue });
                  addVector3D(g, O, v2, C.gray, { radius: 0.022, opacity: 0.8, label: 'v₂', labelColor: C.red });
                  addVector3D(g, O, v3, C.gray, { radius: 0.022, opacity: 0.8, label: 'v₃', labelColor: C.green });
                  if (step >= 1) addVector3D(g, O, e1, C.blue, { radius: 0.04, label: 'e₁' });
                  if (step === 2) {
                    addVector3D(g, O, p21, C.blue, { radius: 0.02, opacity: 0.6 });
                    addFatLine(g, [p21, v2], C.ink2, 1.4, { dashed: true });
                    addVector3D(g, p21, v2, C.red, { radius: 0.02, opacity: 0.7 });
                  }
                  if (step >= 2 && n2 > 1e-6) addVector3D(g, O, e2, C.red, { radius: 0.04, label: 'e₂' });
                  if (step === 3) {
                    const S = 2.4;
                    const c = [addv(scl(S, e1), scl(S, e2)), addv(scl(-S, e1), scl(S, e2)), addv(scl(-S, e1), scl(-S, e2)), addv(scl(S, e1), scl(-S, e2))];
                    addPolygon3D(g, c, C.violet, 0.1);
                    addVector3D(g, O, p3, C.violet, { radius: 0.02, opacity: 0.7 });
                    addFatLine(g, [p3, v3], C.ink2, 1.4, { dashed: true });
                    if (n3 > 1e-6) addVector3D(g, O, e3, C.green, { radius: 0.04, label: 'e₃' });
                  }
                }}
              />
            </Figure>
          }
          side={
            <>
              <Panel title="向量组">
                <VectorInput name="v₁" color={C.blue} value={v1} onChange={(p) => setV([p as Vec3, v2, v3])} />
                <VectorInput name="v₂" color={C.red} value={v2} onChange={(p) => setV([v1, p as Vec3, v3])} />
                <VectorInput name="v₃" color={C.green} value={v3} onChange={(p) => setV([v1, v2, p as Vec3])} />
                <Segmented
                  ariaLabel="步骤"
                  value={step}
                  onChange={setStep}
                  options={[0, 1, 2, 3].map((s) => ({ value: s, label: s === 0 ? '原始' : `第 ${s} 步` }))}
                />
              </Panel>
              <Panel title="A = QR">
                <MathBox>
                  {step >= 1 && <Tex block math={`\\bm e_1 = (${e1.map((x) => fmt(x)).join(',\\,')})`} />}
                  {step >= 2 && <Tex block math={`\\bm u_2 = \\bm v_2 - \\langle \\bm v_2,\\bm e_1\\rangle\\bm e_1,\\ \\|\\bm u_2\\| = ${fmt(n2)}`} />}
                  {step >= 3 && <Tex block math={`\\bm u_3 = \\bm v_3 - \\textstyle\\sum_{i\\le 2}\\langle \\bm v_3,\\bm e_i\\rangle\\bm e_i,\\ \\|\\bm u_3\\| = ${fmt(n3)}`} />}
                  <Tex block math={`R = Q^{\\top}A = \\begin{pmatrix}${R.map((r) => r.map((x) => fmt(x)).join('&')).join('\\\\')}\\end{pmatrix}`} />
                </MathBox>
                {n3 < 0.05 && <Status tone="warn">u₃ ≈ 0：v₃ 落在 span(v₁, v₂) 中，向量组线性相关。</Status>}
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'full', label: '逐步完成三步正交化。' },
                  { id: 'dep', label: '把 v₃ 拖进 v₁, v₂ 张成的平面，观察 u₃ → 0。' },
                  { id: 'orth', label: '让输入本身两两正交，观察每步“什么都不减”。' },
                ]}
              />
              <Note>R 的对角元 ‖uₖ‖ 是 vₖ 到前 k−1 个向量张成子空间的距离，因此 |det A| = ‖u₁‖‖u₂‖‖u₃‖。</Note>
            </>
          }
        />
      ) : (
        <LabGrid
          stage={
            <Figure
              caption="点击空白处添加数据点，拖动点调整；红线为残差。"
              legend={
                <>
                  <Swatch color={C.green} label="拟合曲线" />
                  <Swatch color={C.red} dashed label="残差" />
                </>
              }
            >
              <Canvas2D
                range={3.5}
                pannable={false}
                onBackgroundClick={(p) => pts.length < 30 && setPts((s) => [...s, [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]])}
                handles={pts.map((p, i) => ({
                  id: `p${i}`,
                  pos: p,
                  color: C.blue,
                  onChange: (np: Vec2) => setPts((s) => s.map((o, j) => (j === i ? np : o))),
                }))}
              >
                {({ toSvg, view, scale }) => {
                  const curve: string[] = [];
                  if (coef)
                    for (let s = 0; s <= 120; s++) {
                      const x = view.xmin + ((view.xmax - view.xmin) * s) / 120;
                      const y = Math.max(view.ymin - 5, Math.min(view.ymax + 5, f(x)));
                      curve.push(toSvg([x, y]).join(','));
                    }
                  return (
                    <g>
                      {squares &&
                        pts.map((p, i) => {
                          const a = toSvg(p);
                          const r = res[i] * scale;
                          return <rect key={`s${i}`} x={a[0]} y={r > 0 ? a[1] : a[1] + r} width={Math.abs(r)} height={Math.abs(r)} fill={C.red} fillOpacity={0.1} stroke={C.red} strokeOpacity={0.4} />;
                        })}
                      {coef && <polyline points={curve.join(' ')} fill="none" stroke={C.green} strokeWidth={2.4} />}
                      {coef &&
                        pts.map((p, i) => {
                          const a = toSvg(p);
                          const b = toSvg([p[0], f(p[0])]);
                          return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.red} strokeWidth={1.6} strokeDasharray="4 3" />;
                        })}
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title={`数据（${pts.length} 点）`}>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] text-ink-2">多项式次数</span>
                  <Segmented ariaLabel="多项式次数" size="sm" value={deg} onChange={setDeg} options={[1, 2, 3].map((d) => ({ value: d, label: String(d) }))} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setPts((s) => s.slice(0, -1))} disabled={!pts.length}>删除最后一点</Button>
                  <Button size="sm" onClick={() => setPts([])}>清空</Button>
                </div>
                <Toggle checked={squares} onChange={setSquares} color={C.red}>把残差画成正方形（面积和 = SSE）</Toggle>
                <Presets
                  items={[
                    { label: '近似直线', onClick: () => setPts([[-2.5, -1.3], [-1.2, -0.2], [0, 0.4], [1.1, 1.5], [2.4, 2.1]]) },
                    { label: '抛物线形', onClick: () => setPts([[-2.4, 2.4], [-1.5, 0.6], [-0.6, -0.6], [0.3, -0.9], [1.2, -0.3], [2.1, 1.4]]) },
                    { label: '含离群点', onClick: () => setPts([[-2, -1.5], [-1, -0.6], [0, 0.2], [1, 1.1], [2, 1.9], [1.5, -2.8]]) },
                  ]}
                />
              </Panel>
              <Panel title="正规方程 AᵀA x̂ = Aᵀb">
                {coef ? (
                  <MathBox>
                    <Tex block math={`\\hat y = ${polyTex}`} />
                    <Tex block math={`\\|\\bm r\\|^2 = ${fmt(sse, 3)},\\qquad A^{\\top}\\bm r = (${Atr.map((x) => fmt(x, 3)).join(',\\,')})`} />
                  </MathBox>
                ) : (
                  <Status tone="warn">至少需要 {k} 个横坐标不全相同的点。</Status>
                )}
                <p className="text-[14px] text-ink-2">Aᵀr ≈ 0 说明残差向量 r 与 A 的每一列正交：b̂ = Ax̂ 是 b 在列空间上的正交投影。</p>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'fit', label: '摆放至少 4 个点，使 SSE < 0.05。' },
                  { id: 'cubic', label: '用三次多项式拟合。' },
                  { id: 'outlier', label: '拖出一个残差大于 2 的离群点，观察拟合被“拉偏”。' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
