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
  '\\Poly': '{#1}_{#2}[x]',
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

interface AtomicBlock {
  kind: 'code' | 'display';
  content: string;
}

type ParsedBlock =
  | { kind: 'code'; content: string }
  | { kind: 'display'; content: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'paragraph'; content: string };

const SENTINEL_PREFIX = '\uE000BLK';
const SENTINEL_SUFFIX = '\uE001';
const SENTINEL_RE = /\uE000BLK(\d+)\uE001/g;

function parseBlocks(input: string): { blocks: ParsedBlock[]; atoms: AtomicBlock[] } {
  const atoms: AtomicBlock[] = [];
  const stash = (kind: 'code' | 'display', content: string) => {
    const idx = atoms.length;
    atoms.push({ kind, content });
    return `\n\n${SENTINEL_PREFIX}${idx}${SENTINEL_SUFFIX}\n\n`;
  };

  // 1. Protect fenced code blocks first so math inside code is untouched
  let text = input.replace(/\r\n/g, '\n').replace(/```[\w-]*\n([\s\S]*?)```/g, (_, code: string) =>
    stash('code', code.replace(/\n$/, '')),
  );

  // 2. Protect display math ($$ ... $$ and \[ ... \])
  text = text.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g, (_, m1?: string, m2?: string) =>
    stash('display', (m1 ?? m2 ?? '').trim()),
  );

  // 3. Split into paragraph-level chunks on blank lines
  const rawChunks = text
    .split(/\n{2,}/)
    .map((c) => c.trim())
    .filter(Boolean);

  const blocks: ParsedBlock[] = [];
  for (const chunk of rawChunks) {
    const exact = chunk.match(/^\uE000BLK(\d+)\uE001$/);
    if (exact) {
      const atom = atoms[Number(exact[1])];
      blocks.push({ kind: atom.kind, content: atom.content });
      continue;
    }

    const lines = chunk.split('\n');
    const isBulletList = lines.every((l) => /^\s*[-*]\s+/.test(l));
    if (isBulletList) {
      blocks.push({
        kind: 'list',
        items: lines.map((l) => l.replace(/^\s*[-*]\s+/, '').trim()),
      });
      continue;
    }

    // Handle mixed prose + bullet lines inside a single chunk (no blank line before list)
    let paraLines: string[] = [];
    let listItems: string[] = [];
    const flushPara = () => {
      if (paraLines.length > 0) {
        blocks.push({ kind: 'paragraph', content: paraLines.join('\n') });
        paraLines = [];
      }
    };
    const flushList = () => {
      if (listItems.length > 0) {
        blocks.push({ kind: 'list', items: listItems });
        listItems = [];
      }
    };

    for (const line of lines) {
      if (/^\s*[-*]\s+/.test(line)) {
        flushPara();
        listItems.push(line.replace(/^\s*[-*]\s+/, '').trim());
      } else {
        flushList();
        paraLines.push(line);
      }
    }
    flushPara();
    flushList();
  }

  return { blocks, atoms };
}

function renderInline(text: string, keyPrefix: string, allowBold = true): React.ReactNode[] {
  // Match inline math $...$, inline code `...`, **bold** (may contain inline math), or *italic*
  const inlineRe = allowBold
    ? /(\$(?:\\.|[^$\\])+\$|`[^`]+`|\*\*(?:(?:\$(?:\\.|[^$\\])+\$)|[^*])+\*\*|\*[^*\n]+\*)/g
    : /(\$(?:\\.|[^$\\])+\$|`[^`]+`|\*[^*\n]+\*)/g;

  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  while ((m = inlineRe.exec(text)) !== null) {
    if (m.index > lastIdx) {
      nodes.push(<React.Fragment key={`${keyPrefix}-t${k++}`}>{text.slice(lastIdx, m.index)}</React.Fragment>);
    }
    const token = m[0];
    if (token.startsWith('$') && token.endsWith('$')) {
      nodes.push(<Tex key={`${keyPrefix}-m${k++}`} math={token.slice(1, -1).trim()} />);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`${keyPrefix}-c${k++}`}
          className="px-1 py-0.5 rounded-sm bg-sunken text-primary text-[0.9em] font-mono"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b${k++}`} className="font-bold text-ink">
          {renderInline(token.slice(2, -2), `${keyPrefix}-bi${k}`, false)}
        </strong>,
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={`${keyPrefix}-i${k++}`} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      nodes.push(<React.Fragment key={`${keyPrefix}-r${k++}`}>{token}</React.Fragment>);
    }
    lastIdx = m.index + token.length;
  }

  if (lastIdx < text.length) {
    nodes.push(<React.Fragment key={`${keyPrefix}-e`}>{text.slice(lastIdx)}</React.Fragment>);
  }
  return nodes;
}

function renderWithAtoms(text: string, atoms: AtomicBlock[], keyPrefix: string): React.ReactNode {
  if (!SENTINEL_RE.test(text)) {
    return renderInline(text, keyPrefix);
  }
  SENTINEL_RE.lastIndex = 0;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = SENTINEL_RE.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(<React.Fragment key={`${keyPrefix}-p${k++}`}>{renderInline(text.slice(lastIdx, m.index), `${keyPrefix}-pi${k}`)}</React.Fragment>);
    }
    const atom = atoms[Number(m[1])];
    if (atom.kind === 'display') {
      parts.push(<Tex key={`${keyPrefix}-d${k++}`} math={atom.content} block />);
    } else {
      parts.push(
        <pre
          key={`${keyPrefix}-cb${k++}`}
          className="my-2.5 rounded-md bg-ink text-paper p-3 text-[13px] font-mono overflow-x-auto leading-relaxed"
        >
          <code>{atom.content}</code>
        </pre>,
      );
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(<React.Fragment key={`${keyPrefix}-pe`}>{renderInline(text.slice(lastIdx), `${keyPrefix}-pei`)}</React.Fragment>);
  }
  return parts;
}

export const MathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const { blocks, atoms } = useMemo(() => parseBlocks(text), [text]);

  return (
    <div className={`leading-relaxed break-words space-y-2.5 ${className}`}>
      {blocks.map((block, i) => {
        if (block.kind === 'display') {
          return <Tex key={i} math={block.content} block />;
        }
        if (block.kind === 'code') {
          return (
            <pre
              key={i}
              className="my-2.5 rounded-md bg-ink text-paper p-3 text-[13px] font-mono overflow-x-auto leading-relaxed"
            >
              <code>{block.content}</code>
            </pre>
          );
        }
        if (block.kind === 'list') {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j}>{renderWithAtoms(item, atoms, `l${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return <div key={i}>{renderWithAtoms(block.content, atoms, `p${i}`)}</div>;
      })}
    </div>
  );
};
