#!/usr/bin/env python3
"""
Build web/src/data/exercises.json from the textbook LaTeX source.

The chapter structure (chapter titles, section titles, which exercise files belong to which
section) is read from ../chapters/*.tex, so the web index always matches the printed book.
Cross references (\\cref, \\ref, \\eqref) are resolved to their printed form ("定理 7.12",
"第 7.2 节", "式 (7.3)", "习题 10.1.2") using ../.latex_cache/main.aux, so readers never see
raw label names. Only exercise prompts are extracted; no chapter prose is copied.

Usage (from web/):  npm run sync-exercises
Requires a recent LaTeX build of the book (main.aux) for reference numbers.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT.parent
OUT_PATH = ROOT / "src" / "data" / "exercises.json"
AUX_CANDIDATES = [BOOK / ".latex_cache" / "main.aux", BOOK / "main.aux"]

CHAPTER_LAB = {
    1: "ch01-vectors3d",
    2: "ch02-span-basis",
    3: "ch03-kernel-image",
    4: "ch04-map-to-matrix",
    5: "ch05-determinant",
    6: "ch06-four-subspaces",
    7: "ch07-eigen-explorer",
    8: "ch08-gram-schmidt",
    9: "ch09-svd-theater",
    10: "ch10-quadratic-forms",
    11: "ch11-quadric-surfaces",
}

# printed names of cleveref types (styles/booksettings.sty)
CREF_NAMES = {
    "theorem": "定理", "proposition": "命题", "lemma": "引理", "corollary": "推论",
    "definition": "定义", "assumption": "假设", "remark": "注", "example": "例",
    "exercise": "练习", "exerciseproblemsi": "习题", "figure": "图", "table": "表",
}


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def strip_comments(tex: str) -> str:
    return "\n".join(re.sub(r"(?<!\\)%.*", "", line) for line in tex.splitlines())


def read_braced(s: str, i: int) -> tuple[str, int]:
    """s[i] == '{'; return (content, index after closing brace)."""
    depth = 0
    for j in range(i, len(s)):
        if s[j] == "{":
            depth += 1
        elif s[j] == "}":
            depth -= 1
            if depth == 0:
                return s[i + 1 : j], j + 1
    return s[i + 1 :], len(s)


def plain_title(t: str) -> str:
    t = re.sub(r"\\texorpdfstring\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{[^{}]*\}", r"\1", t)
    t = t.replace("$", "")
    t = re.sub(r"\\lambda\b", "λ", t)
    t = re.sub(r"\\[a-zA-Z]+\s*", "", t)
    t = t.replace("{", "").replace("}", "")
    t = re.sub(r"^\*\s*", "", t)
    return re.sub(r"\s+", " ", t).strip()


def load_aux() -> dict[str, tuple[str, str]]:
    """label -> (printed number, cleveref type)"""
    for p in AUX_CANDIDATES:
        if p.exists():
            aux = p.read_text(encoding="utf-8")
            break
    else:
        print("warning: main.aux not found; cross references cannot be resolved", file=sys.stderr)
        return {}
    out: dict[str, tuple[str, str]] = {}
    for m in re.finditer(r"\\newlabel\{([^}]+)@cref\}\{\{\[([^\]]*)\]\[[^\]]*\]\[[^\]]*\]\{?([^}]*)\}?\}", aux):
        out[m.group(1)] = (m.group(3), m.group(2))
    return out


def fmt_ref(label: str, aux: dict[str, tuple[str, str]]) -> str:
    if label not in aux:
        print(f"warning: unresolved reference {label}", file=sys.stderr)
        return "正文相关内容"
    num, typ = aux[label]
    if typ == "chapter":
        return "预备知识" if num == "0" else f"第 {num} 章"
    if typ in ("section", "subsection", "subsubsection"):
        return f"第 {num} 节"
    if typ in ("appendix", "subappendix"):
        return f"附录 {num}"
    if typ == "equation":
        return f"式 ({num})"
    return f"{CREF_NAMES.get(typ, '')} {num}".strip()


def resolve_refs(text: str, aux: dict[str, tuple[str, str]]) -> str:
    def repl(m: re.Match[str]) -> str:
        keys = [k.strip() for k in m.group(2).split(",") if k.strip()]
        names = [fmt_ref(k, aux) for k in keys]
        if m.group(1) == "eqref":
            names = [f"({aux[k][0]})" if k in aux else n for k, n in zip(keys, names)]
        if len(names) <= 1:
            return names[0] if names else ""
        return "、".join(names[:-1]) + " 与 " + names[-1]

    return re.sub(r"\\(cref|Cref|ref|eqref)\*?\{([^}]+)\}", repl, text)


def expand_poly(text: str) -> str:
    text = re.sub(r"\\Poly\[([^\]]+)\]\{([^{}]+)\}\{([^{}]+)\}", r"{\2}_{\3}[\1]", text)
    return re.sub(r"\\Poly\{([^{}]+)\}\{([^{}]+)\}", r"{\1}_{\2}[x]", text)


def clean_fragment(text: str, aux: dict[str, tuple[str, str]]) -> str:
    text = expand_poly(text)
    text = resolve_refs(text, aux)
    # Fix cross-chapter review-exercise refs whose aux label carried the source chapter number
    text = re.sub(r"第 (\d+) 章习题 \d+\.([ABC]\.\d+)", r"第 \1 章习题 \1.\2", text)
    text = re.sub(r"\\label\{[^}]+\}", "", text)
    text = re.sub(r"\\emph\{([^}]+)\}", r"*\1*", text)
    text = re.sub(r"\\textbf\{([^}]+)\}", r"**\1**", text)
    text = re.sub(
        r"\\texttt\{([^}]+)\}",
        lambda m: "`" + re.sub(r"\\textbackslash\s*", r"\\", m.group(1)) + "`",
        text,
    )
    text = re.sub(r"\\textlatinit\{([^}]+)\}", r"*\1*", text)
    text = re.sub(r"\\textsf\{([^}]+)\}", r"\1", text)
    text = re.sub(r"\\(noindent|ignorespaces|par)\b", "", text)
    text = re.sub(
        r"\\begin\{lstlisting\}(?:\[[^\]]*\])?\s*(.*?)\s*\\end\{lstlisting\}",
        lambda m: "\n```matlab\n" + m.group(1).strip() + "\n```\n",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_parts(body: str, aux) -> dict:
    m = re.search(r"\\begin\{exparts\}(.*?)\\end\{exparts\}", body, flags=re.DOTALL)
    if not m:
        return {"stem": clean_fragment(body, aux), "parts": [], "tail": ""}
    items = re.split(r"\\item\b", m.group(1))
    return {
        "stem": clean_fragment(body[: m.start()], aux),
        "parts": [clean_fragment(p, aux) for p in items[1:] if p.strip()],
        "tail": clean_fragment(body[m.end() :], aux),
    }


# ---------------------------------------------------------------------------
# book structure
# ---------------------------------------------------------------------------

def chapter_structure() -> list[dict]:
    """[{chapter, title, sections: {k: title}, files: [(path, section_or_0)]}] in book order."""
    main = strip_comments((BOOK / "main.tex").read_text(encoding="utf-8"))
    order = re.findall(r"\\input\{(chapters/[^}]*)\}", main)
    out = []
    for n, rel in enumerate(order):
        tex = strip_comments((BOOK / (rel if rel.endswith(".tex") else rel + ".tex")).read_text(encoding="utf-8"))
        cm = re.search(r"\\chapter\*?(?:\[[^\]]*\])?\{", tex)
        title = plain_title(read_braced(tex, cm.end() - 1)[0]) if cm else ""
        sections: dict[int, str] = {}
        files: list[tuple[Path, int]] = []
        sec = 0
        for m in re.finditer(r"\\section\*?(?:\[[^\]]*\])?\{|\\input\{(exercises/[^}]*)\}", tex):
            if m.group(1):
                p = BOOK / (m.group(1) if m.group(1).endswith(".tex") else m.group(1) + ".tex")
                files.append((p, sec if "-sec" in p.name else 0))
            else:
                sec += 1
                sections[sec] = plain_title(read_braced(tex, m.end() - 1)[0])
        out.append({"chapter": n, "title": title, "sections": sections, "files": files})
    return out


def parse_exercise_file(path: Path, chapter: int, section: int, sections: dict[int, str]) -> list[dict]:
    raw = strip_comments(path.read_text(encoding="utf-8"))
    is_review = section == 0
    pattern = re.compile(
        r"(?:\\ExerciseGroup\{([^}]+)\}|\\ReviewGroup\{([^}]+)\}|(\\MatlabGroup))(.*?)"
        r"\\begin\{exerciseproblems\}(.*?)\\end\{exerciseproblems\}",
        flags=re.DOTALL,
    )
    out = []
    for gm in pattern.finditer(raw):
        if gm.group(3):
            code, label = "M", "动手学线性代数"
        elif gm.group(2):
            code, label = gm.group(2), f"章末总复习题 · {gm.group(2)} 组"
        else:
            code = gm.group(1)
            label = f"习题 {chapter}.{code}" + (f" · {sections[section]}" if section in sections else "")
        items = list(re.finditer(r"\\exitem\{([^}]*)\}\{([^}]*)\}", gm.group(5)))
        for idx, im in enumerate(items):
            end = items[idx + 1].start() if idx + 1 < len(items) else len(gm.group(5))
            out.append({
                "id": f"ch{chapter:02d}-{code}-{idx + 1}",
                "displayNum": f"{chapter}.{code}.{idx + 1}",
                "chapter": chapter,
                "section": section,
                "isReview": is_review,
                "groupCode": code,
                "groupLabel": label,
                "difficulty": im.group(1).strip() or "基础",
                "type": im.group(2).strip() or "计算",
                "body": gm.group(5)[im.end() : end].strip(),
            })
    return out


def main() -> None:
    aux = load_aux()
    structure = [c for c in chapter_structure() if c["files"]]
    all_ch_probs: list[tuple[dict, list[dict]]] = []
    for c in structure:
        ch_probs: list[dict] = []
        for path, sec in c["files"]:
            ch_probs.extend(parse_exercise_file(path, c["chapter"], sec, c["sections"]))
        # section exercises first (book order), then review groups A, B, C, then MATLAB
        rank = {"A": 1, "B": 2, "C": 3, "M": 4}
        ch_probs.sort(key=lambda p: (p["isReview"], p["section"] if not p["isReview"] else rank.get(p["groupCode"], 9)))
        # Harvest live exercise labels so newly added \label{...} resolve without needing a fresh main.aux
        for p in ch_probs:
            for lbl in re.findall(r"\\label\{([^}]+)\}", p["body"]):
                aux[lbl] = (p["displayNum"], "exerciseproblemsi")
        all_ch_probs.append((c, ch_probs))

    problems: list[dict] = []
    chapters_out = []
    for c, ch_probs in all_ch_probs:
        groups = []
        for p in ch_probs:
            if not groups or groups[-1]["code"] != p["groupCode"]:
                groups.append({"code": p["groupCode"], "label": p["groupLabel"], "isReview": p["isReview"], "count": 0})
            groups[-1]["count"] += 1
        chapters_out.append({"chapter": c["chapter"], "title": c["title"], "count": len(ch_probs), "groups": groups})
        for p in ch_probs:
            body = p.pop("body")
            p.update(split_parts(body, aux))
            p["recommendedLab"] = CHAPTER_LAB.get(c["chapter"], "")
            problems.append(p)

    OUT_PATH.write_text(
        json.dumps({"total": len(problems), "chapters": chapters_out, "problems": problems}, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Synced {len(problems)} exercises across {len(chapters_out)} chapters -> {OUT_PATH}")


if __name__ == "__main__":
    main()
