#!/usr/bin/env python3
"""Create a GitHub repository via REST API (classic PAT recommended).

Prints:
- ssh_url
- html_url

Token resolution:
- --token
- $GITHUB_TOKEN (or --token-env)
- --env-file (KEY=VALUE lines)

Never prints token.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from urllib import error, request


API = "https://api.github.com"


def read_env_file(path: str) -> dict[str, str]:
    if not path:
        return {}
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    out: dict[str, str] = {}
    for line in open(path, "r", encoding="utf-8", errors="ignore").read().splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$", line)
        if not m:
            continue
        k, v = m.group(1), m.group(2)
        v = v.strip().strip('"').strip("'")
        out[k] = v
    return out


def gh_request(token: str, method: str, path: str, payload: dict | None = None) -> tuple[int, str]:
    url = API + path
    data = None
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"token {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "postcast/scripts/create_repo.py",
    }
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(url, method=method, headers=headers, data=data)
    try:
        with request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8")
    except error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="ignore")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--owner", required=True, help="GitHub owner (user or org), e.g. EOMZON")
    p.add_argument("--name", required=True, help="Repository name, e.g. postcast")
    vis = p.add_mutually_exclusive_group()
    vis.add_argument("--public", action="store_true", help="Create as public (default)")
    vis.add_argument("--private", action="store_true", help="Create as private")
    p.add_argument("--description", default="", help="Repo description")
    p.add_argument("--token", default="", help="GitHub token (discouraged: prefer env)")
    p.add_argument("--token-env", default="GITHUB_TOKEN", help="Token env var name")
    p.add_argument("--env-file", default="", help="Optional .env file path")

    args = p.parse_args()

    env = read_env_file(args.env_file) if args.env_file else {}
    token = args.token or os.environ.get(args.token_env, "") or env.get(args.token_env, "")
    if not token:
        print("ERROR: token not provided (use --token, set $GITHUB_TOKEN, or --env-file)", file=sys.stderr)
        return 2

    s, b = gh_request(token, "GET", "/user")
    if s != 200:
        print(f"ERROR: token invalid or blocked (GET /user => {s})", file=sys.stderr)
        print(b[:800], file=sys.stderr)
        return 3
    login = json.loads(b).get("login")

    owner = args.owner
    name = args.name

    # If repo exists, return URLs.
    s, b = gh_request(token, "GET", f"/repos/{owner}/{name}")
    if s == 200:
        j = json.loads(b)
        print(j.get("ssh_url"))
        print(j.get("html_url"))
        return 0
    if s not in (404,):
        print(f"ERROR: failed checking existence (GET /repos => {s})", file=sys.stderr)
        print(b[:800], file=sys.stderr)
        return 4

    payload = {
        "name": name,
        "description": args.description or "",
        "private": bool(args.private),
        "has_issues": False,
        "has_projects": False,
        "has_wiki": False,
        "auto_init": False,
    }

    if owner == login:
        s, b = gh_request(token, "POST", "/user/repos", payload)
    else:
        s, b = gh_request(token, "POST", f"/orgs/{owner}/repos", payload)

    if s == 201:
        j = json.loads(b)
        print(j.get("ssh_url"))
        print(j.get("html_url"))
        return 0

    print(f"ERROR: create repo failed ({s})", file=sys.stderr)
    print(b[:1200], file=sys.stderr)
    return 5


if __name__ == "__main__":
    raise SystemExit(main())

