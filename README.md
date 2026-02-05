# postcast

这个仓库用于**播客内容自动化**（多主题：AI 应用论文速递 / 增长变现案例 / 健康前沿），尽量把“重资源/大文件”（个人声线素材、模型、最终音频）放在仓库外（旧仓库或对象存储），这里只保留：

- 选题与来源配置（`topics/`）
- 每日抓取与摘要产物（`data/processed/`，体积可控）
- 自动化脚本与 GitHub Actions（`scripts/` / `.github/workflows/`）
- 方案与流程报告（`docs/`）

## Quick start（本地试跑：只抓取+生成文字 digest）

```bash
python3 scripts/run_daily.py --topic ai_papers
```

输出（按当天日期落盘）：
- `data/raw/YYYY-MM-DD/ai_papers/`
- `data/processed/YYYY-MM-DD/ai_papers/digest.md`

## GitHub Actions（每日定时）

启用后会每天跑一次 `ai_papers` 的抓取与 digest，并把产物 commit 回仓库（默认只做“文字版”，不做音频）。

- Workflow: `.github/workflows/daily.yml`
- Secrets（如后续接 LLM/TTS）：在仓库 Settings → Secrets and variables → Actions 配置

## 目录结构

- `topics/`：每个主题一个 `*.toml`（来源与过滤规则）
- `scripts/`：抓取/解析/生成 digest 的脚本
- `data/raw/`：原始 RSS/Atom 抓取结果（可按需 gitignore）
- `data/processed/`：可提交的处理结果（digest / shortlist）
- `docs/`：方案报告入口 `docs/report.html`

## 从 Issue #40 导入信息源链接（可选）

如果你的信息源都沉淀在 `EOMZON/myObsidian#40`，可以用脚本把 issue 与评论里的链接抓下来做二次整理：

```bash
python3 scripts/import_github_issue_links.py --env-file /Users/zon/Desktop/MINE/.env
```

产物会写到 `data/sources/`。
