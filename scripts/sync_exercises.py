#!/usr/bin/env python3
"""
Parse ../exercises/*.tex from the textbook LaTeX source into web/src/data/exercises.json.
Does NOT copy any textbook chapter prose; only extracts exercise metadata and prompts.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXERCISES_DIR = ROOT.parent / "exercises"
OUT_PATH = ROOT / "src" / "data" / "exercises.json"

CHAPTER_META = {
    1: {"title": "几何向量、线性方程组初步", "sections": {
        1: "几何向量及其线性运算",
        2: "空间直角坐标系与向量的坐标表示",
        3: "内积、外积与混合积",
        4: "空间中的直线、平面及其方程",
        5: "n 元向量",
        6: "线性相关性的初步认识",
    }},
    2: {"title": "线性空间", "sections": {
        1: "线性空间的定义",
        2: "子空间及其判定",
        3: "线性相关性",
        4: "基、维数与坐标",
        5: "子空间的交与和",
    }},
    3: {"title": "线性映射", "sections": {
        1: "线性映射的定义",
        2: "线性映射的像与核",
        3: "线性映射的秩与线性空间的同构",
        4: "线性映射的运算",
        5: "线性空间的积与商",
        6: "线性泛函与对偶空间",
    }},
    4: {"title": "矩阵", "sections": {
        1: "矩阵的概念",
        2: "矩阵的运算",
        3: "线性映射的矩阵表示",
        4: "矩阵的秩、可逆性与初等变换",
        5: "分块矩阵",
        6: "矩阵的 LU 分解",
        7: "对偶映射的矩阵与矩阵的转置",
    }},
    5: {"title": "行列式", "sections": {
        1: "二、三阶行列式及其性质",
        2: "n 阶行列式",
        3: "行列式的展开",
        4: "行列式的计算",
        5: "矩阵乘积的行列式",
        6: "伴随矩阵与逆矩阵公式",
        7: "Cramer 法则",
    }},
    6: {"title": "线性方程组综述", "sections": {
        1: "齐次线性方程组",
        2: "非齐次线性方程组",
    }},
    7: {"title": "特征值与相似理论", "sections": {
        1: "矩阵的相似",
        2: "不变子空间",
        3: "特征值与特征向量",
        4: "对角化",
        5: "极小多项式",
        6: "广义特征向量与 Jordan 标准形",
        7: "多项式矩阵与相似不变量",
        8: "Gerschgorin 圆盘定理",
    }},
    8: {"title": "内积空间与正交理论", "sections": {
        1: "内积与内积空间",
        2: "标准正交基",
        3: "正交补空间",
    }},
    9: {"title": "内积空间上的算子", "sections": {
        1: "伴随算子",
        2: "幂等算子与正交投影",
        3: "正交算子与酉算子",
        4: "正规算子与谱定理",
        5: "自伴算子与实谱定理",
        6: "实正规算子",
        7: "半正定算子与极分解",
        8: "奇异值分解",
    }},
    10: {"title": "二次型", "sections": {
        1: "实二次型",
        2: "二次型的正交标准形",
        3: "正定性与惯性定理",
        4: "同时对角化与 Rayleigh 商",
        5: "Hermite 型",
    }},
    11: {"title": "空间解析几何", "sections": {
        1: "球面、柱面、锥面与旋转面",
        2: "椭球面、双曲面与抛物面",
        3: "二次曲面的一般方程",
        4: "二次曲面的分类",
        5: "空间等距变换",
        6: "空间仿射变换",
    }},
}

# Map chapter -> default recommended lab id
CHAPTER_LAB = {
    1: "ch01-vectors3d",
    2: "ch02-span-basis",
    3: "ch03-kernel-image",
    4: "ch04-basis-shadow",
    5: "ch05-determinant",
    6: "ch06-four-subspaces",
    7: "ch07-eigen-explorer",
    8: "ch08-gram-schmidt",
    9: "ch09-svd-theater",
    10: "ch10-quadratic-forms",
    11: "ch11-quadric-surfaces",
}


def strip_comments(tex: str) -> str:
    lines = []
    for line in tex.splitlines():
        # Remove unescaped % comments
        m = re.search(r"(?<!\\)%", line)
        if m:
            line = line[: m.start()]
        lines.append(line)
    return "\n".join(lines)


def expand_poly(text: str) -> str:
    # \Poly[t]{\mathbb R}{2} -> {\mathbb R}_{2}[t]
    text = re.sub(
        r"\\Poly\[([^\]]+)\]\{([^{}]+)\}\{([^{}]+)\}",
        r"{\2}_{\3}[\1]",
        text,
    )
    # \Poly{\mathbb R}{2} -> {\mathbb R}_{2}[x]
    text = re.sub(
        r"\\Poly\{([^{}]+)\}\{([^{}]+)\}",
        r"{\1}_{\2}[x]",
        text,
    )
    return text


def clean_latex_fragment(text: str, label_map: dict[str, str]) -> str:
    text = expand_poly(text)
    # Replace \cref{...}
    def repl_cref(m: re.Match[str]) -> str:
        raw = m.group(1)
        keys = [k.strip() for k in raw.split(",")]
        names = []
        for k in keys:
            if k in label_map:
                names.append(label_map[k])
            elif k.startswith("exer:ch"):
                parts = k.replace("exer:ch", "").split("-")
                names.append("习题 " + ".".join(p.lstrip("0") or "0" for p in parts))
            elif k.startswith("thm:") or k.startswith("prop:") or k.startswith("cor:"):
                names.append("正文相关定理")
            elif k.startswith("def:"):
                names.append("正文相关定义")
            elif k.startswith("sec:") or k.startswith("ch:"):
                names.append("正文相关章节")
            else:
                names.append(f"[{k}]")
        return "、".join(names)

    text = re.sub(r"\\(?:cref|Cref|ref)\{([^}]+)\}", repl_cref, text)
    text = re.sub(r"\\label\{[^}]+\}", "", text)
    text = re.sub(r"\\emph\{([^}]+)\}", r"*\1*", text)
    text = re.sub(r"\\textbf\{([^}]+)\}", r"**\1**", text)
    text = re.sub(r"\\texttt\{([^}]+)\}", r"`\1`", text)
    text = re.sub(r"\\textlatinit\{([^}]+)\}", r"*\1*", text)
    text = re.sub(r"\\textsf\{([^}]+)\}", r"\1", text)
    text = re.sub(r"\\noindent\b", "", text)
    text = re.sub(r"\\ignorespaces\b", "", text)
    # Handle lstlisting blocks -> fenced matlab blocks
    text = re.sub(
        r"\\begin\{lstlisting\}(?:\[[^\]]*\])?\s*(.*?)\s*\\end\{lstlisting\}",
        lambda m: "\n```matlab\n" + m.group(1).strip() + "\n```\n",
        text,
        flags=re.DOTALL,
    )
    # Collapse excessive whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_exparts(raw_body: str, label_map: dict[str, str]) -> dict:
    """Split a problem body into stem, optional parts list, and optional tail."""
    m = re.search(r"\\begin\{exparts\}(.*?)\\end\{exparts\}", raw_body, flags=re.DOTALL)
    if not m:
        return {
            "stem": clean_latex_fragment(raw_body, label_map),
            "parts": [],
            "tail": "",
        }
    stem = clean_latex_fragment(raw_body[: m.start()], label_map)
    tail = clean_latex_fragment(raw_body[m.end() :], label_map)
    inner = m.group(1)
    # Split on \item at top level of exparts
    raw_items = re.split(r"\\item\b", inner)
    parts = [clean_latex_fragment(p, label_map) for p in raw_items[1:] if p.strip()]
    return {"stem": stem, "parts": parts, "tail": tail}


def parse_file(path: Path) -> list[dict]:
    fname = path.name
    m_sec = re.match(r"ch(\d+)-sec(\d+)-exercises\.tex$", fname)
    m_rev = re.match(r"ch(\d+)-exercises\.tex$", fname)
    if not m_sec and not m_rev:
        return []

    chapter = int((m_sec or m_rev).group(1))
    is_review = m_rev is not None
    sec_num = int(m_sec.group(2)) if m_sec else 0

    raw = strip_comments(path.read_text(encoding="utf-8"))

    # Find group blocks: \ExerciseGroup{k}, \ReviewGroup{A/B}, \MatlabGroup
    # Split into chunks by \begin{exerciseproblems}...\end{exerciseproblems}
    problems: list[dict] = []
    # Track group header before each exerciseproblems block
    pattern = re.compile(
        r"(?:\\ExerciseGroup\{([^}]+)\}|\\ReviewGroup\{([^}]+)\}|(\\MatlabGroup))(.*?)\\begin\{exerciseproblems\}(.*?)\\end\{exerciseproblems\}",
        flags=re.DOTALL,
    )

    for gm in pattern.finditer(raw):
        ex_group = gm.group(1)
        rev_group = gm.group(2)
        is_matlab = gm.group(3) is not None
        block = gm.group(5)

        if is_matlab:
            group_code = "M"
            group_label = "动手学线性代数"
        elif rev_group:
            group_code = rev_group
            group_label = f"章末总复习题 · {rev_group} 组"
        else:
            group_code = ex_group or str(sec_num)
            sec_title = CHAPTER_META.get(chapter, {}).get("sections", {}).get(sec_num, "")
            group_label = f"习题 {chapter}.{group_code}" + (f" · {sec_title}" if sec_title else "")

        # Extract individual \exitem{diff}{type}
        item_matches = list(re.finditer(r"\\exitem\{([^}]*)\}\{([^}]*)\}", block))
        for idx, im in enumerate(item_matches):
            diff = im.group(1).strip() or "基础"
            ptype = im.group(2).strip() or "计算"
            start = im.end()
            end = item_matches[idx + 1].start() if idx + 1 < len(item_matches) else len(block)
            body = block[start:end].strip()

            lbl_m = re.search(r"\\label\{([^}]+)\}", body)
            label = lbl_m.group(1) if lbl_m else ""

            num = idx + 1
            pid = f"ch{chapter:02d}-{group_code}-{num}"
            display_num = f"{chapter}.{group_code}.{num}"

            problems.append({
                "id": pid,
                "displayNum": display_num,
                "chapter": chapter,
                "section": sec_num,
                "isReview": is_review,
                "groupCode": group_code,
                "groupLabel": group_label,
                "difficulty": diff,
                "type": ptype,
                "label": label,
                "rawBody": body,
                "recommendedLab": CHAPTER_LAB.get(chapter, ""),
            })

    return problems


def main() -> None:
    if not EXERCISES_DIR.exists():
        raise SystemExit(f"Exercises directory not found: {EXERCISES_DIR}")

    all_raw: list[dict] = []
    for path in sorted(EXERCISES_DIR.glob("ch*.tex")):
        all_raw.extend(parse_file(path))

    # Build label -> display name map first
    label_map = {
        p["label"]: f"习题 {p['displayNum']}"
        for p in all_raw
        if p["label"]
    }

    # Sort properly: by chapter, then non-review before review, then section/group order, then number
    def sort_key(p: dict):
        group_order = 0
        if p["isReview"]:
            group_order = {"A": 100, "B": 101, "M": 102}.get(p["groupCode"], 105)
        else:
            group_order = p["section"]
        num = int(p["id"].split("-")[-1])
        return (p["chapter"], group_order, num)

    all_raw.sort(key=sort_key)

    final_problems = []
    for p in all_raw:
        parsed = split_exparts(p["rawBody"], label_map)
        final_problems.append({
            "id": p["id"],
            "displayNum": p["displayNum"],
            "chapter": p["chapter"],
            "section": p["section"],
            "isReview": p["isReview"],
            "groupCode": p["groupCode"],
            "groupLabel": p["groupLabel"],
            "difficulty": p["difficulty"],
            "type": p["type"],
            "stem": parsed["stem"],
            "parts": parsed["parts"],
            "tail": parsed["tail"],
            "recommendedLab": p["recommendedLab"],
        })

    # Build chapter summary
    chapters_out = []
    for ch_num in sorted(CHAPTER_META.keys()):
        ch_probs = [p for p in final_problems if p["chapter"] == ch_num]
        groups = []
        seen = set()
        for p in ch_probs:
            gk = p["groupCode"]
            if gk not in seen:
                seen.add(gk)
                groups.append({
                    "code": gk,
                    "label": p["groupLabel"],
                    "isReview": p["isReview"],
                    "count": sum(1 for x in ch_probs if x["groupCode"] == gk),
                })
        chapters_out.append({
            "chapter": ch_num,
            "title": CHAPTER_META[ch_num]["title"],
            "count": len(ch_probs),
            "groups": groups,
        })

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(
            {
                "total": len(final_problems),
                "chapters": chapters_out,
                "problems": final_problems,
            },
            ensure_ascii=False,
            indent=None,
        ),
        encoding="utf-8",
    )
    print(f"Synced {len(final_problems)} exercises across {len(chapters_out)} chapters -> {OUT_PATH}")


if __name__ == "__main__":
    main()
