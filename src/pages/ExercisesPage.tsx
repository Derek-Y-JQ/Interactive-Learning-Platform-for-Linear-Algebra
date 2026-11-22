import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Check, ChevronDown, Search } from 'lucide-react';
import exercisesData from '../data/exercises.json';
import {
  getCachedChapterSolutions,
  loadChapterSolutions,
  type ExerciseSolution,
} from '../data/solutions';
import { MathText } from '../components/MathText';
import { Button, Segmented } from '../components/ui';
import { LABS } from '../data/labs';

interface Problem {
  id: string;
  displayNum: string;
  chapter: number;
  section: number;
  isReview: boolean;
  groupCode: string;
  groupLabel: string;
  difficulty: string;
  type: string;
  stem: string;
  parts: string[];
  tail: string;
  recommendedLab: string;
}

interface ChapterInfo {
  chapter: number;
  title: string;
  count: number;
  groups: { code: string; label: string; isReview: boolean; count: number }[];
}

const DATA = exercisesData as { total: number; chapters: ChapterInfo[]; problems: Problem[] };
const STORAGE_KEY = 'la-companion-progress-v1';
const PAGE_SIZE = 20;

interface ProgressState {
  done: Record<string, boolean>;
  starred: Record<string, boolean>;
}

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object') return { done: p.done ?? {}, starred: p.starred ?? {} };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { done: {}, starred: {} };
}

const DIFF_COLOR: Record<string, string> = {
  基础: 'var(--color-fig-green)',
  稍难: 'var(--color-fig-ochre)',
  困难: 'var(--color-fig-red)',
};

interface ExercisesPageProps {
  initialChapter?: number;
  onNavigate: (hash: string) => void;
}

export const ExercisesPage: React.FC<ExercisesPageProps> = ({ initialChapter, onNavigate }) => {
  const [chapter, setChapter] = useState<number>(initialChapter ?? 1);
  const [group, setGroup] = useState('ALL');
  const [difficulty, setDifficulty] = useState('全部');
  const [ptype, setPtype] = useState('全部');
  const [status, setStatus] = useState<'all' | 'todo' | 'done' | 'starred'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Record<string, 'hint' | 'sol' | undefined>>({});
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [chapterSols, setChapterSols] = useState<Record<string, ExerciseSolution>>(
    () => getCachedChapterSolutions(initialChapter ?? 1) ?? {},
  );
  const [solsLoading, setSolsLoading] = useState(() => !getCachedChapterSolutions(initialChapter ?? 1));

  useEffect(() => {
    const cached = getCachedChapterSolutions(chapter);
    if (cached) {
      setChapterSols(cached);
      setSolsLoading(false);
      return;
    }
    let cancelled = false;
    setSolsLoading(true);
    loadChapterSolutions(chapter).then((data) => {
      if (!cancelled) {
        setChapterSols(data);
        setSolsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chapter]);

  useEffect(() => {
    if (initialChapter && initialChapter >= 1 && initialChapter <= 11) {
      setChapter(initialChapter);
      setGroup('ALL');
      setPage(1);
    }
  }, [initialChapter]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* storage full or disabled */
    }
  }, [progress]);

  const toggle = (key: 'done' | 'starred', id: string) =>
    setProgress((p) => ({ ...p, [key]: { ...p[key], [id]: !p[key][id] } }));

  const info = DATA.chapters.find((c) => c.chapter === chapter) ?? DATA.chapters[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DATA.problems.filter((p) => {
      if (p.chapter !== chapter) return false;
      if (group !== 'ALL' && p.groupCode !== group) return false;
      if (difficulty !== '全部' && p.difficulty !== difficulty) return false;
      if (ptype !== '全部' && p.type !== ptype) return false;
      if (status === 'done' && !progress.done[p.id]) return false;
      if (status === 'todo' && progress.done[p.id]) return false;
      if (status === 'starred' && !progress.starred[p.id]) return false;
      if (q && !`${p.displayNum} ${p.stem} ${p.parts.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [chapter, group, difficulty, ptype, status, query, progress]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const doneTotal = Object.values(progress.done).filter(Boolean).length;
  const doneIn = (ch: number) => DATA.problems.filter((p) => p.chapter === ch && progress.done[p.id]).length;
  const reset = () => setPage(1);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[250px_minmax(0,1fr)] gap-8 pb-8 items-start">
      {/* ---------- chapter list ---------- */}
      <aside className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] overflow-y-auto pr-1" aria-label="章节">
        <div className="flex items-baseline justify-between mb-3">
          <span className="eyebrow">章节</span>
          <span className="text-[13px] text-ink-3 font-mono tabular">
            已掌握 {doneTotal}/{DATA.total}
          </span>
        </div>
        <ol className="xl:space-y-0 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-1 gap-x-4">
          {DATA.chapters.map((c) => {
            const on = c.chapter === chapter;
            const d = doneIn(c.chapter);
            return (
              <li key={c.chapter}>
                <button
                  type="button"
                  onClick={() => {
                    setChapter(c.chapter);
                    setGroup('ALL');
                    reset();
                  }}
                  aria-current={on ? 'true' : undefined}
                  className={`w-full text-left py-2 border-b border-rule flex items-baseline gap-2 text-[14px] ${on ? 'text-ink font-bold' : 'text-ink-2 hover:text-ink'}`}
                >
                  <span className="font-serif text-[18px] w-6 tabular text-ink-3">{c.chapter}</span>
                  <span className="flex-1 min-w-0 truncate">{c.title}</span>
                  <span className="font-mono text-[12px] text-ink-3 tabular">{d > 0 ? `${d}/` : ''}{c.count}</span>
                </button>
                {on && (
                  <ul className="hidden xl:block py-1.5 pl-8 space-y-0.5">
                    <li>
                      <button
                        type="button"
                        onClick={() => { setGroup('ALL'); reset(); }}
                        className={`w-full text-left text-[13px] py-1 ${group === 'ALL' ? 'text-accent font-bold' : 'text-ink-2 hover:text-ink'}`}
                      >
                        全部
                      </button>
                    </li>
                    {c.groups.map((g) => (
                      <li key={g.code}>
                        <button
                          type="button"
                          onClick={() => { setGroup(g.code); reset(); }}
                          className={`w-full text-left text-[13px] py-1 flex gap-2 ${group === g.code ? 'text-accent font-bold' : 'text-ink-2 hover:text-ink'}`}
                        >
                          <span className="flex-1">{g.label.replace(/^习题\s*/, '')}</span>
                          <span className="font-mono text-ink-3">{g.count}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </aside>

      {/* ---------- list ---------- */}
      <div className="min-w-0">
        <header className="border-b border-rule pb-5 space-y-4">
          <div>
            <div className="text-[14px] text-ink-3">第 {info.chapter} 章 · 课后习题</div>
            <h1 className="text-[30px] sm:text-[36px] font-bold leading-tight">{info.title}</h1>
            <p className="text-[14px] text-ink-3 mt-1">
              共 {info.count} 题，当前筛选 {filtered.length} 题。全部习题均附完整解答。
            </p>
          </div>

          {/* mobile section select */}
          <div className="xl:hidden">
            <label htmlFor="sec" className="eyebrow block mb-1">小节</label>
            <select id="sec" value={group} onChange={(e) => { setGroup(e.target.value); reset(); }} className="w-full h-10 px-2 rounded-md border border-rule-strong bg-surface text-[15px]">
              <option value="ALL">全部</option>
              {info.groups.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex-1 min-w-[220px] max-w-sm">
              <span className="sr-only">搜索题号或关键词</span>
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); reset(); }}
                placeholder="题号或关键词"
                className="w-full h-10 pl-9 pr-3 text-[15px] rounded-md border border-rule-strong bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <Segmented ariaLabel="难度" size="sm" value={difficulty} onChange={(v) => { setDifficulty(v); reset(); }} options={['全部', '基础', '稍难', '困难'].map((d) => ({ value: d, label: d === '全部' ? '全部难度' : d }))} />
            <Segmented ariaLabel="题型" size="sm" value={ptype} onChange={(v) => { setPtype(v); reset(); }} options={['全部', '计算', '证明'].map((d) => ({ value: d, label: d === '全部' ? '全部题型' : d }))} />
            <Segmented
              ariaLabel="状态"
              size="sm"
              value={status}
              onChange={(v) => { setStatus(v); reset(); }}
              options={[
                { value: 'all', label: '全部' },
                { value: 'todo', label: '未掌握' },
                { value: 'done', label: '已掌握' },
                { value: 'starred', label: '收藏' },
              ]}
            />
          </div>
        </header>

        {items.length === 0 ? (
          <div className="py-16 text-center text-[15px] text-ink-2">
            没有符合条件的习题。
            <Button variant="quiet" className="ml-2" onClick={() => { setQuery(''); setDifficulty('全部'); setPtype('全部'); setStatus('all'); setGroup('ALL'); }}>
              清除筛选
            </Button>
          </div>
        ) : (
          <ol>
            {items.map((p, i) => {
              const sol = chapterSols[p.id];
              const isDone = !!progress.done[p.id];
              const starred = !!progress.starred[p.id];
              const o = open[p.id];
              const newGroup = group === 'ALL' && (i === 0 || items[i - 1].groupCode !== p.groupCode);
              const lab = p.recommendedLab ? LABS.find((l) => l.id === p.recommendedLab) : undefined;
              return (
                <li key={p.id}>
                  {newGroup && <h2 className="pt-8 pb-1 text-[18px] font-semibold text-ink-2 border-b border-ink/70">{p.groupLabel}</h2>}
                  <article className={`py-5 border-b border-rule ${isDone ? 'opacity-80' : ''}`} aria-labelledby={`h-${p.id}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 mb-2">
                      <div className="flex items-baseline gap-3">
                        <h3 id={`h-${p.id}`} className="font-serif text-[19px] font-bold">
                          {p.displayNum}
                        </h3>
                        <span className="text-[13px] text-ink-2 inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: DIFF_COLOR[p.difficulty] ?? 'var(--color-ink-3)' }} aria-hidden="true" />
                          {p.difficulty} · {p.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant={isDone ? 'secondary' : 'ghost'} active={isDone} onClick={() => toggle('done', p.id)} icon={<Check className="w-4 h-4" />}>
                          {isDone ? '已掌握' : '标记掌握'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          active={starred}
                          aria-label={starred ? '取消收藏' : '收藏'}
                          onClick={() => toggle('starred', p.id)}
                          icon={<Bookmark className="w-4 h-4" fill={starred ? 'currentColor' : 'none'} />}
                        />
                      </div>
                    </div>

                    <div className="text-[16px] leading-relaxed text-ink space-y-2 max-w-[46em]">
                      {p.stem && <MathText text={p.stem} />}
                      {p.parts.length > 0 && (
                        <ol className="space-y-1.5">
                          {p.parts.map((part, idx) => (
                            <li key={idx} className="flex gap-2.5">
                              <span className="font-serif text-ink-3 shrink-0">({idx + 1})</span>
                              <div className="flex-1 min-w-0"><MathText text={part} /></div>
                            </li>
                          ))}
                        </ol>
                      )}
                      {p.tail && <MathText text={p.tail} className="text-[14px] text-ink-2" />}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                      {sol?.hint && (
                        <button
                          type="button"
                          aria-expanded={o === 'hint'}
                          onClick={() => setOpen((m) => ({ ...m, [p.id]: m[p.id] === 'hint' ? undefined : 'hint' }))}
                          className={`inline-flex items-center gap-1 ${o === 'hint' ? 'text-ink font-bold' : 'text-primary hover:underline underline-offset-4'}`}
                        >
                          提示
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${o === 'hint' ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-expanded={o === 'sol'}
                        onClick={() => setOpen((m) => ({ ...m, [p.id]: m[p.id] === 'sol' ? undefined : 'sol' }))}
                        className={`inline-flex items-center gap-1 ${o === 'sol' ? 'text-ink font-bold' : 'text-primary hover:underline underline-offset-4'}`}
                      >
                        解答
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${o === 'sol' ? 'rotate-180' : ''}`} />
                      </button>
                      {lab && (
                        <a
                          href={`#/labs/${lab.id}`}
                          onClick={(e) => { e.preventDefault(); onNavigate(`#/labs/${lab.id}`); }}
                          className="text-ink-2 hover:text-primary"
                        >
                          相关实验 <span className="font-mono text-[13px]">{lab.number}</span> {lab.title}
                        </a>
                      )}
                    </div>

                    {o && (
                      <div className={`mt-3 pl-4 border-l-2 text-[15px] max-w-[46em] ${o === 'hint' ? 'border-accent' : 'border-primary'}`}>
                        {o === 'hint' ? (
                          sol?.hint ? <MathText text={sol.hint} /> : <p className="text-ink-3">本题提示尚在编写。</p>
                        ) : solsLoading ? (
                          <p className="text-ink-3">正在加载本章解答…</p>
                        ) : sol?.solution ? (
                          <MathText text={sol.solution} />
                        ) : (
                          <p className="text-ink-3">本题解答尚未录入。</p>
                        )}
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-3 pt-6" aria-label="分页">
            <Button size="sm" disabled={safePage <= 1} onClick={() => { setPage((x) => Math.max(1, x - 1)); window.scrollTo({ top: 0 }); }}>
              上一页
            </Button>
            <span className="text-[14px] font-mono text-ink-2 tabular">
              {safePage} / {totalPages}
            </span>
            <Button size="sm" disabled={safePage >= totalPages} onClick={() => { setPage((x) => Math.min(totalPages, x + 1)); window.scrollTo({ top: 0 }); }}>
              下一页
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
};
