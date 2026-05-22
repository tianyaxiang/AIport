# AIport Navigation Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Astro navigation site for AI relay stations driven by `site/sites.json`, plus a Manifest V3 browser extension that one-click opens all currently visible site cards.

**Architecture:** Astro 5.x static site renders every site card from `sites.json` at build time, with categories shown in a left sidebar and a search box in the header. Client-side TypeScript filters cards by toggling the `hidden` attribute (category + search are combined). The MV3 extension's content script queries `.site-card:not([hidden])` and returns `data-site-url` values; the background service worker opens each as a background tab. The site and extension communicate only through the stable DOM contract (`data-site-url`, `data-categories`).

**Tech Stack:** Astro 5.x, TypeScript, pnpm, native CSS with CSS Variables. Extension is plain JS (no build).

**Spec:** `docs/superpowers/specs/2026-05-22-aiport-navigation-design.md`

---

## File Structure

**Create:**
- `site/package.json` — Astro project manifest
- `site/astro.config.mjs` — Astro config (static output, base path)
- `site/tsconfig.json` — TS config (Astro default)
- `site/sites.json` — data source (categories + sites)
- `site/src/types.ts` — TypeScript types for `sites.json`
- `site/src/layouts/Base.astro` — html shell, inline theme bootstrap, header
- `site/src/components/Sidebar.astro` — left category list
- `site/src/components/SearchBox.astro` — header search input
- `site/src/components/ThemeToggle.astro` — light/dark button
- `site/src/components/SiteCard.astro` — single card with data attributes
- `site/src/pages/index.astro` — composes everything
- `site/src/scripts/filter.ts` — runtime category+search filter
- `site/src/scripts/theme.ts` — theme toggle behavior
- `site/src/styles/global.css` — CSS variables + layout + cards
- `site/public/logos/.gitkeep` — placeholder
- `extension/manifest.json` — MV3 manifest
- `extension/background.js` — service worker (action click → collect → open tabs)
- `extension/content.js` — DOM collector
- `extension/README.md` — load/usage instructions
- `README.md` — root readme (project overview + dev/build commands)
- `.gitignore` — node_modules, dist, etc.

**No modifications** — empty repo, everything new.

---

## Task 1: Scaffold Astro site

**Files:**
- Create: `site/package.json`
- Create: `site/astro.config.mjs`
- Create: `site/tsconfig.json`
- Create: `site/src/pages/index.astro` (placeholder)
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore` at repo root**

```
node_modules/
dist/
.astro/
.DS_Store
*.log
```

- [ ] **Step 2: Create `site/package.json`**

```json
{
  "name": "aiport-site",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "astro": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create `site/astro.config.mjs`**

```js
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  build: { format: "directory" },
});
```

- [ ] **Step 4: Create `site/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 5: Create placeholder `site/src/pages/index.astro`**

```astro
---
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>AIport</title>
  </head>
  <body>
    <h1>AIport — scaffold ok</h1>
  </body>
</html>
```

- [ ] **Step 6: Install and verify dev server**

Run from repo root:
```bash
cd site && pnpm install
pnpm build
```

Expected: `site/dist/index.html` exists and contains "scaffold ok".

- [ ] **Step 7: Commit**

```bash
git add .gitignore site/package.json site/astro.config.mjs site/tsconfig.json site/src/pages/index.astro
[ -f site/pnpm-lock.yaml ] && git add site/pnpm-lock.yaml
git commit -m "feat(site): scaffold Astro 5 project"
```

---

## Task 2: Add data source and types

**Files:**
- Create: `site/sites.json`
- Create: `site/src/types.ts`
- Create: `site/public/logos/.gitkeep`

- [ ] **Step 1: Create `site/sites.json` with sample data**

```json
{
  "categories": [
    { "id": "all", "name": "全部", "default": true },
    { "id": "stable", "name": "稳定优选" },
    { "id": "cheap", "name": "高性价比" }
  ],
  "sites": [
    {
      "id": "demo-a",
      "name": "Demo 中转 A",
      "url": "https://example.com/a",
      "logo": "/logos/demo-a.png",
      "description": "支持 GPT/Claude/Gemini 全系列，官方价 5 折",
      "categories": ["stable"]
    },
    {
      "id": "demo-b",
      "name": "Demo 中转 B",
      "url": "https://example.com/b",
      "logo": "/logos/demo-b.png",
      "description": "高性价比中转，按量计费，新用户 5 元额度",
      "categories": ["cheap"]
    },
    {
      "id": "demo-c",
      "name": "Demo 中转 C",
      "url": "https://example.com/c",
      "logo": "",
      "description": "稳定且实惠，双线路自动切换",
      "categories": ["stable", "cheap"]
    }
  ]
}
```

- [ ] **Step 2: Create `site/src/types.ts`**

```ts
export interface Category {
  id: string;
  name: string;
  default?: boolean;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  logo: string;
  description: string;
  categories: string[];
}

export interface SitesData {
  categories: Category[];
  sites: Site[];
}
```

- [ ] **Step 3: Create logos directory placeholder**

```bash
mkdir -p site/public/logos
touch site/public/logos/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add site/sites.json site/src/types.ts site/public/logos/.gitkeep
git commit -m "feat(site): add sites.json schema and sample data"
```

---

## Task 3: Base layout with no-flicker theme bootstrap

**Files:**
- Create: `site/src/layouts/Base.astro`
- Create: `site/src/styles/global.css`

- [ ] **Step 1: Create `site/public/styles/global.css`**

(Native CSS + tiny vanilla JS live under `site/public/` so they can be referenced via `<link>` / `<script src>` without a bundler. Keeps deps minimal per spec §6.)


```css
:root {
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-alt: #f6f7f9;
  --border: #e6e7eb;
  --text: #1a1a1d;
  --text-muted: #6b6f76;
  --accent: #6366f1;
  --accent-soft: rgba(99, 102, 241, 0.12);
  --radius: 12px;
  --shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.06);
  --header-h: 56px;
  --sidebar-w: 200px;
}

html[data-theme="dark"] {
  --bg: #0e0f12;
  --surface: #16181d;
  --surface-alt: #1c1f25;
  --border: #262a31;
  --text: #e8eaed;
  --text-muted: #9aa0a6;
  --accent: #8b8df0;
  --accent-soft: rgba(139, 141, 240, 0.18);
  --shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.4);
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.app-header .brand { font-weight: 600; font-size: 16px; }
.app-header .spacer { flex: 1; }

.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  min-height: calc(100vh - var(--header-h));
}

@media (max-width: 768px) {
  .app-layout { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Create `site/src/layouts/Base.astro`**

```astro
---
interface Props { title?: string }
const { title = "AIport — AI 中转站导航" } = Astro.props;
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <script is:inline>
      (() => {
        try {
          const stored = localStorage.getItem("aiport-theme");
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          const theme = stored || (prefersDark ? "dark" : "light");
          document.documentElement.setAttribute("data-theme", theme);
        } catch (_) {
          document.documentElement.setAttribute("data-theme", "light");
        }
      })();
    </script>
    <link rel="stylesheet" href="/styles/global.css" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 3: Skip — global.css already in `site/public/styles/global.css` from Step 1.**

- [ ] **Step 4: Update placeholder index.astro to use Base**

Replace `site/src/pages/index.astro`:
```astro
---
import Base from "../layouts/Base.astro";
---
<Base>
  <header class="app-header">
    <span class="brand">AIport</span>
    <span class="spacer"></span>
  </header>
  <div class="app-layout">
    <aside></aside>
    <main></main>
  </div>
</Base>
```

- [ ] **Step 5: Build and verify**

```bash
cd site && pnpm build
```

Expected: `site/dist/index.html` contains the inline theme script and `<link href="/styles/global.css">`.

- [ ] **Step 6: Commit**

```bash
git add site/src/layouts/Base.astro site/src/pages/index.astro
git add site/public/styles/global.css
git commit -m "feat(site): add base layout with no-flicker theme bootstrap"
```

---

## Task 4: Theme toggle component and script

**Files:**
- Create: `site/src/components/ThemeToggle.astro`
- Create: `site/public/scripts/theme.js`

(Theme + filter scripts live under `public/scripts/` so they can be referenced by `<script src>` without bundling; they're tiny vanilla files. Same idea as global.css.)

- [ ] **Step 1: Create `site/public/scripts/theme.js`**

```js
(() => {
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;
  const sync = () => {
    const t = document.documentElement.getAttribute("data-theme");
    btn.textContent = t === "dark" ? "☀" : "🌙";
    btn.setAttribute("aria-label", t === "dark" ? "切换为浅色" : "切换为深色");
  };
  sync();
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("aiport-theme", next); } catch (_) {}
    sync();
  });
})();
```

- [ ] **Step 2: Create `site/src/components/ThemeToggle.astro`**

```astro
<button class="theme-toggle" data-theme-toggle type="button">🌙</button>
```

- [ ] **Step 3: Append styles to `site/public/styles/global.css`**

Append to the end:
```css
.theme-toggle {
  width: 36px; height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-size: 16px;
}
.theme-toggle:hover { background: var(--surface-alt); }
```

- [ ] **Step 4: Wire into index.astro and load theme.js**

Replace `site/src/pages/index.astro`:
```astro
---
import Base from "../layouts/Base.astro";
import ThemeToggle from "../components/ThemeToggle.astro";
---
<Base>
  <header class="app-header">
    <span class="brand">AIport</span>
    <span class="spacer"></span>
    <ThemeToggle />
  </header>
  <div class="app-layout">
    <aside></aside>
    <main></main>
  </div>
  <script src="/scripts/theme.js" defer></script>
</Base>
```

- [ ] **Step 5: Manually verify**

```bash
cd site && pnpm dev
```

Visit `http://localhost:4321/`, click the toggle. Expected: html `data-theme` switches between `light` and `dark`; localStorage `aiport-theme` updates; reload preserves theme.

- [ ] **Step 6: Commit**

```bash
git add site/public/scripts/theme.js site/src/components/ThemeToggle.astro site/public/styles/global.css site/src/pages/index.astro
git commit -m "feat(site): add theme toggle with localStorage persistence"
```

---

## Task 5: Sidebar component (categories)

**Files:**
- Create: `site/src/components/Sidebar.astro`

- [ ] **Step 1: Append sidebar styles to `site/public/styles/global.css`**

```css
.sidebar {
  border-right: 1px solid var(--border);
  background: var(--surface);
  padding: 16px 8px;
  overflow-y: auto;
}
.sidebar .cat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  cursor: pointer;
  width: 100%;
  text-align: left;
  position: relative;
}
.sidebar .cat:hover { background: var(--surface-alt); }
.sidebar .cat[aria-pressed="true"] {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}
.sidebar .cat[aria-pressed="true"]::before {
  content: "";
  position: absolute; left: 2px; top: 8px; bottom: 8px;
  width: 2px; background: var(--accent); border-radius: 2px;
}

@media (max-width: 768px) {
  .sidebar {
    display: flex; gap: 6px;
    overflow-x: auto; overflow-y: hidden;
    border-right: none; border-bottom: 1px solid var(--border);
    padding: 8px 12px;
  }
  .sidebar .cat { width: auto; white-space: nowrap; padding: 6px 12px; }
  .sidebar .cat[aria-pressed="true"]::before { display: none; }
}
```

- [ ] **Step 2: Create `site/src/components/Sidebar.astro`**

```astro
---
import type { Category } from "../types";
interface Props { categories: Category[]; activeId: string }
const { categories, activeId } = Astro.props;
---
<aside class="sidebar" data-sidebar>
  {categories.map((c) => (
    <button
      class="cat"
      data-category={c.id}
      aria-pressed={c.id === activeId ? "true" : "false"}
      type="button"
    >{c.name}</button>
  ))}
</aside>
```

- [ ] **Step 3: Wire into index.astro**

Replace `site/src/pages/index.astro`:
```astro
---
import Base from "../layouts/Base.astro";
import ThemeToggle from "../components/ThemeToggle.astro";
import Sidebar from "../components/Sidebar.astro";
import sitesData from "../../sites.json";
import type { SitesData } from "../types";

const data = sitesData as SitesData;
const defaultCat = data.categories.find((c) => c.default) ?? data.categories[0];
const activeId = defaultCat?.id ?? "all";
---
<Base>
  <header class="app-header">
    <span class="brand">AIport</span>
    <span class="spacer"></span>
    <ThemeToggle />
  </header>
  <div class="app-layout">
    <Sidebar categories={data.categories} activeId={activeId} />
    <main></main>
  </div>
  <script src="/scripts/theme.js" defer></script>
</Base>
```

- [ ] **Step 4: Build and verify**

```bash
cd site && pnpm build
```

Expected: build succeeds; `dist/index.html` contains 3 `<button class="cat">` with the default `aria-pressed="true"` on `data-category="all"`.

- [ ] **Step 5: Commit**

```bash
git add site/src/components/Sidebar.astro site/src/pages/index.astro site/public/styles/global.css
git commit -m "feat(site): add category sidebar"
```

---

## Task 6: SiteCard and SearchBox components

**Files:**
- Create: `site/src/components/SiteCard.astro`
- Create: `site/src/components/SearchBox.astro`

- [ ] **Step 1: Append card and search styles to `site/public/styles/global.css`**

```css
main.cards {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  align-content: start;
}

.site-card {
  display: block;
  padding: 16px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.site-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: var(--accent);
}
.site-card[hidden] { display: none; }

.site-head { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.site-logo {
  width: 40px; height: 40px; border-radius: 10px;
  object-fit: cover; background: var(--surface-alt);
}
.site-logo.placeholder {
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; color: var(--accent); background: var(--accent-soft);
}
.site-name { margin: 0; font-size: 15px; font-weight: 600; }
.site-desc { margin: 0; font-size: 13px; color: var(--text-muted); line-height: 1.5; }

.search-box {
  display: flex; align-items: center; gap: 8px;
  width: 280px; max-width: 50vw;
  padding: 0 12px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-alt);
}
.search-box input {
  flex: 1; border: none; outline: none; background: transparent;
  color: var(--text); font: inherit;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-muted);
  padding: 60px 20px;
}
```

- [ ] **Step 2: Create `site/src/components/SiteCard.astro`**

```astro
---
import type { Site } from "../types";
interface Props { site: Site }
const { site } = Astro.props;
const initial = site.name.trim().charAt(0).toUpperCase();
const cats = site.categories.join(",");
---
<a
  class="site-card"
  href={site.url}
  target="_blank"
  rel="noopener noreferrer"
  data-site-url={site.url}
  data-categories={cats}
  data-search-text={(site.name + " " + site.description).toLowerCase()}
>
  <div class="site-head">
    {site.logo
      ? <img
          class="site-logo"
          src={site.logo}
          alt=""
          onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'site-logo placeholder',textContent:this.dataset.initial}))"
          data-initial={initial}
        />
      : <div class="site-logo placeholder">{initial}</div>}
    <h3 class="site-name">{site.name}</h3>
  </div>
  <p class="site-desc">{site.description}</p>
</a>
```

- [ ] **Step 3: Create `site/src/components/SearchBox.astro`**

```astro
<div class="search-box">
  <span aria-hidden="true">🔍</span>
  <input
    type="search"
    data-search
    placeholder="搜索中转站..."
    autocomplete="off"
    spellcheck="false"
  />
</div>
```

- [ ] **Step 4: Wire into index.astro**

Replace `site/src/pages/index.astro`:
```astro
---
import Base from "../layouts/Base.astro";
import ThemeToggle from "../components/ThemeToggle.astro";
import Sidebar from "../components/Sidebar.astro";
import SearchBox from "../components/SearchBox.astro";
import SiteCard from "../components/SiteCard.astro";
import sitesData from "../../sites.json";
import type { SitesData } from "../types";

const data = sitesData as SitesData;
const defaultCat = data.categories.find((c) => c.default) ?? data.categories[0];
const activeId = defaultCat?.id ?? "all";
---
<Base>
  <header class="app-header">
    <span class="brand">AIport</span>
    <span class="spacer"></span>
    <SearchBox />
    <ThemeToggle />
  </header>
  <div class="app-layout">
    <Sidebar categories={data.categories} activeId={activeId} />
    <main class="cards" data-cards data-active-category={activeId}>
      {data.sites.map((s) => <SiteCard site={s} />)}
      <div class="empty-state" data-empty hidden>没有匹配的站点</div>
    </main>
  </div>
  <script src="/scripts/theme.js" defer></script>
</Base>
```

- [ ] **Step 5: Build and verify**

```bash
cd site && pnpm build
```

Expected: `dist/index.html` includes 3 `<a class="site-card"` elements with `data-site-url` and `data-categories` attributes. One card (demo-c with empty `logo`) uses the placeholder div.

- [ ] **Step 6: Commit**

```bash
git add site/src/components/SiteCard.astro site/src/components/SearchBox.astro site/src/pages/index.astro site/public/styles/global.css
git commit -m "feat(site): add site card and search box components"
```

---

## Task 7: Filter runtime (category + search)

**Files:**
- Create: `site/public/scripts/filter.js`

- [ ] **Step 1: Create `site/public/scripts/filter.js`**

```js
(() => {
  const main = document.querySelector("[data-cards]");
  const sidebar = document.querySelector("[data-sidebar]");
  const search = document.querySelector("[data-search]");
  const empty = document.querySelector("[data-empty]");
  if (!main || !sidebar) return;

  const cards = Array.from(main.querySelectorAll(".site-card"));

  const state = {
    category: main.getAttribute("data-active-category") || "all",
    query: "",
  };

  const matchCategory = (card) => {
    if (state.category === "all") return true;
    const cats = (card.getAttribute("data-categories") || "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    return cats.includes(state.category);
  };

  const matchQuery = (card) => {
    if (!state.query) return true;
    const txt = card.getAttribute("data-search-text") || "";
    return txt.includes(state.query);
  };

  const apply = () => {
    let visible = 0;
    for (const card of cards) {
      const ok = matchCategory(card) && matchQuery(card);
      if (ok) {
        card.removeAttribute("hidden");
        visible++;
      } else {
        card.setAttribute("hidden", "");
      }
    }
    if (empty) {
      if (visible === 0) empty.removeAttribute("hidden");
      else empty.setAttribute("hidden", "");
    }
  };

  sidebar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    state.category = btn.getAttribute("data-category") || "all";
    main.setAttribute("data-active-category", state.category);
    for (const b of sidebar.querySelectorAll("[data-category]")) {
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    }
    apply();
  });

  if (search) {
    let t;
    search.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.query = search.value.trim().toLowerCase();
        apply();
      }, 300);
    });
  }

  apply();
})();
```

- [ ] **Step 2: Load `filter.js` from index.astro**

Edit `site/src/pages/index.astro`, add a second script tag after `theme.js`:
```astro
  <script src="/scripts/theme.js" defer></script>
  <script src="/scripts/filter.js" defer></script>
```

- [ ] **Step 3: Manually verify**

```bash
cd site && pnpm dev
```

Visit `http://localhost:4321/` and verify:
- Default tab "全部" shows 3 cards.
- Click "稳定优选" → only demo-a and demo-c visible (demo-b hidden).
- Click "高性价比" → only demo-b and demo-c visible.
- Type "5 元" in search while on "全部" → only demo-b visible.
- Clear search → all category-matching cards return.
- Empty result shows "没有匹配的站点".

- [ ] **Step 4: Commit**

```bash
git add site/public/scripts/filter.js site/src/pages/index.astro
git commit -m "feat(site): add client-side category and search filtering"
```

---

## Task 8: Responsive polish and final visual pass

**Files:**
- Modify: `site/public/styles/global.css`

- [ ] **Step 1: Append responsive tweaks**

Append to `site/public/styles/global.css`:
```css
@media (max-width: 768px) {
  .app-header { padding: 0 12px; gap: 8px; }
  .search-box { width: 100%; max-width: none; }
  main.cards { padding: 12px; grid-template-columns: 1fr 1fr; gap: 12px; }
}

@media (max-width: 480px) {
  main.cards { grid-template-columns: 1fr; }
}

.site-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Manually verify in browser**

```bash
cd site && pnpm dev
```

Open dev tools, set viewport to 375px wide. Expected:
- Sidebar becomes a horizontal scrolling row at top.
- Cards collapse to single column.
- Header stays usable, search expands.

- [ ] **Step 3: Commit**

```bash
git add site/public/styles/global.css
git commit -m "feat(site): responsive polish for mobile viewport"
```

---

## Task 9: Extension manifest, content script, background

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/content.js`
- Create: `extension/background.js`
- Create: `extension/README.md`

- [ ] **Step 1: Create `extension/manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "AIport 一键打开",
  "version": "0.1.0",
  "description": "在 AIport 导航站一键打开当前可见的所有 AI 中转站",
  "action": { "default_title": "打开当前可见站点" },
  "permissions": ["tabs", "activeTab", "scripting"],
  "host_permissions": [
    "http://localhost:4321/*",
    "https://aiport.example.com/*"
  ],
  "background": { "service_worker": "background.js" },
  "content_scripts": [{
    "matches": [
      "http://localhost:4321/*",
      "https://aiport.example.com/*"
    ],
    "js": ["content.js"],
    "run_at": "document_idle"
  }]
}
```

Note: replace `https://aiport.example.com/*` with the real deployed domain in both `host_permissions` and `content_scripts.matches` before publishing.

- [ ] **Step 2: Create `extension/content.js`**

```js
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "collect") {
    const cards = document.querySelectorAll(".site-card:not([hidden])");
    const urls = [];
    for (const card of cards) {
      const u = card.getAttribute("data-site-url");
      if (u) urls.push(u);
    }
    sendResponse({ urls });
    return true;
  }
});
```

- [ ] **Step 3: Create `extension/background.js`**

```js
const HOSTS = [
  "http://localhost:4321/",
  "https://aiport.example.com/",
];

const isNavPage = (url) => !!url && HOSTS.some((h) => url.startsWith(h));

const flashBadge = async (text) => {
  await chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
};

const confirmInPage = async (tabId, count) => {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (n) => window.confirm(`将打开 ${n} 个标签页，确认继续？`),
    args: [count],
  });
  return result === true;
};

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  if (!isNavPage(tab.url)) {
    await chrome.tabs.create({ url: HOSTS[HOSTS.length - 1] });
    return;
  }
  let resp;
  try {
    resp = await chrome.tabs.sendMessage(tab.id, { type: "collect" });
  } catch (_) {
    await flashBadge("!");
    return;
  }
  const urls = (resp && resp.urls) || [];
  if (urls.length === 0) {
    await flashBadge("0");
    return;
  }
  if (urls.length > 20) {
    const ok = await confirmInPage(tab.id, urls.length);
    if (!ok) return;
  }
  for (const url of urls) {
    chrome.tabs.create({ url, active: false });
  }
});
```

- [ ] **Step 4: Create `extension/README.md`**

```markdown
# AIport 一键打开 扩展

## 安装（开发）

1. 打开 `chrome://extensions/`（或 Edge 的扩展页）。
2. 开启 "开发者模式"。
3. 点击 "加载已解压的扩展程序"，选择本目录 `extension/`。
4. 在导航站（本地 `http://localhost:4321/` 或部署域名）任意切换分类/搜索，点击工具栏图标即可批量打开当前可见站点。

## 自定义部署域名

在 `manifest.json` 的 `host_permissions`、`content_scripts.matches` 和 `background.js` 的 `HOSTS` 中，把 `https://aiport.example.com/` 替换为实际部署域名。

## 打包

```bash
cd extension && zip -r ../aiport-extension.zip .
```
```

- [ ] **Step 5: Commit**

```bash
git add extension/manifest.json extension/content.js extension/background.js extension/README.md
git commit -m "feat(extension): MV3 extension that opens currently visible cards"
```

---

## Task 10: End-to-end manual verification

**Files:** none modified — verification only.

- [ ] **Step 1: Start dev server**

```bash
cd site && pnpm dev
```

- [ ] **Step 2: Load extension**

In Chrome/Edge `chrome://extensions/`, enable Developer Mode, "Load unpacked", select `extension/`.

- [ ] **Step 3: Verify "全部" → opens 3 tabs**

On `http://localhost:4321/`, ensure "全部" is selected and search is empty. Click extension icon. Expected: 3 background tabs open (one per demo card).

- [ ] **Step 4: Verify category filter applies**

Select "高性价比", click extension icon. Expected: 2 tabs (demo-b, demo-c).

- [ ] **Step 5: Verify search filter applies**

Click "全部", type "5 元" in search. Click extension icon. Expected: 1 tab (demo-b).

- [ ] **Step 6: Verify empty case shows badge**

Type "xxxnomatch" in search. Click icon. Expected: badge "0" flashes; no tabs open.

- [ ] **Step 7: Verify off-domain click opens nav site**

Open a random tab like `https://www.google.com`. Click icon. Expected: nav site opens (per HOSTS fallback URL).

- [ ] **Step 8: Verify build output**

```bash
cd site && pnpm build
```

Expected: build succeeds, `site/dist/index.html` contains all cards with stable DOM attributes.

- [ ] **Step 9: Commit (only if you tweaked anything during verification)**

If no changes, skip. Otherwise commit fixes.

---

## Task 11: Root README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md` at repo root**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add root README"
```

---

## Verification Summary

After all tasks complete:
- `cd site && pnpm build` succeeds.
- `site/dist/index.html` contains every site from `sites.json` as `.site-card` with `data-site-url` and `data-categories`.
- In a browser: category sidebar, search box, theme toggle, and responsive layout all behave per spec §4.
- Loaded extension on the dev or deployed nav page opens exactly the currently-visible cards as background tabs, with badge "0" / confirm-on->20 / off-domain fallback per spec §5.
