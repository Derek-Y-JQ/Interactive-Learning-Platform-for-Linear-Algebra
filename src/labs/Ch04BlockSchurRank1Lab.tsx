import React, { useState } from 'react';
import { Tex } from '../components/MathText';
import { LabGrid, MathBox, MatrixInput, Note, Panel, Presets, Segmented, Status, Tasks, Toggle, useLatch } from '../components/ui';
import { det2, det3, fmt, invMat2, mulMat2Vec, type Mat2, type Mat3, type Vec2 } from '../utils/math';

const mTex = (M: number[][]) => `\\begin{pmatrix}${M.map((r) => r.map((v) => fmt(v)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;

export const Ch04BlockSchurRank1Lab: React.FC = () => {
  const [tab, setTab] = useState<'schur' | 'rank1'>('schur');

  // 3x3 block matrix [[A(2x2), B(2x1)], [C(1x2), D(1x1)]]
  const [M, setM] = useState<Mat3>([
    [2, 1, 1],
    [1, 3, -1],
    [2, 1, 4],
  ]);

  // Rank-1 decomposition: M = u1 v1^T + u2 v2^T (customizable vectors)
  const [u1, setU1] = useState<[number, number, number]>([1, 2, -1]);
  const [v1, setV1] = useState<[number, number, number]>([1, 0, 2]);
  const [u2, setU2] = useState<[number, number, number]>([0, 1, 1]);
  const [v2, setV2] = useState<[number, number, number]>([2, 1, 0]);
  const [on1, setOn1] = useState(true);
  const [on2, setOn2] = useState(true);

  const A: Mat2 = [
    [M[0][0], M[0][1]],
    [M[1][0], M[1][1]],
  ];
  const B: Vec2 = [M[0][2], M[1][2]];
  const Cvec: Vec2 = [M[2][0], M[2][1]];
  const D = M[2][2];

  const detA = det2(A);
  const invA = invMat2(A);
  const invAB = invA ? mulMat2Vec(invA, B) : null;
  const schur = invAB ? D - (Cvec[0] * invAB[0] + Cvec[1] * invAB[1]) : null;
  const detM = det3(M);

  const outer = (u: number[], v: number[]) => u.map((ui) => v.map((vj) => ui * vj));
  const R1 = outer(u1, v1);
  const R2 = outer(u2, v2);
  const sumR = R1.map((row, i) => row.map((val, j) => (on1 ? val : 0) + (on2 ? R2[i][j] : 0)));

  const done = useLatch({
    schurOk: tab === 'schur' && schur !== null,
    schurZero: tab === 'schur' && schur !== null && Math.abs(schur) < 0.05,
    rank1Toggle: tab === 'rank1' && (!on1 || !on2),
  });

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="分块与秩 1 分解"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'schur', label: '分块消元与 Schur 补' },
          { value: 'rank1', label: '矩阵的秩 1 分解' },
        ]}
      />

      {tab === 'schur' ? (
        <LabGrid
          wideStage
          stage={
            <Panel title="2+1 分块矩阵与 Schur 补 S = D − C A⁻¹ B">
              <MathBox>
                <Tex
                  block
                  math={`M = \\left(\\begin{array}{cc|c}${fmt(M[0][0])} & ${fmt(M[0][1])} & ${fmt(M[0][2])} \\\\ ${fmt(M[1][0])} & ${fmt(M[1][1])} & ${fmt(M[1][2])} \\\\ \\hline ${fmt(M[2][0])} & ${fmt(M[2][1])} & ${fmt(M[2][2])}\\end{array}\\right) = \\begin{pmatrix}A & B \\\\ C & D\\end{pmatrix}`}
                />
              </MathBox>
              {invA && schur !== null ? (
                <>
                  <MathBox tone="ok">
                    <Tex
                      block
                      math={`\\begin{pmatrix}I & 0 \\\\ -CA^{-1} & 1\\end{pmatrix}\\begin{pmatrix}A & B \\\\ C & D\\end{pmatrix} = \\begin{pmatrix}A & B \\\\ 0 & S\\end{pmatrix}`}
                    />
                    <Tex block math={`S = D - C A^{-1} B = ${fmt(D)} - (${fmt(D - schur)}) = ${fmt(schur)}`} />
                    <Tex block math={`\\det M = \\det A \\cdot \\det S = (${fmt(detA)}) \\cdot (${fmt(schur)}) = ${fmt(detA * schur)} \\;(= \\det M = ${fmt(detM)})`} />
                  </MathBox>
                  <Status tone={Math.abs(schur) < 1e-6 ? 'warn' : 'ok'}>
                    {Math.abs(schur) < 1e-6
                      ? 'Schur 补 S = 0！因此原 3×3 矩阵 M 不可逆（det M = 0）。'
                      : '当左上块 A 可逆时，M 可逆当且仅当 Schur 补 S = D − CA⁻¹B 可逆！'}
                  </Status>
                </>
              ) : (
                <Status tone="warn">左上 2×2 子块 A 不可逆（det A = 0），无法形成 A⁻¹ 与该分块下的 Schur 补。</Status>
              )}
            </Panel>
          }
          side={
            <>
              <Panel title="编辑分块矩阵 M">
                <MatrixInput ariaLabel="矩阵 M" value={M} onChange={(m) => setM(m as Mat3)} step={1} />
                <Presets
                  items={[
                    { label: '可逆分块阵', onClick: () => setM([[2, 1, 1], [1, 3, -1], [2, 1, 4]]) },
                    { label: 'Schur 补为零（M 奇异）', onClick: () => setM([[2, 1, 1], [1, 3, -1], [2, 1, 1]]) },
                    { label: '分块上三角（C = 0）', onClick: () => setM([[2, 1, 3], [1, 2, -1], [0, 0, 5]]) },
                  ]}
                />
                <Note label="教材 §4.6">
                  分块消元把“先消去第一列”推广为“用左上可逆子块 <Tex math="A" /> 一次性消去左下子块 <Tex math="C" />”，右下角留下的正是 Schur 补 <Tex math="D - CA^{-1}B" />。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'schurOk', label: '验证 det M = det A · det(D − CA⁻¹B)' },
                  { id: 'schurZero', label: '切换到“Schur 补为零”，观察 A 可逆但整阵 M 不可逆' },
                  { id: 'rank1Toggle', label: '切到“秩 1 分解”标签页并开关其中一个秩 1 分量' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          wideStage
          stage={
            <Panel title="把秩 2 矩阵拆成两个秩 1 矩阵之和：A = u₁v₁ᵀ + u₂v₂ᵀ">
              <div className="flex flex-wrap gap-4">
                <Toggle checked={on1} onChange={setOn1}>包含第 1 项 u₁v₁ᵀ</Toggle>
                <Toggle checked={on2} onChange={setOn2}>包含第 2 项 u₂v₂ᵀ</Toggle>
              </div>
              <MathBox tone="ok">
                <Tex block math={`\\boldsymbol{u}_1\\boldsymbol{v}_1^\\top = ${mTex(R1)},\\qquad \\boldsymbol{u}_2\\boldsymbol{v}_2^\\top = ${mTex(R2)}`} />
                <Tex block math={`\\text{当前合成矩阵} = ${mTex(sumR)}`} />
              </MathBox>
              <Status tone="info">
                每个外积 <Tex math="\boldsymbol{u}_k\boldsymbol{v}_k^\top" /> 的所有列都是 <Tex math="\boldsymbol{u}_k" /> 的倍数，故秩至多为 1；任意秩为 <Tex math="r" /> 的矩阵都能写成 <Tex math="r" /> 个秩 1 矩阵之和（且不能少于 <Tex math="r" /> 个）。
              </Status>
            </Panel>
          }
          side={
            <>
              <Panel title="预设秩 1 分量">
                <Presets
                  items={[
                    { label: '默认秩 2 组合', onClick: () => { setU1([1, 2, -1]); setV1([1, 0, 2]); setU2([0, 1, 1]); setV2([2, 1, 0]); setOn1(true); setOn2(true); } },
                    { label: '棋盘格叠加', onClick: () => { setU1([1, -1, 1]); setV1([1, -1, 1]); setU2([1, 1, 1]); setV2([1, 1, 1]); setOn1(true); setOn2(true); } },
                  ]}
                />
                <Note label="教材例 4.4">
                  秩 1 分解是矩阵压缩（例如第 9 章 SVD 低秩逼近）的代数基石：存下 <Tex math="\boldsymbol{u}_k, \boldsymbol{v}_k" /> 只需 <Tex math="r(m+n)" /> 个数，而非整个 <Tex math="mn" /> 矩阵。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'schurOk', label: '在“Schur 补”标签页验证分块行列式乘积公式' },
                  { id: 'schurZero', label: '在“Schur 补”标签页观察 S = 0 导致 M 奇异' },
                  { id: 'rank1Toggle', label: '取消勾选其中一项，观察单独一个秩 1 矩阵的列比例特征' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
