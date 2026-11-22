import React, { useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, addFatLine, addLabel3D, addPoint3D, addPolygon3D, addVector3D } from '../components/ThreeViewport';
import { Tex } from '../components/MathText';
import { Figure, LabGrid, MathBox, Note, Panel, Presets, Status, Swatch, Tasks, Toggle, VectorInput, useLatch } from '../components/ui';
import { cross3, dot3, fmt, norm3, type Vec3 } from '../utils/math';
import { C } from '../theme';

type ConfigId = 'line-plane-direct' | 'line-plane-in' | 'plane-plane' | 'line-line-direct' | 'line-line-same';

interface ConfigInfo {
  id: ConfigId;
  label: string;
  desc: string;
  dimU: number;
  dimW: number;
  dimCap: number;
  dimSum: number;
  isDirect: boolean;
  uType: 'line' | 'plane';
  wType: 'line' | 'plane';
  // For line: direction vector; for plane: normal vector
  uVec: Vec3;
  wVec: Vec3;
}

const CONFIGS: ConfigInfo[] = [
  {
    id: 'line-plane-direct',
    label: '直线 ⊕ 平面（直和）',
    desc: 'U 为 xOy 平面，W 为斜直线 span((0.5, 0.5, 1))，交为零向量，和为全空间 ℝ³。',
    dimU: 2,
    dimW: 1,
    dimCap: 0,
    dimSum: 3,
    isDirect: true,
    uType: 'plane',
    wType: 'line',
    uVec: [0, 0, 1],
    wVec: [0.5, 0.5, 1],
  },
  {
    id: 'line-plane-in',
    label: '直线 ⊂ 平面（非直和）',
    desc: '直线 W 完全落在平面 U 内：U ∩ W = W，U + W = U。',
    dimU: 2,
    dimW: 1,
    dimCap: 1,
    dimSum: 2,
    isDirect: false,
    uType: 'plane',
    wType: 'line',
    uVec: [0, 0, 1],
    wVec: [1, 1, 0],
  },
  {
    id: 'plane-plane',
    label: '两张过原点平面',
    desc: 'U 与 W 均为二维平面，必交于一条一维直线 U ∩ W，和为全空间 ℝ³（不是直和）。',
    dimU: 2,
    dimW: 2,
    dimCap: 1,
    dimSum: 3,
    isDirect: false,
    uType: 'plane',
    wType: 'plane',
    uVec: [0, 0, 1],
    wVec: [0, -1, 1],
  },
  {
    id: 'line-line-direct',
    label: '两条不同直线（直和）',
    desc: '两条不共线的过原点直线交为零向量，直和 U ⊕ W 张成一张二维平面。',
    dimU: 1,
    dimW: 1,
    dimCap: 0,
    dimSum: 2,
    isDirect: true,
    uType: 'line',
    wType: 'line',
    uVec: [1, 0, 0],
    wVec: [0.3, 1, 0.5],
  },
  {
    id: 'line-line-same',
    label: '两条重合直线',
    desc: 'U 与 W 重合，U ∩ W = U = W，U + W = U，维数公式 1 + 1 − 1 = 1。',
    dimU: 1,
    dimW: 1,
    dimCap: 1,
    dimSum: 1,
    isDirect: false,
    uType: 'line',
    wType: 'line',
    uVec: [1, 1, 0.5],
    wVec: [1, 1, 0.5],
  },
];

function planeQuad(normal: Vec3, size = 2.8): Vec3[] {
  const nLen = norm3(normal) || 1;
  const n: Vec3 = [normal[0] / nLen, normal[1] / nLen, normal[2] / nLen];
  const ref: Vec3 = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1 = cross3(n, ref);
  const l1 = norm3(e1) || 1;
  const u: Vec3 = [(e1[0] / l1) * size, (e1[1] / l1) * size, (e1[2] / l1) * size];
  const e2 = cross3(n, u);
  const l2 = norm3(e2) || 1;
  const v: Vec3 = [(e2[0] / l2) * size, (e2[1] / l2) * size, (e2[2] / l2) * size];
  return [
    [-u[0] - v[0], -u[1] - v[1], -u[2] - v[2]],
    [u[0] - v[0], u[1] - v[1], u[2] - v[2]],
    [u[0] + v[0], u[1] + v[1], u[2] + v[2]],
    [-u[0] + v[0], -u[1] + v[1], -u[2] + v[2]],
  ];
}

export const Ch02SubspaceOpsLab: React.FC = () => {
  const [cid, setCid] = useState<ConfigId>('line-plane-direct');
  const [v, setV] = useState<Vec3>([1.6, 1.0, 1.4]);
  const [showDecomp, setShowDecomp] = useState(true);
  const [altShift, setAltShift] = useState(0.8);

  const cfg = CONFIGS.find((c) => c.id === cid)!;

  // Compute decomposition v = uPart + wPart when applicable
  let uPart: Vec3 | null = null;
  let wPart: Vec3 | null = null;
  let altUPart: Vec3 | null = null;
  let altWPart: Vec3 | null = null;

  if (cid === 'line-plane-direct') {
    // U: z = 0, W: span(0.5, 0.5, 1)
    const t = v[2];
    wPart = [0.5 * t, 0.5 * t, t];
    uPart = [v[0] - wPart[0], v[1] - wPart[1], 0];
  } else if (cid === 'plane-plane') {
    // U: z = 0, W: y = z => intersection is x-axis (1,0,0)
    // Any (x, y, z) = (x - s, y - z, 0) + (s, z, z)
    wPart = [0, v[2], v[2]];
    uPart = [v[0], v[1] - v[2], 0];
    altWPart = [altShift, v[2], v[2]];
    altUPart = [v[0] - altShift, v[1] - v[2], 0];
  } else if (cid === 'line-line-direct') {
    // Project v onto span(uVec, wVec)
    const a = cfg.uVec;
    const b = cfg.wVec;
    const g11 = dot3(a, a), g12 = dot3(a, b), g22 = dot3(b, b);
    const det = g11 * g22 - g12 * g12;
    const r1 = dot3(v, a), r2 = dot3(v, b);
    const c1 = (g22 * r1 - g12 * r2) / det;
    const c2 = (-g12 * r1 + g11 * r2) / det;
    uPart = [c1 * a[0], c1 * a[1], c1 * a[2]];
    wPart = [c2 * b[0], c2 * b[1], c2 * b[2]];
  }

  const done = useLatch({
    direct3: cid === 'line-plane-direct' && showDecomp,
    planes: cid === 'plane-plane',
    linesDirect: cid === 'line-line-direct',
    inPlane: cid === 'line-plane-in',
  });

  const buildScene = (group: THREE.Group) => {
    const drawSubspace = (type: 'line' | 'plane', vec: Vec3, color: string, label: string) => {
      if (type === 'plane') {
        const q = planeQuad(vec, 2.8);
        addPolygon3D(group, q, color, 0.22);
        addFatLine(group, [...q, q[0]], color, 1.5, { opacity: 0.6 });
        addLabel3D(group, label, q[2], color);
      } else {
        const l = norm3(vec) || 1;
        const d: Vec3 = [(vec[0] / l) * 3.2, (vec[1] / l) * 3.2, (vec[2] / l) * 3.2];
        addFatLine(group, [[-d[0], -d[1], -d[2]], d], color, 3.5);
        addLabel3D(group, label, [d[0] * 0.85, d[1] * 0.85, d[2] * 0.85 + 0.25], color);
      }
    };

    drawSubspace(cfg.uType, cfg.uVec, C.blue, 'U');
    drawSubspace(cfg.wType, cfg.wVec, C.green, 'W');

    // Highlight U + W when it is a 2D plane formed by two lines
    if (cid === 'line-line-direct') {
      const n = cross3(cfg.uVec, cfg.wVec);
      const q = planeQuad(n, 2.7);
      addPolygon3D(group, q, C.violet, 0.12);
    }

    // Highlight intersection U ∩ W
    if (cfg.dimCap === 0) {
      addPoint3D(group, [0, 0, 0], C.red, 0.13);
      addLabel3D(group, 'U∩W = {0}', [0.2, 0.2, -0.35], C.red);
    } else {
      let dir: Vec3 = [1, 0, 0];
      if (cid === 'plane-plane') dir = cross3(cfg.uVec, cfg.wVec);
      else if (cid === 'line-plane-in') dir = cfg.wVec;
      else if (cid === 'line-line-same') dir = cfg.uVec;
      const l = norm3(dir) || 1;
      const d: Vec3 = [(dir[0] / l) * 3.4, (dir[1] / l) * 3.4, (dir[2] / l) * 3.4];
      addFatLine(group, [[-d[0], -d[1], -d[2]], d], C.red, 5);
      addLabel3D(group, 'U ∩ W', [d[0] * 0.65, d[1] * 0.65, d[2] * 0.65 + 0.3], C.red);
    }

    // Direct sum / non-direct decomposition visualization
    if (showDecomp && uPart && wPart) {
      const target: Vec3 = [uPart[0] + wPart[0], uPart[1] + wPart[1], uPart[2] + wPart[2]];
      addVector3D(group, [0, 0, 0], target, C.violet, { label: cid === 'line-line-direct' ? 'v_proj' : 'v' });
      addVector3D(group, [0, 0, 0], uPart, C.blue, { radius: 0.028, label: 'u' });
      addVector3D(group, [0, 0, 0], wPart, C.green, { radius: 0.028, label: 'w' });
      addFatLine(group, [uPart, target], C.green, 2, { dashed: true });
      addFatLine(group, [wPart, target], C.blue, 2, { dashed: true });

      if (altUPart && altWPart) {
        addVector3D(group, [0, 0, 0], altUPart, C.ochre, { radius: 0.022, opacity: 0.75, label: "u'" });
        addVector3D(group, [0, 0, 0], altWPart, C.ochre, { radius: 0.022, opacity: 0.75, label: "w'" });
        addFatLine(group, [altUPart, target], C.ochre, 1.5, { dashed: true, opacity: 0.7 });
      }
    }
  };

  return (
    <LabGrid
      stage={
        <Figure
          caption="三维空间中两个子空间 U、W 的交与和；可拖动紫色向量 v 观察分解的唯一性。"
          legend={
            <>
              <Swatch color={C.blue} label="U" />
              <Swatch color={C.green} label="W" />
              <Swatch color={C.red} label="U ∩ W" />
              <Swatch color={C.violet} label="v = u + w" />
            </>
          }
        >
          <ThreeViewport
            buildScene={buildScene}
            deps={[cid, v, showDecomp, altShift]}
            handles={
              showDecomp && (cid === 'line-plane-direct' || cid === 'plane-plane')
                ? [{ id: 'v', pos: v, color: C.violet, label: 'v', onChange: setV }]
                : []
            }
            ariaLabel="子空间交与和三维视图"
          />
        </Figure>
      }
      side={
        <>
          <Panel title="子空间配置">
            <Presets
              label="常见位置关系"
              items={CONFIGS.map((c) => ({
                label: c.label,
                active: c.id === cid,
                onClick: () => setCid(c.id),
              }))}
            />
            <p className="text-[14px] text-ink-2 leading-relaxed">{cfg.desc}</p>
            <Toggle checked={showDecomp} onChange={setShowDecomp} color={C.violet}>
              显示向量分解 <Tex math="\boldsymbol{v} = \boldsymbol{u} + \boldsymbol{w}" />
            </Toggle>
            {showDecomp && (cid === 'line-plane-direct' || cid === 'plane-plane') && (
              <VectorInput name="v" color={C.violet} value={v} onChange={(p) => setV(p as Vec3)} min={-3} max={3} />
            )}
            {showDecomp && cid === 'plane-plane' && (
              <div className="text-[13px] text-ink-2">
                <button
                  type="button"
                  className="text-primary underline underline-offset-4"
                  onClick={() => setAltShift((s) => (s > 0 ? -1.1 : 1.1))}
                >
                  切换另一组分解 u&apos; + w&apos;（沿交线平移）
                </button>
              </div>
            )}
          </Panel>

          <Panel title="维数公式与直和判定">
            <MathBox tone={cfg.isDirect ? 'ok' : 'neutral'}>
              <Tex
                math={`\\dim(U + W) = \\dim U + \\dim W - \\dim(U \\cap W) = ${cfg.dimU} + ${cfg.dimW} - ${cfg.dimCap} = ${cfg.dimSum}`}
                block
              />
            </MathBox>
            <Status tone={cfg.isDirect ? 'ok' : 'info'}>
              {cfg.isDirect ? (
                <span>
                  <Tex math="U \cap W = \{\boldsymbol{0}\}" />，因此是<strong>直和</strong> <Tex math="U \oplus W" />：每个和空间中的向量分解唯一。
                </span>
              ) : (
                <span>
                  <Tex math={`\\dim(U \\cap W) = ${cfg.dimCap} > 0`} />，<strong>不是直和</strong>：把交空间中的非零向量一加一减即可得到无穷多种分解。
                </span>
              )}
            </Status>
            {showDecomp && uPart && wPart && (
              <MathBox>
                <Tex
                  math={`\\boldsymbol{u}=(${fmt(uPart[0])},${fmt(uPart[1])},${fmt(uPart[2])}),\\quad \\boldsymbol{w}=(${fmt(wPart[0])},${fmt(wPart[1])},${fmt(wPart[2])})`}
                  block
                />
              </MathBox>
            )}
            <Note label="定理">
              两个子空间之和为直和，当且仅当 <Tex math="U \cap W = \{\boldsymbol{0}\}" />，也等价于 <Tex math="\dim(U+W) = \dim U + \dim W" />。
            </Note>
          </Panel>

          <Tasks
            done={done}
            items={[
              { id: 'direct3', label: '在“直线 ⊕ 平面”下拖动 v，观察唯一分解 u + w' },
              { id: 'planes', label: '切换到“两张过原点平面”，观察为何交必为直线且分解不唯一' },
              { id: 'linesDirect', label: '切换到“两条不同直线”，观察一维直和如何张成二维平面' },
              { id: 'inPlane', label: '切换到“直线 ⊂ 平面”，验证维数公式 2 + 1 − 1 = 2' },
            ]}
          />
        </>
      }
    />
  );
};
