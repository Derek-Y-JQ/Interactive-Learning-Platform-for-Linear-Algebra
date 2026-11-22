import React, { useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, addFatLine, addPolygon3D, addVector3D } from '../components/ThreeViewport';
import { Tex } from '../components/MathText';
import { Button, Figure, LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { det3, fmt, type Mat3, type Vec3 } from '../utils/math';
import { C } from '../theme';

function minor2(A: Mat3, delR: number, delC: number): number {
  const rs = [0, 1, 2].filter((r) => r !== delR);
  const cs = [0, 1, 2].filter((c) => c !== delC);
  return A[rs[0]][cs[0]] * A[rs[1]][cs[1]] - A[rs[0]][cs[1]] * A[rs[1]][cs[0]];
}

export const Ch05VolumeLaplaceLab: React.FC = () => {
  const [tab, setTab] = useState<'vol' | 'laplace'>('vol');

  // 3D parallelepiped spanned by a1, a2, a3
  const [a1, setA1] = useState<Vec3>([1.8, 0.2, 0]);
  const [a2, setA2] = useState<Vec3>([0.2, 1.6, 0.3]);
  const [a3, setA3] = useState<Vec3>([0.2, 0.3, 1.5]);

  // Laplace expansion matrix & chosen row/col
  const [A, setA] = useState<Mat3>([
    [2, 0, -1],
    [3, 1, 2],
    [0, 4, 0],
  ]);
  const [axis, setAxis] = useState<'row' | 'col'>('row');
  const [idx, setIdx] = useState(2); // default row 3 (has two zeros!)

  const vol = det3([
    [a1[0], a2[0], a3[0]],
    [a1[1], a2[1], a3[1]],
    [a1[2], a2[2], a3[2]],
  ]);

  const dA = det3(A);
  const terms = [0, 1, 2].map((k) => {
    const r = axis === 'row' ? idx : k;
    const c = axis === 'row' ? k : idx;
    const sign = (r + c) % 2 === 0 ? 1 : -1;
    const entry = A[r][c];
    const m = minor2(A, r, c);
    return { r, c, sign, entry, m, prod: sign * entry * m };
  });
  const zeroCount = terms.filter((t) => Math.abs(t.entry) < 1e-6).length;

  const [didSwap, setDidSwap] = useState(false);
  const [didShear, setDidShear] = useState(false);

  const done = useLatch({
    swapped: didSwap,
    sheared: didShear,
    smartLaplace: tab === 'laplace' && zeroCount >= 2,
  });

  const buildScene = (group: THREE.Group) => {
    const o: Vec3 = [0, 0, 0];
    const p1 = a1, p2 = a2, p3 = a3;
    const p12: Vec3 = [p1[0] + p2[0], p1[1] + p2[1], p1[2] + p2[2]];
    const p13: Vec3 = [p1[0] + p3[0], p1[1] + p3[1], p1[2] + p3[2]];
    const p23: Vec3 = [p2[0] + p3[0], p2[1] + p3[1], p2[2] + p3[2]];
    const p123: Vec3 = [p12[0] + p3[0], p12[1] + p3[1], p12[2] + p3[2]];

    const tone = Math.abs(vol) < 0.05 ? C.gray : vol > 0 ? C.blue : C.red;
    // 6 faces of parallelepiped
    const faces: Vec3[][] = [
      [o, p1, p12, p2],
      [p3, p13, p123, p23],
      [o, p1, p13, p3],
      [p2, p12, p123, p23],
      [o, p2, p23, p3],
      [p1, p12, p123, p13],
    ];
    faces.forEach((f) => addPolygon3D(group, f, tone, 0.14));

    const edges: [Vec3, Vec3][] = [
      [p1, p12], [p2, p12], [p1, p13], [p3, p13], [p2, p23], [p3, p23],
      [p12, p123], [p13, p123], [p23, p123],
    ];
    edges.forEach(([u, v]) => addFatLine(group, [u, v], tone, 1.6, { opacity: 0.65 }));

    addVector3D(group, o, p1, C.blue, { label: 'a₁' });
    addVector3D(group, o, p2, C.green, { label: 'a₂' });
    addVector3D(group, o, p3, C.violet, { label: 'a₃' });
  };

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="三阶行列式模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'vol', label: '三维有向体积与初等列性质' },
          { value: 'laplace', label: '按任意行 / 列做 Laplace 展开' },
        ]}
      />

      {tab === 'vol' ? (
        <LabGrid
          stage={
            <Figure
              caption="平行六面体的有向体积等于 det(a₁, a₂, a₃)：蓝色为右手系（det > 0），红色为左手系（det < 0）。"
              legend={
                <>
                  <Swatch color={C.blue} label="det > 0（右手系）" />
                  <Swatch color={C.red} label="det < 0（左手系）" />
                </>
              }
            >
              <ThreeViewport
                buildScene={buildScene}
                deps={[a1, a2, a3]}
                handles={[
                  { id: 'a1', pos: a1, color: C.blue, label: 'a₁', onChange: setA1 },
                  { id: 'a2', pos: a2, color: C.green, label: 'a₂', onChange: setA2 },
                  { id: 'a3', pos: a3, color: C.violet, label: 'a₃', onChange: setA3 },
                ]}
                ariaLabel="三阶行列式平行六面体"
              />
            </Figure>
          }
          side={
            <>
              <Panel title="一键检验行列式三大基本性质">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setA1(a2);
                      setA2(a1);
                      setDidSwap(true);
                    }}
                  >
                    交换 a₁ ↔ a₂（体积变号）
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setA3([a3[0] * 1.5, a3[1] * 1.5, a3[2] * 1.5])}
                  >
                    a₃ 伸长 1.5 倍（体积 ×1.5）
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setA2([a2[0] + 0.6 * a1[0], a2[1] + 0.6 * a1[1], a2[2] + 0.6 * a1[2]]);
                      setDidShear(true);
                    }}
                  >
                    错切 a₂ ← a₂ + 0.6a₁（体积不变！）
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setA1([1.8, 0.2, 0]);
                      setA2([0.2, 1.6, 0.3]);
                      setA3([0.2, 0.3, 1.5]);
                    }}
                  >
                    复位
                  </Button>
                </div>
                <MathBox tone={Math.abs(vol) < 0.05 ? 'warn' : 'ok'}>
                  <Tex block math={`\\det(\\boldsymbol{a}_1, \\boldsymbol{a}_2, \\boldsymbol{a}_3) = ${fmt(vol, 3)}`} />
                  <Tex block math={`\\text{体积 } V = |\\det| = ${fmt(Math.abs(vol), 3)},\\quad \\text{定向：}${vol > 0.05 ? '\\text{正（右手）}' : vol < -0.05 ? '\\text{负（左手）}' : '\\text{退化共面}'}`} />
                </MathBox>
                <Note label="错切不变性">
                  把 <Tex math="\boldsymbol{a}_1" /> 的倍数加到 <Tex math="\boldsymbol{a}_2" /> 上，平行六面体沿底面方向倾斜（底面积与高都不变），因此有向体积严格不变！
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'swapped', label: '点击“交换 a₁ ↔ a₂”，观察体积绝对值不变但颜色由蓝变红（反号）' },
                  { id: 'sheared', label: '连续点击“错切”，确认几何体变斜但 det 数值纹丝不动' },
                  { id: 'smartLaplace', label: '切到“Laplace 展开”标签页，选出含两个零元素的行或列' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          wideStage
          stage={
            <Panel title={`沿第 ${idx + 1} ${axis === 'row' ? '行' : '列'} 展开`}>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((i) => (
                  <Button key={`r${i}`} size="sm" variant="secondary" active={axis === 'row' && idx === i} onClick={() => { setAxis('row'); setIdx(i); }}>
                    按第 {i + 1} 行展开
                  </Button>
                ))}
                {[0, 1, 2].map((j) => (
                  <Button key={`c${j}`} size="sm" variant="secondary" active={axis === 'col' && idx === j} onClick={() => { setAxis('col'); setIdx(j); }}>
                    按第 {j + 1} 列展开
                  </Button>
                ))}
              </div>
              <MathBox tone="ok">
                <Tex
                  block
                  math={`\\det A = ${terms
                    .map(
                      (t) =>
                        `(${t.sign > 0 ? '+' : '-'}${fmt(t.entry)}) \\cdot M_{${t.r + 1},${t.c + 1}}`
                    )
                    .join(' + ')}`}
                />
                <Tex
                  block
                  math={`= ${terms.map((t) => `(${t.sign > 0 ? '+' : '-'}1)(${fmt(t.entry)})(${fmt(t.m)})`).join(' + ')} = ${fmt(dA)}`}
                />
              </MathBox>
              <Status tone={zeroCount >= 2 ? 'ok' : 'info'}>
                {zeroCount >= 2
                  ? `最佳选择！本${axis === 'row' ? '行' : '列'}有 ${zeroCount} 个零元素，只需计算 ${3 - zeroCount} 个二阶余子式！`
                  : `本${axis === 'row' ? '行' : '列'}只有 ${zeroCount} 个零，不妨试试含零更多的行或列，结果同样等于 ${fmt(dA)}。`}
              </Status>
            </Panel>
          }
          side={
            <>
              <Panel title="编辑 3×3 矩阵 A">
                <MatrixInput ariaLabel="矩阵 A" value={A} onChange={(m) => setA(m as Mat3)} step={1} />
                <Presets
                  items={[
                    { label: '含较多零元', onClick: () => setA([[2, 0, -1], [3, 1, 2], [0, 4, 0]]) },
                    { label: 'Vandermonde (1,2,3)', onClick: () => setA([[1, 1, 1], [1, 2, 4], [1, 3, 9]]) },
                    { label: '上三角阵', onClick: () => setA([[2, 5, -3], [0, -1, 4], [0, 0, 3]]) },
                  ]}
                />
                <Note label="Laplace 定理">
                  沿任意一行或一列展开都得到相同的行列式值；实战中应优先选零元最多的行/列，或先用倍加消出更多零再展开。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'swapped', label: '在“三维体积”标签页测试交换两列变号' },
                  { id: 'sheared', label: '在“三维体积”标签页测试错切保体积' },
                  { id: 'smartLaplace', label: '在“Laplace 展开”中选中至少含两个零元素的行或列' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
