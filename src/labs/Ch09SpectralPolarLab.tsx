import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, SliderField, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { eigen2, fmt, mat2ToTex, mulMat2, mulMat2Vec, svd2, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

const lerpM = (A: Mat2, B: Mat2, t: number): Mat2 => [
  [A[0][0] + (B[0][0] - A[0][0]) * t, A[0][1] + (B[0][1] - A[0][1]) * t],
  [A[1][0] + (B[1][0] - A[1][0]) * t, A[1][1] + (B[1][1] - A[1][1]) * t],
];

const I2: Mat2 = [
  [1, 0],
  [0, 1],
];

export const Ch09SpectralPolarLab: React.FC = () => {
  const [tab, setTab] = useState<'spectral' | 'polar'>('spectral');

  // Spectral mode: symmetric matrix [[a, b], [b, c]]
  const [a, setA] = useState(2.0);
  const [b, setB] = useState(0.7);
  const [c, setC] = useState(1.0);

  // Polar mode: general 2x2 matrix A = Q * S
  const [M, setM] = useState<Mat2>([
    [1.4, -0.8],
    [1.1, 1.3],
  ]);
  const [stage, setStage] = useState(2); // 0: I, 1: S, 2: Q*S = A
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(2, ((now - start) / 1000) * 0.75);
      setStage(t);
      if (t >= 2) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Spectral computation
  const symA: Mat2 = [
    [a, b],
    [b, c],
  ];
  const eig = eigen2(symA);
  const l1 = eig.values[0].re;
  const l2 = eig.values[1].re;
  const u1: Vec2 = eig.vectors[0] ?? [1, 0];
  const u2: Vec2 = [-u1[1], u1[0]]; // guaranteed orthonormal for real symmetric

  const P1: Mat2 = [
    [u1[0] * u1[0], u1[0] * u1[1]],
    [u1[1] * u1[0], u1[1] * u1[1]],
  ];
  const P2: Mat2 = [
    [u2[0] * u2[0], u2[0] * u2[1]],
    [u2[1] * u2[0], u2[1] * u2[1]],
  ];

  // Polar decomposition from SVD: A = U Σ V^T = (U V^T)(V Σ V^T) = Q S
  const sv = svd2(M);
  const V: Mat2 = [
    [sv.Vt[0][0], sv.Vt[1][0]],
    [sv.Vt[0][1], sv.Vt[1][1]],
  ];
  const Q = mulMat2(sv.U, sv.Vt);
  const Sig: Mat2 = [
    [sv.S[0], 0],
    [0, sv.S[1]],
  ];
  const S = mulMat2(mulMat2(V, Sig), sv.Vt); // symmetric positive semi-definite
  const curMat = stage <= 1 ? lerpM(I2, S, stage) : mulMat2(lerpM(I2, Q, stage - 1), S);

  const done = useLatch({
    symEdited: tab === 'spectral' && (Math.abs(b - 0.7) > 0.1 || Math.abs(a - 2) > 0.1),
    polarMid: tab === 'polar' && stage > 0.6 && stage < 1.4,
    polarEnd: tab === 'polar' && stage >= 1.95,
  });

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="算子分解模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'spectral', label: '实对称矩阵的谱定理 A = λ₁u₁u₁ᵀ + λ₂u₂u₂ᵀ' },
          { value: 'polar', label: '极分解 A = QS（先拉伸后旋转）' },
        ]}
      />

      {tab === 'spectral' ? (
        <LabGrid
          stage={
            <Figure
              caption="实对称矩阵把单位圆映成椭圆，且两个特征向量 u₁, u₂ 始终互相垂直、恰好落在椭圆长短主轴上。"
              legend={
                <>
                  <Swatch color={C.blue} label="u₁, λ₁u₁" />
                  <Swatch color={C.green} label="u₂, λ₂u₂" />
                  <Swatch color={C.violet} label="A(单位圆)" />
                </>
              }
            >
              <Canvas2D range={3.5} ariaLabel="实谱定理几何画布">
                {({ toSvg, scale, cx, cy }) => {
                  const o = toSvg([0, 0]);
                  const pts: string[] = [];
                  for (let k = 0; k <= 96; k++) {
                    const t = (2 * Math.PI * k) / 96;
                    pts.push(toSvg(mulMat2Vec(symA, [Math.cos(t), Math.sin(t)])).join(','));
                  }
                  const au1: Vec2 = [l1 * u1[0], l1 * u1[1]];
                  const au2: Vec2 = [l2 * u2[0], l2 * u2[1]];
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={scale} fill="none" stroke={C.ruleStrong} strokeDasharray="4 3" />
                      <polygon points={pts.join(' ')} fill={C.violet} fillOpacity={0.12} stroke={C.violet} strokeWidth={2} />
                      <SvgArrow from={o} to={toSvg(au1)} color={C.blue} width={2.8} dashed />
                      <SvgArrow from={o} to={toSvg(au2)} color={C.green} width={2.8} dashed />
                      <SvgArrow from={o} to={toSvg(u1)} color={C.blue} width={2.4} />
                      <SvgArrow from={o} to={toSvg(u2)} color={C.green} width={2.4} />
                      <SvgLabel at={toSvg(au1)} color={C.blue} dy={-12}>λ₁u₁</SvgLabel>
                      <SvgLabel at={toSvg(au2)} color={C.green} dy={16}>λ₂u₂</SvgLabel>
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="实对称矩阵 A = Aᵀ">
                <SliderField label="a₁₁" value={a} min={-2.5} max={2.5} step={0.1} onChange={setA} />
                <SliderField label="a₁₂ = a₂₁（非对角元）" value={b} min={-2} max={2} step={0.1} color={C.violet} onChange={setB} />
                <SliderField label="a₂₂" value={c} min={-2.5} max={2.5} step={0.1} onChange={setC} />
                <Presets
                  items={[
                    { label: '正定对称阵', onClick: () => { setA(2); setB(0.7); setC(1); } },
                    { label: '不定对称阵（双曲）', onClick: () => { setA(1.5); setB(1.2); setC(-0.5); } },
                    { label: '秩 1 对称投影', onClick: () => { setA(0.8); setB(0.4); setC(0.2); } },
                  ]}
                />
                <MathBox tone="ok">
                  <Tex block math={`A = ${mat2ToTex(symA)}, \\quad \\lambda_1 = ${fmt(l1)},\\; \\lambda_2 = ${fmt(l2)}`} />
                  <Tex block math={`\\langle \\boldsymbol{u}_1, \\boldsymbol{u}_2 \\rangle = ${fmt(u1[0] * u2[0] + u1[1] * u2[1])} = 0`} />
                  <Tex block math={`A = ${fmt(l1)}${mat2ToTex(P1)} + ${fmt(l2)}${mat2ToTex(P2)}`} />
                </MathBox>
                <Note label="实谱定理">
                  任意实对称矩阵必有全实特征值，且存在标准正交特征基，从而可写成正交投影算子 <Tex math="\boldsymbol{u}_i\boldsymbol{u}_i^\top" /> 的线性组合。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'symEdited', label: '任意调节对称矩阵元素，验证两个特征向量始终正交' },
                  { id: 'polarMid', label: '切到“极分解”标签页，停在阶段 1 观察纯半正定拉伸 S' },
                  { id: 'polarEnd', label: '推进到阶段 2，观察正交旋转/反射 Q 把拉伸后的图形转到最终位置' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          stage={
            <Figure
              caption="极分解 A = QS 如同复数的极坐标 z = e^{iθ}r：阶段 0→1 先沿正交主轴做半正定拉伸 S，阶段 1→2 再做刚体正交变换 Q。"
              legend={
                <>
                  <Swatch color={C.blue} label="单位圆" />
                  <Swatch color={C.green} label="S(单位圆)" />
                  <Swatch color={C.accent} label="当前变形" />
                </>
              }
            >
              <Canvas2D range={3.5} ariaLabel="极分解动画画布">
                {({ toSvg, scale, cx, cy }) => {
                  const o = toSvg([0, 0]);
                  const ptsS: string[] = [];
                  const ptsCur: string[] = [];
                  for (let k = 0; k <= 96; k++) {
                    const t = (2 * Math.PI * k) / 96;
                    const p: Vec2 = [Math.cos(t), Math.sin(t)];
                    ptsS.push(toSvg(mulMat2Vec(S, p)).join(','));
                    ptsCur.push(toSvg(mulMat2Vec(curMat, p)).join(','));
                  }
                  const e1 = mulMat2Vec(curMat, [1, 0]);
                  const e2 = mulMat2Vec(curMat, [0, 1]);
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={scale} fill="none" stroke={C.blue} strokeDasharray="4 3" />
                      <polygon points={ptsS.join(' ')} fill={C.green} fillOpacity={0.07} stroke={C.green} strokeDasharray="5 3" />
                      <polygon points={ptsCur.join(' ')} fill={C.accent} fillOpacity={0.18} stroke={C.accent} strokeWidth={2.2} />
                      <SvgArrow from={o} to={toSvg(e1)} color={C.blue} width={2.6} />
                      <SvgArrow from={o} to={toSvg(e2)} color={C.red} width={2.6} />
                      <SvgLabel at={toSvg(e1)} color={C.blue} dy={-12}>e₁ 像</SvgLabel>
                      <SvgLabel at={toSvg(e2)} color={C.red} dy={16}>e₂ 像</SvgLabel>
                    </g>
                  );
                }}
              </Canvas2D>
            </Figure>
          }
          side={
            <>
              <Panel title="极分解 A = Q S">
                <MatrixInput ariaLabel="矩阵 A" value={M} onChange={(m) => setM(m as Mat2)} />
                <SliderField label="分解动画进度（0: I → 1: S → 2: QS）" value={stage} min={0} max={2} step={0.05} color={C.accent} onChange={setStage} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" icon={<Play className="w-3.5 h-3.5" />} onClick={() => { setStage(0); setPlaying(true); }}>
                    播放两阶段极分解
                  </Button>
                </div>
                <MathBox tone="ok">
                  <Tex block math={`Q = ${mat2ToTex(Q)} \\quad (Q^\\top Q = I)`} />
                  <Tex block math={`S = \\sqrt{A^\\top A} = ${mat2ToTex(S)} \\quad (S^\\top = S \\succeq 0)`} />
                </MathBox>
                <Status tone="info">
                  {stage < 0.05 && '初始恒等状态 I。'}
                  {stage >= 0.05 && stage <= 1.05 && '第一阶段：对称半正定拉伸 S，只沿两条正交主轴伸缩，不旋转。'}
                  {stage > 1.05 && '第二阶段：正交变换 Q，整体刚体旋转（或反射），不改变椭圆形状。'}
                </Status>
                <Note>极分解与 SVD 密切相关：若 <Tex math="A = U\Sigma V^\top" />，则 <Tex math="Q = UV^\top" />、<Tex math="S = V\Sigma V^\top" />。</Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'symEdited', label: '在“实谱定理”标签页编辑对称矩阵' },
                  { id: 'polarMid', label: '在“极分解”中将进度停在 1 左右，观察对称拉伸 S' },
                  { id: 'polarEnd', label: '推进到 2，确认最终结果与 A 完全一致' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
