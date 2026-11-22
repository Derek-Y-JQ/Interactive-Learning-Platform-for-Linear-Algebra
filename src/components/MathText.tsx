import React, { useMemo } from 'react';
import katex from 'katex';

const KATEX_MACROS: Record<string, string> = {
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
  '\\C': '\\mathbb{C}',
  '\\dd': '\\,\\mathrm{d}',
  '\\e': '\\mathrm{e}',
  '\\ii': '\\mathrm{i}',
  '\\sgn': '\\operatorname{sgn}',
  '\\osc': '\\operatorname{osc}',
  '\\Hom': '\\operatorname{Hom}',
  '\\End': '\\operatorname{End}',
  '\\id': '\\operatorname{id}',
  '\\proj': '\\operatorname{proj}',
  '\\ev': '\\operatorname{ev}',
  '\\rank': '\\operatorname{rank}',
  '\\tr': '\\operatorname{tr}',
  '\\im': '\\operatorname{im}',
  '\\vg': '\\mathcal{#1}',
  '\\bm': '\\boldsymbol{#1}',
};

export function renderKatex(math: string, displayMode = false): string {
  try {
    return katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: true,
      macros: { ...KATEX_MACROS },
    });
  } catch {
    return math;
  }
}

export const Tex: React.FC<{ math: string; block?: boolean; className?: string }> = ({
  math,
  block = false,
  className = '',
}) => {
  const html = useMemo(() => renderKatex(math, block), [math, block]);
  if (block) {
    return <div className={`my-1.5 overflow-x-auto ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

interface Segment {
  kind: 'text' | 'inline' | 'display' | 'code';
  content: string;
}

function tokenizeMixedLatex(input: string): Segment[] {
  const segments: Segment[] = [];
  // First split fenced code blocks ```matlab ... ```
  const codeRegex = /```(?:matlab)?\n([\s\S]*?)```/g;
  let lastIdx = 0;
  const chunks: { isCode: boolean; content: string }[] = [];
  let cm: RegExpExecArray | null;
  while ((cm = codeRegex.exec(input)) !== null) {
    if (cm.index > lastIdx) {
      chunks.push({ isCode: false, content: input.slice(lastIdx, cm.index) });
    }
    chunks.push({ isCode: true, content: cm[1] });
    lastIdx = cm.index + cm[0].length;
  }
  if (lastIdx < input.length) {
    chunks.push({ isCode: false, content: input.slice(lastIdx) });
  }

  // Tokenize math inside non-code chunks
  const mathRegex = /(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$(?:\\.|[^$\\])+\$)/g;
  for (const chunk of chunks) {
    if (chunk.isCode) {
      segments.push({ kind: 'code', content: chunk.content });
      continue;
    }
    let idx = 0;
    let m: RegExpExecArray | null;
    while ((m = mathRegex.exec(chunk.content)) !== null) {
      if (m.index > idx) {
        segments.push({ kind: 'text', content: chunk.content.slice(idx, m.index) });
      }
      const token = m[0];
      if (token.startsWith('\\[')) {
        segments.push({ kind: 'display', content: token.slice(2, -2).trim() });
      } else if (token.startsWith('$$')) {
        segments.push({ kind: 'display', content: token.slice(2, -2).trim() });
      } else {
        segments.push({ kind: 'inline', content: token.slice(1, -1).trim() });
      }
      idx = m.index + token.length;
    }
    if (idx < chunk.content.length) {
      segments.push({ kind: 'text', content: chunk.content.slice(idx) });
    }
  }
  return segments;
}

export const MathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const segments = useMemo(() => tokenizeMixedLatex(text), [text]);

  return (
    <div className={`leading-relaxed break-words ${className}`}>
      {segments.map((seg, i) => {
        if (seg.kind === 'display') {
          return <Tex key={i} math={seg.content} block />;
        }
        if (seg.kind === 'inline') {
          return <Tex key={i} math={seg.content} />;
        }
        if (seg.kind === 'code') {
          return (
            <pre
              key={i}
              className="my-2.5 rounded-md bg-ink text-paper p-3 text-[13px] font-mono overflow-x-auto leading-relaxed"
            >
              <code>{seg.content}</code>
            </pre>
          );
        }
        // Simple inline formatting for **bold**, *italic*, `code`
        const parts = seg.content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
        return (
          <React.Fragment key={i}>
            {parts.map((p, j) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return <strong key={j} className="font-bold text-ink">{p.slice(2, -2)}</strong>;
              }
              if (p.startsWith('*') && p.endsWith('*')) {
                return <em key={j} className="italic">{p.slice(1, -1)}</em>;
              }
              if (p.startsWith('`') && p.endsWith('`')) {
                return (
                  <code key={j} className="px-1 py-0.5 rounded-sm bg-sunken text-primary text-[0.9em] font-mono">
                    {p.slice(1, -1)}
                  </code>
                );
              }
              return <React.Fragment key={j}>{p}</React.Fragment>;
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
