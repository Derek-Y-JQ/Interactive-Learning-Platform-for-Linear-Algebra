import React, { useEffect, useState } from 'react';
import exercisesData from './data/exercises.json';
import { HomePage } from './pages/HomePage';
import { LabsPage } from './pages/LabsPage';
import { ExercisesPage } from './pages/ExercisesPage';

interface RouteState {
  view: 'home' | 'labs' | 'exercises';
  param?: string;
}

function parseHash(hash: string): RouteState {
  const cleaned = hash.replace(/^#\/?/, '');
  if (!cleaned) return { view: 'home' };
  const [first, second] = cleaned.split('/');
  if (first === 'labs') return { view: 'labs', param: second || 'ch01-vectors3d' };
  if (first === 'exercises') return { view: 'exercises', param: second };
  return { view: 'home' };
}

const NAV: { key: string; label: string; hash: string; match: (r: RouteState) => boolean; hideSm?: boolean }[] = [
  { key: 'home', label: '目录', hash: '#/', match: (r) => r.view === 'home' },
  {
    key: 'labs',
    label: '实验',
    hash: '#/labs/ch01-vectors3d',
    match: (r) => r.view === 'labs' && r.param !== 'appendix-equivalence',
  },
  { key: 'ex', label: '习题', hash: '#/exercises', match: (r) => r.view === 'exercises' },
  {
    key: 'map',
    label: '概念图谱',
    hash: '#/labs/appendix-equivalence',
    match: (r) => r.view === 'labs' && r.param === 'appendix-equivalence',
    hideSm: true,
  },
];

export const App: React.FC = () => {
  const [route, setRoute] = useState<RouteState>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (hash: string) => {
    if (window.location.hash === hash) setRoute(parseHash(hash));
    else window.location.hash = hash;
  };

  const totalExercises = (exercisesData as { total: number }).total;

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 bg-surface px-3 py-2 border border-ink">
        跳到正文
      </a>
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-ink/80">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <a href="#/" className="flex items-baseline gap-3 min-w-0 group" aria-label="返回目录">
            <span className="font-serif text-[21px] font-bold text-ink tracking-tight whitespace-nowrap">线性代数</span>
            <span className="hidden md:inline font-serif text-[16px] text-ink-2 truncate group-hover:text-ink">
              从几何向量到谱理论
            </span>
          </a>

          <nav aria-label="主导航" className="flex items-stretch h-full">
            {NAV.map((n) => {
              const on = n.match(route);
              return (
                <a
                  key={n.key}
                  href={n.hash}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(n.hash);
                  }}
                  aria-current={on ? 'page' : undefined}
                  className={`${n.hideSm ? 'hidden sm:flex' : 'flex'} items-center px-3 sm:px-4 text-[15px] border-b-2 -mb-px transition-colors ${
                    on ? 'border-accent text-ink font-bold' : 'border-transparent text-ink-2 hover:text-ink'
                  }`}
                >
                  {n.label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {route.view === 'home' && <HomePage totalExercises={totalExercises} onNavigate={navigate} />}
        {route.view === 'labs' && <LabsPage activeLabId={route.param ?? 'ch01-vectors3d'} onNavigate={navigate} />}
        {route.view === 'exercises' && (
          <ExercisesPage initialChapter={route.param ? Number(route.param) : undefined} onNavigate={navigate} />
        )}
      </main>

      <footer className="border-t border-rule mt-10">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 flex flex-wrap gap-x-6 gap-y-2 justify-between text-[13px] text-ink-3">
          <span>《线性代数：从几何向量到谱理论》 尹俊淇 · 杨毅 著 — 配套开源学习站</span>
          <span>静态站点 · 进度仅保存在本机浏览器</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
