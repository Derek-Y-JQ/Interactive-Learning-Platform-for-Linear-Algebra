import React, { Suspense } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CHAPTER_TITLES, LABS } from '../data/labs';

interface LabsPageProps {
  activeLabId: string;
  onNavigate: (hash: string) => void;
}

export const LabsPage: React.FC<LabsPageProps> = ({ activeLabId, onNavigate }) => {
  const idx = Math.max(0, LABS.findIndex((l) => l.id === activeLabId));
  const lab = LABS[idx];
  const prev = LABS[idx - 1];
  const next = LABS[idx + 1];
  const Active = lab.component;
  const chapters = [...new Set(LABS.map((l) => l.chapter))];

  const go = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    onNavigate(hash);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[230px_minmax(0,1fr)] gap-8 pb-8 items-start">
      {/* ---------- Contents sidebar ---------- */}
      <aside className="hidden xl:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2" aria-label="实验目录">
        <div className="eyebrow mb-3">实验目录</div>
        <nav>
          <ol className="space-y-4">
            {chapters.map((ch) => (
              <li key={ch}>
                <div className="text-[13px] text-ink-3 mb-1">
                  {ch === 99 ? '附录' : `第 ${ch} 章`} · {CHAPTER_TITLES[ch]}
                </div>
                <ul className="border-l border-rule">
                  {LABS.filter((l) => l.chapter === ch).map((l) => {
                    const on = l.id === lab.id;
                    return (
                      <li key={l.id}>
                        <a
                          href={`#/labs/${l.id}`}
                          onClick={(e) => go(e, `#/labs/${l.id}`)}
                          aria-current={on ? 'page' : undefined}
                          className={`-ml-px flex gap-2 py-1.5 pl-3 pr-1 border-l-2 text-[14px] leading-snug transition-colors ${
                            on ? 'border-accent text-ink font-bold' : 'border-transparent text-ink-2 hover:text-ink hover:border-rule-strong'
                          }`}
                        >
                          <span className="font-mono text-[12px] text-ink-3 pt-[2px] w-8 shrink-0 tabular">{l.number}</span>
                          <span>{l.title}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <div className="min-w-0 space-y-6">
        {/* mobile selector */}
        <div className="xl:hidden">
          <label htmlFor="lab-select" className="eyebrow block mb-1.5">
            切换实验
          </label>
          <select
            id="lab-select"
            value={lab.id}
            onChange={(e) => onNavigate(`#/labs/${e.target.value}`)}
            className="w-full h-11 px-3 text-[15px] rounded-md border border-rule-strong bg-surface"
          >
            {LABS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.number}　{l.title}
              </option>
            ))}
          </select>
        </div>

        {/* ---------- Lab heading ---------- */}
        <header className="border-b border-rule pb-5">
          <div className="text-[14px] text-ink-3">
            {lab.chapter === 99 ? '附录' : `第 ${lab.chapter} 章`} · {CHAPTER_TITLES[lab.chapter]}
          </div>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <h1 className="text-[30px] sm:text-[36px] font-bold leading-tight">
              <span className="font-mono text-[0.6em] text-accent mr-3 align-[0.15em] tabular">{lab.number}</span>
              {lab.title}
            </h1>
            {lab.chapter >= 1 && lab.chapter <= 11 && (
              <a
                href={`#/exercises/${lab.chapter}`}
                onClick={(e) => go(e, `#/exercises/${lab.chapter}`)}
                className="inline-flex items-center gap-1 text-[15px] text-primary hover:underline underline-offset-4"
              >
                第 {lab.chapter} 章习题 <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
          <p className="mt-2 text-[16px] text-ink-2 max-w-[48em]">{lab.subtitle}</p>
        </header>

        <Suspense
          fallback={
            <div className="h-[520px] border border-rule rounded-md bg-surface flex items-center justify-center text-[15px] text-ink-3" role="status">
              正在加载实验…
            </div>
          }
        >
          <Active key={lab.id} />
        </Suspense>

        {/* ---------- prev / next ---------- */}
        <nav className="grid grid-cols-2 gap-4 pt-6 border-t border-rule" aria-label="上一个与下一个实验">
          <div>
            {prev && (
              <a href={`#/labs/${prev.id}`} onClick={(e) => go(e, `#/labs/${prev.id}`)} className="group block">
                <span className="flex items-center gap-1 text-[13px] text-ink-3">
                  <ArrowLeft className="w-3.5 h-3.5" /> 上一个
                </span>
                <span className="block text-[15px] text-ink-2 group-hover:text-primary">
                  <span className="font-mono text-[13px] mr-1.5">{prev.number}</span>
                  {prev.title}
                </span>
              </a>
            )}
          </div>
          <div className="text-right">
            {next && (
              <a href={`#/labs/${next.id}`} onClick={(e) => go(e, `#/labs/${next.id}`)} className="group block">
                <span className="flex items-center justify-end gap-1 text-[13px] text-ink-3">
                  下一个 <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="block text-[15px] text-ink-2 group-hover:text-primary">
                  <span className="font-mono text-[13px] mr-1.5">{next.number}</span>
                  {next.title}
                </span>
              </a>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};
