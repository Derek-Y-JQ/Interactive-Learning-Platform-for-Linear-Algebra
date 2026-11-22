#!/usr/bin/env python3
"""
Parse ../solutions/ch01-solutions.md .. ch11-solutions.md into per-chapter JSON files
under web/src/data/solutions/ch01.json .. ch11.json, indexed by exercise id (e.g. "ch01-1-1").

Verifies 1-to-1 coverage against web/src/data/exercises.json so every exercise has its
matching solution and no stray or missing entries slip through.

Usage (from web/):  npm run sync-solutions
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT.parent
SOLUTIONS_DIR = BOOK / "solutions"
EXERCISES_PATH = ROOT / "src" / "data" / "exercises.json"
OUT_DIR = ROOT / "src" / "data" / "solutions"


def expand_poly(text: str) -> str:
    arg = r"((?:[^{}]|\{[^{}]*\})+)"
    text = re.sub(rf"\\Poly\[([^\]]+)\]\{{{arg}\}}\{{{arg}\}}", r"{\2}_{\3}[\1]", text)
    return re.sub(rf"\\Poly\{{{arg}\}}\{{{arg}\}}", r"{\1}_{\2}[x]", text)


def parse_chapter_solutions(path: Path, chapter: int) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    heading_re = re.compile(r"^(#{2,4})\s+(.+?)\s*$", flags=re.MULTILINE)
    matches = list(heading_re.finditer(text))
    sols: dict[str, str] = {}

    for idx, m in enumerate(matches):
        level = len(m.group(1))
        title = m.group(2).strip()
        if level < 3:
            continue

        pid: str | None = None
        m_sec = re.match(r"^(\d+)\.(\d+)\.(\d+)\b", title)
        m_rev = re.match(r"^([ABC])\.(\d+)\b", title)
        m_mat = re.match(r"^M\.(\d+)\b", title)
        if m_sec:
            ch, sec, num = int(m_sec.group(1)), int(m_sec.group(2)), int(m_sec.group(3))
            if ch != chapter:
                raise ValueError(f"{path.name}: heading {title!r} chapter {ch} != {chapter}")
            pid = f"ch{ch:02d}-{sec}-{num}"
        elif m_rev:
            grp, num = m_rev.group(1), int(m_rev.group(2))
            pid = f"ch{chapter:02d}-{grp}-{num}"
        elif m_mat:
            num = int(m_mat.group(1))
            pid = f"ch{chapter:02d}-M-{num}"

        if not pid:
            continue

        start = m.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        # Strip trailing horizontal rules used as problem separators in Markdown
        body = re.sub(r"(?:\r?\n|^)---\s*$", "", body).strip()
        body = expand_poly(body)
        if not body:
            raise ValueError(f"{path.name}: empty solution body for {pid}")
        if pid in sols:
            raise ValueError(f"{path.name}: duplicate solution for {pid}")
        sols[pid] = body

    return sols


def main() -> None:
    exercises_data = json.loads(EXERCISES_PATH.read_text(encoding="utf-8"))
    by_chapter: dict[int, list[str]] = {}
    for p in exercises_data["problems"]:
        by_chapter.setdefault(p["chapter"], []).append(p["id"])

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    errors: list[str] = []

    for ch in sorted(by_chapter.keys()):
        md_path = SOLUTIONS_DIR / f"ch{ch:02d}-solutions.md"
        if not md_path.exists():
            errors.append(f"Missing solution file: {md_path}")
            continue
        sols = parse_chapter_solutions(md_path, ch)
        expected = by_chapter[ch]
        missing = sorted(set(expected) - set(sols.keys()))
        extra = sorted(set(sols.keys()) - set(expected))
        if missing:
            errors.append(f"Ch {ch:02d} missing solutions: {missing}")
        if extra:
            errors.append(f"Ch {ch:02d} extra solutions: {extra}")

        ordered = {pid: sols[pid] for pid in expected if pid in sols}
        out_path = OUT_DIR / f"ch{ch:02d}.json"
        out_path.write_text(json.dumps(ordered, ensure_ascii=False), encoding="utf-8")
        total += len(ordered)

    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Synced {total} solutions across {len(by_chapter)} chapters -> {OUT_DIR}")


if __name__ == "__main__":
    main()
