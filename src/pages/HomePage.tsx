import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Canvas2D, SvgArrow, SvgLabel } from '../components/Canvas2D';
import { Button, Figure, Swatch } from '../components/ui';
import exercisesData from '../data/exercises.json';
import { CHAPTER_TITLES, LABS } from '../data/labs';
import { det2, fmt, type Vec2 } from '../utils/math';
import { C } from '../theme';

interface HomePageProps {
  totalExercises: number;
  onNavigate: (hash: string) => void;
}

const EX_COUNTS = new Map((exercisesData as { chapters: { chapter: number; count: number }[] }).chapters.map((c) => [c.chapter, c.count]));

export const HomePage: React.FC<HomePageProps> = ({ totalExercises, onNavigate }) => {
  const [u, setU] = useState<Vec2>([2, 0.5]);
  const [v, setV] = useState<Vec2>([0.8, 1.8]);
  const area = det2([
    [u[0], v[0]],
    [u[1], v[1]],
  ]);
  const fill = Math.abs(area) < 0.05 ? C.gray : area > 0 ? C.blue : C.red;
  const chapters = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 99];

  return (
    <div className="pb-10">
      {/* ---------- Title block ---------- */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pb-10 border-b border-rule">
        <div className="lg:col-span-6 space-y-6">
          <div className="eyebrow">教材配套 · 交互实验与习题</div>
          <h1 className="font-serif leading-[1.05]">
            <span className="block text-[44px] sm:text-[60px] font-bold text-ink tracking-tight">线性代数</span>
            <span className="block mt-2 text-[24px] sm:text-[30px] font-normal text-ink-2">从几何向量到谱理论</span>
          </h1>
          <p className="text-[17px] leading-relaxed text-ink-2 max-w-[34em]">
            书中的每个核心对象——向量、子空间、线性映射、特征方向、奇异值——在这里都是可以拖动、编辑和逐步演算的图形。
            共 {LABS.length} 个实验，覆盖第 0 至 11 章与附录；另收录全书 {totalExercises} 道课后习题。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => onNavigate('#/labs/ch01-vectors3d')}>
              从第 1 章实验开始 <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => onNavigate('#/exercises')}>浏览课后习题</Button>
          </div>
          <p className="text-[14px] text-ink-3">尹俊淇（新加坡国立大学） · 杨毅（中山大学） 著</p>
        </div>

        <div className="lg:col-span-6">
          <Figure
            caption={
              <>
                <span className="font-serif font-bold text-ink mr-1.5">图 0.1</span>
                拖动 <i className="font-serif">u</i>、<i className="font-serif">v</i>：有向面积 det(u, v) ={' '}
                <span className="font-mono tabular" style={{ color: fill }}>
                  {fmt(area)}
                </span>
              </>
            }
            legend={<Swatch color={fill} label={area >= 0 ? '正定向' : '负定向'} />}
          >
            <Canvas2D
              range={3.2}
              aspect={1.35}
              ariaLabel="可拖动向量 u 与 v 张成的平行四边形"
              handles={[
                { id: 'u', pos: u, color: C.blue, label: 'u', onChange: setU },
                { id: 'v', pos: v, color: C.red, label: 'v', onChange: setV },
              ]}
            >
              {({ toSvg }) => {
                const o = toSvg([0, 0]);
                const pu = toSvg(u);
                const pv = toSvg(v);
                const ps = toSvg([u[0] + v[0], u[1] + v[1]]);
                return (
                  <g>
                    <polygon
                      points={`${o} ${pu} ${ps} ${pv}`}
                      fill={fill}
                      fillOpacity={0.12}
                      stroke={fill}
                      strokeOpacity={0.6}
                      strokeDasharray="5 4"
                    />
                    <SvgArrow from={o} to={pu} color={C.blue} width={2.6} />
                    <SvgArrow from={o} to={pv} color={C.red} width={2.6} />
                    <SvgLabel at={ps} color={C.ink2} size={15}>
                      u + v
                    </SvgLabel>
                  </g>
                );
              }}
            </Canvas2D>
          </Figure>
        </div>
      </section>

      {/* ---------- Contents ---------- */}
      <section className="pt-10" aria-labelledby="toc">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 id="toc" className="text-[30px] font-bold">
            目录
          </h2>
          <span className="text-[14px] text-ink-3">章 · 实验 · 习题</span>
        </div>

        <ol className="border-t-2 border-ink">
          {chapters.map((ch) => {
            const labs = LABS.filter((l) => l.chapter === ch);
            const ex = EX_COUNTS.get(ch);
            return (
              <li key={ch} className="grid grid-cols-[3rem_1fr] sm:grid-cols-[4.5rem_1fr_auto] gap-x-4 gap-y-2 py-4 border-b border-rule">
                <span className="font-serif text-[30px] leading-none text-ink-3 tabular pt-0.5">{ch === 99 ? 'A' : ch}</span>
                <div className="min-w-0">
                  <h3 className="text-[20px] font-semibold leading-tight">{CHAPTER_TITLES[ch]}</h3>
                  {labs.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {labs.map((lab) => (
                        <li key={lab.id}>
                          <a
                            href={`#/labs/${lab.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate(`#/labs/${lab.id}`);
                            }}
                            className="group inline-flex items-baseline gap-2 text-[15px] text-ink-2 hover:text-primary"
                          >
                            <span className="font-mono text-[13px] text-ink-3 tabular w-10 shrink-0">{lab.number}</span>
                            <span className="underline decoration-rule-strong underline-offset-4 group-hover:decoration-primary">{lab.title}</span>
                            <span className="text-[12px] text-ink-3 font-mono">{lab.kind}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="col-start-2 sm:col-start-3 sm:text-right">
                  {ex ? (
                    <a
                      href={`#/exercises/${ch}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`#/exercises/${ch}`);
                      }}
                      className="inline-flex items-center gap-1 text-[14px] text-ink-2 hover:text-primary whitespace-nowrap"
                    >
                      习题 <span className="font-mono tabular">{ex}</span> 题
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[14px] text-ink-3">—</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
};
