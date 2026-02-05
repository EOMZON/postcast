window.zonReportData = {
  version: "zon-report@v1",
  meta: {
    id: "report-20260205-194257",
    title: "播客自动化多主题方案",
    subtitle: "从本地 RVC 流水线迁移到云端（GitHub Actions / API / Server）",
    abstract:
      "把播客从“本地重资源（TTS+RVC+模型存储）”迁移为“云端 text-first → 可选 TTS 音频”的自动化体系：多主题、可扩展来源、低本地占用、可持续发布。",
    label: "Report",
    layout: "playbook",
    theme: "light",
    date: "2026-02-05 19:42",
    audience: "Zon",
    scope:
      "新仓库负责内容与自动化；个人声线/模型/最终音频尽量放在旧仓库或对象存储；先做文字日报，再逐步接入 TTS/发布。",
    tags: ["podcast", "automation", "ai-papers", "growth", "health"],
    generated_at: "2026-02-05 19:42",
    links: {},
  },
  blocks: [
    {
      id: "tldr",
      nav: "TL;DR",
      type: "html",
      data: {
        html: `
          <h2>TL;DR</h2>
          <ul>
            <li><b>先用“文字版日报”跑通闭环</b>：每日抓取→粗筛→digest（GitHub Actions 能稳定承载、成本可控、几乎不占本地空间）。</li>
            <li><b>再接音频</b>：优先走 <b>TTS API</b>（无需在仓库存声线模型）；“像你本人”的音色先用少量样本的克隆方案或后置变声（放到自建/自托管 runner）。</li>
            <li><b>节目结构建议：先 1 个节目、3 个固定板块</b>（论文/开源/增长与健康轮换），等稳定后再拆成 2–3 个独立 feed。</li>
            <li><b>内容策略：应用向</b>（医疗、音视频、日常工具），避免“模型训练/工程细节”占用主篇幅。</li>
          </ul>
          <div class="kpi-grid">
            <div class="kpi"><div class="k">最小闭环</div><div class="v">Text-first</div><div class="muted">Actions 每日自动更新</div></div>
            <div class="kpi"><div class="k">扩展方向</div><div class="v">TTS / 发布</div><div class="muted">API 或自建算力</div></div>
            <div class="kpi"><div class="k">核心约束</div><div class="v">磁盘/复用声线</div><div class="muted">大文件不进新仓库</div></div>
          </div>
        `,
      },
    },

    {
      id: "themes",
      nav: "主题",
      type: "html",
      data: {
        html: `
          <h2>你当前的 3 个主题（建议定义到“可执行口径”）</h2>
          <ol>
            <li><b>AI 论文每日速递（应用向）</b>：只做“可落地的研究方向/应用证据”，优先医疗、音视频/语音、多模态、临床工作流、真实数据与部署经验。</li>
            <li><b>AI 应用增长与变现</b>：真实案例拆解（小而美 App / SaaS / 内容产品）——怎么启动、怎么定价、怎么获客、怎么转化、怎么复购。</li>
            <li><b>健康前沿（含 AI/非 AI）</b>：个人健康管理 + 医疗科技新进展（与 AI 相关就加上“AI 怎么改变流程/成本/效果”的视角）。</li>
          </ol>
          <hr />
          <h3>命名与栏目建议（先聚合，再拆分）</h3>
          <div class="card">
            <div class="muted">推荐先用 1 个节目名（统一入口）</div>
            <div style="font-size:18px; line-height:1.6; margin-top:6px;"><b>《AI 应用速递》</b></div>
            <ul>
              <li>固定板块：<b>论文 3 条</b> + <b>开源 2 条</b> + <b>增长/健康 1 条</b>（轮换）</li>
              <li>单集目标时长：<b>6–10 分钟</b>（利于持续更新与新受众进入）</li>
            </ul>
          </div>
        `,
      },
    },

    {
      id: "flow",
      nav: "全局流程",
      type: "html",
      data: {
        html: `
          <h2>全局流程（从“信息源”到“可发布”）</h2>
          <figure class="figure">
            <svg viewBox="0 0 980 280" width="100%" role="img" aria-label="pipeline">
              <defs>
                <style>
                  .b{fill:#fafafa;stroke:#333;stroke-width:1.2;rx:14;ry:14}
                  .t{font: 14px ui-sans-serif, system-ui, -apple-system, "PingFang SC","Microsoft YaHei"; fill:#0a0a0a}
                  .m{font: 12px ui-sans-serif, system-ui, -apple-system, "PingFang SC","Microsoft YaHei"; fill:#666}
                  .a{stroke:#333;stroke-width:1.2;fill:none;stroke-linecap:round;stroke-linejoin:round}
                  .d{stroke-dasharray:6 6}
                </style>
              </defs>
              <rect class="b" x="20" y="40" width="170" height="90"/>
              <text class="t" x="35" y="70">Sources</text>
              <text class="m" x="35" y="95">arXiv / RSS / GH</text>
              <text class="m" x="35" y="115">HF / Newsletters</text>

              <rect class="b" x="210" y="40" width="170" height="90"/>
              <text class="t" x="225" y="70">Collect</text>
              <text class="m" x="225" y="95">抓取 + 归档</text>
              <text class="m" x="225" y="115">去重</text>

              <rect class="b" x="400" y="40" width="170" height="90"/>
              <text class="t" x="415" y="70">Filter/Score</text>
              <text class="m" x="415" y="95">关键词/规则</text>
              <text class="m" x="415" y="115">可选 LLM 精选</text>

              <rect class="b" x="590" y="40" width="170" height="90"/>
              <text class="t" x="605" y="70">Script</text>
              <text class="m" x="605" y="95">口播稿 / 结构化</text>
              <text class="m" x="605" y="115">引用来源</text>

              <rect class="b" x="780" y="40" width="180" height="90"/>
              <text class="t" x="795" y="70">Publish</text>
              <text class="m" x="795" y="95">RSS 更新</text>
              <text class="m" x="795" y="115">音频上传（可选）</text>

              <path class="a" d="M190 85 L210 85"/>
              <path class="a" d="M380 85 L400 85"/>
              <path class="a" d="M570 85 L590 85"/>
              <path class="a" d="M760 85 L780 85"/>

              <rect class="b" x="210" y="165" width="360" height="90"/>
              <text class="t" x="225" y="195">Text-first 最小闭环</text>
              <text class="m" x="225" y="220">GitHub Actions 每日运行：digest.md / shortlist.jsonl</text>

              <rect class="b" x="590" y="165" width="370" height="90"/>
              <text class="t" x="605" y="195">Audio 可选闭环</text>
              <text class="m" x="605" y="220">TTS API → 混音/响度 → MP3 → 对象存储</text>

              <path class="a d" d="M485 130 L485 165"/>
              <path class="a d" d="M775 130 L775 165"/>
            </svg>
          </figure>
          <div class="muted">要点：先把“每日自动更新”变成确定性资产（文字 digest），再把音频当作可插拔的发布形态。</div>
        `,
      },
    },

    {
      id: "split",
      nav: "拆分评估",
      type: "html",
      data: {
        html: `
          <h2>一个节目 vs 两个节目（论文/开源拆分）</h2>
          <table class="table">
            <thead><tr><th>方案</th><th>对新受众</th><th>对你</th><th>何时更合适</th></tr></thead>
            <tbody>
              <tr>
                <td><b>1 个节目（多板块）</b></td>
                <td>入口更清晰；更新更稳定；容易形成“每天都来听”的习惯</td>
                <td>制作成本最低；选题可互相补位</td>
                <td>冷启动阶段（前 30–60 集）</td>
              </tr>
              <tr>
                <td>2 个节目（论文/开源分开）</td>
                <td>定位更窄更精准；利于极致人群</td>
                <td>发布与运营成本翻倍；断更风险上升</td>
                <td>你已能稳定日产出，且两类受众明显不同</td>
              </tr>
            </tbody>
          </table>
          <div class="callout info">
            <div class="title">推荐结论</div>
            <ul>
              <li><b>先 1 个节目</b>，把“论文/开源”做成两个固定板块；等数据上看到某个板块显著更强，再独立拆 feed。</li>
              <li>拆分触发器：连续 4 周更新稳定 + 单板块平均完播/收藏显著更高 + 你能承受双倍制作成本。</li>
            </ul>
          </div>
        `,
      },
    },

    {
      id: "options",
      nav: "实现方案",
      type: "html",
      data: {
        html: `
          <h2>三种实现方案（按“算力/成本/复杂度”）</h2>
          <div class="barlist">
            <div class="row">
              <div class="label"><b>A. GitHub Actions + 摘要/脚本 + TTS API</b></div>
              <div class="bar"><div class="barfill" style="--pct: 86%"></div></div>
              <div class="value">推荐</div>
            </div>
            <div class="row">
              <div class="label">B. Actions（文字）+ 外部 Serverless/GPU（音频/变声）</div>
              <div class="bar"><div class="barfill" style="--pct: 68%"></div></div>
              <div class="value">可扩展</div>
            </div>
            <div class="row">
              <div class="label">C. 自建服务器/自托管 Runner（含 RVC/模型）</div>
              <div class="bar"><div class="barfill" style="--pct: 52%"></div></div>
              <div class="value">最灵活</div>
            </div>
          </div>

          <table class="table">
            <thead><tr><th>维度</th><th>A</th><th>B</th><th>C</th></tr></thead>
            <tbody>
              <tr><td>本地占用</td><td><b>最低</b>（几乎 0）</td><td>低</td><td>高（模型/音频/依赖）</td></tr>
              <tr><td>可持续性</td><td><b>最高</b></td><td>高</td><td>取决于运维</td></tr>
              <tr><td>“像你本人”音色</td><td>取决于 TTS 克隆能力</td><td><b>更好</b>（可加变声）</td><td><b>最好</b>（你现有 RVC 直接复用）</td></tr>
              <tr><td>实现难度</td><td><b>低</b></td><td>中</td><td>中-高</td></tr>
              <tr><td>成本结构</td><td>按调用计费（LLM/TTS）</td><td>调用 + 算力</td><td>固定月租 + 电费/维护</td></tr>
            </tbody>
          </table>

          <details>
            <summary><b>关于“GitHub Actions 跑不跑得动 TTS/RVC？”</b></summary>
            <div class="muted" style="margin-top:8px;">
              Actions 对“调用外部 API”非常适合；但对“本地加载大模型/GPU 推理/长音频处理”不友好（磁盘与时间受限、无 GPU）。
              因此：<b>把重计算放到 API 或外部算力</b>，Actions 做编排与发布，是更稳的结构。
            </div>
          </details>
        `,
      },
    },

    {
      id: "tts",
      nav: "TTS&成本",
      type: "html",
      data: {
        html: `
          <h2>TTS / 变声：怎么选 & 怎么估算成本（不依赖本地大模型）</h2>
          <div class="card">
            <div class="muted">先用公式把量级算清楚（再去看各家官方单价）</div>
            <ul>
              <li><b>脚本文字量</b>：日更 6–10 分钟，通常约 <b>1200–2200 中文字</b>（取决于语速与密度）。</li>
              <li><b>月度 TTS 字符量</b>：<code>chars_per_day × 30</code>。</li>
              <li><b>月度 TTS 成本</b>：<code>(chars_per_month / 1,000,000) × price_per_1M_chars</code>（再叠加：克隆/自定义音色附加费，如果有）。</li>
            </ul>
          </div>
          <h3>选择清单（按优先级）</h3>
          <ol>
            <li><b>中文可懂度/停连</b>：医学名词、缩写、英文论文标题的读法。</li>
            <li><b>稳定性</b>：同一段脚本重复生成的一致性（对日更很关键）。</li>
            <li><b>音色策略</b>：是否需要“像你本人”。如果是：更倾向 <b>克隆型 TTS</b>；否则：直接用高质量系统音色即可。</li>
            <li><b>合规与授权</b>：音色克隆的条款、可商用范围、对“像真人”的限制。</li>
            <li><b>接口体验</b>：是否支持流式输出、分段拼接、SSML/停顿标记。</li>
          </ol>
          <details>
            <summary><b>两条现实建议</b></summary>
            <ul style="margin-top:8px;">
              <li><b>阶段 1（1–2 周）</b>：先用“好用的默认音色”把节目跑起来，别先被“像本人”卡住。</li>
              <li><b>阶段 2（跑稳后）</b>：再把“你的音色”做成可迁移的 voice pack（少量样本 + 版本号 + 存储位置），由 API/外部算力消费。</li>
            </ul>
          </details>
        `,
      },
    },

    {
      id: "publish",
      nav: "发布&存储",
      type: "html",
      data: {
        html: `
          <h2>发布与存储：避免“多仓库多处存储”的结构</h2>
          <table class="table">
            <thead><tr><th>层</th><th>放哪里</th><th>为什么</th></tr></thead>
            <tbody>
              <tr><td>内容配置/脚本</td><td>本仓库</td><td>可版本化、可审计、体积小</td></tr>
              <tr><td>声线资产（录音/模型）</td><td><b>旧仓库或对象存储（私有）</b></td><td>避免复制；权限可控；大文件不污染内容仓库</td></tr>
              <tr><td>最终音频（MP3）</td><td><b>对象存储（R2/S3）</b></td><td>RSS 的 <code>enclosure</code> 只需要一个稳定 URL</td></tr>
              <tr><td>RSS Feed</td><td>本仓库或静态站点</td><td>更新小文件即可（可让 Actions 自动提交）</td></tr>
            </tbody>
          </table>
          <div class="muted">如果你坚持“音频也只存一处”：把 MP3 放对象存储是最干净的做法；仓库只维护 feed 与元数据。</div>
        `,
      },
    },

    {
      id: "roadmap",
      nav: "路线图",
      type: "timeline",
      data: {
        title: "2–4 周落地路线图（先文字，后音频）",
        orientation: "auto",
        items: [
          { label: "Day 0–2", time: "2026-02-05", note: "确定 3 个主题的“口径+来源清单”；先跑 text-first 日报。" },
          { label: "Week 1", time: "2026-02-12", note: "加入 LLM 二次精选 + 口播稿；设定统一主持人口吻与栏目结构。" },
          { label: "Week 2", time: "2026-02-19", note: "接入 TTS API 生成音频；对象存储上传；RSS 自动更新。" },
          { label: "Week 3–4", time: "2026-03-05", note: "按数据决定是否拆分 feed；引入更像你的音色（克隆或变声）。" }
        ]
      }
    },

    {
      id: "steps",
      nav: "怎么做",
      type: "html",
      data: {
        html: `
          <h2>最小可行落地（你现在就能开始做的步骤）</h2>
          <ol>
            <li><b>先只做一个主题</b>（AI 应用论文速递），把信息源变成确定输入：arXiv + 你最常看的 2–3 个站点（有 RSS 更好）。</li>
            <li>把关键词写成“能筛掉 80% 噪音”的规则（本仓库已给了一个起始版：<code>topics/ai_papers.toml</code>）。</li>
            <li>跑通 GitHub Actions：每天生成 <code>digest.md</code>（本仓库已提供：<code>.github/workflows/daily.yml</code>）。</li>
            <li>当文字稳定后，再加一层：LLM 生成 <b>口播脚本</b>（结构固定：开场→3 条要点→一句结论→片尾）。</li>
            <li>最后再接音频：优先 <b>TTS API</b>；如果必须“像你本人”，再引入外部算力做变声或用支持克隆的 TTS。</li>
          </ol>
          <div class="callout warning">
            <div class="title">关于“你的声音必须沿用旧仓库”</div>
            <ul>
              <li>建议把“声线资产”从“整套本地模型+大数据”压缩为 <b>可迁移 voice pack</b>：几分钟干净样本 + 版本化说明。</li>
              <li>新仓库只存引用（URL/ID/版本号）；敏感文件放旧仓库或对象存储（加密/访问控制）。</li>
            </ul>
          </div>
        `,
      },
    },

    {
      id: "next",
      nav: "Next",
      type: "callout",
      data: {
        variant: "info",
        title: "One next action（最重要的下一步）",
        bullets: [
          "把你最常看的 10–30 个信息源按主题列出来；每个源标注：是否有 RSS / 是否需要登录 / 你希望每天最多看几条。",
          "补两条约束：你希望单集时长（例如 6–10 分钟）与可接受的月度预算上限（LLM+TTS）。",
          "然后我可以基于这份清单，把 topics 配置补齐，并把“抓取→去重→精选→digest→口播稿”先完全自动化。"
        ],
      },
    },

    {
      id: "sources",
      nav: "Sources",
      type: "html",
      data: {
        html: `
          <h2>Sources（需你后续在线核验/补齐）</h2>
          <ul>
            <li>arXiv API (Atom): <code>https://export.arxiv.org/api/query</code></li>
            <li>GitHub Actions schedules: <code>https://docs.github.com/actions/using-workflows/events-that-trigger-workflows#schedule</code></li>
            <li>Podcast RSS / enclosure: <code>https://validator.w3.org/feed/</code>（用于校验 feed）</li>
            <li>对象存储（用于放 mp3）：Cloudflare R2 / S3 兼容存储</li>
          </ul>
          <div class="muted">说明：本环境无法联网核验最新价格/条款；涉及 TTS/LLM 计费请以官方文档为准。</div>
        `,
      },
    },

    {
      id: "closing",
      nav: "Closing",
      type: "html",
      data: {
        html: `
          <h2>Closing Summary</h2>
          <p><b>最稳的顺序是：</b>先把“每日自动更新”做成文字资产（低成本、低风险、0 本地占用）→ 再把音频当作可插拔发布形态（API 或外部算力）→ 最后再追求“极像本人”的声线一致性（这一步才需要重资源）。</p>
          <p class="muted">如果你把信息源清单给我（按主题 10–30 个即可），我能把 topics 配置与抓取适配补齐，并把 “AI 论文每日速递”先跑到每天自动产出一篇可直接口播的脚本。</p>
        `,
      },
    },
  ],
};
