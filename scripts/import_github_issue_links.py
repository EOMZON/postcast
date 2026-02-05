#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error, request


API = "https://api.github.com"


def _read_env_file(path: str) -> dict[str, str]:
    if not path:
        return {}
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    out: dict[str, str] = {}
    for line in Path(path).read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$", line)
        if not m:
            continue
        k, v = m.group(1), m.group(2)
        out[k] = v.strip().strip('"').strip("'")
    return out


def _gh_get(token: str, path: str) -> Any:
    url = API + path
    req = request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"token {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "postcast/scripts/import_github_issue_links.py",
        },
    )
    try:
        with request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"GitHub API error {e.code}: {body[:500]}")


URL_RE = re.compile(r"https?://[^\s\]\)\"'>]+", re.IGNORECASE)


def _extract_urls(text: str) -> list[str]:
    if not text:
        return []
    urls = URL_RE.findall(text)
    # normalize: strip trailing punctuation
    out: list[str] = []
    for u in urls:
        u = u.rstrip(".,;:!?)\">'")
        if u:
            out.append(u)
    return out


def _dedupe_keep_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in items:
        if x in seen:
            continue
        seen.add(x)
        out.append(x)
    return out


def _guess_kind(url: str) -> str:
    u = url.lower()
    if any(k in u for k in ["/rss", "feed", ".atom", "feeds.feedburner.com"]) or u.endswith(".xml"):
        return "feed"
    if "github.com" in u:
        return "github"
    if "arxiv.org" in u:
        return "arxiv"
    return "web"


@dataclass(frozen=True)
class IssueRef:
    owner: str
    repo: str
    number: int


def main() -> int:
    p = argparse.ArgumentParser(description="Import links from a GitHub issue + comments into data/sources/")
    p.add_argument("--owner", default="EOMZON")
    p.add_argument("--repo", default="myObsidian")
    p.add_argument("--number", type=int, default=40)
    p.add_argument("--token", default="", help="discouraged: prefer env or --env-file")
    p.add_argument("--token-env", default="GITHUB_TOKEN")
    p.add_argument("--env-file", default="", help="Optional .env file path")
    p.add_argument("--out-dir", default="data/sources")
    args = p.parse_args()

    env = _read_env_file(args.env_file) if args.env_file else {}
    token = args.token or os.environ.get(args.token_env, "") or env.get(args.token_env, "")
    if not token:
        print("ERROR: missing token (set $GITHUB_TOKEN or pass --env-file)", file=sys.stderr)
        return 2

    ref = IssueRef(args.owner, args.repo, args.number)

    issue = _gh_get(token, f"/repos/{ref.owner}/{ref.repo}/issues/{ref.number}")
    comments = _gh_get(token, f"/repos/{ref.owner}/{ref.repo}/issues/{ref.number}/comments?per_page=100")

    blobs: list[dict[str, Any]] = []
    blobs.append(
        {
            "type": "issue",
            "url": issue.get("html_url"),
            "created_at": issue.get("created_at"),
            "updated_at": issue.get("updated_at"),
            "body": issue.get("body") or "",
        }
    )
    for c in comments if isinstance(comments, list) else []:
        blobs.append(
            {
                "type": "comment",
                "url": c.get("html_url"),
                "created_at": c.get("created_at"),
                "updated_at": c.get("updated_at"),
                "body": c.get("body") or "",
            }
        )

    all_urls: list[str] = []
    for b in blobs:
        all_urls.extend(_extract_urls(b.get("body", "")))

    urls = _dedupe_keep_order(all_urls)
    enriched = [{"url": u, "kind": _guess_kind(u)} for u in urls]

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(tz=timezone.utc).strftime("%Y%m%d-%H%M%S")
    out_json = out_dir / f"issue-{ref.owner}-{ref.repo}-{ref.number}-{stamp}.links.json"
    out_txt = out_dir / f"issue-{ref.owner}-{ref.repo}-{ref.number}-{stamp}.urls.txt"

    out_json.write_text(
        json.dumps(
            {
                "issue": {"owner": ref.owner, "repo": ref.repo, "number": ref.number},
                "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                "count": len(enriched),
                "links": enriched,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    out_txt.write_text("\n".join(u for u in urls) + "\n", encoding="utf-8")

    print(f"OK: {out_json}")
    print(f"OK: {out_txt}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

