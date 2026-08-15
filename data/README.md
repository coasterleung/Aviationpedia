# 数据管道说明

从开放数据源构建百科全书的**可重复执行**管道。

## 流水线

```
pipeline/fetch-aircraft.ts   → generated/raw-aircraft.json   (Wikidata 机型)
pipeline/fetch-airlines.ts   → generated/raw-airlines.json   (Wikidata 航司)
                             → generated/raw-alliances.json  (Wikidata 联盟元数据)
                             → generated/raw-members.json    (Wikipedia 成员名单)
pipeline/build.ts            → generated/final/encyclopaedia.json → ../../app/src/data/encyclopaedia.json
```

运行（Node ≥ 24，自带 TS 类型剥离）：

```bash
node --experimental-strip-types pipeline/fetch-aircraft.ts
node --experimental-strip-types pipeline/fetch-airlines.ts
node --experimental-strip-types pipeline/build.ts
```

## Wikidata 属性映射（2025-08 验证）

### 机型（类 Q15056993 = aircraft family，覆盖族/型号/改型）

| 字段 | 属性 | 说明 |
|---|---|---|
| length / wingspan / height / width | P2043 / P2050 / P2048 / P2049 | 米（psv: + wikibase:quantityAmount/Unit）|
| range | P2073 | vehicle range，千米 |
| speed | P2052 | km/h |
| wingArea | P2112 | 翼面积 m² |
| capacity | P1083 | maximum capacity |
| produced | P1092 | 总产量 |
| altitude | P2254 | 升限（m 或 ft，build 统一转 m）|
| firstFlight / serviceEntry | P606 / P729 | 日期 |
| manufacturer / image / variants / poweredBy / operator | P176 / P18 / P527 / P516 / P137 | |

> 陷阱记录：`UNITS()` 函数不被该端点支持（语法错误）；`ps:` + `wikibase:quantityUnit` 拿不到单位，必须用 `psv:` + `wikibase:quantityAmount`；测量属性与 GROUP BY 组合会笛卡尔爆炸，故拆分为独立扁平查询。

### 航司（类 Q46970 = airline）

| 字段 | 属性 |
|---|---|
| IATA | P229（2 字母）|
| ICAO | P230（3 字母）|
| callsign | P432 |
| founded | P571 |
| website | P856 |
| country | P17 |
| headquarters | P159 |
| hub | P113 |
| logo / image | P154 / P18 |
| 机队机型 | P121（aircraft fleet）|

> 部分航司（如 Korean Air Q213147）**缺少 en 标签**，需通过 Query A2（MINUS en 标签 + 任意语言兜底）补齐。

### 联盟

- 联盟本体：类 Q2465581，字段 P571/P856/P154/P18
- 成员：Wikidata **无结构化成员数据** → 从 Wikipedia "Full members" 表格解析 + [src/alliance-overrides.ts](src/alliance-overrides.ts) 显式 QID 覆盖（自有补充数据）

## 数据质量说明

- 规格参数覆盖率因条目而异（约 25-65%），缺失显示 "—"
- 联盟成员名单随 Wikipedia 更新；个别条目可能包含历史成员（如 SkyTeam 中的 Aeroflot）
- OpenFlights 合并提供已停运/区域性航司覆盖（source: 'openflights'）
