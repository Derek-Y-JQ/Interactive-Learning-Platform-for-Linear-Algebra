import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Tasks, useLatch } from '../components/ui';
import { fmt } from '../utils/math';
import { C } from '../theme';

// Symmetric two-mass coupled oscillator:
// M = diag(1, 1), K = [[k + kc, -kc], [-kc, k + kc]]
// Simultaneous congruence diagonalization:
// C = (1/sqrt(2)) [[1, 1], [1, -1]]
// Mode 1 (in-phase):     w1 = sqrt(k),        q1 = (x1 + x2)/sqrt(2)
// Mode 2 (out-of-phase): w2 = sqrt(k + 2*kc), q2 = (x1 - x2)/sqrt(2)

export const Ch10NormalModesLab: React.FC = () => {
  const [k, setK] = useState(1.0); // wall spring constant
  const [kc, setKc] = useState(1.5); // coupling spring constant
  const [a1, setA1] = useState(0.7); // mode 1 amplitude
  const [a2, setA2] = useState(0.0); // mode 2 amplitude
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setT((prev) => prev + dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const w1 = Math.sqrt(k);
  const w2 = Math.sqrt(k + 2 * kc);
  const q1 = a1 * Math.cos(w1 * t);
  const q2 = a2 * Math.cos(w2 * t);
  // x = C q
  const x1 = (q1 + q2) / Math.SQRT2;
  const x2 = (q1 - q2) / Math.SQRT2;

  const done = useLatch({
    mode1: Math.abs(a1) > 0.2 && Math.abs(a2) < 0.05,
    mode2: Math.abs(a2) > 0.2 && Math.abs(a1) < 0.05,
    mixed: Math.abs(a1) > 0.2 && Math.abs(a2) > 0.2,
  });

  // Render SVG spring zig-zag from xA to xB at height y
  const springPath = (xA: number, xB: number, y: number, coils = 8) => {
    const pts = [`M ${xA} ${y}`];
    const len = xB - xA;
    for (let i = 1; i <= coils; i++) {
      const xm = xA + ((i - 0.5) / coils) * len;
      const ym = y + (i % 2 === 0 ? -11 : 11);
      pts.push(`L ${xm.toFixed(1)} ${ym}`);
    }
    pts.push(`L ${xB} ${y}`);
    return pts.join(' ');
  };

  const W = 560;
  const H = 190;
  const yMid = 95;
  const wallL = 30;
  const wallR = W - 30;
  const m1X = 195 + x1 * 55;
  const m2X = 365 + x2 * 55;

  return (
    <LabGrid
      stage={
        <Figure caption="两个等质量滑块由三根弹簧连接：主坐标 q₁, q₂ 分别做独立的简谐振动，物理位移 (x₁, x₂) 是两简正模式的叠加。">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-surface block" aria-label="双弹簧耦合振子动画">
            {/* Walls */}
            <rect x={wallL - 12} y={35} width={12} height={120} fill={C.ink3} opacity={0.25} />
            <line x1={wallL} y1={35} x2={wallL} y2={155} stroke={C.ink2} strokeWidth={2.5} />
            <rect x={wallR} y={35} width={12} height={120} fill={C.ink3} opacity={0.25} />
            <line x1={wallR} y1={35} x2={wallR} y2={155} stroke={C.ink2} strokeWidth={2.5} />

            {/* Equilibrium reference ticks */}
            <line x1={195} y1={40} x2={195} y2={150} stroke={C.ruleStrong} strokeDasharray="4 4" />
            <line x1={365} y1={40} x2={365} y2={150} stroke={C.ruleStrong} strokeDasharray="4 4" />

            {/* Three springs */}
            <path d={springPath(wallL, m1X - 24, yMid)} fill="none" stroke={C.blue} strokeWidth={2} />
            <path d={springPath(m1X + 24, m2X - 24, yMid)} fill="none" stroke={C.accent} strokeWidth={2.3} />
            <path d={springPath(m2X + 24, wallR, yMid)} fill="none" stroke={C.blue} strokeWidth={2} />

            {/* Two masses */}
            <rect x={m1X - 24} y={yMid - 24} width={48} height={48} rx={6} fill={C.blue} fillOpacity={0.18} stroke={C.blue} strokeWidth={2.4} />
            <text x={m1X} y={yMid + 5} textAnchor="middle" fill={C.blue} fontSize={15} fontWeight={700}>m₁</text>

            <rect x={m2X - 24} y={yMid - 24} width={48} height={48} rx={6} fill={C.green} fillOpacity={0.18} stroke={C.green} strokeWidth={2.4} />
            <text x={m2X} y={yMid + 5} textAnchor="middle" fill={C.green} fontSize={15} fontWeight={700}>m₂</text>

            {/* Displacements */}
            <text x={195} y={172} textAnchor="middle" fill={C.ink2} fontSize={12}>x₁ = {fmt(x1)}</text>
            <text x={365} y={172} textAnchor="middle" fill={C.ink2} fontSize={12}>x₂ = {fmt(x2)}</text>
          </svg>
        </Figure>
      }
      side={
        <>
          <Panel title="简正模式与参数">
            <Presets
              label="模式切换"
              items={[
                { label: '同相模式 q₁（低频）', onClick: () => { setA1(0.8); setA2(0); } },
                { label: '反相模式 q₂（高频）', onClick: () => { setA1(0); setA2(0.8); } },
                { label: '叠加拍频（混合）', onClick: () => { setA1(0.6); setA2(0.6); } },
              ]}
            />
            <SliderField label="同相模式振幅 A₁" value={a1} min={0} max={1} step={0.1} color={C.blue} onChange={setA1} />
            <SliderField label="反相模式振幅 A₂" value={a2} min={0} max={1} step={0.1} color={C.accent} onChange={setA2} />
            <SliderField label="两侧弹簧刚度 k" value={k} min={0.5} max={4} step={0.5} onChange={setK} />
            <SliderField label="中间耦合刚度 k_c" value={kc} min={0.2} max={4} step={0.2} color={C.accent} onChange={setKc} />
            <Button
              size="sm"
              variant="secondary"
              icon={playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? '暂停振动' : '继续振动'}
            </Button>
          </Panel>

          <Panel title="动能与势能二次型的同时合同对角化">
            <MathBox tone="ok">
              <Tex block math={`M = I_2,\\qquad K = \\begin{pmatrix}${fmt(k + kc)} & ${fmt(-kc)} \\\\ ${fmt(-kc)} & ${fmt(k + kc)}\\end{pmatrix}`} />
              <Tex block math={`C^\\top M C = I_2,\\qquad C^\\top K C = \\operatorname{diag}(\\omega_1^2, \\omega_2^2) = \\operatorname{diag}(${fmt(k)},\\; ${fmt(k + 2 * kc)})`} />
              <Tex block math={`\\omega_1 = \\sqrt{k} = ${fmt(w1)},\\qquad \\omega_2 = \\sqrt{k + 2k_c} = ${fmt(w2)}`} />
            </MathBox>
            <Status tone="info">
              同相振动时中间弹簧长度不变（频率只取决于 <Tex math="k" />）；反相振动时中间弹簧被剧烈拉压（频率升高至 <Tex math="\sqrt{k+2k_c}" />）。
            </Status>
            <Note label="教材例 10.3">
              只要动能矩阵 <Tex math="M" /> 正定，就能用同一个可逆矩阵 <Tex math="C" /> 把 <Tex math="M" /> 与势能矩阵 <Tex math="K" /> 同时合同对角化，从而把耦合微分方程组彻底解耦为独立的简谐振动！
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'mode1', label: '点击“同相模式”，观察中间橙色弹簧几乎不伸缩' },
              { id: 'mode2', label: '点击“反相模式”，观察两滑块反向高频振动' },
              { id: 'mixed', label: '点击“叠加拍频”，观察能量在两个滑块之间来回传递' },
            ]}
          />
        </>
      }
    />
  );
};
