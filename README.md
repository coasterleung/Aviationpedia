# 航空百科全书 · Aviation Encyclopedia ✈️

全平台飞机与航空公司百科全书应用。当前为 **Web（PWA）** 版本，数据来自 Wikidata + OpenFlights 开放数据，架构预留移动端/桌面端扩展。

## 功能

- **机型百科**：2965 个机型/型号条目（含规格参数：机长、翼展、航程、速度、载客量、产量、升限、首飞日期…）
- **航司百科**：9302 家航司（含 IATA/ICAO 代码、呼号、国家、总部、枢纽、机队、成立年份）
- **联盟**：星空联盟 / 天合联盟 / 寰宇一家（成员名单、成立年份、Logo）
- **制造商**：518 家制造商按产量浏览
- **搜索**：全站即时搜索（名称 / 代码 / 描述，中英双语）
- **对比**：最多 3 个机型或航司并排对比参数
- **收藏 + 离线**：IndexedDB 本地收藏，PWA 离线可用
- **i18n**：中文 / English 一键切换
- **深色模式**：浅色/深色主题

## 快速开始

```bash
cd app
npm install
npm run dev        # 开发服务器 http://localhost:5173
npm run build      # 生产构建 (dist/)
npm run preview    # 预览生产构建
```

> 如果 npm 缓存目录有权限问题，使用 `npm --cache ../.npm-cache install`。

## 项目结构

```
plane_ encyclopaedia/
├── app/                     # Web 应用 (React 19 + TypeScript + Vite 8 + Tailwind 4)
│   └── src/
│       ├── data/            # 生成的结构化数据 (encyclopaedia.json) + 类型 + 数据访问层
│       ├── components/      # 布局、卡片、搜索、操作按钮
│       ├── pages/           # 首页/列表/详情/对比/收藏/联盟/制造商
│       ├── hooks/           # 收藏 (Dexie)
│       ├── store/           # UI 状态 (Zustand, localStorage 持久化)
│       ├── db/              # IndexedDB (Dexie)
│       └── i18n/            # 中英双语
├── data/                    # 数据管道
│   ├── src/                 # 原始数据 + 自有补充数据 (联盟成员覆盖表)
│   ├── pipeline/            # 抓取 + 构建脚本 (Node TS)
│   └── generated/           # 中间与最终产物
└── docs/                    # 文档
```

## 数据管道

| 源 | 内容 | 规模 |
|---|---|---|
| Wikidata (SPARQL) | 机型族/型号、规格参数、图片、运营航司、航司档案 | 2965 机型 / 5676 航司 |
| OpenFlights | 航司 IATA/ICAO 代码、已停运航司 | 6162 家（补充 3626 家） |
| Wikipedia | 联盟成员名单（自有补充解析） | 3 联盟 59 成员 |

重建数据：

```bash
cd data
node --experimental-strip-types pipeline/fetch-aircraft.ts
node --experimental-strip-types pipeline/fetch-airlines.ts
node --experimental-strip-types pipeline/build.ts
```

详见 data/README.md。

## 迭代记录

- **迭代 0 — 骨架**：Vite+React+TS 初始化、目录分层、路由、i18n、Tailwind 设计系统 ✅
- **迭代 1 — 数据层**：数据模型、开放数据管道（Wikidata SPARQL / OpenFlights / Wikipedia）、单位换算、联盟成员匹配 ✅
- **迭代 2 — 浏览搜索**：机型/航司列表、全站即时搜索、制造商筛选 ✅
- **迭代 3 — 详情页**：机型规格表 + 图片 + 型号/运营航司；航司档案 + 机队 + 枢纽 + 联盟 ✅
- **迭代 4 — 对比**：最多 3 项并排对比 ✅
- **迭代 5 — 收藏与离线**：Dexie 收藏 + PWA（manifest + Service Worker 预缓存）✅
- **迭代 6 — 打磨发布**：待办（响应式细调、部署、品牌命名、原生扩展）

## 技术选型

- **Web**: React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + React Router 7
- **状态**: Zustand (UI) + Dexie (收藏/IndexedDB)
- **i18n**: i18next / react-i18next
- **PWA**: vite-plugin-pwa (generateSW)
- **数据**: Node 24 内置 TS 运行 + Wikidata SPARQL 端点
- **未来扩展**: 数据层已与 UI 解耦，可平滑迁移至 React Native / Expo 或 Capacitor 原生壳

## 部署（GitHub Pages）

1. 在 GitHub 创建仓库（如 `aviationpedia`）并推送代码：
   ```bash
   git remote add origin git@github.com:<用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**
3. 推送后自动构建并发布（workflow 已配置好）

## 原生 App（Capacitor）

原生壳已配置好（`app/ios`、`app/android`，可随时重新生成）。在装有 Xcode / Android Studio 的机器上：

```bash
cd app
npm run cap:sync       # 构建 + 同步 web 资源到原生工程
npm run cap:ios        # 打开 Xcode 工程
npm run cap:android    # 打开 Android Studio 工程
```

> 注意：原生目录已加入 .gitignore，用 `npx cap add ios android` 可随时重建。

## 数据来源与许可

- [Wikidata](https://www.wikidata.org/) — CC0
- [OpenFlights](https://openflights.org/) — Open Database License (ODbL)
- 联盟成员名单解析自 Wikipedia（CC BY-SA），并辅以自有校验
