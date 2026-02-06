#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class DigestEntry:
    date: str
    topic_id: str
    topic_title: str
    digest_path: str
    shortlist_path: str
    items: list[dict[str, Any]]


def _read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    out: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out


def _guess_topic_title(topic_id: str) -> str:
    cfg = Path("topics") / f"{topic_id}.toml"
    if not cfg.exists():
        return topic_id
    try:
        text = cfg.read_text(encoding="utf-8", errors="ignore")
        m = re.search(r'^\s*title\s*=\s*"([^"]+)"\s*$', text, flags=re.MULTILINE)
        if m:
            return m.group(1).strip()
    except Exception:
        pass
    return topic_id


def _collect_digests(*, max_days: int) -> list[DigestEntry]:
    base = Path("data/processed")
    if not base.exists():
        return []

    dates = sorted([p.name for p in base.iterdir() if p.is_dir()], reverse=True)
    dates = dates[:max_days]

    entries: list[DigestEntry] = []
    for d in dates:
        date_dir = base / d
        for topic_dir in sorted([p for p in date_dir.iterdir() if p.is_dir()]):
            topic_id = topic_dir.name
            digest = topic_dir / "digest.md"
            shortlist = topic_dir / "shortlist.jsonl"
            if not digest.exists() and not shortlist.exists():
                continue
            entries.append(
                DigestEntry(
                    date=d,
                    topic_id=topic_id,
                    topic_title=_guess_topic_title(topic_id),
                    digest_path=str(digest),
                    shortlist_path=str(shortlist),
                    items=_read_jsonl(shortlist),
                )
            )
    return entries


def _latest_issue_sources() -> dict[str, Any] | None:
    src_dir = Path("data/sources")
    if not src_dir.exists():
        return None
    files = sorted(src_dir.glob("issue-*.links.json"))
    if not files:
        return None
    path = files[-1]
    try:
        return {"path": str(path), "data": json.loads(path.read_text(encoding="utf-8"))}
    except Exception:
        return {"path": str(path), "data": None}


def _h(s: str) -> str:
    return html.escape(s or "", quote=True)


def _render_digests(entries: list[DigestEntry]) -> str:
    if not entries:
        return "<div class=\"card\"><div class=\"muted\">暂无 digest 产物。</div></div>"

    # group by topic
    by_topic: dict[str, list[DigestEntry]] = {}
    for e in entries:
        by_topic.setdefault(e.topic_id, []).append(e)

    parts: list[str] = []
    for topic_id, items in sorted(by_topic.items(), key=lambda x: x[0]):
        topic_title = items[0].topic_title
        parts.append("<details open>")
        parts.append(f"<summary><b>{_h(topic_title)}</b> <span class=\"muted\">({topic_id})</span></summary>")
        parts.append("<div style=\"margin-top:10px\">")
        parts.append("<table class=\"table\">")
        parts.append("<thead><tr><th>Date</th><th>Count</th><th>Open</th><th>Top</th></tr></thead>")
        parts.append("<tbody>")
        for e in sorted(items, key=lambda x: x.date, reverse=True):
            count = len(e.items)
            open_links = []
            if Path(e.digest_path).exists():
                open_links.append(f"<a href=\"../{_h(e.digest_path)}\">digest.md</a>")
            if Path(e.shortlist_path).exists():
                open_links.append(f"<a href=\"../{_h(e.shortlist_path)}\">shortlist.jsonl</a>")
            top_titles = []
            for it in e.items[:3]:
                t = (it.get("title") or "").strip().replace("\n", " ")
                u = (it.get("url") or "").strip()
                if t and u:
                    top_titles.append(f"<a href=\"{_h(u)}\" target=\"_blank\" rel=\"noreferrer\">{_h(t)}</a>")
                elif t:
                    top_titles.append(_h(t))
            parts.append(
                "<tr>"
                f"<td>{_h(e.date)}</td>"
                f"<td>{count}</td>"
                f"<td>{' · '.join(open_links) if open_links else ''}</td>"
                f"<td>{'<br />'.join(top_titles) if top_titles else '<span class=\"muted\">(empty)</span>'}</td>"
                "</tr>"
            )
        parts.append("</tbody></table></div></details>")
    return "\n".join(parts)


def _render_sources_block(issue_src: dict[str, Any] | None) -> str:
    if not issue_src or not issue_src.get("data"):
        return "<div class=\"card\"><div class=\"muted\">暂无导入的 Issue 信息源（或解析失败）。</div></div>"

    data = issue_src["data"]
    links = data.get("links") or []
    by_kind: dict[str, list[str]] = {}
    for x in links:
        if not isinstance(x, dict):
            continue
        url = (x.get("url") or "").strip()
        kind = (x.get("kind") or "web").strip()
        if url:
            by_kind.setdefault(kind, []).append(url)

    rows: list[str] = []
    for kind, urls in sorted(by_kind.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        preview = urls[:8]
        preview_html = "<br />".join(
            f"<a href=\"{_h(u)}\" target=\"_blank\" rel=\"noreferrer\">{_h(u)}</a>" for u in preview
        )
        rows.append(f"<tr><td><b>{_h(kind)}</b></td><td>{len(urls)}</td><td>{preview_html}</td></tr>")

    return (
        "<div class=\"card\">"
        f"<div class=\"muted\">Latest import: <code>{_h(issue_src['path'])}</code></div>"
        "<hr />"
        "<table class=\"table\">"
        "<thead><tr><th>Kind</th><th>Count</th><th>Preview</th></tr></thead>"
        "<tbody>"
        + "".join(rows)
        + "</tbody></table>"
        "</div>"
    )


def _unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    for i in range(2, 99):
        candidate = parent / f"{stem}-{i}{suffix}"
        if not candidate.exists():
            return candidate
    raise RuntimeError(f"Unable to pick unique filename for {path}")


def build_board(*, max_days: int) -> tuple[Path, Path]:
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    board_id = f"board-{ts}"

    out_dir = Path("docs/boards")
    out_dir.mkdir(parents=True, exist_ok=True)
    html_path = _unique_path(out_dir / f"{board_id}.html")
    data_path = _unique_path(out_dir / f"{board_id}.data.js")

    entries = _collect_digests(max_days=max_days)
    issue_src = _latest_issue_sources()

    digest_html = _render_digests(entries)
    sources_html = _render_sources_block(issue_src)

    topic_files = sorted(Path("topics").glob("*.toml"))
    topics_list = "".join(
        f"<li><code>{_h(str(p))}</code> — {_h(_guess_topic_title(p.stem))}</li>" for p in topic_files
    )

    kpi_today = entries[0].date if entries else "-"
    kpi_topics = str(len({e.topic_id for e in entries})) if entries else "0"
    kpi_items = str(sum(len(e.items) for e in entries)) if entries else "0"

    board_data = {
        "version": "zon-report@v1",
        "meta": {
            "id": board_id,
            "title": "postcast · Daily Board",
            "subtitle": "多主题播客自动化（text-first）",
            "abstract": "每日 digest、信息源导入、配置入口与运行说明。",
            "label": "Board",
            "layout": "audit",
            "theme": "light",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "audience": "Zon",
            "scope": "Repo-local dashboard",
            "tags": ["board", "podcast", "automation"],
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "links": {},
        },
        "blocks": [
            {
                "id": "tldr",
                "nav": "Overview",
                "type": "html",
                "data": {
                    "html": f"""
                      <h2>Overview</h2>
                      <div class="kpi-grid">
                        <div class="kpi"><div class="k">Latest date</div><div class="v">{_h(kpi_today)}</div><div class="muted">From data/processed</div></div>
                        <div class="kpi"><div class="k">Topics</div><div class="v">{_h(kpi_topics)}</div><div class="muted">With digests</div></div>
                        <div class="kpi"><div class="k">Shortlist items</div><div class="v">{_h(kpi_items)}</div><div class="muted">Across last {max_days} days</div></div>
                      </div>
                        <div class="card" style="margin-top:12px">
                        <div class="muted">Quick links</div>
                        <ul class="list-tight">
                          <li><a href="../report.html">方案报告（report）</a></li>
                          <li><a href="../../data/processed/">data/processed</a>（产物目录，仅本地）</li>
                          <li><a href="../../topics/">topics</a>（主题配置，仅本地）</li>
                        </ul>
                      </div>
                    """
                },
            },
            {
                "id": "topics",
                "nav": "Topics",
                "type": "html",
                "data": {"html": f"<h2>Topics</h2><div class=\"card\"><ul>{topics_list}</ul></div>"},
            },
            {
                "id": "digests",
                "nav": "Digests",
                "type": "html",
                "data": {"html": f"<h2>Digests (last {max_days} days)</h2>{digest_html}"},
            },
            {
                "id": "sources",
                "nav": "Sources",
                "type": "html",
                "data": {"html": f"<h2>Imported sources (Issue #40)</h2>{sources_html}"},
            },
            {
                "id": "runbook",
                "nav": "Runbook",
                "type": "html",
                "data": {
                    "html": """
                      <h2>Runbook</h2>
                      <div class="card">
                        <ol>
                          <li><b>本地跑</b>：<code>python3 scripts/run_daily.py --topic ai_papers</code></li>
                          <li><b>导入 Issue #40 信息源</b>：<code>python3 scripts/import_github_issue_links.py --env-file /Users/zon/Desktop/MINE/.env</code></li>
                          <li><b>生成看板</b>：<code>python3 scripts/build_board.py</code></li>
                        </ol>
                        <hr />
                        <div class="muted">建议：先把 text-first（digest + 口播稿）跑稳，再接入 TTS/音频上传/RSS 发布。</div>
                      </div>
                    """
                },
            },
            {
                "id": "closing",
                "nav": "Closing",
                "type": "html",
                "data": {
                    "html": """
                      <h2>Closing Summary</h2>
                      <div class="callout info">
                        <div class="title">One next action</div>
                        <ul>
                          <li>把 Issue #40 导入的链接里，挑出你真正要“每日跟踪”的 10–30 个源，补成 <code>topics/*.toml</code>（RSS/Atom 优先）。</li>
                        </ul>
                      </div>
                    """
                },
            },
        ],
    }

    data_path.write_text("window.zonBoardData = " + json.dumps(board_data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    html_path.write_text(
        f"""<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>postcast · Daily Board</title>
    <link rel="stylesheet" href="https://zon-report-kit.zondev.top/zon-report.css" />
  </head>
  <body>
    <div data-zon-report data-var="zonBoardData"></div>
    <script src="{_h(data_path.name)}"></script>
    <script src="https://zon-report-kit.zondev.top/zon-report.js"></script>
  </body>
</html>
""",
        encoding="utf-8",
    )

    # redirect entry
    entry = Path("docs/board.html")
    entry.write_text(
        f"""<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=boards/{_h(html_path.name)}" />
    <title>Board Redirect</title>
  </head>
  <body>
    <p>Redirecting to latest board…</p>
    <p><a href="boards/{_h(html_path.name)}">Open board</a></p>
  </body>
</html>
""",
        encoding="utf-8",
    )

    return html_path, data_path


def main() -> int:
    p = argparse.ArgumentParser(description="Build a minimalist HTML board (Zon style) into docs/boards/")
    p.add_argument("--max-days", type=int, default=14)
    args = p.parse_args()

    html_path, data_path = build_board(max_days=args.max_days)
    print(f"OK: {html_path}")
    print(f"OK: {data_path}")
    print("OK: docs/board.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
