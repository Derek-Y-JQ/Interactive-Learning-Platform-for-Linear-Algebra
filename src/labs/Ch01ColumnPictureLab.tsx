import React, { useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, addFatLine, addPoint3D, addPolygon3D, addVector3D } from '../components/ThreeViewport';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, VectorInput, useLatch } from '../components/ui';
import { cross3, det3, fmt, norm3, type Mat3, type Vec3 } from '../utils/math';
import { C } from '../theme';

export const Ch01ColumnPictureLab: React.FC = () => {
  const [singular, setSingular] = useState(false);
  const [x1, setX1] = useState(1.0);
  const [x2, setX2] = useState(0.5);
  const [x3, setX3] = useState(0.8);
  const [b, setB] = useState<Vec3>([1.5, 2.0, 2.2]);

  const a1: Vec3 = [1, 0.3, 0.2];
  const a2: Vec3 = [0.2, 1.2, 0.4];
  const a3: Vec3 = singular ? [1.2, 1.5, 0.6] : [0.3, 0.4, 1.4]; // singular: a3 = a1 + a2

  const p1: Vec3 = [x1 * a1[0], x1 * a1[1], x1 * a1[2]];
  const p2: Vec3 = [p1[0] + x2 * a2[0], p1[1] + x2 * a2[1], p1[2] + x2 * a2[2]];
  const p3: Vec3 = [p2[0] + x3 * a3[0], p2[1] + x3 * a3[1], p2[2] + x3 * a3[2]];

  const err = norm3([p3[0] - b[0], p3[1] - b[1], p3[2] - b[2]]);
  const hit = err < 0.15;

  const autoSolve = () => {
    const M: Mat3 = [
      [a1[0], a2[0], a3[0]],
      [a1[1], a2[1], a3[1]],
      [a1[2], a2[2], a3[2]],
    ];
    const D = det3(M);
    if (Math.abs(D) < 1e-6) return;
    const rep = (col: number): Mat3 =>
      M.map((r, i) => r.map((v, j) => (j === col ? b[i] : v))) as Mat3;
    setX1(Math.round((det3(rep(0)) / D) * 10) / 10);
    setX2(Math.round((det3(rep(1)) / D) * 10) / 10);
    setX3(Math.round((det3(rep(2)) / D) * 10) / 10);
  };

  const done = useLatch({
    hitNormal: !singular && hit,
    seenSingular: singular,
  });

  const buildScene = (group: THREE.Group) => {
    // Base column vectors (faint)
    addVector3D(group, [0, 0, 0], a1, C.blue, { radius: 0.022, opacity: 0.35, label: 'a₁' });
    addVector3D(group, [0, 0, 0], a2, C.green, { radius: 0.022, opacity: 0.35, label: 'a₂' });
    addVector3D(group, [0, 0, 0], a3, C.ochre, { radius: 0.022, opacity: 0.35, label: 'a₃' });

    // If singular, draw the plane span(a1, a2)
    if (singular) {
      const n = cross3(a1, a2);
      const nl = norm3(n) || 1;
      const nn: Vec3 = [n[0] / nl, n[1] / nl, n[2] / nl];
      const e1 = cross3(nn, [0, 0, 1]);
      const l1 = norm3(e1) || 1;
      const u: Vec3 = [(e1[0] / l1) * 3, (e1[1] / l1) * 3, (e1[2] / l1) * 3];
      const e2 = cross3(nn, u);
      const l2 = norm3(e2) || 1;
      const v: Vec3 = [(e2[0] / l2) * 3, (e2[1] / l2) * 3, (e2[2] / l2) * 3];
      addPolygon3D(
        group,
        [
          [-u[0] - v[0], -u[1] - v[1], -u[2] - v[2]],
          [u[0] - v[0], u[1] - v[1], u[2] - v[2]],
          [u[0] + v[0], u[1] + v[1], u[2] + v[2]],
          [-u[0] + v[0], -u[1] + v[1], -u[2] + v[2]],
        ],
        C.red,
        0.16
      );
    }

    // Tip-to-tail chain: 0 -> p1 -> p2 -> p3
    addVector3D(group, [0, 0, 0], p1, C.blue, { radius: 0.038 });
    addVector3D(group, p1, p2, C.green, { radius: 0.038 });
    addVector3D(group, p2, p3, C.ochre, { radius: 0.038 });
    addPoint3D(group, p3, C.violet, 0.11);

    // Target b
    addVector3D(group, [0, 0, 0], b, C.red, { radius: 0.032, label: 'b' });
    if (!hit) addFatLine(group, [p3, b], C.red, 2, { dashed: true });
  };

  return (
    <LabGrid
      stage={
        <Figure
          caption="列视角：方程组 Ax = b 等价于寻找系数 x₁, x₂, x₃，使首尾相接的折线 x₁a₁ + x₂a₂ + x₃a₃ 精准命中红色目标向量 b。"
          legend={
            <>
              <Swatch color={C.blue} label="x₁a₁" />
              <Swatch color={C.green} label="x₂a₂" />
              <Swatch color={C.ochre} label="x₃a₃" />
              <Swatch color={C.red} label="目标 b" />
            </>
          }
        >
          <ThreeViewport
            buildScene={buildScene}
            deps={[singular, x1, x2, x3, b]}
            handles={[{ id: 'b', pos: b, color: C.red, label: 'b', onChange: setB }]}
            ariaLabel="三元方程组列视角三维图"
          />
        </Figure>
      }
      side={
        <>
          <Panel title="调节组合系数 x₁, x₂, x₃">
            <Presets
              label="列向量组状态"
              items={[
                { label: '不共面（唯一解）', active: !singular, onClick: () => setSingular(false) },
                { label: '共面 a₃ = a₁ + a₂（奇异）', active: singular, onClick: () => setSingular(true) },
              ]}
            />
            <SliderField label="x₁" value={x1} min={-2.5} max={2.5} step={0.1} color={C.blue} onChange={setX1} />
            <SliderField label="x₂" value={x2} min={-2.5} max={2.5} step={0.1} color={C.green} onChange={setX2} />
            <SliderField label="x₃" value={x3} min={-2.5} max={2.5} step={0.1} color={C.ochre} onChange={setX3} />
            <VectorInput name="b" color={C.red} value={b} onChange={(p) => setB(p as Vec3)} min={-3} max={3} />
            <Button size="sm" variant="primary" disabled={singular} onClick={autoSolve}>
              自动代入精确解
            </Button>
            <MathBox tone={hit ? 'ok' : 'neutral'}>
              <Tex block math={`x_1\\boldsymbol{a}_1 + x_2\\boldsymbol{a}_2 + x_3\\boldsymbol{a}_3 = (${fmt(p3[0])},\\; ${fmt(p3[1])},\\; ${fmt(p3[2])})`} />
              <Tex block math={`\\|\\text{合成向量} - \\boldsymbol{b}\\| = ${fmt(err)}`} />
            </MathBox>
            <Status tone={hit ? 'ok' : singular ? 'warn' : 'info'}>
              {hit
                ? '命中目标！这组 (x₁, x₂, x₃) 正是线性方程组的一个解。'
                : singular
                ? '三列共面：无论怎样调节 x₁, x₂, x₃，折线终点都逃不出红色平面；若 b 不在平面内则无解！'
                : '与 1.2“三张平面相交（行视角）”对照，这里是“列向量线性组合（列视角）”。'}
            </Status>
            <Note label="教材 §1.5.4">
              行视角看“三个方程各自约束的平面之交”，列视角看“能否用三个列向量拼出目标向量 <Tex math="\boldsymbol{b}" />”——后者直接通向第 2 章的线性张成与第 6 章的列空间。
            </Note>
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'hitNormal', label: '在“不共面”模式下调节滑块（或点击自动求解），使折线精准命中 b' },
              { id: 'seenSingular', label: '切换到“共面（奇异）”，拖动 b 离开红色平面，体验无解的几何含义' },
            ]}
          />
        </>
      }
    />
  );
};
