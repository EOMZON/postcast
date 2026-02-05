#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import tomllib

# NOTE: This file is intended to be runnable as `python scripts/run_daily.py`.
# In that mode, `sys.path[0]` is `scripts/`, so we import sibling modules directly.
from sources import collect_items  # type: ignore
from text import build_digest_markdown  # type: ignore


@dataclass(frozen=True)
class TopicConfig:
    topic_id: str
    title: str
    sources: list[dict[str, Any]]
    top_k: int


def _today_yyyy_mm_dd() -> str:
    return dt.date.today().isoformat()


def _load_topic_config(topic_id: str) -> TopicConfig:
    cfg_path = Path("topics") / f"{topic_id}.toml"
    if not cfg_path.exists():
        raise SystemExit(f"Topic config not found: {cfg_path}")
    data = tomllib.loads(cfg_path.read_text(encoding="utf-8"))

    meta = data.get("meta", {})
    sources = data.get("sources", [])
    if not isinstance(sources, list):
        raise SystemExit(f"Invalid sources in {cfg_path}")

    top_k = 8
    for src in sources:
        if isinstance(src, dict) and "top_k" in src:
            try:
                top_k = int(src["top_k"])
            except Exception:
                pass
    return TopicConfig(
        topic_id=meta.get("id", topic_id),
        title=meta.get("title", topic_id),
        sources=sources,
        top_k=top_k,
    )


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _write_jsonl(path: Path, items: Iterable[dict[str, Any]]) -> None:
    _ensure_dir(path.parent)
    with path.open("w", encoding="utf-8") as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")


def _append_jsonl(path: Path, items: Iterable[dict[str, Any]]) -> None:
    _ensure_dir(path.parent)
    with path.open("a", encoding="utf-8") as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")


def _write_text(path: Path, content: str) -> None:
    _ensure_dir(path.parent)
    path.write_text(content, encoding="utf-8")


def run_one_topic(*, topic_id: str, date: str) -> None:
    cfg = _load_topic_config(topic_id)

    raw_dir = Path("data/raw") / date / cfg.topic_id
    processed_dir = Path("data/processed") / date / cfg.topic_id
    _ensure_dir(raw_dir)
    _ensure_dir(processed_dir)

    all_items: list[dict[str, Any]] = []
    for src in cfg.sources:
        if not isinstance(src, dict):
            continue
        if not bool(src.get("enabled", True)):
            continue
        try:
            # propagate offline switch to collectors without mutating topic files
            if os.environ.get("OFFLINE") == "1":
                src = {**src, "offline": "1"}
            items = collect_items(source=src, raw_dir=raw_dir)
            all_items.extend(items)
        except Exception as e:
            err = {
                "source_id": src.get("id"),
                "kind": src.get("kind"),
                "error": repr(e),
            }
            _append_jsonl(processed_dir / "errors.jsonl", [err])

    # naive ranking: keep stable order, then take top_k after keyword filtering inside collectors
    shortlist = all_items[: cfg.top_k]

    _write_jsonl(processed_dir / "items.jsonl", all_items)
    _write_jsonl(processed_dir / "shortlist.jsonl", shortlist)

    digest = build_digest_markdown(topic_title=cfg.title, date=date, items=shortlist)
    _write_text(processed_dir / "digest.md", digest)

    print(f"OK: {topic_id} {date} -> {processed_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Daily collector + digest builder (text-first).")
    parser.add_argument("--date", default=os.environ.get("DATE") or _today_yyyy_mm_dd())
    parser.add_argument("--topic", action="append", default=[])
    parser.add_argument("--all", action="store_true", help="Run all topic configs in topics/*.toml")
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Do not use network; collectors read local fixtures when possible.",
    )
    args = parser.parse_args()

    if args.all:
        topics = sorted(p.stem for p in Path("topics").glob("*.toml"))
    else:
        topics = args.topic or ["ai_papers"]

    for topic_id in topics:
        if args.offline:
            os.environ["OFFLINE"] = "1"
        run_one_topic(topic_id=topic_id, date=args.date)


if __name__ == "__main__":
    main()
