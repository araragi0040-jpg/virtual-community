/**
 * 歩ける語り場 v033 GAS 読み込み専用API
 *
 * 使い方：
 * 1. Googleスプレッドシートに v028/v029 のTSVを貼り付ける
 * 2. このコードをApps Scriptへ貼り付ける
 * 3. SPREADSHEET_ID を設定する（スプレッドシートに紐づくApps Scriptなら空でも可）
 * 4. ウェブアプリとしてデプロイする
 * 5. アプリ側の「データ設定」にWebアプリURLを登録する
 */

const SPREADSHEET_ID = ''; // 例：'1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
const API_KEY = ''; // 必要な場合だけ設定。空ならキー不要。
const INITIAL_MAP_ID = 'outside_4u';

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    if (API_KEY && params.key !== API_KEY) {
      return jsonOutput({ ok: false, error: 'API key is invalid.' });
    }

    const mode = params.mode || 'project';
    if (mode === 'ping') {
      return jsonOutput({ ok: true, message: 'vc4u gas api is ready', generatedAt: new Date().toISOString() });
    }

    if (mode !== 'project') {
      return jsonOutput({ ok: false, error: 'Unknown mode: ' + mode });
    }

    const project = buildProjectFromSheets();
    const summary = summarizeProject_(project);
    if (!summary.maps) {
      return jsonOutput({ ok: false, error: 'maps シートのデータが0件です。スプレッドシートに maps シートを作成し、v028のTSVをヘッダー付きで貼り付けてください。', summary: summary, sheetNames: getSheetNames_(), generatedAt: new Date().toISOString() });
    }
    return jsonOutput({ ok: true, version: 'v033', generatedAt: new Date().toISOString(), summary: summary, data: project });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err && err.message ? err.message : err), stack: String(err && err.stack ? err.stack : '') });
  }
}



function getSheetNames_() {
  return getSpreadsheet_().getSheets().map(function(s) { return s.getName(); });
}

function summarizeProject_(project) {
  const maps = project && project.mapsData && project.mapsData.maps ? project.mapsData.maps : {};
  return {
    maps: Object.keys(maps).length,
    interactables: Object.keys(maps).reduce(function(n, id) { return n + ((maps[id].interactables || []).length); }, 0),
    blocks: Object.keys(maps).reduce(function(n, id) { return n + ((maps[id].blocks || []).length); }, 0),
    npcs: ((project.npcsData || {}).npcs || []).length,
    hidden: ((project.hiddenData || {}).hiddenSpots || []).length,
    dialogues: Object.keys(((project.dialoguesData || {}).dialogues || {})).length,
    boards: Object.keys(((project.boardsData || {}).boards || {})).length,
    menus: Object.keys(((project.menusData || {}).menus || {})).length,
    linkBoards: Object.keys(((project.linkBoardsData || {}).linkBoards || {})).length
  };
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet is not found. Set SPREADSHEET_ID or bind this script to a spreadsheet.');
  return ss;
}

function rows_(sheetName) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];
  const headers = values[0].map(h => String(h || '').trim());
  return values.slice(1).filter(row => row.some(v => v !== '' && v !== null)).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      if (!h) return;
      obj[h] = row[i];
    });
    return obj;
  });
}

function str_(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback || '';
  return String(v);
}

function num_(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback || 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : (fallback || 0);
}

function bool_(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback !== undefined ? fallback : true;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['false', '0', 'no', 'off', '無効'].indexOf(s) >= 0) return false;
  if (['true', '1', 'yes', 'on', '有効'].indexOf(s) >= 0) return true;
  return fallback !== undefined ? fallback : true;
}

function json_(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'object') return v;
  const s = String(v).trim();
  if (!s) return fallback;
  try { return JSON.parse(s); } catch (_) { return fallback; }
}

function days_(v) {
  if (v === null || v === undefined || v === '') return ['all'];
  if (Array.isArray(v)) return v.length ? v : ['all'];
  const s = String(v).trim();
  if (!s || s === 'all') return ['all'];
  if (s.charAt(0) === '[') return json_(s, ['all']);
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

function splitIds_(v) {
  if (v === null || v === undefined || v === '') return [];
  if (Array.isArray(v)) return v;
  return String(v).split(',').map(x => x.trim()).filter(Boolean);
}

function addCommon_(obj, row) {
  obj.visibleDays = days_(row.visibleDays);
  const visibleWhen = json_(row.visibleWhenJson || row.visibleWhen || row.conditionJson || row.condition, null);
  if (visibleWhen) obj.visibleWhen = visibleWhen;
  if (row.optionsJson) obj.options = json_(row.optionsJson, []);
  if (row.note !== undefined) obj.note = str_(row.note, '');
  return obj;
}

function buildProjectFromSheets() {
  const mapsData = buildMapsData_();
  const dialoguesData = buildDialoguesData_();
  const boardsData = buildBoardsData_();
  const menusData = buildMenusData_();
  const linkBoardsData = buildLinkBoardsData_();
  const npcsData = buildNpcsData_();
  const hiddenData = buildHiddenData_();
  const actionsData = buildActionsData_();
  const achievementsData = buildAchievementsData_();

  applyOptions_(dialoguesData, boardsData, menusData, linkBoardsData, hiddenData, npcsData, mapsData);

  return {
    mapsData: mapsData,
    npcsData: npcsData,
    hiddenData: hiddenData,
    dialoguesData: dialoguesData,
    boardsData: boardsData,
    menusData: menusData,
    linkBoardsData: linkBoardsData,
    actionsData: actionsData,
    achievementsData: achievementsData
  };
}

function buildMapsData_() {
  const maps = {};
  rows_('maps').forEach(row => {
    const id = str_(row.id);
    if (!id) return;
    const map = addCommon_({
      id: id,
      name: str_(row.name, id),
      type: str_(row.type, 'outside'),
      shopId: str_(row.shopId, ''),
      image: str_(row.image, ''),
      start: { x: num_(row.startX, 50), y: num_(row.startY, 50), dir: str_(row.startDir, 'front') },
      collisionRadius: num_(row.collisionRadius, 1.6),
      walkZones: json_(row.walkZonesJson, [{ x: 0, y: 0, w: 100, h: 100 }]),
      transitions: json_(row.transitionsJson, []),
      interactables: [],
      blocks: [],
      label: str_(row.label, str_(row.name, id))
    }, row);
    maps[id] = map;
  });

  rows_('interactables').forEach(row => {
    const mapId = str_(row.mapId);
    if (!mapId || !maps[mapId]) return;
    const item = addCommon_({
      id: str_(row.id),
      type: str_(row.type, 'event'),
      label: str_(row.label, str_(row.id)),
      x: num_(row.x), y: num_(row.y), w: num_(row.w, 8), h: num_(row.h, 8),
      range: num_(row.range, 12)
    }, row);
    ['targetMapId', 'confirmId', 'boardId', 'signId', 'menuId', 'dialogueId'].forEach(key => {
      if (row[key] !== undefined && row[key] !== '') item[key] = str_(row[key]);
    });
    const spawn = json_(row.spawnJson, null);
    if (spawn) item.spawn = spawn;
    maps[mapId].interactables.push(item);
  });

  rows_('blocks').forEach(row => {
    const mapId = str_(row.mapId);
    if (!mapId || !maps[mapId]) return;
    const block = addCommon_({
      id: str_(row.id),
      type: 'block',
      label: str_(row.label, str_(row.id)),
      x: num_(row.x), y: num_(row.y), w: num_(row.w, 8), h: num_(row.h, 8)
    }, row);
    maps[mapId].blocks.push(block);
  });

  const initialMapId = maps[INITIAL_MAP_ID] ? INITIAL_MAP_ID : Object.keys(maps)[0];
  return { canvasSize: 1000, initialMapId: initialMapId, maps: maps };
}

function buildNpcsData_() {
  const npcs = rows_('npcs').map(row => addCommon_({
    id: str_(row.id),
    name: str_(row.name, str_(row.id)),
    mapId: str_(row.mapId),
    x: num_(row.x),
    y: num_(row.y),
    sprite: str_(row.sprite, ''),
    dialogueId: str_(row.dialogueId, ''),
    dialogueByDay: json_(row.dialogueByDayJson, null),
    range: num_(row.range, 12)
  }, row)).filter(n => n.id);
  return { npcs: npcs };
}

function buildDialoguesData_() {
  const dialogues = {};
  rows_('dialogues').forEach(row => {
    const id = str_(row.id);
    if (!id) return;
    dialogues[id] = addCommon_({
      id: id,
      speaker: str_(row.speaker, str_(row.label, '')),
      label: str_(row.label, str_(row.speaker, id)),
      text: str_(row.text, ''),
      textByDay: json_(row.textByDayJson, null)
    }, row);
  });

  const confirms = {};
  rows_('confirms').forEach(row => {
    const id = str_(row.id);
    if (!id) return;
    confirms[id] = addCommon_({
      id: id,
      title: str_(row.title, id),
      text: str_(row.text, ''),
      yesLabel: str_(row.yesLabel, 'はい'),
      noLabel: str_(row.noLabel, 'いいえ')
    }, row);
  });

  return { dialogues: dialogues, confirms: confirms };
}

function buildBoardsData_() {
  const boards = {};
  rows_('boards').forEach(row => {
    const id = str_(row.id);
    if (!id) return;
    boards[id] = addCommon_({
      id: id,
      title: str_(row.title, id),
      body: str_(row.body, ''),
      bodyByDay: json_(row.bodyByDayJson, null),
      linkLabel: str_(row.linkLabel, ''),
      linkUrl: str_(row.linkUrl, ''),
      linkBoardId: str_(row.linkBoardId, ''),
      extraLinkLabel: str_(row.extraLinkLabel, '')
    }, row);
  });
  return { boards: boards };
}

function buildMenusData_() {
  const menus = {};
  rows_('menus').forEach(row => {
    const id = str_(row.id);
    if (!id) return;
    menus[id] = addCommon_({
      id: id,
      title: str_(row.title, id),
      note: str_(row.note, ''),
      items: json_(row.itemsJson, []),
      noteByDay: json_(row.noteByDayJson, null),
      itemsByDay: json_(row.itemsByDayJson, null),
      actionIds: splitIds_(row.actionIds),
      actionNote: str_(row.actionNote, '')
    }, row);
  });
  return { menus: menus };
}

function buildActionsData_() {
  const actions = {};
  rows_('actions').forEach(row => {
    const id = str_(row.id);
    if (!id) return;
    actions[id] = {
      id: id,
      title: str_(row.title, id),
      category: str_(row.category, ''),
      resultTitle: str_(row.resultTitle, ''),
      resultText: str_(row.resultText, ''),
      log: str_(row.log, ''),
      stats: json_(row.statsJson, {}),
      note: str_(row.note, '')
    };
  });
  return { actions: actions };
}

function buildAchievementsData_() {
  const achievements = rows_('achievements').map(row => ({
    id: str_(row.id),
    title: str_(row.title, str_(row.id)),
    kind: str_(row.kind, 'achievement'),
    description: str_(row.description, ''),
    lockedHint: str_(row.lockedHint, ''),
    condition: json_(row.conditionJson, null),
    rewardText: str_(row.rewardText, ''),
    note: str_(row.note, '')
  })).filter(a => a.id);
  return { achievements: achievements };
}

function buildHiddenData_() {
  const hiddenSpots = rows_('hidden_spots').map(row => addCommon_({
    id: str_(row.id),
    mapId: str_(row.mapId),
    label: str_(row.label, str_(row.id)),
    x: num_(row.x), y: num_(row.y), w: num_(row.w, 8), h: num_(row.h, 8),
    range: num_(row.range, 12),
    title: str_(row.title, str_(row.label, '')),
    text: str_(row.text, ''),
    foundText: str_(row.foundText, ''),
    log: str_(row.log, ''),
    stats: json_(row.statsJson, {})
  }, row)).filter(h => h.id);
  return { hiddenSpots: hiddenSpots };
}

function buildLinkBoardsData_() {
  const linkBoards = {};
  rows_('link_boards').forEach(row => {
    const id = str_(row.id);
    if (!id) return;
    linkBoards[id] = addCommon_({
      id: id,
      title: str_(row.title, id),
      body: str_(row.body, ''),
      links: []
    }, row);
  });

  rows_('link_items').forEach(row => {
    const parentId = str_(row.parentId);
    if (!parentId || !linkBoards[parentId]) return;
    const item = addCommon_({
      id: str_(row.id),
      order: num_(row.order, 0),
      label: str_(row.label, str_(row.id)),
      type: str_(row.type, 'link'),
      url: str_(row.url, ''),
      targetId: str_(row.targetId, ''),
      note: str_(row.note, ''),
      enabled: bool_(row.enabled, true)
    }, row);
    linkBoards[parentId].links.push(item);
  });
  Object.keys(linkBoards).forEach(id => linkBoards[id].links.sort((a, b) => (a.order || 0) - (b.order || 0)));
  return { linkBoards: linkBoards };
}

function applyOptions_(dialoguesData, boardsData, menusData, linkBoardsData, hiddenData, npcsData, mapsData) {
  const optionRows = rows_('options');
  const hiddenById = {};
  hiddenData.hiddenSpots.forEach(h => hiddenById[h.id] = h);
  const npcById = {};
  npcsData.npcs.forEach(n => npcById[n.id] = n);
  const interactableById = {};
  Object.values(mapsData.maps).forEach(map => (map.interactables || []).forEach(i => interactableById[i.id] = i));

  optionRows.forEach(row => {
    const parentType = str_(row.parentType);
    const parentId = str_(row.parentId);
    if (!parentType || !parentId) return;
    const option = addCommon_({
      label: str_(row.label, '選択肢'),
      type: str_(row.type, 'close'),
      targetId: str_(row.targetId, ''),
      targetMapId: str_(row.targetMapId, ''),
      url: str_(row.url, ''),
      message: str_(row.message, ''),
      className: str_(row.className, ''),
      branches: json_(row.branchesJson, null),
      fallbackId: str_(row.fallbackId, '')
    }, row);
    const condition = json_(row.conditionJson, null);
    if (condition) option.visibleWhen = condition;

    let target = null;
    if (parentType === 'dialogue') target = dialoguesData.dialogues[parentId];
    if (parentType === 'confirm') target = dialoguesData.confirms[parentId];
    if (parentType === 'board') target = boardsData.boards[parentId];
    if (parentType === 'menu') target = menusData.menus[parentId];
    if (parentType === 'hidden') target = hiddenById[parentId];
    if (parentType === 'npc') target = npcById[parentId];
    if (parentType === 'interactable') target = interactableById[parentId];
    if (parentType === 'linkBoard') target = linkBoardsData.linkBoards[parentId];

    if (!target) return;
    if (!Array.isArray(target.options)) target.options = [];
    target.options.push(option);
  });
}
