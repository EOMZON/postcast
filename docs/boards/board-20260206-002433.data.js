window.zonBoardData = {
  "version": "zon-report@v1",
  "meta": {
    "id": "board-20260206-002433",
    "title": "postcast · Daily Board",
    "subtitle": "多主题播客自动化（text-first）",
    "abstract": "每日 digest、信息源导入、配置入口与运行说明。",
    "label": "Board",
    "layout": "audit",
    "theme": "light",
    "date": "2026-02-06 00:24",
    "audience": "Zon",
    "scope": "Repo-local dashboard",
    "tags": [
      "board",
      "podcast",
      "automation"
    ],
    "generated_at": "2026-02-06 00:24",
    "links": {}
  },
  "blocks": [
    {
      "id": "tldr",
      "nav": "Overview",
      "type": "html",
      "data": {
        "html": "\n                      <h2>Overview</h2>\n                      <div class=\"kpi-grid\">\n                        <div class=\"kpi\"><div class=\"k\">Latest date</div><div class=\"v\">2026-02-05</div><div class=\"muted\">From data/processed</div></div>\n                        <div class=\"kpi\"><div class=\"k\">Topics</div><div class=\"v\">1</div><div class=\"muted\">With digests</div></div>\n                        <div class=\"kpi\"><div class=\"k\">Shortlist items</div><div class=\"v\">8</div><div class=\"muted\">Across last 14 days</div></div>\n                      </div>\n                        <div class=\"card\" style=\"margin-top:12px\">\n                        <div class=\"muted\">Quick links</div>\n                        <ul class=\"list-tight\">\n                          <li><a href=\"../report.html\">方案报告（report）</a></li>\n                          <li><a href=\"../../data/processed/\">data/processed</a>（产物目录，仅本地）</li>\n                          <li><a href=\"../../topics/\">topics</a>（主题配置，仅本地）</li>\n                        </ul>\n                      </div>\n                    "
      }
    },
    {
      "id": "topics",
      "nav": "Topics",
      "type": "html",
      "data": {
        "html": "<h2>Topics</h2><div class=\"card\"><ul><li><code>topics/ai_growth.toml</code> — AI 应用增长与变现（真实案例）</li><li><code>topics/ai_papers.toml</code> — AI 论文每日速递（应用向）</li><li><code>topics/health_frontier.toml</code> — 健康前沿（含 AI/非 AI）</li></ul></div>"
      }
    },
    {
      "id": "digests",
      "nav": "Digests",
      "type": "html",
      "data": {
        "html": "<h2>Digests (last 14 days)</h2><details open>\n<summary><b>AI 论文每日速递（应用向）</b> <span class=\"muted\">(ai_papers)</span></summary>\n<div style=\"margin-top:10px\">\n<table class=\"table\">\n<thead><tr><th>Date</th><th>Count</th><th>Open</th><th>Top</th></tr></thead>\n<tbody>\n<tr><td>2026-02-05</td><td>8</td><td><a href=\"../data/processed/2026-02-05/ai_papers/digest.md\">digest.md</a> · <a href=\"../data/processed/2026-02-05/ai_papers/shortlist.jsonl\">shortlist.jsonl</a></td><td><a href=\"https://arxiv.org/abs/2602.04884v1\" target=\"_blank\" rel=\"noreferrer\">Reinforced Attention Learning</a><br /><a href=\"https://arxiv.org/abs/2602.04877v1\" target=\"_blank\" rel=\"noreferrer\">CoWTracker: Tracking by Warping instead of Correlation</a><br /><a href=\"https://arxiv.org/abs/2602.04820v1\" target=\"_blank\" rel=\"noreferrer\">Toward Reliable and Explainable Nail Disease Classification: Leveraging Adversarial Training and Grad-CAM Visualization</a></td></tr>\n</tbody></table></div></details>"
      }
    },
    {
      "id": "sources",
      "nav": "Sources",
      "type": "html",
      "data": {
        "html": "<h2>Imported sources (Issue #40)</h2><div class=\"card\"><div class=\"muted\">Latest import: <code>data/sources/issue-EOMZON-myObsidian-40-20260205-160934.links.json</code></div><hr /><table class=\"table\"><thead><tr><th>Kind</th><th>Count</th><th>Preview</th></tr></thead><tbody><tr><td><b>web</b></td><td>15</td><td><a href=\"http://xhslink.com/o/66fVSRemPwz\" target=\"_blank\" rel=\"noreferrer\">http://xhslink.com/o/66fVSRemPwz</a><br /><a href=\"https://diary.zondev.top/reports/report-20260129-211802.html\" target=\"_blank\" rel=\"noreferrer\">https://diary.zondev.top/reports/report-20260129-211802.html</a><br /><a href=\"https://diary.zondev.top/research/\" target=\"_blank\" rel=\"noreferrer\">https://diary.zondev.top/research/</a><br /><a href=\"http://xhslink.com/o/4JsOr1ZfFPt\" target=\"_blank\" rel=\"noreferrer\">http://xhslink.com/o/4JsOr1ZfFPt</a><br /><a href=\"https://diary.zondev.top/reports/report-20260130-104318.html\" target=\"_blank\" rel=\"noreferrer\">https://diary.zondev.top/reports/report-20260130-104318.html</a><br /><a href=\"http://xhslink.com/o/2TjOECZeGeL\" target=\"_blank\" rel=\"noreferrer\">http://xhslink.com/o/2TjOECZeGeL</a><br /><a href=\"https://diary.zondev.top/reports/report-20260202-202517.html\" target=\"_blank\" rel=\"noreferrer\">https://diary.zondev.top/reports/report-20260202-202517.html</a><br /><a href=\"http://xhslink.com/o/ABPIS7Dnec4\" target=\"_blank\" rel=\"noreferrer\">http://xhslink.com/o/ABPIS7Dnec4</a></td></tr><tr><td><b>github</b></td><td>1</td><td><a href=\"https://github.com/EOMZON/myObsidian/actions/runs/21479662781\" target=\"_blank\" rel=\"noreferrer\">https://github.com/EOMZON/myObsidian/actions/runs/21479662781</a></td></tr></tbody></table></div>"
      }
    },
    {
      "id": "runbook",
      "nav": "Runbook",
      "type": "html",
      "data": {
        "html": "\n                      <h2>Runbook</h2>\n                      <div class=\"card\">\n                        <ol>\n                          <li><b>本地跑</b>：<code>python3 scripts/run_daily.py --topic ai_papers</code></li>\n                          <li><b>导入 Issue #40 信息源</b>：<code>python3 scripts/import_github_issue_links.py --env-file /Users/zon/Desktop/MINE/.env</code></li>\n                          <li><b>生成看板</b>：<code>python3 scripts/build_board.py</code></li>\n                        </ol>\n                        <hr />\n                        <div class=\"muted\">建议：先把 text-first（digest + 口播稿）跑稳，再接入 TTS/音频上传/RSS 发布。</div>\n                      </div>\n                    "
      }
    },
    {
      "id": "closing",
      "nav": "Closing",
      "type": "html",
      "data": {
        "html": "\n                      <h2>Closing Summary</h2>\n                      <div class=\"callout info\">\n                        <div class=\"title\">One next action</div>\n                        <ul>\n                          <li>把 Issue #40 导入的链接里，挑出你真正要“每日跟踪”的 10–30 个源，补成 <code>topics/*.toml</code>（RSS/Atom 优先）。</li>\n                        </ul>\n                      </div>\n                    "
      }
    }
  ]
};
