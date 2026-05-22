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
