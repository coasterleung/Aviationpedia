# 实时航班数据方案与成本分析

> 更新日期：2026-08 · 项目：Aviationpedia 实时航班功能

## 一、当前方案（免费，已上线）

```
GitHub Actions 工作流（live-flights.yml）
  ├─ 定时抓取 OpenSky 中国区域（ADS-B 状态）
  ├─ 关联机型/注册号（OpenSky 整库 90MB，actions/cache 每日缓存一次）
  ├─ 压缩为 flights.json + lookup.json
  └─ force-push 到 live-data 分支
        │
        ▼
应用端直接读取 raw.githubusercontent.com（CORS * 允许）
  ├─ /live 实时地图（Leaflet + CARTO 深/浅色底图）
  ├─ 弹窗：航班号/机型(可跳机型页)/注册号/高度/速度/航向/垂直速率/出发国/航司链接
  └─ 航司详情页「当前航班」列表
```

**成本：$0/月**（GitHub Actions 公共仓库免费、OpenSky 免费非商用、Leaflet/OSM 免费）

**数据新鲜度：约 30-40 分钟**（GitHub Actions 分钟级 cron 会被聚合降频，实测间隔 20-68 分钟）

## 二、数据源成本对比（2026-08 实测/核实）

| 数据源 | 免费额度 | 付费门槛 | 商用授权 | 覆盖 | 备注 |
|---|---|---|---|---|---|
| **OpenSky Network** | 400 信用/天（非商用） | — | ❌ 仅学术/个人 | 全球 ADS-B | 实测 646 架中国区域；**封锁云服务商 IP**（CF Worker 访问 = HTTP 522） |
| **Aviationstack** | **100 请求/月**（仅试用） | Basic $49.99/月（1 万次） | ✅ | 全球商业级 | 每 5 分钟轮询需 Professional $149.99/月；60 秒轮询需 Business $499.99/月 |
| **FlightAware AeroAPI** | 极有限试用 | 约 $500+/月 | ✅ | 全球 + 航班计划/历史 | 专业级，成本高 |
| **ADS-B Exchange** | 无 | 全付费（被 JetNet 收购后） | ✅ | 全球 | 曾免费，2024 起转付费 |
| **自建 ADS-B 接收机** | 硬件 $30-50 一次性 | — | ✅ 数据自有 | 接收机覆盖范围 | 树莓派 + RTL-SDR；无 ToS 风险，适合长期 |

## 三、本项目的试错记录（避免重蹈覆辙）

| 方案 | 结果 | 原因 |
|---|---|---|
| ❌ GitHub Actions 5 分钟 cron | 实际 20-68 分钟 | GitHub 对分钟级调度聚合降频（官方 best-effort 承诺） |
| ❌ Cloudflare Worker 定时抓取 | 完全不可用 | **OpenSky 封锁 CF IP**（522 连接超时）；GitHub raw 也限流 CF 共享 IP（429） |
| ❌ 本机 launchd 5 分钟任务 | 删除 | launchd 环境 PATH 缺 node（exit 78）；且数据源偶尔限流本机 IP；机器需常开 |
| ✅ GitHub Actions 工作流（30-40 分钟） | 稳定运行 | GitHub 服务器 IP 可访问 OpenSky；actions/cache 每日缓存 90MB 机型库 |

## 四、结论与建议

1. **免费体验版：维持现状**（GitHub 工作流 + raw 读取）——成本 $0，功能完整，只是更新慢。
2. **追求真·实时（分钟级）且可商用**：按轮询频率选 Aviationstack 档位（5 分钟 ≈ $150/月，1 分钟 ≈ $500/月），或自建接收机。
3. **云函数/Worker 中转路线对 OpenSky 无效**（IP 封锁），除非改用不封云 IP 的付费源。
4. 免费档（100 请求/月）仅适合开发调试，撑不起任何自动刷新功能。

## 五、相关代码位置

- 工作流：`.github/workflows/live-flights.yml`
- 压缩/关联脚本：`e2e/compact-flights.mjs`
- 应用数据 Hook：`app/src/hooks/useLiveFlights.ts`（`LIVE_DATA_URL` 可切换数据源）
- 实时页面：`app/src/pages/LiveFlights.tsx`
- 航司联动：`app/src/pages/AirlineDetail.tsx`

## 六、有状态的合规限流与多源适配（2026-08 落地）

针对「免费 API 请求受限 / 被 IP 封锁」的基线问题，采用**合规**的工程手段（不轮换 IP、不伪装来源、不超频撞限流），并让数据源可替换。

### 1. 固定 + 有状态的退避调度
- 调度从 `*/5` 改为 **每 30 分钟一次**（`30 * * * *`），约 48 请求/天，远低于 OpenSky 免费额度。
- 状态记录在 `live-data` 分支的 `data/state.json`，由 `e2e/fetch-live.mjs` 维护：
  - 抓取失败 → 写 `status: degraded` 与**指数退避** `nextRetryAt`（30 min → 1h → 2h → 4h）。
  - 下次运行若 `nextRetryAt` 在未来 → **跳过本次抓取**（不撞限流），仅更新时间戳。
  - 抓取成功 → 重置退避，写 `status: ok`。

### 2. 旧数据保护
- 抓取失败时**保留上一份有效的 `flights.json`**，前端继续展示最后已知快照，并标记为可能过期。
- 失败时仍推送 `state.json`（让退避状态跨运行持久化），但绝不推送空数据覆盖线上。

### 3. 多源 Provider 适配层
- `e2e/live-data-providers.mjs` 抽象出统一的 `{ time, states }` 输出，隔离前端与上游格式。
- 现成 `opensky` provider；预留 `licensed`（付费 API）与 `selfHosted`（自建 ADS-B 接收机）模板，接新源时无需改前端或 compact 脚本。

### 4. 前端数据新鲜度提示
- `useLiveFlights` 解析 `source` / `stale` 字段；地图页展示 **数据源徽标**、**刷新间隔** 与 **陈旧警告**（数据超过 2 小时或上游 `stale` 时置黄）。

### 校验记录
- `fetch-live.mjs` 三路径本地实测通过：**跳过**（future `nextRetryAt`）、**成功**（抓到 306 架次，写出 `source/stale/fetchedAt` 与 `state:ok`）、**失败**（未知 provider，写 `degraded` + 30min 退避，旧文件保留）。
- `tsc -b` 与 `npm run build` 通过。
