from __future__ import annotations

import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


USER_AGENT = "postcast/0.1 (+https://example.invalid)"


def _fetch(url: str) -> bytes:
    if url.startswith("file://"):
        p = Path(url.removeprefix("file://"))
        return p.read_bytes()
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def _write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def _kw_norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def _matches_keywords(*, text: str, include: list[str], exclude: list[str]) -> bool:
    t = _kw_norm(text)
    if include:
        ok = any(_kw_norm(k) in t for k in include if _kw_norm(k))
        if not ok:
            return False
    if exclude:
        bad = any(_kw_norm(k) in t for k in exclude if _kw_norm(k))
        if bad:
            return False
    return True


@dataclass(frozen=True)
class ArxivQuery:
    query: str
    sort_by: str
    sort_order: str
    max_results: int
    include_keywords: list[str]
    exclude_keywords: list[str]


def _arxiv_api_url(q: ArxivQuery) -> str:
    params = {
        "search_query": q.query,
        "start": 0,
        "max_results": q.max_results,
        "sortBy": q.sort_by,
        "sortOrder": q.sort_order,
    }
    return "https://export.arxiv.org/api/query?" + urllib.parse.urlencode(params)


def _atom_text(el: ET.Element | None, tag: str) -> str:
    if el is None:
        return ""
    ns = {"a": "http://www.w3.org/2005/Atom"}
    node = el.find(f"a:{tag}", ns)
    return (node.text or "").strip() if node is not None else ""


def _atom_links(entry: ET.Element) -> dict[str, str]:
    ns = {"a": "http://www.w3.org/2005/Atom"}
    out: dict[str, str] = {}
    for link in entry.findall("a:link", ns):
        href = (link.attrib.get("href") or "").strip()
        rel = (link.attrib.get("rel") or "alternate").strip()
        if href:
            out[rel] = href
    return out


def collect_arxiv(*, source: dict[str, Any], raw_dir: Path) -> list[dict[str, Any]]:
    q = ArxivQuery(
        query=str(source.get("query") or ""),
        sort_by=str(source.get("sort_by") or "submittedDate"),
        sort_order=str(source.get("sort_order") or "descending"),
        max_results=int(source.get("max_results") or 50),
        include_keywords=list(source.get("include_keywords") or []),
        exclude_keywords=list(source.get("exclude_keywords") or []),
    )
    if not q.query:
        return []

    offline = str(source.get("offline") or "").strip().lower() in ("1", "true", "yes") or (
        str(__import__("os").environ.get("OFFLINE", "")).strip() == "1"
    )
    fixture_path = str(source.get("fixture_path") or "fixtures/arxiv_sample.atom.xml")
    if offline:
        xml_bytes = Path(fixture_path).read_bytes()
    else:
        url = _arxiv_api_url(q)
        xml_bytes = _fetch(url)

    raw_path = raw_dir / f"{source.get('id','arxiv')}.atom.xml"
    _write_bytes(raw_path, xml_bytes)

    root = ET.fromstring(xml_bytes)
    ns = {"a": "http://www.w3.org/2005/Atom"}
    items: list[dict[str, Any]] = []
    for entry in root.findall("a:entry", ns):
        title = _atom_text(entry, "title")
        summary = _atom_text(entry, "summary")
        published = _atom_text(entry, "published") or _atom_text(entry, "updated")
        links = _atom_links(entry)
        url_abs = links.get("alternate") or links.get("related") or ""

        authors = []
        for a in entry.findall("a:author", ns):
            name = _atom_text(a, "name")
            if name:
                authors.append(name)

        text_for_filter = f"{title}\n{summary}"
        if not _matches_keywords(text=text_for_filter, include=q.include_keywords, exclude=q.exclude_keywords):
            continue

        items.append(
            {
                "source": "arxiv",
                "source_id": source.get("id", "arxiv"),
                "title": title,
                "summary": summary,
                "url": url_abs,
                "published": published,
                "authors": authors,
                "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
            }
        )

    return items


def collect_items(*, source: dict[str, Any], raw_dir: Path) -> list[dict[str, Any]]:
    kind = str(source.get("kind") or "").strip().lower()
    if kind == "arxiv":
        return collect_arxiv(source=source, raw_dir=raw_dir)
    if kind in ("rss", "atom", "feed"):
        return collect_rss(source=source, raw_dir=raw_dir)
    # Future: rss/github/hf/etc.
    return []


def _strip(s: str) -> str:
    return (s or "").strip()


def _first_text(el: ET.Element | None, paths: list[str], ns: dict[str, str] | None = None) -> str:
    if el is None:
        return ""
    for p in paths:
        node = el.find(p, ns or {})
        if node is not None and node.text:
            return node.text.strip()
    return ""


def collect_rss(*, source: dict[str, Any], raw_dir: Path) -> list[dict[str, Any]]:
    url = _strip(str(source.get("url") or ""))
    if not url:
        return []
    xml_bytes = _fetch(url)
    raw_path = raw_dir / f"{source.get('id','feed')}.xml"
    _write_bytes(raw_path, xml_bytes)

    include = list(source.get("include_keywords") or [])
    exclude = list(source.get("exclude_keywords") or [])
    max_results = int(source.get("max_results") or 50)

    root = ET.fromstring(xml_bytes)
    tag = root.tag.lower()
    items: list[dict[str, Any]] = []

    # Atom
    if "feed" in tag:
        ns = {"a": "http://www.w3.org/2005/Atom"}
        for entry in root.findall("a:entry", ns):
            title = _first_text(entry, ["a:title"], ns)
            summary = _first_text(entry, ["a:summary", "a:content"], ns)
            updated = _first_text(entry, ["a:updated", "a:published"], ns)
            link = ""
            for l in entry.findall("a:link", ns):
                href = _strip(l.attrib.get("href") or "")
                rel = _strip(l.attrib.get("rel") or "alternate")
                if rel == "alternate" and href:
                    link = href
                    break
                if not link and href:
                    link = href

            text_for_filter = f"{title}\n{summary}"
            if not _matches_keywords(text=text_for_filter, include=include, exclude=exclude):
                continue

            items.append(
                {
                    "source": "rss",
                    "source_id": source.get("id", "feed"),
                    "title": title,
                    "summary": summary,
                    "url": link,
                    "published": updated,
                    "authors": [],
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                }
            )
            if len(items) >= max_results:
                break
        return items

    # RSS 2.0
    channel = root.find("channel")
    if channel is not None:
        for item in channel.findall("item"):
            title = _first_text(item, ["title"])
            summary = _first_text(item, ["description"])
            pub = _first_text(item, ["pubDate"])
            link = _first_text(item, ["link"])

            text_for_filter = f"{title}\n{summary}"
            if not _matches_keywords(text=text_for_filter, include=include, exclude=exclude):
                continue

            items.append(
                {
                    "source": "rss",
                    "source_id": source.get("id", "feed"),
                    "title": title,
                    "summary": summary,
                    "url": link,
                    "published": pub,
                    "authors": [],
                    "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                }
            )
            if len(items) >= max_results:
                break

    return items
