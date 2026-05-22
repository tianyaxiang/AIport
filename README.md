# AIport

AI 中转站导航站 + 浏览器扩展（一键打开当前可见的所有站点）。

## 仓库结构

- `site/` — Astro 5 静态导航站。数据源：`site/sites.json`。
- `extension/` — Manifest V3 浏览器扩展，操作导航页 DOM 实现一键打开。
- `docs/superpowers/` — 设计文档与实施计划。

## 开发站点

```bash
cd site
pnpm install
pnpm dev        # http://localhost:4321/
pnpm build      # 输出 site/dist/
```

## 编辑导航数据

直接编辑 `site/sites.json`，重新构建即可。分类的 `id: "all"` 是内置"全部"分类；站点的 `categories` 留空则只出现在"全部"中。

## 加载扩展

详见 `extension/README.md`。

## 部署

把 `site/dist/` 推到任意静态托管（GitHub Pages / Vercel / Cloudflare Pages），并在扩展的 `manifest.json` / `background.js` 中替换占位域名。
