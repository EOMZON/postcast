from __future__ import annotations

from typing import Any


def build_digest_markdown(*, topic_title: str, date: str, items: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    lines.append(f"# {topic_title}")
    lines.append(f"{date}")
    lines.append("")
    lines.append("## 今日精选")
    if not items:
        lines.append("- （暂无命中；可调整关键词/来源）")
        return "\n".join(lines).strip() + "\n"

    for i, it in enumerate(items, start=1):
        title = (it.get("title") or "").strip().replace("\n", " ")
        url = (it.get("url") or "").strip()
        published = (it.get("published") or "").strip()
        src = (it.get("source_id") or it.get("source") or "").strip()
        if url:
            lines.append(f"{i}. [{title}]({url})")
        else:
            lines.append(f"{i}. {title}")
        meta_bits = [b for b in [published, src] if b]
        if meta_bits:
            lines.append(f"   - {' · '.join(meta_bits)}")

    lines.append("")
    lines.append("## Notes")
    lines.append("- 这是 text-first 的最小闭环：抓取 → 粗筛 → digest（后续可加 LLM 二次精选与口播脚本）。")
    return "\n".join(lines).strip() + "\n"

