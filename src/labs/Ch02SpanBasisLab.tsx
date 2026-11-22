import React, { useState } from 'react';
import { Canvas2D, SvgArrow, SvgLabel, SvgPoint } from '../components/Canvas2D';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, NumberInput, Note, Panel, Presets, Status, Swatch, Tasks, Toggle, VectorInput, useLatch } from '../components/ui';
import { det2, fmt, invMat2, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

export const Ch02SpanBasisLab: React.FC = () => {
  const [b1, setB1] = useState<Vec2>([1.5, 0.5]);
  const [b2, setB2] = useState<Vec2>([0.5, 1.5]);
  const [v, setV] = useState<Vec2>([2.5, 2.5]);
  const [showLattice, setShowLattice] = useState(true);
  const [showPath, setShowPath] = useState(true);

  const P: Mat2 = [
    [b1[0], b2[0]],
    [b1[1], b2[1]],
  ];
  const d = det2(P);
  const inv = Math.abs(d) > 0.02 ? invMat2(P) : null;
  const coords = inv ? mulMat2Vec(inv, v) : null;

  const dir = Math.hypot(b1[0], b1[1]) > 0.05 ? b1 : b2;
  const onSpan = !inv && Math.abs(dir[0] * v[1] - dir[1] * v[0]) / (Math.hypot(dir[0], dir[1]) || 1) < 0.06;

  const setCoord = (i: 0 | 1, val: number) => {
    if (!coords) return;
    const c: Vec2 = i === 0 ? [val, coords[1]] : [coords[0], val];
    setV([c[0] * b1[0] + c[1] * b2[0], c[0] * b1[1] + c[1] * b2[1]]);
  };

  const near = (a: number, b: number) => Math.abs(a - b) < 0.06;
  const done = useLatch({
    c11: !!coords && near(coords[0], 1) && near(coords[1], 1),
    neg: !!coords && near(coords[0], 2) && near(coords[1], -1),
    dep: !inv && Math.hypot(b1[0], b1[1]) > 0.3 && Math.hypot(b2[0], b2[1]) > 0.3,
    inspan: onSpan && Math.hypot(v[0], v[1]) > 0.5,
  });

  return (
    <LabGrid
      stage={
        <Figure
          caption={inv ? '斜坐标网的每个格点都是 β₁, β₂ 的整系数组合。' : 'β₁ 与 β₂ 共线：张成空间坍缩为一条直线。'}
          legend={
            <>
              <Swatch color={C.blue} label="β₁" />
              <Swatch color={C.red} label="β₂" />
              <Swatch color={C.violet} label="v" />
            </>
          }
        >
          <Canvas2D
            range={4}
            handles={[
              { id: 'b1', pos: b1, color: C.blue, label: 'β₁', onChange: setB1 },
              { id: 'b2', pos: b2, color: C.red, label: 'β₂', onChange: setB2 },
              { id: 'v', pos: v, color: C.violet, label: 'v', onChange: setV },
            ]}
          >
            {({ toSvg, line, view }) => {
              const o = toSvg([0, 0]);
              const els: React.ReactNode[] = [];
              if (inv) {
                // integer coordinate lines visible in view
                const corners: Vec2[] = [
                  [view.xmin, view.ymin],
                  [view.xmax, view.ymin],
                  [view.xmin, view.ymax],
                  [view.xmax, view.ymax],
                ].map((p) => mulMat2Vec(inv, p as Vec2));
                const lo = [Math.floor(Math.min(...corners.map((c) => c[0]))), Math.floor(Math.min(...corners.map((c) => c[1])))];
                const hi = [Math.ceil(Math.max(...corners.map((c) => c[0]))), Math.ceil(Math.max(...corners.map((c) => c[1])))];
                if (hi[0] - lo[0] < 80 && hi[1] - lo[1] < 80) {
                  for (let k = lo[0]; k <= hi[0]; k++) {
                    const l = line([k * b1[0], k * b1[1]], b2);
                    els.push(<line key={`a${k}`} {...l} stroke={C.blue} strokeOpacity={k === 0 ? 0.55 : 0.2} strokeWidth={k === 0 ? 1.5 : 1} />);
                  }
                  for (let k = lo[1]; k <= hi[1]; k++) {
                    const l = line([k * b2[0], k * b2[1]], b1);
                    els.push(<line key={`b${k}`} {...l} stroke={C.red} strokeOpacity={k === 0 ? 0.55 : 0.2} strokeWidth={k === 0 ? 1.5 : 1} />);
                  }
                  if (showLattice && (hi[0] - lo[0]) * (hi[1] - lo[1]) < 900)
                    for (let i = lo[0]; i <= hi[0]; i++)
                      for (let j = lo[1]; j <= hi[1]; j++) {
                        const p = toSvg([i * b1[0] + j * b2[0], i * b1[1] + j * b2[1]]);
                        els.push(<circle key={`p${i},${j}`} cx={p[0]} cy={p[1]} r={2.2} fill={C.ink2} fillOpacity={0.45} />);
                      }
                }
              } else {
                const l = line([0, 0], dir);
                els.push(<line key="span" {...l} stroke={C.red} strokeWidth={6} strokeOpacity={0.18} />);
                els.push(<line key="span2" {...l} stroke={C.red} strokeWidth={1.5} />);
              }
              const c1v: Vec2 | null = coords ? [coords[0] * b1[0], coords[0] * b1[1]] : null;
              return (
                <g>
                  {els}
                  {coords && c1v && showPath && (
                    <>
                      <SvgArrow from={o} to={toSvg(c1v)} color={C.blue} width={2} dashed />
                      <SvgArrow from={toSvg(c1v)} to={toSvg(v)} color={C.red} width={2} dashed />
                      <SvgPoint at={toSvg(c1v)} color={C.blue} r={3} />
                      <SvgLabel at={toSvg([c1v[0] / 2, c1v[1] / 2])} color={C.blue} size={14} dx={4} dy={16}>
                        {`${fmt(coords[0])}β₁`}
                      </SvgLabel>
                    </>
                  )}
                  <SvgArrow from={o} to={toSvg(b1)} color={C.blue} width={2.8} />
                  <SvgArrow from={o} to={toSvg(b2)} color={C.red} width={2.8} />
                  <SvgArrow from={o} to={toSvg(v)} color={C.violet} width={2.6} />
                </g>
              );
            }}
          </Canvas2D>
        </Figure>
      }
      side={
        <>
          <Panel title="基">
            <VectorInput name="β₁" color={C.blue} value={b1} onChange={(x) => setB1(x as Vec2)} />
            <VectorInput name="β₂" color={C.red} value={b2} onChange={(x) => setB2(x as Vec2)} />
            <VectorInput name="v" color={C.violet} value={v} onChange={(x) => setV(x as Vec2)} />
            <div className="flex flex-wrap gap-x-5">
              <Toggle checked={showLattice} onChange={setShowLattice}>整点格</Toggle>
              <Toggle checked={showPath} onChange={setShowPath}>分解路径</Toggle>
            </div>
          </Panel>
          <Panel title="坐标 [v]_B">
            {coords ? (
              <>
                <div className="flex items-center gap-2 flex-wrap text-[15px]">
                  <Tex math="\bm v =" />
                  <NumberInput ariaLabel="β₁ 的系数" value={coords[0]} onChange={(x) => setCoord(0, x)} className="w-[68px]" />
                  <Tex math="\bm\beta_1 +" />
                  <NumberInput ariaLabel="β₂ 的系数" value={coords[1]} onChange={(x) => setCoord(1, x)} className="w-[68px]" />
                  <Tex math="\bm\beta_2" />
                </div>
                <p className="text-[13px] text-ink-3 -mt-2">直接输入坐标即可反求 v。</p>
                <MathBox>
                  <Tex block math={`[\\bm v]_{\\mathcal B} = P^{-1}\\bm v,\\quad P = (\\bm\\beta_1\\;\\bm\\beta_2),\\quad \\det P = ${fmt(d)}`} />
                </MathBox>
                <Status tone="ok">β₁, β₂ 线性无关，构成 ℝ² 的一组基。</Status>
              </>
            ) : (
              <Status tone="warn">
                det P = 0：β₁, β₂ 线性相关，dim span = {Math.hypot(dir[0], dir[1]) > 0.05 ? 1 : 0}。
                {onSpan ? ' v 恰在张成直线上，表示不唯一。' : ' v 不在张成空间中，无法表示。'}
              </Status>
            )}
            <Presets
              items={[
                { label: '标准基', onClick: () => { setB1([1, 0]); setB2([0, 1]); } },
                { label: '正交基', onClick: () => { setB1([2, 1]); setB2([-1, 2]); } },
                { label: '狭长基', onClick: () => { setB1([2, 0.4]); setB2([2, 0.9]); } },
                { label: '线性相关', onClick: () => { setB1([2, 1]); setB2([-1, -0.5]); } },
              ]}
            />
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'c11', label: '移动 v，使它在 B 下的坐标为 (1, 1)。' },
              { id: 'neg', label: '让 [v]_B = (2, −1)：用格点读出答案。' },
              { id: 'dep', label: '拖动 β₂，让两个基向量线性相关。' },
              { id: 'inspan', label: '在相关状态下，把 v 放到张成直线上。' },
            ]}
          />
          <Note>选“狭长基”时，v 稍微移动，坐标就会剧烈变化——这是条件数大的几何表现（第 9 章）。</Note>
        </>
      }
    />
  );
};
