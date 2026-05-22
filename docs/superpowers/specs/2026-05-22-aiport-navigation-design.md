# AIport — AI 中转站导航站 设计文档

- 日期: 2026-05-22
- 状态: Draft（待用户审阅）
- 目标受众: 公开访问的 AI API 中转站导航站访客

## 1. 背景与目标

为公开访客提供一个简洁的 AI 中转站导航页，配套一个浏览器扩展，支持"一键打开当前可见的所有站点"。所有中转站数据通过一份 JSON 配置驱动，便于增删改。

**核心需求**
- 公开导航站（对外）
- 支持分类切换，含默认 "全部" 分类
- 现代极简视觉，桌面+移动响应式
- 搜索 + 分类筛选 + 亮/暗色切换
- 浏览器扩展一键打开"当前可见"的站点（受分类、搜索过滤）
- 纯静态部署

**非目标（YAGNI）**
- 用户登录、评论、收藏
- 支持模型标签、价格、邀请返佣等富信息（卡片仅展示基础信息）
- 后端 / SSR / 数据库
- 单元测试（手动验证即可）

## 2. 项目结构

```
AIport/
├── docs/superpowers/specs/                     # 设计文档
├── site/                                       # Astro 静态站
│   ├── sites.json                              # 唯一数据源
│   ├── package.json
│   ├── astro.config.mjs
│   ├── tsconfig.json
│   ├── src/
│   │   ├── pages/index.astro                   # build 期 import ./sites.json（相对路径取决于位置，实际写 ../sites.json）
│   │   ├── layouts/Base.astro
│   │   ├── components/
│   │   │   ├── Sidebar.astro                   # 左侧分类列表
│   │   │   ├── SearchBox.astro
│   │   │   ├── ThemeToggle.astro
│   │   │   └── SiteCard.astro
│   │   ├── scripts/
│   │   │   ├── filter.ts                       # 分类+搜索过滤
│   │   │   └── theme.ts                        # 主题持久化
│   │   └── styles/global.css                   # CSS Variables, 亮/暗主题
│   └── public/logos/                           # 站点 logo 资源
└── extension/                                  # MV3 浏览器扩展
    ├── manifest.json
    ├── background.js
    └── content.js
```

根目录不使用 monorepo workspace。两个子项目相互独立、无共享代码，保持简单。

## 3. 数据契约：sites.json

位于 `site/sites.json`，是站点构建唯一数据源。

```json
{
  "categories": [
    { "id": "all", "name": "全部", "default": true },
    { "id": "stable", "name": "稳定优选" },
    { "id": "cheap", "name": "高性价比" }
  ],
  "sites": [
    {
      "id": "demo-relay",
      "name": "Demo 中转站",
      "url": "https://example.com",
      "logo": "/logos/demo.png",
      "description": "支持 GPT/Claude/Gemini 全系列",
      "categories": ["stable"]
    }
  ]
}
```

**约定**
- `categories[].id` 必须唯一。
- `default: true` 的分类在首页默认选中，建议固定为 `all`；若没有任何分类标记 default，初始化时兜底选第一个。
- `all` 是虚拟分类：任何站点都属于 `all`，不需要在 `sites[].categories` 中显式写。
- `sites[].categories` 为空数组的站点仅出现在 `all` 中。
- `logo` 为 site/public 下的绝对路径（如 `/logos/foo.png`）；缺失或加载失败时使用 `name` 首字母占位。

**构建期校验**
- Astro 在 `pages/index.astro` 顶部直接 `import sitesData from "../sites.json"`，JSON 不合法会让 build 失败，不会部署残页。
- 额外加一段 TS 类型断言（轻量），保证字段齐全；若关键字段缺失抛错。

## 4. 页面与交互

**布局（桌面）**

```
┌──────────────────────────────────────────────────┐
│  AIport                          [🔍 搜索][🌓]   │  ← Header（sticky）
├──────────┬───────────────────────────────────────┤
│ 全部     │ ┌───────┐ ┌───────┐ ┌───────┐         │
│ 稳定优选 │ │ logo  │ │ logo  │ │ logo  │         │
│ 高性价比 │ │ name  │ │ name  │ │ name  │         │
│ ...      │ │ desc  │ │ desc  │ │ desc  │         │
│ (左侧栏) │ └───────┘ └───────┘ └───────┘         │
└──────────┴───────────────────────────────────────┘
```

- 左侧 Sidebar 固定宽 ~200px，分类项垂直列，激活项 2px 强调色竖条 + 背景。
- 主区使用 CSS Grid `repeat(auto-fill, minmax(260px, 1fr))`，gap 16~20px。
- 移动端（`max-width: 768px`）：Sidebar 折叠为顶部横向滚动 Tab；卡片单列或双列。

**视觉**
- 现代极简风：白底 / 深底切换；中性灰为主，单一强调色（默认蓝紫，可通过 CSS var 调整）。
- 圆角 12px，细 1px 边框，hover 时轻微抬升（`translateY(-2px)` + 阴影）。
- 字体：系统默认（`-apple-system, Segoe UI, Helvetica, Arial, ...`）。
- 不引入 Tailwind / UI 库，保持依赖最小。

**渲染策略**
- 所有卡片在 build 期一次性渲染进 DOM，运行期通过 `hidden` 属性显隐。
- 这样插件读"可见站点"等价于读 `.site-card:not([hidden])`，逻辑自洽。

**客户端脚本**
- `filter.ts`：
  - 状态：`activeCategory: string`、`query: string`。
  - 分类点击 → 更新激活态 + 重过滤。
  - 搜索输入 → 300ms debounce → 重过滤；匹配 `name` 与 `description` 的小写子串。
  - 过滤逻辑：分类匹配（`all` 通过 / 卡片 `data-categories` 包含 active）AND 查询匹配。结果通过 `hidden` 属性增删生效。
- `theme.ts`：
  - 初始化优先读 `localStorage.theme`，否则跟随 `prefers-color-scheme`。
  - Toggle 写回 `<html data-theme="light|dark">` 与 `localStorage`。
  - 为避免首帧闪烁，主题脚本以内联方式放在 `<head>` 顶部，先于样式应用。

**卡片 DOM 契约（插件依赖）**

```html
<a class="site-card"
   href="https://..." target="_blank" rel="noopener noreferrer"
   data-site-url="https://..."
   data-categories="stable,cheap">
  <img class="site-logo" src="/logos/foo.png" alt="" onerror="...占位...">
  <h3 class="site-name">Foo 中转</h3>
  <p class="site-desc">...</p>
</a>
```

`data-site-url` 与 `data-categories` 是稳定 API，扩展依赖这两个属性。

## 5. 浏览器扩展（Manifest V3）

**manifest.json（关键片段）**

```json
{
  "manifest_version": 3,
  "name": "AIport 一键打开",
  "version": "0.1.0",
  "action": { "default_title": "打开当前可见站点" },
  "permissions": ["tabs", "activeTab"],
  "host_permissions": ["https://<your-domain>/*"],
  "background": { "service_worker": "background.js" },
  "content_scripts": [{
    "matches": ["https://<your-domain>/*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }]
}
```

**流程**
1. 用户在导航站过滤（分类 + 搜索）。
2. 点工具栏图标 → `background.js` 监听 `chrome.action.onClicked`。
3. background 查询当前 tab：
   - 若不在导航站域名 → 用 `chrome.tabs.create` 打开导航站首页，停止。
   - 若在导航站 → 发 `chrome.tabs.sendMessage(tabId, { type: "collect" })`。
4. `content.js` 收到 `collect` → `document.querySelectorAll(".site-card:not([hidden])")` → 提取每个的 `dataset.siteUrl` → 返回数组。
5. background 收到数组：
   - 长度 0 → `chrome.action.setBadgeText({ text: "0" })`，2 秒后清空，不开 tab。
   - 长度 > 20 → 注入 `chrome.scripting.executeScript` 在页面里 `confirm(...)` 让用户确认；取消则不开。
   - 否则 → `for (url of arr) chrome.tabs.create({ url, active: false })`。

**域名占位**
- `manifest.json` 中 `<your-domain>` 在打包前替换为实际部署域名。
- 开发期可临时把 `"http://localhost:4321/*"` 加入 `host_permissions` 与 `content_scripts.matches`。

**打包**
- 无构建步骤；发布时 `cd extension && zip -r ../aiport-extension.zip .`。

## 6. 技术栈与构建

- 站点：Astro 5.x、TypeScript、pnpm；无 UI 框架；原生 CSS + CSS Variables。
- 扩展：纯 JS、MV3、无构建。
- 部署：`site/dist/` 推到 GitHub Pages / Vercel / Cloudflare Pages 任一。
- 命令：
  - `cd site && pnpm install && pnpm dev`（本地开发）
  - `cd site && pnpm build`（产出 `dist/`）
  - 扩展开发：浏览器扩展页"加载未打包扩展" → 选 `extension/`。

## 7. 错误处理与边界

- `sites.json` 不合法 / 关键字段缺失 → 构建期失败。
- 没有 `default: true` 的分类 → 客户端初始化时兜底选第一个。
- 卡片 `logo` 加载失败 → 用 `name` 首字母占位（CSS 实现彩色背景 + 首字母）。
- 搜索词为空 → 仅按分类过滤。
- 主题脚本必须 inline 在 `<head>`，避免首帧闪烁。
- 扩展：用户当前不在导航站域名 → 不批量开 tab，而是打开导航首页。
- 扩展：批量打开超过 20 个 → 弹 confirm 让用户确认。
- 扩展：批量打开使用 `active: false` 防止焦点抢占。

## 8. 验收标准

- `pnpm build` 通过，`site/dist/index.html` 包含所有 `sites.json` 卡片。
- 切换分类、输入搜索、亮/暗切换三种交互在本地和移动视口均工作。
- 加载扩展并访问本地 dev 站点，点击工具栏图标可在后台批量打开当前可见卡片对应的 URL。
- 当前可见 0 个时显示徽章 "0" 且不开新 tab；当前可见 > 20 个时弹 confirm。
- 修改 `sites.json` 增删一项后 rebuild，页面变化正确。

## 9. 后续可能演进（非本次范围）

- 卡片增加模型标签 / 价格徽章 / 状态徽章。
- 站点暴露 `/sites.json` 让扩展独立 popup 渲染（方案 C），不依赖打开导航页。
- 国际化（i18n）与 SEO 元信息细化。
- 单元测试与 e2e（Playwright）。
