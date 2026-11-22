import React, { useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, addFatLine, addPolygon3D, addVector3D } from '../components/ThreeViewport';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, SliderField, Status, Swatch, Tasks, useLatch } from '../components/ui';
import { det3, fmt, norm3, type Mat3, type Vec3 } from '../utils/math';
import { C } from '../theme';

type TransformKind = 'rot' | 'refl' | 'screw' | 'rotorefl' | 'affine';

// Asymmetric 3D tetrahedron vertices so reflections and stretches are immediately visible
const TETRA: Vec3[] = [
  [0.2, 0.2, 0.1],
  [1.6, 0.2, 0.1],
  [0.2, 1.1, 0.1],
  [0.4, 0.4, 1.3],
];

const FACES: [number, number, number][] = [
  [0, 1, 2],
  [0, 1, 3],
  [1, 2, 3],
  [0, 2, 3],
];

function mul3v(M: Mat3, v: Vec3): Vec3 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

export const Ch11IsometryAffineLab: React.FC = () => {
  const [kind, setKind] = useState<TransformKind>('rot');
  const [theta, setTheta] = useState(70);
  const [shift, setShift] = useState(1.0);

  const rad = (theta * Math.PI) / 180;
  const ct = Math.cos(rad), st = Math.sin(rad);

  let Q: Mat3;
  let b: Vec3;
  let desc = '';

  switch (kind) {
    case 'rot':
      Q = [[ct, -st, 0], [st, ct, 0], [0, 0, 1]];
      b = [0, 0, 0];
      desc = '绕 z 轴旋转（第一类等距变换：det Q = +1，保持距离与手性定向）。';
      break;
    case 'refl':
      Q = [[1, 0, 0], [0, 1, 0], [0, 0, -1]];
      b = [0, 0, 0];
      desc = '关于 xOy 平面镜面反射（第二类等距变换：det Q = −1，保距离但反转手性）。';
      break;
    case 'screw':
      Q = [[ct, -st, 0], [st, ct, 0], [0, 0, 1]];
      b = [0, 0, shift];
      desc = '螺旋运动：绕 z 轴旋转 θ 并沿转轴方向平移 b（一般空间第一类等距变换）。';
      break;
    case 'rotorefl':
      Q = [[ct, -st, 0], [st, ct, 0], [0, 0, -1]];
      b = [0, 0, 0];
      desc = '旋转反射：绕 z 轴旋转 θ 再关于 xOy 面反射（第二类等距变换，det Q = −1）。';
      break;
    case 'affine':
      Q = [[1.4, 0.5, 0], [0, 0.7, 0.4], [0, 0, 1.2]];
      b = [-0.5, 0.4, 0.5];
      desc = '一般仿射变换 f(x) = Ax + b：不再保持长度和角度，但仍保持共线性、平行性与二次曲面类型。';
      break;
  }

  const apply = (v: Vec3): Vec3 => {
    const u = mul3v(Q, v);
    return [u[0] + b[0], u[1] + b[1], u[2] + b[2]];
  };

  const mapped = TETRA.map(apply);
  const origEdge = norm3([TETRA[1][0] - TETRA[0][0], TETRA[1][1] - TETRA[0][1], TETRA[1][2] - TETRA[0][2]]);
  const newEdge = norm3([mapped[1][0] - mapped[0][0], mapped[1][1] - mapped[0][1], mapped[1][2] - mapped[0][2]]);
  const dQ = det3(Q);
  const isIso = kind !== 'affine';

  const done = useLatch({
    screw: kind === 'screw',
    refl: kind === 'refl' || kind === 'rotorefl',
    affine: kind === 'affine',
  });

  const buildScene = (group: THREE.Group) => {
    const drawTet = (verts: Vec3[], color: string, opacity: number) => {
      FACES.forEach(([i, j, k]) => addPolygon3D(group, [verts[i], verts[j], verts[k]], color, opacity));
      const edges: [number, number][] = [[0, 1], [1, 2], [2, 0], [0, 3], [1, 3], [2, 3]];
      edges.forEach(([i, j]) => addFatLine(group, [verts[i], verts[j]], color, 2));
    };

    drawTet(TETRA, C.blue, 0.16);
    drawTet(mapped, isIso ? (dQ > 0 ? C.green : C.red) : C.violet, 0.25);

    if (kind === 'refl' || kind === 'rotorefl') {
      addPolygon3D(group, [[-2.6, -2.6, 0], [2.6, -2.6, 0], [2.6, 2.6, 0], [-2.6, 2.6, 0]], C.red, 0.08);
    }
    if (kind === 'rot' || kind === 'screw' || kind === 'rotorefl') {
      addVector3D(group, [0, 0, -2.2], [0, 0, 2.6], C.ochre, { radius: 0.025, label: '转轴' });
    }
  };

  return (
    <LabGrid
      stage={
        <Figure
          caption="浅蓝为原始不对称四面体，彩色为变换后的像：绿色为保定向等距，红色为反定向等距，紫色为一般仿射变换。"
          legend={
            <>
              <Swatch color={C.blue} label="原四面体" />
              <Swatch color={isIso ? (dQ > 0 ? C.green : C.red) : C.violet} label="变换后的像" />
            </>
          }
        >
          <ThreeViewport buildScene={buildScene} deps={[kind, theta, shift]} ariaLabel="空间等距与仿射变换三维视图" />
        </Figure>
      }
      side={
        <>
          <Panel title="选择空间变换 f(x) = Qx + b">
            <Presets
              label="等距变换（§11.5）与仿射变换（§11.6）"
              items={[
                { label: '绕轴旋转', active: kind === 'rot', onClick: () => setKind('rot') },
                { label: '镜面反射', active: kind === 'refl', onClick: () => setKind('refl') },
                { label: '螺旋运动', active: kind === 'screw', onClick: () => setKind('screw') },
                { label: '旋转反射', active: kind === 'rotorefl', onClick: () => setKind('rotorefl') },
                { label: '一般仿射变换', active: kind === 'affine', onClick: () => setKind('affine') },
              ]}
            />
            {(kind === 'rot' || kind === 'screw' || kind === 'rotorefl') && (
              <SliderField label="转角 θ" value={theta} min={-180} max={180} step={5} digits={0} unit="°" color={C.ochre} onChange={setTheta} />
            )}
            {kind === 'screw' && (
              <SliderField label="沿轴平移量" value={shift} min={-1.5} max={1.8} step={0.1} color={C.green} onChange={setShift} />
            )}
            <MathBox tone={isIso ? 'ok' : 'neutral'}>
              <Tex block math={`\\det Q = ${fmt(dQ)},\\qquad \\text{棱长变化：}${fmt(origEdge)} \\longrightarrow ${fmt(newEdge)}`} />
            </MathBox>
            <Status tone={isIso ? 'ok' : 'info'}>{desc}</Status>
            <Note label="空间等距分类定理">
              三维空间中的任何等距变换都可写为 <Tex math="f(\boldsymbol{x})=Q\boldsymbol{x}+\boldsymbol{b}" />（<Tex math="Q" /> 正交）：<Tex math="\det Q = +1" /> 时必为平移、旋转或螺旋运动；<Tex math="\det Q = -1" /> 时必为反射、滑移反射或旋转反射。
            </Note>
          </Panel>
          <Tasks
            done={done}
            items={[
              { id: 'screw', label: '切换到“螺旋运动”，同时调节转角 θ 与沿轴平移量' },
              { id: 'refl', label: '切换到“镜面反射”或“旋转反射”，确认棱长不变但 det Q = −1（手性翻转）' },
              { id: 'affine', label: '切换到“一般仿射变换”，观察棱长改变且体积按 |det A| 缩放' },
            ]}
          />
        </>
      }
    />
  );
};
