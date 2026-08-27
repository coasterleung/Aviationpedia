import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      app: { name: 'Aviationpedia', tagline: 'Aircraft & Airline Encyclopedia' },
      nav: { home: 'Home', aircraft: 'Aircraft', airlines: 'Airlines', manufacturers: 'Manufacturers', codes: 'Type Codes', live: 'Live Flights', alliances: 'Alliances', favorites: 'Favorites', compare: 'Compare' },
      home: {
        heroTitle: 'Explore the world of aviation',
        heroSubtitle: 'A free, open encyclopedia of aircraft and airlines — specs, fleets, alliances and history.',
        browseAircraft: 'Browse Aircraft', browseAirlines: 'Browse Airlines',
        statsAircraft: 'Aircraft', statsAirlines: 'Airlines', statsManufacturers: 'Manufacturers', statsAlliances: 'Alliances',
        searchPlaceholder: 'Search aircraft or airlines (e.g. 737, A380, CA, Star Alliance)…',
        featuredTitle: 'Featured aircraft',
      },
      search: { placeholder: 'Search…', noResults: 'No results found' },
      aircraft: {
        title: 'Aircraft', subtitle: 'Browse by manufacturer or search', allManufacturers: 'All manufacturers',
        manufacturer: 'Manufacturer', firstFlight: 'First flight', serviceEntry: 'Service entry',
        length: 'Length', wingspan: 'Wingspan', height: 'Height', width: 'Width',
        range: 'Range', speed: 'Max speed', wingArea: 'Wing area', capacity: 'Capacity',
        produced: 'Total produced', altitude: 'Service ceiling', mass: 'Mass (MTOW/empty)', derivative: 'Derived from',
        variants: 'Variants', operators: 'Operators', poweredBy: 'Engines', family: 'Family',
        specs: 'Specifications', overview: 'Overview', images: 'Photos',
        notAvailable: '—', model: 'Model', familyName: 'Part of', allAircraft: 'All aircraft',
      },
      airlines: {
        title: 'Airlines', subtitle: 'Search by name or IATA/ICAO code',
        iata: 'IATA', icao: 'ICAO', callsign: 'Callsign', country: 'Country', founded: 'Founded',
        website: 'Website', alliance: 'Alliance', fleet: 'Fleet', hubs: 'Hubs',
        headquarters: 'Headquarters', active: 'Active', defunct: 'Defunct', source: 'Source',
        noFleetData: 'Fleet data not available', allAirlines: 'All airlines',
      },
      alliances: { title: 'Alliances', subtitle: 'Star Alliance · SkyTeam · Oneworld', members: 'Member airlines', founded: 'Founded', website: 'Website' },
      manufacturers: { title: 'Manufacturers', subtitle: 'Browse aircraft by builder', aircraftCount: 'aircraft', searchPlaceholder: 'Search by name…', allCountries: 'All countries', sortByCount: 'By aircraft count', sortByName: 'By name' },
      live: { title: 'Live Flights', subtitle: 'Real-time aircraft positions', region: 'China region', aircraftCount: 'Aircraft', lastUpdate: 'Updated', legend: 'Altitude legend', highAlt: '>10 km', midHighAlt: '7–10 km', midAlt: '3–7 km', lowAlt: '<3 km', ground: 'On ground / unknown', altitude: 'Altitude', speed: 'Speed', heading: 'Heading', vrate: 'V/S', origin: 'Origin', viewAirline: 'View airline →', aircraft: 'Aircraft', registration: 'Registration', unknownCallsign: 'Unknown flight', source: 'Data source', refresh: 'Refreshes', refreshInterval: 'every 30 min', stale: 'Data may be outdated — the source is temporarily unavailable', disclaimer: 'Positions via OpenSky Network (ADS-B), refreshed every 30 minutes. Coverage varies by region; some flights may be missing.', error: 'Live data unavailable', currentFlights: 'Live flights', noFlights: 'No live flights for this airline right now', noIcao: 'No ICAO code — cannot match live flights', viewLiveMap: 'View live map →' },
      codes: { title: 'Aircraft Type Codes', subtitle: 'IATA / ICAO codes used in flight schedules', searchPlaceholder: 'Search by name or code…', iata: 'IATA', icao: 'ICAO', name: 'Aircraft type', count: 'codes' },
      favorites: { title: 'Favorites', subtitle: 'Saved for offline viewing', empty: 'No favorites yet — tap the ★ on any aircraft or airline to save it.' },
      compare: { title: 'Compare', subtitle: 'Select up to 3 items to compare side by side', empty: 'Nothing selected yet. Use "Compare" on aircraft or airline pages.', addPrompt: 'Add items from detail pages', remove: 'Remove', clearAll: 'Clear all', field: 'Specification' },
      detail: { back: 'Back', addFavorite: 'Save', removeFavorite: 'Saved', addCompare: 'Compare', wikiLink: 'View on Wikipedia', dataCredit: 'Data from Wikidata & OpenFlights' },
      common: { loading: 'Loading…', language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark', notFound: 'Not found', backHome: 'Home' },
    },
  },
  zh: {
    translation: {
      app: { name: '航空百科', tagline: '飞机与航空公司百科全书' },
      nav: { home: '首页', aircraft: '机型', airlines: '航司', manufacturers: '制造商', codes: '机型代码', live: '实时航班', alliances: '联盟', favorites: '收藏', compare: '对比' },
      home: {
        heroTitle: '探索航空世界',
        heroSubtitle: '免费的飞机与航空公司开放百科——规格、机队、联盟与历史。',
        browseAircraft: '浏览机型', browseAirlines: '浏览航司',
        statsAircraft: '机型', statsAirlines: '航司', statsManufacturers: '制造商', statsAlliances: '联盟',
        searchPlaceholder: '搜索机型或航司（如 737、A380、CA、星空联盟）…',
        featuredTitle: '精选机型',
      },
      search: { placeholder: '搜索…', noResults: '未找到结果' },
      aircraft: {
        title: '机型', subtitle: '按制造商浏览或搜索', allManufacturers: '全部制造商',
        manufacturer: '制造商', firstFlight: '首飞', serviceEntry: '服役',
        length: '机长', wingspan: '翼展', height: '机高', width: '机身宽',
        range: '航程', speed: '最大速度', wingArea: '翼面积', capacity: '载客量',
        produced: '总产量', altitude: '升限', mass: '质量（起飞/空重）', derivative: '衍生于',
        variants: '型号', operators: '运营航司', poweredBy: '发动机', family: '所属系列',
        specs: '规格参数', overview: '简介', images: '图片',
        notAvailable: '—', model: '型号', familyName: '所属系列', allAircraft: '全部机型',
      },
      airlines: {
        title: '航司', subtitle: '按名称或 IATA/ICAO 代码搜索',
        iata: 'IATA', icao: 'ICAO', callsign: '呼号', country: '国家', founded: '成立',
        website: '官网', alliance: '联盟', fleet: '机队', hubs: '枢纽',
        headquarters: '总部', active: '运营中', defunct: '已停运', source: '数据来源',
        noFleetData: '暂无机队数据', allAirlines: '全部航司',
      },
      alliances: { title: '联盟', subtitle: '星空联盟 · 天合联盟 · 寰宇一家', members: '成员航司', founded: '成立', website: '官网' },
      manufacturers: { title: '制造商', subtitle: '按厂商浏览机型', aircraftCount: '款机型', searchPlaceholder: '按名称搜索…', allCountries: '全部国家/地区', sortByCount: '按机型数量', sortByName: '按名称' },
      live: { title: '实时航班', subtitle: '实时飞机位置', region: '中国区域', aircraftCount: '飞机数', lastUpdate: '更新于', legend: '高度图例', highAlt: '>10 km', midHighAlt: '7–10 km', midAlt: '3–7 km', lowAlt: '<3 km', ground: '地面/未知', altitude: '高度', speed: '速度', heading: '航向', vrate: '垂直速率', origin: '出发国', viewAirline: '查看航司 →', aircraft: '机型', registration: '注册号', unknownCallsign: '未知航班', source: '数据源', refresh: '刷新', refreshInterval: '每 30 分钟', stale: '数据可能已过期——数据源暂时不可用', disclaimer: '数据来自 OpenSky Network（ADS-B），约每 30 分钟刷新。覆盖率因地区而异，部分航班可能缺失。', error: '实时数据不可用', currentFlights: '当前航班', noFlights: '该航司当前无实时航班', noIcao: '无 ICAO 代码，无法匹配实时航班', viewLiveMap: '查看实时地图 →' },
      codes: { title: '机型代码速查', subtitle: '航班时刻表中使用的 IATA / ICAO 机型代码', searchPlaceholder: '按名称或代码搜索…', iata: 'IATA', icao: 'ICAO', name: '机型', count: '个代码' },
      favorites: { title: '收藏', subtitle: '离线也能查看', empty: '还没有收藏——在任意机型或航司页点 ★ 即可收藏。' },
      compare: { title: '对比', subtitle: '最多选择 3 项进行对比', empty: '还没有选择内容。在详情页使用"对比"按钮添加。', addPrompt: '从详情页添加项目', remove: '移除', clearAll: '清空', field: '规格' },
      detail: { back: '返回', addFavorite: '收藏', removeFavorite: '已收藏', addCompare: '对比', wikiLink: '在维基百科查看', dataCredit: '数据来自 Wikidata 与 OpenFlights' },
      common: { loading: '加载中…', language: '语言', theme: '主题', light: '浅色', dark: '深色', notFound: '未找到', backHome: '首页' },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n