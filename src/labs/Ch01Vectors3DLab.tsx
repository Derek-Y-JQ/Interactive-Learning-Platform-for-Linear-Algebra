import React, { useState } from 'react';
import { ThreeViewport, addFatLine, addPolygon3D, addVector3D } from '../components/ThreeViewport';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, Swatch, Tasks, Toggle, VectorInput, useLatch } from '../components/ui';
import { cross3, dot3, fmt, norm3, type Vec3 } from '../utils/math';
import { C } from '../theme';

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (k: number, a: Vec3): Vec3 => [k * a[0], k * a[1], k * a[2]];

export const Ch01Vectors3DLab: React.FC = () => {
  const [u, setU] = useState<Vec3>([2, 0.5, 0]);
  const [v, setV] = useState<Vec3>([0.5, 2, 0.5]);
  const [w, setW] = useState<Vec3>([0.5, 0.5, 2]);
  const [showCross, setShowCross] = useState(true);
  const [showBox, setShowBox] = useState(true);
  const [showProj, setShowProj] = useState(true);

  const uv = dot3(u, v);
  const nu = norm3(u);
  const nv = norm3(v);
  const uxv = cross3(u, v);
  const area = norm3(uxv);
  const triple = dot3(uxv, w);
  const cos = nu * nv > 1e-9 ? uv / (nu * nv) : 0;
  const angle = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  const proj = nu > 1e-9 ? mul(uv / (nu * nu), u) : ([0, 0, 0] as Vec3);
  const boxColor = Math.abs(triple) < 0.05 ? C.gray : triple > 0 ? C.blue : C.red;

  const done = useLatch({
    perp: nu > 0.3 && nv > 0.3 && Math.abs(uv) < 0.05,
    area: Math.abs(area - 4) < 0.08,
    coplanar: nu > 0.3 && nv > 0.3 && norm3(w) > 0.3 && area > 0.3 && Math.abs(triple) < 0.05,
    left: triple < -0.5,
  });

  return (
    <LabGrid
      stage={
        <Figure
          caption="平行四边形面积 = ‖u × v‖；平行六面体有向体积 = (u × v)·w。"
          legend={
            <>
              <Swatch color={C.blue} label="u" />
              <Swatch color={C.red} label="v" />
              <Swatch color={C.green} label="w" />
              <Swatch color={C.violet} label="u × v" />
            </>
          }
        >
          <ThreeViewport
            deps={[u, v, w, showCross, showBox, showProj]}
            handles={[
              { id: 'u', pos: u, color: C.blue, onChange: setU },
              { id: 'v', pos: v, color: C.red, onChange: setV },
              ...(showBox ? [{ id: 'w', pos: w, color: C.green, onChange: setW }] : []),
            ]}
            buildScene={(g) => {
              const O: Vec3 = [0, 0, 0];
              addVector3D(g, O, u, C.blue, { label: 'u' });
              addVector3D(g, O, v, C.red, { label: 'v' });
              const s = add(u, v);
              addPolygon3D(g, [O, u, s, v], C.violet, 0.16);
              addFatLine(g, [u, s, v], C.violet, 1.4, { dashed: true, opacity: 0.7 });

              if (showProj && nu > 1e-6) {
                addVector3D(g, O, proj, C.ochre, { radius: 0.025, opacity: 0.9 });
                addFatLine(g, [v, proj], C.ink2, 1.4, { dashed: true });
              }
              if (showCross && area > 1e-6) {
                const L = Math.min(area, 3.6);
                const disp = mul(L / area, uxv);
                addVector3D(g, O, disp, C.violet, { label: area > 3.6 ? 'u×v（缩短显示）' : 'u×v' });
              }
              if (showBox) {
                addVector3D(g, O, w, C.green, { label: 'w' });
                const P = [O, u, v, s, w, add(u, w), add(v, w), add(s, w)];
                const faces: number[][] = [
                  [0, 1, 3, 2],
                  [4, 5, 7, 6],
                  [0, 1, 5, 4],
                  [2, 3, 7, 6],
                  [0, 2, 6, 4],
                  [1, 3, 7, 5],
                ];
                faces.forEach((f, i) => i > 0 && addPolygon3D(g, f.map((k) => P[k]), boxColor, 0.07));
                const edges: [number, number][] = [
                  [4, 5], [4, 6], [5, 7], [6, 7], [0, 4], [1, 5], [2, 6], [3, 7],
                ];
                for (const [a, b] of edges) addFatLine(g, [P[a], P[b]], boxColor, 1.3, { opacity: 0.75 });
              }
            }}
          />
        </Figure>
      }
      side={
        <>
          <Panel title="向量">
            <VectorInput name="u" color={C.blue} value={u} onChange={(x) => setU(x as Vec3)} min={-4} max={4} />
            <VectorInput name="v" color={C.red} value={v} onChange={(x) => setV(x as Vec3)} min={-4} max={4} />
            <VectorInput name="w" color={C.green} value={w} onChange={(x) => setW(x as Vec3)} min={-4} max={4} />
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <Toggle checked={showProj} onChange={setShowProj} color={C.ochre}>v 在 u 上的投影</Toggle>
              <Toggle checked={showCross} onChange={setShowCross} color={C.violet}>外积 u × v</Toggle>
              <Toggle checked={showBox} onChange={setShowBox} color={C.green}>平行六面体</Toggle>
            </div>
          </Panel>

          <Panel title="读数">
            <MathBox>
              <Tex block math={`\\bm u\\cdot\\bm v = ${fmt(uv)},\\qquad \\theta = ${fmt(angle, 1)}^\\circ`} />
              <Tex block math={`\\operatorname{proj}_{\\bm u}\\bm v = \\frac{\\bm u\\cdot\\bm v}{\\|\\bm u\\|^2}\\bm u = (${proj.map((x) => fmt(x)).join(',\\,')})`} />
              <Tex block math={`\\bm u\\times\\bm v = (${uxv.map((x) => fmt(x)).join(',\\,')}),\\qquad S = ${fmt(area)}`} />
              <Tex block math={`[\\bm u,\\bm v,\\bm w] = ${fmt(triple)}`} />
            </MathBox>
            <p className="text-[14px] text-ink-2">
              {Math.abs(triple) < 0.05
                ? '三个向量共面：有向体积为 0。'
                : triple > 0
                ? '(u, v, w) 构成右手系，有向体积为正（蓝）。'
                : '(u, v, w) 构成左手系，有向体积为负（红）。'}
            </p>
            <Presets
              items={[
                { label: '标准正交基', onClick: () => { setU([2, 0, 0]); setV([0, 2, 0]); setW([0, 0, 2]); } },
                { label: '交换 u, v', onClick: () => { setU(v); setV(u); } },
                { label: '三向量共面', onClick: () => { setU([2, 1, 0]); setV([-1, 2, 0]); setW([1, 3, 0]); } },
              ]}
            />
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'perp', label: '让 u ⊥ v（内积为 0）。' },
              { id: 'area', label: '让 u, v 张成的平行四边形面积恰为 4。' },
              { id: 'coplanar', label: '在 u, v 不共线的情况下，把 w 拖进 u, v 所在平面。' },
              { id: 'left', label: '只移动 w，使 (u, v, w) 变为左手系。' },
            ]}
          />
          <Note>拖动 w 穿过 u, v 所在平面时，混合积连续地经过 0 并改变符号——这就是第 5 章中行列式“定向”的几何来源。</Note>
        </>
      }
    />
  );
};
