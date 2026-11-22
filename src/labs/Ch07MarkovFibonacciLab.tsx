import React, { useState } from 'react';
import { Tex } from '../components/MathText';
import { LabGrid, MathBox, Note, Panel, Presets, Segmented, SliderField, Status, Tasks, useLatch } from '../components/ui';
import { fmt, mulMat2Vec, type Mat2, type Vec2 } from '../utils/math';
import { C } from '../theme';

const PHI = (1 + Math.sqrt(5)) / 2;
const PSI = (1 - Math.sqrt(5)) / 2;

export const Ch07MarkovFibonacciLab: React.FC = () => {
  const [tab, setTab] = useState<'markov' | 'fib'>('markov');

  // 2-state Markov chain: P = [[1 - a, b], [a, 1 - b]] (columns sum to 1)
  const [a, setA] = useState(0.2); // city -> suburb migration
  const [b, setB] = useState(0.3); // suburb -> city migration
  const [initCity, setInitCity] = useState(0.8);
  const [step, setStep] = useState(6);

  // Fibonacci step n
  const [fibN, setFibN] = useState(8);

  const P: Mat2 = [
    [1 - a, b],
    [a, 1 - b],
  ];
  const lam2 = 1 - a - b;
  const steady: Vec2 = a + b > 1e-6 ? [b / (a + b), a / (a + b)] : [initCity, 1 - initCity];

  // Compute P^k v0 for k = 0..step
  const history: Vec2[] = [[initCity, 1 - initCity]];
  for (let k = 0; k < step; k++) history.push(mulMat2Vec(P, history[history.length - 1]));
  const cur = history[history.length - 1];

  // Fibonacci via A^n [1, 0]^T
  const A_fib: Mat2 = [[1, 1], [1, 0]];
  let fv: Vec2 = [1, 0];
  for (let k = 0; k < fibN; k++) fv = mulMat2Vec(A_fib, fv);
  const fnVal = Math.round(fv[1]);
  const fnNext = Math.round(fv[0]);
  const binetVal = (Math.pow(PHI, fibN) - Math.pow(PSI, fibN)) / Math.sqrt(5);

  const done = useLatch({
    markovConverge: tab === 'markov' && step >= 10 && Math.abs(cur[0] - steady[0]) < 0.02,
    markovInit: tab === 'markov' && Math.abs(initCity - 0.8) > 0.25,
    fibHigh: tab === 'fib' && fibN >= 10,
  });

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="离散动力系统模式"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'markov', label: '人口迁移与 Markov 链' },
          { value: 'fib', label: 'Fibonacci 数列与对角化通项' },
        ]}
      />

      {tab === 'markov' ? (
        <LabGrid
          wideStage
          stage={
            <Panel title={`第 ${step} 步状态分布 v_${step} = P^${step} v₀`}>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[14px] mb-1">
                    <span className="font-semibold" style={{ color: C.blue }}>城市人口占比 x_{step}</span>
                    <span className="font-mono">{fmt(cur[0] * 100, 1)}%（稳态 {fmt(steady[0] * 100, 1)}%）</span>
                  </div>
                  <div className="h-6 rounded bg-sunken overflow-hidden relative">
                    <div className="h-full transition-all duration-200" style={{ width: `${cur[0] * 100}%`, background: C.blue }} />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-ink" style={{ left: `${steady[0] * 100}%` }} title="稳态极限" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[14px] mb-1">
                    <span className="font-semibold" style={{ color: C.green }}>郊区人口占比 y_{step}</span>
                    <span className="font-mono">{fmt(cur[1] * 100, 1)}%（稳态 {fmt(steady[1] * 100, 1)}%）</span>
                  </div>
                  <div className="h-6 rounded bg-sunken overflow-hidden relative">
                    <div className="h-full transition-all duration-200" style={{ width: `${cur[1] * 100}%`, background: C.green }} />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-ink" style={{ left: `${steady[1] * 100}%` }} title="稳态极限" />
                  </div>
                </div>
              </div>

              <MathBox tone="ok">
                <Tex block math={`P = \\begin{pmatrix}${fmt(1 - a)} & ${fmt(b)} \\\\ ${fmt(a)} & ${fmt(1 - b)}\\end{pmatrix},\\quad \\lambda_1 = 1,\\; \\lambda_2 = 1 - a - b = ${fmt(lam2)}`} />
                <Tex block math={`\\boldsymbol{v}_\\infty = \\begin{pmatrix}${fmt(steady[0], 3)} \\\\ ${fmt(steady[1], 3)}\\end{pmatrix},\\qquad \\boldsymbol{v}_{${step}} = \\boldsymbol{v}_\\infty + c\\,(${fmt(lam2)})^{${step}}\\begin{pmatrix}1\\\\-1\\end{pmatrix}`} />
              </MathBox>

              <Status tone="info">
                因为 <Tex math="|\lambda_2| < 1" />，当步数 <Tex math="k\to\infty" /> 时 <Tex math="\lambda_2^k \to 0" />，无论初始分布 <Tex math="\boldsymbol{v}_0" /> 如何，系统最终都收敛到对应 <Tex math="\lambda_1 = 1" /> 的唯一稳态特征向量！
              </Status>
            </Panel>
          }
          side={
            <>
              <Panel title="转移概率与步数">
                <SliderField label="城市 → 郊区迁移率 a" value={a} min={0.05} max={0.8} step={0.05} color={C.blue} onChange={setA} />
                <SliderField label="郊区 → 城市迁移率 b" value={b} min={0.05} max={0.8} step={0.05} color={C.green} onChange={setB} />
                <SliderField label="初始城市占比 x₀" value={initCity} min={0} max={1} step={0.05} color={C.violet} onChange={setInitCity} />
                <SliderField label="迭代步数 k" value={step} min={0} max={20} step={1} digits={0} color={C.accent} onChange={setStep} />
                <Note label="教材例 7.4">
                  列和为 1 的非负矩阵（Markov 矩阵）必有特征值 <Tex math="\lambda_1 = 1" />，其余特征值满足 <Tex math="|\lambda_i|\le 1" />；通过相似对角化立刻看清长期演化规律。
                </Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'markovConverge', label: '将步数 k 推至 10 以上，观察进度条贴合黑色稳态竖线' },
                  { id: 'markovInit', label: '大幅改变初始占比 x₀，验证最终稳态竖线位置完全不变' },
                  { id: 'fibHigh', label: '切到“Fibonacci 数列”并将 n 调至 10 以上，观察比值逼近黄金比例 φ' },
                ]}
              />
            </>
          }
        />
      ) : (
        <LabGrid
          wideStage
          stage={
            <Panel title="用相似对角化推导 Fibonacci 通项公式">
              <MathBox tone="ok">
                <Tex block math={`\\begin{pmatrix}F_{n+1} \\\\ F_n\\end{pmatrix} = \\begin{pmatrix}1 & 1 \\\\ 1 & 0\\end{pmatrix}^n \\begin{pmatrix}1 \\\\ 0\\end{pmatrix},\\qquad \\lambda_1 = \\phi = \\frac{1+\\sqrt{5}}{2} \\approx 1.6180,\\quad \\lambda_2 = \\frac{1-\\sqrt{5}}{2} \\approx -0.6180`} />
                <Tex block math={`F_{${fibN}} = \\frac{\\phi^{${fibN}} - \\hat\\phi^{${fibN}}}{\\sqrt{5}} = ${fmt(binetVal, 4)} = ${fnVal}`} />
                <Tex block math={`\\frac{F_{${fibN + 1}}}{F_{${fibN}}} = \\frac{${fnNext}}{${fnVal}} = ${fnVal > 0 ? fmt(fnNext / fnVal, 6) : '—'} \\quad (\\text{黄金比例 } \\phi \\approx ${fmt(PHI, 6)})`} />
              </MathBox>
              <Status tone="ok">
                主特征值 <Tex math="\phi \approx 1.618" /> 主导增长，副特征值 <Tex math="|\hat\phi| < 1" /> 指数衰减，因此相邻两项之比迅速收敛至黄金比例！
              </Status>
            </Panel>
          }
          side={
            <>
              <Panel title="选择项数 n">
                <SliderField label="项数 n" value={fibN} min={1} max={18} step={1} digits={0} color={C.accent} onChange={setFibN} />
                <Presets
                  items={[
                    { label: 'n = 5', onClick: () => setFibN(5) },
                    { label: 'n = 10', onClick: () => setFibN(10) },
                    { label: 'n = 15', onClick: () => setFibN(15) },
                  ]}
                />
                <Note>把二阶递推 <Tex math="F_{n+1}=F_n+F_{n-1}" /> 写成矩阵幂 <Tex math="A^n" /> 后，对角化 <Tex math="A = P\Lambda P^{-1}" /> 让计算 <Tex math="A^n = P\Lambda^n P^{-1}" /> 只需做标量乘方。</Note>
              </Panel>
              <Tasks
                done={done}
                items={[
                  { id: 'markovConverge', label: '在“Markov 链”中观察状态分布收敛到稳态' },
                  { id: 'markovInit', label: '在“Markov 链”中改变初始分布确认稳态无关初值' },
                  { id: 'fibHigh', label: '在“Fibonacci”中将 n 调至 10 以上，观察 F_{n+1}/F_n 收敛至 1.618034' },
                ]}
              />
            </>
          }
        />
      )}
    </div>
  );
};
