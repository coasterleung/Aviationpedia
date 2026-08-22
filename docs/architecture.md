# 架构设计

## 分层

```
┌─────────────────────────────────────────────┐
│  UI 层 (pages/ + components/)               │  React Router 页面
├─────────────────────────────────────────────┤
│  状态层 (store/ + hooks/ + db/)             │  Zustand UI 状态 / Dexie 收藏
├─────────────────────────────────────────────┤
│  数据访问层 (data/index.ts)                 │  查询、搜索、实体解析、i18n 名称
├─────────────────────────────────────────────┤
│  数据层 (data/encyclopaedia.json + types)   │  构建期生成的静态数据（随包离线）
└─────────────────────────────────────────────┘
```

## 设计决策

1. **数据随包分发而非运行时 API**：百科全书数据量 ~4.4MB，静态打包 → 首屏快、天然离线、无后端依赖。更新通过重新构建数据。
2. **数据管道可重复执行**：fetch → build 两步，全部产物可重建，Wikidata/OpenFlights 数据可随上游更新。
3. **全平台路径**：UI 只依赖数据访问层接口；未来可换壳（Capacitor → iOS/Android），或数据层换 API 实现。
4. **实体标识**：统一使用 Wikidata QID 作为主键（机型/航司/制造商/联盟），OpenFlights 补充条目用 `OF:` 前缀。
5. **离线优先**：PWA Service Worker 预缓存全部资源（generateSW），收藏存 IndexedDB。

## 未来迭代方向

- 机型↔航司双向机队关系完善（当前用 P121/P137，覆盖率有限）
- 航班时刻/机票搜索等动态数据（需后端 API）
- 原生壳（Capacitor）打包 iOS/Android

## 已落地增强

- **图片离线缓存**：`ImageWithFallback` 离线优先 —— 视图挂载时主动把 Wikimedia Commons 图片以 Blob 形式存入 IndexedDB（`imageCache` 表，Dexie v2），离线时优先从本地读取；收藏页进入时批量预取收藏项图片，确保离线可用。Service Worker（vite-plugin-pwa）仍对访问过的图片做 CacheFirst 运行时缓存作为双层兜底。
- **数据自动更新调度**：`.github/workflows/update-data.yml` 每周日 UTC 定时重跑数据管道（fetch-aircraft / fetch-airlines / build），仅当 `encyclopaedia.json` 内容变化时才提交推送，触发 Pages 重新部署。
