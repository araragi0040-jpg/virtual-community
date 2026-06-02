const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const mapSelect = document.getElementById('mapSelect');
const layerSelect = document.getElementById('layerSelect');
const entityList = document.getElementById('entityList');
const outputBox = document.getElementById('outputBox');
const selectedEmpty = document.getElementById('selectedEmpty');
const editForm = document.getElementById('editForm');
const helpText = document.getElementById('helpText');
const validationBox = document.getElementById('validationBox');

const contentEditor = document.getElementById('contentEditor');
const contentHelp = document.getElementById('contentHelp');
const contentKind = document.getElementById('contentKind');
const contentForm = document.getElementById('contentForm');
const contentFields = {
  id: document.getElementById('contentId'),
  title: document.getElementById('contentTitle'),
  body: document.getElementById('contentBody'),
  linkLabel: document.getElementById('contentLinkLabel'),
  linkUrl: document.getElementById('contentLinkUrl'),
  json: document.getElementById('contentJson'),
  titleLabel: document.getElementById('contentTitleLabel'),
  bodyLabel: document.getElementById('contentBodyLabel'),
  linkLabelLabel: document.getElementById('contentLinkLabelLabel'),
  linkUrlLabel: document.getElementById('contentLinkUrlLabel'),
  jsonLabel: document.getElementById('contentJsonLabel')
};

const choiceEditor = {
  panel: document.getElementById('choiceEditor'),
  list: document.getElementById('choiceList'),
  addButton: document.getElementById('addChoiceButton')
};

const targetMetaEditor = {
  panel: document.getElementById('targetMetaEditor'),
  visibleDays: document.getElementById('targetVisibleDays'),
  condition: document.getElementById('targetCondition')
};

const CHOICE_TYPES = [
  { value: 'close', label: '会話を閉じる' },
  { value: 'dialogue', label: '別の会話へ進む' },
  { value: 'conditionalDialogue', label: '条件で会話を分岐' },
  { value: 'board', label: '掲示板を開く' },
  { value: 'menu', label: 'メニューを開く' },
  { value: 'linkBoard', label: 'リンク集を開く' },
  { value: 'link', label: '外部URLを開く' },
  { value: 'action', label: '店内アクションを実行' },
  { value: 'memo', label: '体験メモを開く' },
  { value: 'achievements', label: '実績を開く' },
  { value: 'info', label: '案内メッセージを出す' },
  { value: 'map', label: 'マップ移動' },
  { value: 'resetExperience', label: '体験メモをリセット' }
];

const DAY_OPTIONS = [
  { value: 'all', label: '全曜日' },
  { value: 'mon', label: '月' },
  { value: 'tue', label: '火' },
  { value: 'wed', label: '水' },
  { value: 'thu', label: '木' },
  { value: 'fri', label: '金' },
  { value: 'sat', label: '土' },
  { value: 'sun', label: '日' }
];

const CHOICE_CONDITION_TYPES = [
  { value: 'none', label: '条件なし' },
  { value: 'statAtLeast', label: '体験値が一定以上' },
  { value: 'totalAtLeast', label: '合計体験値が一定以上' },
  { value: 'actionAtLeast', label: '特定アクション回数以上' },
  { value: 'visitedMap', label: '特定マップ訪問済み' },
  { value: 'hiddenFound', label: '隠し要素発見済み' },
  { value: 'hiddenCountAtLeast', label: '隠し要素発見数以上' },
  { value: 'achievementUnlocked', label: '実績開放済み' },
  { value: 'dayIs', label: '特定曜日' },
  { value: 'customJson', label: '詳細JSON条件' }
];

const fields = {
  id: document.getElementById('fieldId'),
  label: document.getElementById('fieldLabel'),
  x: document.getElementById('fieldX'),
  y: document.getElementById('fieldY'),
  w: document.getElementById('fieldW'),
  h: document.getElementById('fieldH'),
  range: document.getElementById('fieldRange'),
  type: document.getElementById('fieldType'),
  target: document.getElementById('fieldTarget')
};

const buttons = {
  undo: document.getElementById('undoButton'),
  redo: document.getElementById('redoButton'),
  saveDraft: document.getElementById('saveDraftButton'),
  loadDraft: document.getElementById('loadDraftButton'),
  clearDraft: document.getElementById('clearDraftButton'),
  preview: document.getElementById('previewButton'),
  addEntity: document.getElementById('addEntityButton'),
  duplicateEntity: document.getElementById('duplicateEntityButton'),
  deleteEntity: document.getElementById('deleteEntityButton'),
  copySelected: document.getElementById('copySelectedButton'),
  downloadMaps: document.getElementById('downloadMapsButton'),
  downloadNpcs: document.getElementById('downloadNpcsButton'),
  downloadHidden: document.getElementById('downloadHiddenButton'),
  downloadDialogues: document.getElementById('downloadDialoguesButton'),
  downloadBoards: document.getElementById('downloadBoardsButton'),
  downloadMenus: document.getElementById('downloadMenusButton'),
  downloadLinkBoards: document.getElementById('downloadLinkBoardsButton'),
  normalizeData: document.getElementById('normalizeDataButton'),
  validateProject: document.getElementById('validateProjectButton'),
  exportBackup: document.getElementById('exportBackupButton'),
  importBackup: document.getElementById('importBackupButton'),
  importBackupInput: document.getElementById('importBackupInput'),
  downloadProject: document.getElementById('downloadProjectButton'),
  exportTsv: document.getElementById('exportTsvButton'),
  exportCsv: document.getElementById('exportCsvButton'),
  previewSheets: document.getElementById('previewSheetsButton'),
  gasSettings: document.getElementById('gasSettingsButton'),
  gasTest: document.getElementById('gasTestButton'),
  loadGas: document.getElementById('loadGasButton'),
  compareGas: document.getElementById('compareGasButton'),
  gasBackup: document.getElementById('gasBackupButton'),
  gasBackupList: document.getElementById('gasBackupListButton'),
  gasBackupLoad: document.getElementById('gasBackupLoadButton'),
  gasBackupLatest: document.getElementById('gasBackupLatestButton'),
  applyContent: document.getElementById('applyContentButton'),
  copyContent: document.getElementById('copyContentButton')
};

const editorOptions = {
  showGrid: document.getElementById('showGridToggle'),
  snap: document.getElementById('snapToggle'),
  gridSize: document.getElementById('gridSizeSelect'),
  showBlocks: document.getElementById('showBlocksToggle'),
  showInteractables: document.getElementById('showInteractablesToggle'),
  showNpcs: document.getElementById('showNpcsToggle'),
  showHidden: document.getElementById('showHiddenToggle'),
  showTransitions: document.getElementById('showTransitionsToggle'),
  lockBlocks: document.getElementById('lockBlocksToggle'),
  lockInteractables: document.getElementById('lockInteractablesToggle'),
  lockNpcs: document.getElementById('lockNpcsToggle'),
  lockHidden: document.getElementById('lockHiddenToggle')
};


const statusEls = {
  badge: document.getElementById('statusBadge'),
  currentSource: document.getElementById('statusCurrentSource'),
  currentDetail: document.getElementById('statusCurrentDetail'),
  draftState: document.getElementById('statusDraftState'),
  draftDetail: document.getElementById('statusDraftDetail'),
  gasBackupState: document.getElementById('statusGasBackupState'),
  gasBackupDetail: document.getElementById('statusGasBackupDetail'),
  lastAction: document.getElementById('statusLastAction'),
  lastActionDetail: document.getElementById('statusLastActionDetail')
};

const state = {
  mapsData: null,
  npcsData: null,
  hiddenData: null,
  dialoguesData: null,
  boardsData: null,
  menusData: null,
  linkBoardsData: null,
  actionsData: null,
  achievementsData: null,
  images: new Map(),
  mapId: '',
  layer: 'interactables',
  selectedKey: '',
  drag: null,
  history: [],
  future: [],
  formHistoryArmed: false,
  showGrid: true,
  snapToGrid: false,
  gridSize: 5,
  visibility: { blocks: true, interactables: true, npcs: true, hidden: true, transitions: true },
  locks: { blocks: false, interactables: false, npcs: false, hidden: false },
  dataSource: 'local',
  gasUrl: '',
  gasLastLoadedAt: '',
  currentLoadedAt: '',
  currentLoadLabel: '未読込'
};

const HANDLE_SIZE_PCT = 2.2;
const MIN_RECT_SIZE_PCT = 1.0;
const RESIZE_CURSORS = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize'
};

const DRAFT_KEY = 'vc4u_editor_draft_v034';
const PREVIEW_FLAG_KEY = 'vc4u_use_editor_draft_v034';
const LEGACY_DRAFT_KEY = 'vc4u_editor_draft_v033';
const LEGACY_DRAFT_KEY_V031 = 'vc4u_editor_draft_v031';
const LEGACY_DRAFT_KEY_V029 = 'vc4u_editor_draft_v029';
const LEGACY_PREVIEW_FLAG_KEY = 'vc4u_use_editor_draft_v033';
const LEGACY_PREVIEW_FLAG_KEY_V031 = 'vc4u_use_editor_draft_v031';
const LEGACY_PREVIEW_FLAG_KEY_V029 = 'vc4u_use_editor_draft_v029';
const DATA_SOURCE_KEY = 'vc4u_data_source_v034';
const GAS_URL_KEY = 'vc4u_gas_api_url_v036';
const LEGACY_DATA_SOURCE_KEY = 'vc4u_data_source_v032';
const LEGACY_DATA_SOURCE_KEY_V031 = 'vc4u_data_source_v031';
const LEGACY_GAS_URL_KEY = 'vc4u_gas_api_url_v032';
const LEGACY_GAS_URL_KEY_V031 = 'vc4u_gas_api_url_v031';
const GAS_TIMEOUT_MS = 12000;
const HISTORY_LIMIT = 60;
const DRAFT_META_KEY = 'vc4u_editor_draft_meta_v036';
const GAS_BACKUP_META_KEY = 'vc4u_gas_backup_meta_v036';
const LAST_ACTION_META_KEY = 'vc4u_editor_last_action_v036';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function snapshotData() {
  return {
    mapsData: deepClone(state.mapsData),
    npcsData: deepClone(state.npcsData),
    hiddenData: deepClone(state.hiddenData),
    dialoguesData: deepClone(state.dialoguesData),
    boardsData: deepClone(state.boardsData),
    menusData: deepClone(state.menusData),
    linkBoardsData: deepClone(state.linkBoardsData),
    actionsData: deepClone(state.actionsData),
    achievementsData: deepClone(state.achievementsData),
    mapId: state.mapId,
    layer: state.layer,
    selectedKey: state.selectedKey
  };
}

function restoreSnapshot(snap) {
  if (!snap) return;
  state.mapsData = deepClone(snap.mapsData);
  state.npcsData = deepClone(snap.npcsData);
  state.hiddenData = deepClone(snap.hiddenData);
  state.dialoguesData = deepClone(snap.dialoguesData || state.dialoguesData);
  state.boardsData = deepClone(snap.boardsData || state.boardsData);
  state.menusData = deepClone(snap.menusData || state.menusData);
  state.linkBoardsData = deepClone(snap.linkBoardsData || state.linkBoardsData);
  state.actionsData = deepClone(snap.actionsData || state.actionsData);
  state.achievementsData = deepClone(snap.achievementsData || state.achievementsData);
  state.mapId = snap.mapId || state.mapId;
  state.layer = snap.layer || state.layer;
  state.selectedKey = snap.selectedKey || '';
  mapSelect.value = state.mapId;
  layerSelect.value = state.layer;
  renderAll();
  updateHistoryButtons();
}

function pushHistory() {
  if (!state.mapsData || !state.npcsData || !state.hiddenData || !state.dialoguesData || !state.boardsData || !state.menusData) return;
  state.history.push(snapshotData());
  if (state.history.length > HISTORY_LIMIT) state.history.shift();
  state.future = [];
  updateHistoryButtons();
}

function undo() {
  if (!state.history.length) return;
  state.future.push(snapshotData());
  const snap = state.history.pop();
  restoreSnapshot(snap);
  helpText.textContent = '1つ前の状態に戻しました。';
}

function redo() {
  if (!state.future.length) return;
  state.history.push(snapshotData());
  const snap = state.future.pop();
  restoreSnapshot(snap);
  helpText.textContent = 'やり直しました。';
}

function updateHistoryButtons() {
  if (buttons.undo) buttons.undo.disabled = !state.history.length;
  if (buttons.redo) buttons.redo.disabled = !state.future.length;
  updateEntityButtons();
}

function updateEntityButtons() {
  const locked = isLayerLocked();
  const hasSelected = !!selectedEntity();
  if (buttons.addEntity) buttons.addEntity.disabled = locked || !currentMap();
  if (buttons.duplicateEntity) buttons.duplicateEntity.disabled = locked || !hasSelected;
  if (buttons.deleteEntity) buttons.deleteEntity.disabled = locked || !hasSelected;
  if (buttons.copySelected) buttons.copySelected.disabled = !currentMap();
}


function formatLocalTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ja-JP', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  } catch (_) {
    return String(iso);
  }
}

function summaryText(bundle) {
  try {
    const s = summarizeBundle(bundle || makeDraft());
    return `maps ${s.maps} / npc ${s.npcs} / dialogues ${s.dialogues} / boards ${s.boards}`;
  } catch (_) {
    return '件数未取得';
  }
}

function readJsonStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function writeJsonStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

function setStatusBadge(text, kind = 'neutral') {
  if (!statusEls.badge) return;
  statusEls.badge.textContent = text;
  statusEls.badge.className = `status-badge ${kind}`;
}

function setLastAction(title, detail = '', kind = 'ok') {
  const savedAt = new Date().toISOString();
  const meta = { title, detail, kind, savedAt };
  writeJsonStorage(LAST_ACTION_META_KEY, meta);
  if (statusEls.lastAction) statusEls.lastAction.textContent = title;
  if (statusEls.lastActionDetail) statusEls.lastActionDetail.textContent = `${detail}${detail ? ' / ' : ''}${formatLocalTime(savedAt)}`;
  setStatusBadge(kind === 'error' ? 'エラー' : kind === 'warn' ? '確認' : 'OK', kind);
}

function writeDraftMeta(summary) {
  writeJsonStorage(DRAFT_META_KEY, { savedAt: new Date().toISOString(), summary });
}

function clearDraftMeta() {
  localStorage.removeItem(DRAFT_META_KEY);
}

function writeGasBackupMeta(meta) {
  writeJsonStorage(GAS_BACKUP_META_KEY, { ...meta, savedAt: new Date().toISOString() });
}

function updateStatusPanel() {
  const bundle = (() => { try { return makeDraft(); } catch (_) { return null; } })();
  const loadedAt = state.currentLoadedAt || '';
  const sourceLabel = state.currentLoadLabel || state.dataSource || 'Local';
  if (statusEls.currentSource) statusEls.currentSource.textContent = sourceLabel;
  if (statusEls.currentDetail) statusEls.currentDetail.textContent = `${summaryText(bundle)}${loadedAt ? ' / ' + formatLocalTime(loadedAt) : ''}`;

  const draftMeta = readJsonStorage(DRAFT_META_KEY);
  const hasDraft = !!(localStorage.getItem(DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY_V031) || localStorage.getItem(LEGACY_DRAFT_KEY_V029));
  if (statusEls.draftState) statusEls.draftState.textContent = hasDraft ? '保存済み' : '未保存';
  if (statusEls.draftDetail) statusEls.draftDetail.textContent = hasDraft
    ? `${draftMeta?.summary || '下書きあり'}${draftMeta?.savedAt ? ' / ' + formatLocalTime(draftMeta.savedAt) : ''}`
    : '「下書き保存」でゲーム確認用データを保存します。';

  const gasMeta = readJsonStorage(GAS_BACKUP_META_KEY);
  if (statusEls.gasBackupState) statusEls.gasBackupState.textContent = gasMeta ? (gasMeta.backupId || '保存/読込あり') : '未確認';
  if (statusEls.gasBackupDetail) statusEls.gasBackupDetail.textContent = gasMeta
    ? `${gasMeta.action || ''}${gasMeta.label ? ' / ' + gasMeta.label : ''}${gasMeta.savedAt ? ' / ' + formatLocalTime(gasMeta.savedAt) : ''}`
    : 'GASバックアップ操作後に表示します。';

  const lastMeta = readJsonStorage(LAST_ACTION_META_KEY);
  if (lastMeta) {
    if (statusEls.lastAction) statusEls.lastAction.textContent = lastMeta.title || 'なし';
    if (statusEls.lastActionDetail) statusEls.lastActionDetail.textContent = `${lastMeta.detail || ''}${lastMeta.savedAt ? ' / ' + formatLocalTime(lastMeta.savedAt) : ''}`;
    setStatusBadge(lastMeta.kind === 'error' ? 'エラー' : lastMeta.kind === 'warn' ? '確認' : 'OK', lastMeta.kind || 'ok');
  }
}

function markCurrentData(label, bundle) {
  state.currentLoadLabel = label;
  state.currentLoadedAt = new Date().toISOString();
  updateStatusPanel();
}

function makeDraft() {
  return {
    version: 'v036',
    savedAt: new Date().toISOString(),
    mapsData: state.mapsData,
    npcsData: state.npcsData,
    hiddenData: state.hiddenData,
    dialoguesData: state.dialoguesData,
    boardsData: state.boardsData,
    menusData: state.menusData,
    linkBoardsData: state.linkBoardsData,
    actionsData: state.actionsData,
    achievementsData: state.achievementsData
  };
}

function saveDraft() {
  try {
    const draft = makeDraft();
    if (!isValidProjectBundle(draft)) { helpText.textContent = '下書き保存を中止しました。マップデータが空です。GAS読み込み結果やスプシの maps シートを確認してください。'; return; }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    writeDraftMeta(summaryText(draft));
    helpText.textContent = '下書きをこのブラウザに保存しました。「ゲームで確認」でこの配置を反映できます。';
    setLastAction('下書き保存OK', summaryText(draft), 'ok');
    updateStatusPanel();
  } catch (err) {
    helpText.textContent = '下書き保存に失敗しました。ブラウザ容量やプライベートモードを確認してください。';
    setLastAction('下書き保存失敗', 'ブラウザ容量やプライベートモードを確認してください。', 'error');
    updateStatusPanel();
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY_V029) || localStorage.getItem(LEGACY_DRAFT_KEY_V031);
    if (!raw) { helpText.textContent = '保存済みの下書きがありません。'; return; }
    pushHistory();
    const draft = JSON.parse(raw);
    if (!isValidProjectBundle(draft)) { helpText.textContent = '保存済み下書きのマップデータが空のため、読み込みを中止しました。'; return; }
    state.mapsData = draft.mapsData || state.mapsData;
    state.npcsData = draft.npcsData || state.npcsData;
    state.hiddenData = draft.hiddenData || state.hiddenData;
    state.dialoguesData = draft.dialoguesData || state.dialoguesData;
    state.boardsData = draft.boardsData || state.boardsData;
    state.menusData = draft.menusData || state.menusData;
    state.linkBoardsData = draft.linkBoardsData || state.linkBoardsData;
    state.selectedKey = '';
    renderAll();
    markCurrentData('Draft', makeDraft());
    helpText.textContent = '保存済みの下書きを読み込みました。';
    setLastAction('下書き読込OK', summaryText(makeDraft()), 'ok');
    updateStatusPanel();
  } catch (err) {
    helpText.textContent = '下書きの読み込みに失敗しました。';
    setLastAction('下書き読込失敗', '', 'error');
    updateStatusPanel();
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(PREVIEW_FLAG_KEY);
  localStorage.removeItem(LEGACY_DRAFT_KEY);
  localStorage.removeItem(LEGACY_DRAFT_KEY_V031);
  localStorage.removeItem(LEGACY_PREVIEW_FLAG_KEY);
  localStorage.removeItem(LEGACY_PREVIEW_FLAG_KEY_V031);
  clearDraftMeta();
  helpText.textContent = '下書きとゲーム確認用フラグを削除しました。';
  setLastAction('下書き削除', 'ゲーム確認用フラグも削除しました。', 'warn');
  updateStatusPanel();
}

function previewGame() {
  if (!isValidProjectBundle(makeDraft())) { helpText.textContent = 'ゲーム確認を中止しました。マップデータが空です。'; return; }
  saveDraft();
  localStorage.setItem(PREVIEW_FLAG_KEY, '1');
  localStorage.setItem(LEGACY_PREVIEW_FLAG_KEY, '1');
  localStorage.setItem(LEGACY_PREVIEW_FLAG_KEY_V031, '1');
  setLastAction('ゲーム確認へ移動', '下書きデータを使用します。', 'ok');
  updateStatusPanel();
  window.location.href = 'index.html?preview=1';
}


function pctToPx(v) { return (v / 100) * canvas.width; }
function pxToPct(v) { return (v / canvas.width) * 100; }
function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, Number(v) || 0)); }
function snapValue(v) {
  if (!state.snapToGrid) return Number(v);
  const step = Number(state.gridSize) || 5;
  return Math.round(Number(v) / step) * step;
}
function snapPoint(p) {
  return { x: clamp(snapValue(p.x)), y: clamp(snapValue(p.y)) };
}
function maybeSnapRect(item) {
  if (!state.snapToGrid || !item) return;
  item.x = Number(clamp(snapValue(item.x), 0, 100 - (Number(item.w) || 0)).toFixed(1));
  item.y = Number(clamp(snapValue(item.y), 0, 100 - (Number(item.h) || 0)).toFixed(1));
  if ('w' in item) item.w = Number(clamp(snapValue(item.w), MIN_RECT_SIZE_PCT, 100 - item.x).toFixed(1));
  if ('h' in item) item.h = Number(clamp(snapValue(item.h), MIN_RECT_SIZE_PCT, 100 - item.y).toFixed(1));
}
function currentMap() { return state.mapsData.maps[state.mapId]; }

async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} を読み込めませんでした`);
  return res.json();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (state.images.has(src)) return resolve(state.images.get(src));
    const img = new Image();
    img.onload = () => { state.images.set(src, img); resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

function getStoredGasUrl() {
  return localStorage.getItem(GAS_URL_KEY) || localStorage.getItem('vc4u_gas_api_url_v035') || localStorage.getItem('vc4u_gas_api_url_v034') || localStorage.getItem('vc4u_gas_api_url_v033') || localStorage.getItem(LEGACY_GAS_URL_KEY) || localStorage.getItem(LEGACY_GAS_URL_KEY_V031) || localStorage.getItem('vc4u_gas_api_url_v030') || '';
}

function saveStoredGasUrl(url) {
  localStorage.setItem(GAS_URL_KEY, url || '');
  localStorage.setItem('vc4u_gas_api_url_v035', url || '');
  localStorage.setItem('vc4u_gas_api_url_v034', url || '');
  localStorage.setItem('vc4u_gas_api_url_v033', url || '');
  // ゲーム側v030との互換用。v034以降はGAS_URL_KEYを優先する。
  localStorage.setItem(LEGACY_GAS_URL_KEY, url || '');
  localStorage.setItem(LEGACY_GAS_URL_KEY_V031, url || '');
  localStorage.setItem('vc4u_gas_api_url_v030', url || '');
}

function saveDataSource(source) {
  localStorage.setItem(DATA_SOURCE_KEY, source || 'local');
  localStorage.setItem(LEGACY_DATA_SOURCE_KEY, source || 'local');
  localStorage.setItem(LEGACY_DATA_SOURCE_KEY_V031, source || 'local');
  localStorage.setItem('vc4u_data_source_v030', source || 'local');
}

async function fetchJsonWithTimeout(url, timeoutMs = GAS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function postJsonWithTimeout(url, payload, timeoutMs = GAS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload || {})
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function gasUrlWithMode(baseUrl, mode) {
  return gasUrlWithParams(baseUrl, { mode });
}

function gasUrlWithParams(baseUrl, params = {}) {
  const url = new URL(baseUrl, window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  url.searchParams.set('t', String(Date.now()));
  return url.toString();
}



function bundleMapCount(bundle) {
  return Object.keys(bundle?.mapsData?.maps || {}).length;
}

function isValidProjectBundle(bundle) {
  return !!(bundle && bundle.mapsData && bundle.mapsData.maps && bundleMapCount(bundle) > 0);
}

function bundleSummary(bundle) {
  const maps = bundle?.mapsData?.maps || {};
  return {
    maps: Object.keys(maps).length,
    interactables: Object.values(maps).reduce((n, m) => n + ((m.interactables || []).length), 0),
    blocks: Object.values(maps).reduce((n, m) => n + ((m.blocks || []).length), 0),
    npcs: (bundle?.npcsData?.npcs || []).length,
    hidden: (bundle?.hiddenData?.hiddenSpots || []).length,
    dialogues: Object.keys(bundle?.dialoguesData?.dialogues || {}).length,
    boards: Object.keys(bundle?.boardsData?.boards || {}).length,
    menus: Object.keys(bundle?.menusData?.menus || {}).length,
    linkBoards: Object.keys(bundle?.linkBoardsData?.linkBoards || {}).length
  };
}

function assertValidBundle(bundle, label = 'データ') {
  if (!isValidProjectBundle(bundle)) {
    const s = bundleSummary(bundle);
    throw new Error(`${label}のマップデータが空です。maps=${s.maps}, npcs=${s.npcs}, dialogues=${s.dialogues}。スプレッドシートの maps シートにヘッダーとデータ行があるか確認してください。`);
  }
}

async function loadGasDataBundle(gasUrl) {
  if (!gasUrl) throw new Error('GAS WebアプリURLが未設定です。');
  const json = await fetchJsonWithTimeout(gasUrlWithMode(gasUrl, 'project'));
  if (!json || json.ok === false) throw new Error(json?.error || 'GAS APIのレスポンスが不正です。');
  const data = json.data || json;
  if (!data.mapsData && data.maps && data.npcs) {
    return {
      mapsData: { initialMapId: data.initialMapId || 'outside_4u', maps: data.maps },
      npcsData: { npcs: data.npcs || [] },
      dialoguesData: { dialogues: data.dialogues || {}, confirms: data.confirms || {} },
      boardsData: { boards: data.boards || {} },
      menusData: { menus: data.menus || {} },
      actionsData: { actions: data.actions || {} },
      achievementsData: { achievements: data.achievements || [] },
      hiddenData: { hiddenSpots: data.hiddenSpots || [] },
      linkBoardsData: { linkBoards: data.linkBoards || {} }
    };
  }
  assertValidBundle(data, 'GAS');
  return data;
}

async function loadLocalDataBundle() {
  const [mapsData, npcsData, hiddenData, dialoguesData, boardsData, menusData, linkBoardsData, actionsData, achievementsData] = await Promise.all([
    loadJson('data/maps.json'),
    loadJson('data/npcs.json'),
    loadJson('data/hidden.json'),
    loadJson('data/dialogues.json'),
    loadJson('data/boards.json'),
    loadJson('data/menus.json'),
    loadJson('data/linkBoards.json'),
    loadJson('data/actions.json').catch(() => ({ actions: {} })),
    loadJson('data/achievements.json').catch(() => ({ achievements: [] }))
  ]);
  return { mapsData, npcsData, hiddenData, dialoguesData, boardsData, menusData, linkBoardsData, actionsData, achievementsData };
}

function applyBundleToEditor(bundle, sourceLabel = 'local') {
  assertValidBundle(bundle, sourceLabel === 'gas' ? 'GAS' : '読み込み');
  state.mapsData = bundle.mapsData || { initialMapId: 'outside_4u', maps: {} };
  state.npcsData = bundle.npcsData || { npcs: [] };
  state.hiddenData = bundle.hiddenData || { hiddenSpots: [] };
  state.dialoguesData = bundle.dialoguesData || { dialogues: {}, confirms: {} };
  state.boardsData = bundle.boardsData || { boards: {} };
  state.menusData = bundle.menusData || { menus: {} };
  state.linkBoardsData = bundle.linkBoardsData || { linkBoards: {} };
  state.actionsData = bundle.actionsData || { actions: {} };
  state.achievementsData = bundle.achievementsData || { achievements: [] };
  state.dataSource = sourceLabel;
  state.gasUrl = getStoredGasUrl();
}

async function rebuildMapSelectAndImages() {
  mapSelect.innerHTML = '';
  state.images.clear();
  const maps = state.mapsData?.maps || {};
  for (const map of Object.values(maps)) {
    try { if (map.image) await loadImage(map.image); } catch (err) { console.warn('画像読み込み失敗:', map.image, err); }
    const option = document.createElement('option');
    option.value = map.id;
    option.textContent = map.name || map.id;
    mapSelect.appendChild(option);
  }
  if (!state.mapId || !maps[state.mapId]) state.mapId = state.mapsData.initialMapId || Object.keys(maps)[0] || '';
  mapSelect.value = state.mapId;
}

function openGasSettings() {
  const current = getStoredGasUrl();
  const url = window.prompt('GAS WebアプリURLを入力してください。\nゲーム画面のデータ設定と同じURLを使えます。', current);
  if (url === null) return;
  saveStoredGasUrl(url.trim());
  state.gasUrl = url.trim();
  helpText.textContent = state.gasUrl ? 'GAS URLを保存しました。必要なら「GAS接続テスト」または「GASから読込」を押してください。' : 'GAS URLを空にしました。';
  setLastAction(state.gasUrl ? 'GAS URL保存' : 'GAS URL削除', state.gasUrl ? 'URL設定済み' : 'URL未設定', state.gasUrl ? 'ok' : 'warn');
  updateStatusPanel();
}

async function testGasConnection() {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) { helpText.textContent = 'GAS URLが未設定です。「GAS URL設定」から登録してください。'; return; }
  helpText.textContent = 'GAS接続テスト中...';
  try {
    const json = await fetchJsonWithTimeout(gasUrlWithMode(gasUrl, 'ping'), 8000);
    if (!json || json.ok === false) throw new Error(json?.error || 'pingの応答が不正です。');
    helpText.textContent = `GAS接続OK：${json.message || 'ready'} / ${json.generatedAt || ''}`;
    setLastAction('GAS接続OK', json.generatedAt || '', 'ok');
    updateStatusPanel();
  } catch (err) {
    helpText.textContent = `GAS接続に失敗しました：${err.message || err}`;
    setLastAction('GAS接続失敗', err.message || String(err), 'error');
    updateStatusPanel();
  }
}

async function loadFromGasIntoEditor() {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) { helpText.textContent = 'GAS URLが未設定です。「GAS URL設定」から登録してください。'; return; }
  if (state.mapsData) pushHistory();
  helpText.textContent = 'GASからデータを読み込み中...';
  try {
    const bundle = await loadGasDataBundle(gasUrl);
    applyBundleToEditor(bundle, 'gas');
    saveDataSource('gas');
    state.selectedKey = '';
    await rebuildMapSelectAndImages();
    normalizeAllData({ silent: true });
    renderAll();
    validateProject();
    state.gasLastLoadedAt = new Date().toISOString();
    markCurrentData('GAS', makeDraft());
    const s = bundleSummary(bundle);
    helpText.textContent = `GASからデータを読み込みました。maps=${s.maps}, npcs=${s.npcs}, dialogues=${s.dialogues}。編集内容はまだスプシには保存されません。必要なら「下書き保存」してください。`;
    setLastAction('GAS読込OK', `maps=${s.maps}, npcs=${s.npcs}, dialogues=${s.dialogues}`, 'ok');
    updateStatusPanel();
  } catch (err) {
    helpText.textContent = `GAS読み込みに失敗しました：${err.message || err}`;
    setLastAction('GAS読込失敗', err.message || String(err), 'error');
    updateStatusPanel();
    console.error(err);
  }
}

function summarizeBundle(bundle) {
  const maps = bundle.mapsData?.maps || {};
  return {
    maps: Object.keys(maps).length,
    interactables: Object.values(maps).reduce((n, m) => n + ((m.interactables || []).length), 0),
    blocks: Object.values(maps).reduce((n, m) => n + ((m.blocks || []).length), 0),
    npcs: (bundle.npcsData?.npcs || []).length,
    hidden: (bundle.hiddenData?.hiddenSpots || []).length,
    dialogues: Object.keys(bundle.dialoguesData?.dialogues || {}).length,
    confirms: Object.keys(bundle.dialoguesData?.confirms || {}).length,
    boards: Object.keys(bundle.boardsData?.boards || {}).length,
    menus: Object.keys(bundle.menusData?.menus || {}).length,
    linkBoards: Object.keys(bundle.linkBoardsData?.linkBoards || {}).length,
    actions: Object.keys(bundle.actionsData?.actions || {}).length,
    achievements: (bundle.achievementsData?.achievements || []).length
  };
}

async function compareGasWithCurrent() {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) { helpText.textContent = 'GAS URLが未設定です。「GAS URL設定」から登録してください。'; return; }
  helpText.textContent = 'GAS差分確認中...';
  try {
    const gasBundle = await loadGasDataBundle(gasUrl);
    const current = summarizeBundle(makeDraft());
    const gas = summarizeBundle(gasBundle);
    const keys = Array.from(new Set([...Object.keys(current), ...Object.keys(gas)]));
    const lines = ['【現在のエディタ】	【GAS】	【差】'];
    keys.forEach(key => lines.push(`${key}	${current[key] || 0}	${gas[key] || 0}	${(gas[key] || 0) - (current[key] || 0)}`));
    outputBox.value = lines.join('\n');
    helpText.textContent = 'GAS差分サマリーを出力プレビューに表示しました。件数差が0でも本文差分までは見ていません。';
  } catch (err) {
    helpText.textContent = `GAS差分確認に失敗しました：${err.message || err}`;
  }
}


async function saveGasBackup() {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) { helpText.textContent = 'GAS URLが未設定です。「GAS URL設定」から登録してください。'; return; }
  let label = window.prompt('GASへ保存するバックアップ名を入力してください。', `editor-backup-${new Date().toISOString().slice(0, 19)}`);
  if (label === null) return;
  label = label.trim() || 'editor-backup';
  const bundle = makeDraft();
  try { assertValidBundle(bundle, 'バックアップ対象'); } catch (err) { helpText.textContent = `GASバックアップ保存を中止しました：${err.message || err}`; return; }
  const summary = summarizeBundle(bundle);
  helpText.textContent = 'GASへバックアップ保存中...';
  try {
    const json = await postJsonWithTimeout(gasUrlWithMode(gasUrl, 'backupProject'), {
      mode: 'backupProject',
      label,
      source: 'editor-v036',
      summary,
      data: bundle
    }, 20000);
    if (!json || json.ok === false) throw new Error(json?.error || 'GASバックアップ保存の応答が不正です。');
    outputBox.value = JSON.stringify(json, null, 2);
    writeGasBackupMeta({ action: '保存OK', backupId: json.backupId || '', label, chunkCount: json.chunkCount || 1 });
    helpText.textContent = `GASバックアップ保存OK：${json.backupId || ''} / chunks=${json.chunkCount || 1}`;
    setLastAction('GASバックアップ保存OK', `${json.backupId || ''} / chunks=${json.chunkCount || 1}`, 'ok');
    updateStatusPanel();
  } catch (err) {
    helpText.textContent = `GASバックアップ保存に失敗しました：${err.message || err}`;
    setLastAction('GASバックアップ保存失敗', err.message || String(err), 'error');
    updateStatusPanel();
    console.error(err);
  }
}

async function listGasBackups() {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) { helpText.textContent = 'GAS URLが未設定です。「GAS URL設定」から登録してください。'; return; }
  helpText.textContent = 'GASバックアップ一覧を取得中...';
  try {
    const json = await fetchJsonWithTimeout(gasUrlWithMode(gasUrl, 'backups'), 12000);
    if (!json || json.ok === false) throw new Error(json?.error || 'GASバックアップ一覧の応答が不正です。');
    const backups = json.backups || [];
    const lines = ['createdAt\tbackupId\tlabel\tsource\tchunks\tsummary'];
    backups.forEach(b => lines.push(`${b.createdAt || ''}\t${b.backupId || ''}\t${b.label || ''}\t${b.source || ''}\t${b.chunkCount || ''}\t${JSON.stringify(b.summary || {})}`));
    outputBox.value = lines.join('\n');
    helpText.textContent = `GASバックアップ一覧を取得しました：${backups.length}件。読込する場合は backupId をコピーして「GASバックアップ読込」を押してください。`;
    setLastAction('GASバックアップ一覧OK', `${backups.length}件`, 'ok');
    updateStatusPanel();
  } catch (err) {
    helpText.textContent = `GASバックアップ一覧の取得に失敗しました：${err.message || err}`;
    setLastAction('GASバックアップ一覧失敗', err.message || String(err), 'error');
    updateStatusPanel();
    console.error(err);
  }
}

function applyGasBackupBundle(bundle, message) {
  assertValidBundle(bundle, 'GASバックアップ');
  pushHistory();
  applyBundleToEditor(bundle, 'gas-backup');
  normalizeAllData({ silent: true });
  renderAll();
  markCurrentData('GAS Backup', makeDraft());
  outputBox.value = JSON.stringify({ message, summary: summarizeBundle(makeDraft()) }, null, 2);
  helpText.textContent = message;
  setLastAction('GASバックアップ読込OK', summaryText(makeDraft()), 'ok');
  updateStatusPanel();
}

async function loadGasBackupById() {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) { helpText.textContent = 'GAS URLが未設定です。「GAS URL設定」から登録してください。'; return; }
  const backupId = window.prompt('読み込むGASバックアップの backupId を入力してください。\n「GASバックアップ一覧」で表示される bk_... のIDです。', '');
  if (!backupId) return;
  helpText.textContent = 'GASバックアップを読み込み中...';
  try {
    const json = await fetchJsonWithTimeout(gasUrlWithParams(gasUrl, { mode: 'backup', backupId: backupId.trim() }), 20000);
    if (!json || json.ok === false) throw new Error(json?.error || 'GASバックアップ読込の応答が不正です。');
    const bundle = json.data || json.project || json.bundle;
    writeGasBackupMeta({ action: '読込OK', backupId: json.backupId || backupId.trim(), label: json.label || '' });
    applyGasBackupBundle(bundle, `GASバックアップを読み込みました：${json.backupId || backupId.trim()}。必要なら「下書き保存」→「ゲームで確認」を押してください。`);
  } catch (err) {
    helpText.textContent = `GASバックアップ読込に失敗しました：${err.message || err}`;
    setLastAction('GASバックアップ読込失敗', err.message || String(err), 'error');
    updateStatusPanel();
    console.error(err);
  }
}

async function loadLatestGasBackup() {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) { helpText.textContent = 'GAS URLが未設定です。「GAS URL設定」から登録してください。'; return; }
  if (!window.confirm('最新のGASバックアップをエディタへ読み込みます。現在の未保存編集は上書きされます。続けますか？')) return;
  helpText.textContent = '最新GASバックアップを読み込み中...';
  try {
    const json = await fetchJsonWithTimeout(gasUrlWithParams(gasUrl, { mode: 'backup', latest: '1' }), 20000);
    if (!json || json.ok === false) throw new Error(json?.error || '最新GASバックアップ読込の応答が不正です。');
    const bundle = json.data || json.project || json.bundle;
    writeGasBackupMeta({ action: '最新読込OK', backupId: json.backupId || '', label: json.label || '' });
    applyGasBackupBundle(bundle, `最新GASバックアップを読み込みました：${json.backupId || ''}。必要なら「下書き保存」→「ゲームで確認」を押してください。`);
  } catch (err) {
    helpText.textContent = `最新GASバックアップ読込に失敗しました：${err.message || err}`;
    setLastAction('最新GASバックアップ読込失敗', err.message || String(err), 'error');
    updateStatusPanel();
    console.error(err);
  }
}


async function boot() {
  const bundle = await loadLocalDataBundle();
  applyBundleToEditor(bundle, 'local');
  markCurrentData('Local', bundle);
  state.gasUrl = getStoredGasUrl();
  state.mapId = state.mapsData.initialMapId;
  await rebuildMapSelectAndImages();

  updateHistoryButtons();
  const missingButtons = Object.entries(buttons).filter(([, el]) => !el).map(([key]) => key);
  if (missingButtons.length) {
    helpText.textContent = `編集ボタンの読み込みに失敗しました: ${missingButtons.join(', ')}`;
    console.warn('Missing editor buttons:', missingButtons);
  }
  const hasDraft = !!(localStorage.getItem(DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY_V031) || localStorage.getItem(LEGACY_DRAFT_KEY_V029));
  if (hasDraft) helpText.textContent = '保存済みの下書きがあります。必要なら「下書き読込」を押してください。';
  if (state.gasUrl && !hasDraft) helpText.textContent = 'GAS URLが設定済みです。「GAS接続テスト」または「GASから読込」を押せます。';
  renderAll();
  updateStatusPanel();
}

function entities() {
  const map = currentMap();
  if (!map) return [];
  if (state.layer === 'interactables') {
    return (map.interactables || []).map(item => ({ key: item.id, type: item.type || 'object', ref: item, shape: 'rect' }));
  }
  if (state.layer === 'npcs') {
    return (state.npcsData.npcs || [])
      .filter(npc => npc.mapId === state.mapId)
      .map(item => ({ key: item.id, type: 'npc', ref: item, shape: 'point' }));
  }
  if (state.layer === 'hidden') {
    return (state.hiddenData.hiddenSpots || [])
      .filter(spot => spot.mapId === state.mapId)
      .map(item => ({ key: item.id, type: 'hidden', ref: item, shape: 'rect' }));
  }
  if (state.layer === 'blocks') {
    return (map.blocks || [])
      .map(item => ({ key: item.id, type: 'block', ref: item, shape: 'rect' }));
  }
  return [];
}

function selectedEntity() {
  return entities().find(e => e.key === state.selectedKey) || null;
}

function colorFor(type) {
  return {
    door: '#69b6ff', exit: '#69b6ff', board: '#8fffe7', sign: '#ffb45a',
    menu: '#d995ff', event: '#ff7ac8', npc: '#fff36d', hidden: '#ffe65a', block: '#ff6464'
  }[type] || '#ffffff';
}


function getEntityType(e) {
  if (!e) return '';
  if (e.shape === 'point' && e.type === 'npc') return 'npc';
  if (e.type === 'hidden') return 'hidden';
  return e.ref.type || e.type || '';
}

function isLayerLocked(layer = state.layer) {
  return !!state.locks[layer];
}

function currentLayerName() {
  return {
    interactables: '入口・掲示板・看板・メニュー',
    npcs: 'NPC',
    hidden: '隠し要素',
    blocks: '通行不可ブロック'
  }[state.layer] || state.layer;
}

function showLockHelp() {
  helpText.textContent = `${currentLayerName()}レイヤーは固定中です。表示はできますが、選択・移動・追加・削除はできません。固定を外すと編集できます。`;
}

function getEntityTarget(e) {
  if (!e) return '';
  const item = e.ref;
  if (e.type === 'npc') return item.dialogueId || '';
  if (e.type === 'hidden') return item.title || '';
  if (e.type === 'block') return '';
  const type = item.type || e.type;
  if (type === 'board') return item.boardId || '';
  if (type === 'sign') return item.signId || '';
  if (type === 'menu') return item.menuId || '';
  if (type === 'event') return item.dialogueId || '';
  if (type === 'door') return item.confirmId || '';
  if (type === 'exit') return item.targetMapId || '';
  return '';
}

function setEntityTarget(e, value) {
  if (!e) return;
  const item = e.ref;
  const v = String(value || '').trim();
  if (e.type === 'npc') {
    item.dialogueId = v || item.dialogueId || 'talk_town_01';
    return;
  }
  if (e.type === 'hidden') {
    if (v) item.title = v;
    return;
  }
  if (e.type === 'block') return;
  const type = item.type || e.type;
  if (type === 'board') item.boardId = v || 'board_town_news';
  if (type === 'sign') item.signId = v || 'sign_to_branch';
  if (type === 'menu') item.menuId = v || 'menu_4u';
  if (type === 'event') item.dialogueId = v || 'event_4u_friday_lively';
  if (type === 'door') item.confirmId = v || 'enter_4u';
  if (type === 'exit') item.targetMapId = v || 'outside_4u';
}

function uniqueId(prefix, existingIds) {
  const safe = (prefix || 'item').replace(/[^a-zA-Z0-9_\-]/g, '_');
  let n = 1;
  let id = `${safe}_${n}`;
  while (existingIds.has(id)) {
    n += 1;
    id = `${safe}_${n}`;
  }
  return id;
}

function allEntityIds() {
  const ids = new Set();
  Object.values(state.mapsData?.maps || {}).forEach(map => {
    (map.interactables || []).forEach(item => ids.add(item.id));
    (map.blocks || []).forEach(item => ids.add(item.id));
  });
  (state.npcsData?.npcs || []).forEach(item => ids.add(item.id));
  (state.hiddenData?.hiddenSpots || []).forEach(item => ids.add(item.id));
  return ids;
}

function makeNewEntityForCurrentLayer() {
  const ids = allEntityIds();
  const map = currentMap();
  if (state.layer === 'interactables') {
    const type = 'board';
    return {
      id: uniqueId(`${type}_${state.mapId}`, ids),
      type,
      label: '新しい掲示板',
      x: 42,
      y: 58,
      w: 16,
      h: 12,
      boardId: 'board_town_news',
      range: 13
    };
  }
  if (state.layer === 'npcs') {
    return {
      id: uniqueId(`npc_${state.mapId}`, ids),
      name: '新しいNPC',
      mapId: state.mapId,
      x: 50,
      y: 58,
      sprite: 'assets/characters/npc_town_01.png',
      dialogueId: 'talk_town_01',
      visibleDays: ['all'],
      range: 14
    };
  }
  if (state.layer === 'hidden') {
    return {
      id: uniqueId(`hidden_${state.mapId}`, ids),
      mapId: state.mapId,
      label: '新しい隠し要素',
      x: 42,
      y: 58,
      w: 16,
      h: 12,
      range: 12,
      visibleDays: ['all'],
      visibleWhen: null,
      title: '新しい隠し要素',
      text: 'ここに隠し要素の本文を設定します。',
      foundText: 'もう一度確認しました。',
      log: '新しい隠し要素を見つけた',
      stats: { event: 1 }
    };
  }
  if (state.layer === 'blocks') {
    return {
      id: uniqueId(`block_${state.mapId}`, ids),
      type: 'block',
      label: '新しい通行不可ブロック',
      x: 38,
      y: 42,
      w: 18,
      h: 14
    };
  }
  return null;
}

function addEntity() {
  if (isLayerLocked()) { showLockHelp(); return; }
  if (!currentMap()) return;
  const item = makeNewEntityForCurrentLayer();
  if (!item) return;
  pushHistory();
  if (state.layer === 'interactables') currentMap().interactables = [ ...(currentMap().interactables || []), item ];
  if (state.layer === 'npcs') state.npcsData.npcs = [ ...(state.npcsData.npcs || []), item ];
  if (state.layer === 'hidden') state.hiddenData.hiddenSpots = [ ...(state.hiddenData.hiddenSpots || []), item ];
  if (state.layer === 'blocks') currentMap().blocks = [ ...(currentMap().blocks || []), item ];
  state.selectedKey = item.id;
  helpText.textContent = '新しい対象を追加しました。位置・範囲・種類を調整してください。';
  renderAll();
}

function duplicateSelected() {
  if (isLayerLocked()) { showLockHelp(); return; }
  const e = selectedEntity();
  if (!e) return;
  pushHistory();
  const item = deepClone(e.ref);
  item.id = uniqueId(`${e.key}_copy`, allEntityIds());
  item.x = Number(clamp((Number(item.x) || 0) + 4, 0, e.shape === 'point' ? 100 : 100 - (Number(item.w) || 0)).toFixed(1));
  item.y = Number(clamp((Number(item.y) || 0) + 4, 0, e.shape === 'point' ? 100 : 100 - (Number(item.h) || 0)).toFixed(1));
  if (state.layer === 'interactables') currentMap().interactables.push(item);
  if (state.layer === 'npcs') state.npcsData.npcs.push(item);
  if (state.layer === 'hidden') state.hiddenData.hiddenSpots.push(item);
  if (state.layer === 'blocks') { currentMap().blocks = currentMap().blocks || []; currentMap().blocks.push(item); }
  state.selectedKey = item.id;
  helpText.textContent = '選択中の対象を複製しました。';
  renderAll();
}

function deleteSelected() {
  if (isLayerLocked()) { showLockHelp(); return; }
  const e = selectedEntity();
  if (!e) return;
  const label = e.ref.label || e.ref.name || e.key;
  if (!window.confirm(`「${label}」を削除しますか？`)) return;
  pushHistory();
  if (state.layer === 'interactables') currentMap().interactables = (currentMap().interactables || []).filter(item => item.id !== e.key);
  if (state.layer === 'npcs') state.npcsData.npcs = (state.npcsData.npcs || []).filter(item => item.id !== e.key);
  if (state.layer === 'hidden') state.hiddenData.hiddenSpots = (state.hiddenData.hiddenSpots || []).filter(item => item.id !== e.key);
  if (state.layer === 'blocks') currentMap().blocks = (currentMap().blocks || []).filter(item => item.id !== e.key);
  state.selectedKey = '';
  helpText.textContent = '選択中の対象を削除しました。Undoで戻せます。';
  renderAll();
}

function applyInteractableTypeDefaults(item, newType) {
  if (!item || !newType || item.type === newType) return;
  item.type = newType;
  delete item.boardId;
  delete item.signId;
  delete item.menuId;
  delete item.dialogueId;
  delete item.confirmId;
  delete item.targetMapId;
  delete item.spawn;
  if (newType === 'board') item.boardId = 'board_town_news';
  if (newType === 'sign') item.signId = 'sign_to_branch';
  if (newType === 'menu') item.menuId = 'menu_4u';
  if (newType === 'event') item.dialogueId = 'event_4u_friday_lively';
  if (newType === 'door') {
    item.confirmId = 'enter_4u';
    item.targetMapId = 'room_4u';
    item.spawn = { x: 50, y: 86, dir: 'back' };
  }
  if (newType === 'exit') {
    item.targetMapId = 'outside_4u';
    item.spawn = { x: 50, y: 72, dir: 'front' };
  }
}

function rectHandles(item) {
  const x = Number(item.x) || 0;
  const y = Number(item.y) || 0;
  const w = Number(item.w) || 0;
  const h = Number(item.h) || 0;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return [
    { name: 'nw', x, y },
    { name: 'n', x: cx, y },
    { name: 'ne', x: x + w, y },
    { name: 'e', x: x + w, y: cy },
    { name: 'se', x: x + w, y: y + h },
    { name: 's', x: cx, y: y + h },
    { name: 'sw', x, y: y + h },
    { name: 'w', x, y: cy }
  ];
}

function handleAt(p, e = selectedEntity()) {
  if (!e || e.shape === 'point') return null;
  const item = e.ref;
  const half = HANDLE_SIZE_PCT / 2;
  return rectHandles(item).find(h => (
    p.x >= h.x - half && p.x <= h.x + half &&
    p.y >= h.y - half && p.y <= h.y + half
  )) || null;
}

function drawResizeHandles(e) {
  if (!e || e.shape === 'point') return;
  const item = e.ref;
  ctx.save();
  const size = pctToPx(HANDLE_SIZE_PCT);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1a120b';
  ctx.fillStyle = '#ffffff';
  for (const h of rectHandles(item)) {
    const px = pctToPx(h.x) - size / 2;
    const py = pctToPx(h.y) - size / 2;
    ctx.fillRect(px, py, size, size);
    ctx.strokeRect(px, py, size, size);
  }
  ctx.restore();
}

function drawMap() {
  const map = currentMap();
  const img = state.images.get(map.image);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  if (!state.showGrid) return;
  const step = Number(state.gridSize) || 5;

  const drawLineSet = ({ minorColor, majorColor, minorWidth, majorWidth }) => {
    for (let v = step; v < 100; v += step) {
      const isMajor = Math.abs(v % 10) < 0.001 || Math.abs((v % 10) - 10) < 0.001;
      const px = pctToPx(v);
      ctx.lineWidth = isMajor ? majorWidth : minorWidth;
      ctx.strokeStyle = isMajor ? majorColor : minorColor;

      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, px);
      ctx.lineTo(canvas.width, px);
      ctx.stroke();
    }
  };

  ctx.save();
  ctx.lineCap = 'butt';

  // v021: グリッドを見やすくするため、暗めの主線＋薄い明線の二重線に変更。
  // 明るい外マップでも、暗めの店内マップでも見えるようにする。
  drawLineSet({
    minorColor: 'rgba(18, 12, 8, .50)',
    majorColor: 'rgba(18, 12, 8, .68)',
    minorWidth: 1.25,
    majorWidth: 2
  });
  drawLineSet({
    minorColor: 'rgba(255, 246, 210, .28)',
    majorColor: 'rgba(255, 218, 94, .62)',
    minorWidth: .7,
    majorWidth: 1.15
  });

  ctx.restore();
}

function isEntityVisible(e) {
  if (!e) return true;
  if (e.type === 'block') return state.visibility.blocks;
  if (e.type === 'npc') return state.visibility.npcs;
  if (e.type === 'hidden') return state.visibility.hidden;
  return state.visibility.interactables;
}

function drawAllOverlays() {
  const map = currentMap();
  ctx.save();
  ctx.lineWidth = 3;

  // 通行不可ブロックは、どのレイヤーでも薄い赤で表示可能
  if (state.visibility.blocks) (map.blocks || []).forEach(block => {
    const isSelected = state.layer === 'blocks' && block.id === state.selectedKey;
    ctx.fillStyle = isSelected ? 'rgba(255,100,100,.34)' : 'rgba(255,80,80,.16)';
    ctx.strokeStyle = isSelected ? 'rgba(255,245,245,.95)' : 'rgba(255,100,100,.48)';
    ctx.lineWidth = isSelected ? 5 : 2;
    ctx.fillRect(pctToPx(block.x), pctToPx(block.y), pctToPx(block.w), pctToPx(block.h));
    ctx.strokeRect(pctToPx(block.x), pctToPx(block.y), pctToPx(block.w), pctToPx(block.h));
    if (state.layer !== 'blocks') drawLabel(block.label || block.id, block.x, block.y - 1, false);
  });

  // マップ遷移範囲
  if (state.visibility.transitions) (map.transitions || []).forEach(t => {
    const [a, b] = t.range || [0, 100];
    ctx.fillStyle = 'rgba(255, 100, 100, 0.24)';
    if (t.edge === 'right') ctx.fillRect(pctToPx(96), pctToPx(a), pctToPx(4), pctToPx(b - a));
    if (t.edge === 'left') ctx.fillRect(0, pctToPx(a), pctToPx(4), pctToPx(b - a));
    if (t.edge === 'bottom') ctx.fillRect(pctToPx(a), pctToPx(96), pctToPx(b - a), pctToPx(4));
    if (t.edge === 'top') ctx.fillRect(pctToPx(a), 0, pctToPx(b - a), pctToPx(4));
  });

  for (const e of entities().filter(isEntityVisible)) {
    const item = e.ref;
    const selected = e.key === state.selectedKey;
    ctx.strokeStyle = colorFor(e.type);
    ctx.fillStyle = selected ? 'rgba(134,211,106,.30)' : 'rgba(0,0,0,.12)';
    ctx.lineWidth = selected ? 5 : 3;
    if (e.shape === 'point') {
      const x = pctToPx(item.x), y = pctToPx(item.y);
      const r = pctToPx((item.range || 12) / 2);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = colorFor(e.type);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(e.key, item.x + 2, item.y - 2, selected);
    } else {
      ctx.fillRect(pctToPx(item.x), pctToPx(item.y), pctToPx(item.w), pctToPx(item.h));
      ctx.strokeRect(pctToPx(item.x), pctToPx(item.y), pctToPx(item.w), pctToPx(item.h));
      drawLabel(e.key, item.x, item.y - 1, selected);
      if (selected) drawResizeHandles(e);
    }
  }
  ctx.restore();
}

function drawLabel(text, xPct, yPct, selected) {
  ctx.save();
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = selected ? '#ffffff' : '#fff2b5';
  ctx.strokeStyle = 'rgba(0,0,0,.72)';
  ctx.lineWidth = 4;
  ctx.strokeText(text, pctToPx(xPct), pctToPx(yPct));
  ctx.fillText(text, pctToPx(xPct), pctToPx(yPct));
  ctx.restore();
}

function renderList() {
  entityList.innerHTML = '';
  const list = entities();
  if (!list.length) {
    entityList.innerHTML = '<p class="help-text">このマップには対象データがありません。</p>';
    return;
  }
  const locked = isLayerLocked();
  if (locked) {
    const notice = document.createElement('div');
    notice.className = 'lock-notice';
    notice.textContent = `${currentLayerName()}レイヤーは固定中です。固定を外すと選択・編集できます。`;
    entityList.appendChild(notice);
  }
  list.forEach(e => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'entity-item' + (e.key === state.selectedKey ? ' active' : '') + (locked ? ' locked' : '');
    btn.textContent = `${e.ref.label || e.ref.name || e.key}｜${e.key}`;
    btn.disabled = locked;
    btn.addEventListener('click', () => { if (!locked) selectEntity(e.key); });
    entityList.appendChild(btn);
  });
}

function renderForm() {
  const e = selectedEntity();
  if (!e) {
    selectedEmpty.classList.remove('hidden');
    editForm.classList.add('hidden');
    outputBox.value = JSON.stringify(currentMap(), null, 2);
    return;
  }
  const item = e.ref;
  selectedEmpty.classList.add('hidden');
  editForm.classList.remove('hidden');
  fields.id.value = e.key;
  fields.label.value = item.label || item.name || '';
  fields.x.value = item.x ?? '';
  fields.y.value = item.y ?? '';
  fields.w.value = item.w ?? '';
  fields.h.value = item.h ?? '';
  fields.range.value = item.range ?? '';
  fields.type.value = getEntityType(e);
  fields.target.value = getEntityTarget(e);
  const locked = isLayerLocked();
  fields.label.disabled = locked;
  fields.x.disabled = locked;
  fields.y.disabled = locked;
  fields.w.disabled = locked || e.shape === 'point';
  fields.h.disabled = locked || e.shape === 'point';
  fields.range.disabled = locked || e.type === 'block';
  fields.type.disabled = locked || e.type === 'npc' || e.type === 'hidden' || e.type === 'block';
  fields.target.disabled = locked || e.type === 'hidden' || e.type === 'block';
  outputBox.value = JSON.stringify(item, null, 2);
  updateEntityButtons();
}


function getSelectedContentTarget() {
  const e = selectedEntity();
  if (!e) return null;
  const item = e.ref;

  function fallback(kind = 'entity') {
    return { kind, id: item.id || e.key, data: item, owner: item, linked: false };
  }

  if (e.type === 'npc') {
    const id = item.dialogueId;
    if (id && state.dialoguesData?.dialogues?.[id]) return { kind: 'dialogue', id, data: state.dialoguesData.dialogues[id], owner: item, linked: true };
    return fallback('npc');
  }
  if (e.type === 'hidden') {
    return { kind: 'hidden', id: item.id, data: item, owner: item, linked: false };
  }
  if (e.type === 'block') {
    return fallback('block');
  }

  const type = item.type || e.type;
  if (type === 'board') {
    const id = item.boardId;
    if (id && state.boardsData?.boards?.[id]) return { kind: 'board', id, data: state.boardsData.boards[id], owner: item, linked: true };
    return fallback('boardObject');
  }
  if (type === 'menu') {
    const id = item.menuId;
    if (id && state.menusData?.menus?.[id]) return { kind: 'menu', id, data: state.menusData.menus[id], owner: item, linked: true };
    return fallback('menuObject');
  }
  if (type === 'sign' || type === 'event') {
    const id = item.signId || item.dialogueId;
    if (id && state.dialoguesData?.dialogues?.[id]) return { kind: 'dialogue', id, data: state.dialoguesData.dialogues[id], owner: item, linked: true };
    return fallback(type === 'sign' ? 'signObject' : 'eventObject');
  }
  if (type === 'door') {
    const id = item.confirmId;
    if (id && state.dialoguesData?.confirms?.[id]) return { kind: 'confirm', id, data: state.dialoguesData.confirms[id], owner: item, linked: true };
    return fallback('doorObject');
  }
  if (type === 'exit') {
    return fallback('exitObject');
  }
  return fallback('entity');
}

function setContentPanelVisibility(show) {
  if (!contentEditor) return;
  contentEditor.classList.toggle('hidden', !show);
}

function setContentControlsDisabled(disabled) {
  Object.values(contentFields).forEach(el => {
    if (el && 'disabled' in el) el.disabled = !!disabled;
  });
  choiceEditor.panel?.querySelectorAll('input, select, textarea, button').forEach(el => { el.disabled = !!disabled; });
  targetMetaEditor.panel?.querySelectorAll('input, select, textarea, button').forEach(el => { el.disabled = !!disabled; });
  if (buttons.applyContent) buttons.applyContent.disabled = !!disabled;
  if (buttons.copyContent) buttons.copyContent.disabled = !!disabled;
}

function hideContentRow(el, hidden) {
  if (!el) return;
  el.classList.toggle('hidden', !!hidden);
}


function setChoiceEditorVisibility(show) {
  if (!choiceEditor.panel) return;
  choiceEditor.panel.classList.toggle('hidden', !show);
}

function choiceTypeLabel(type) {
  return CHOICE_TYPES.find(t => t.value === type)?.label || type || '未設定';
}

function normalizeChoiceList(data, fallback = []) {
  const raw = Array.isArray(data?.options) ? data.options : (Array.isArray(data?.choices) ? data.choices : fallback);
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw.map(choice => ({
    ...(choice && typeof choice === 'object' ? choice : {}),
    label: String(choice?.label || '閉じる'),
    type: String(choice?.type || 'close')
  }));
}

function normalizeDialogueOptions(data) {
  return normalizeChoiceList(data, [{ label: '閉じる', type: 'close' }]);
}

function makeChoiceInput(labelText, className, value = '', placeholder = '') {
  const label = document.createElement('label');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.className = className;
  input.value = value || '';
  if (placeholder) input.placeholder = placeholder;
  label.appendChild(input);
  return label;
}

function makeChoiceTypeSelect(value = 'close') {
  const label = document.createElement('label');
  label.textContent = '動作タイプ';
  const select = document.createElement('select');
  select.className = 'choice-type';
  CHOICE_TYPES.forEach(item => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    if (item.value === value) option.selected = true;
    select.appendChild(option);
  });
  label.appendChild(select);
  return label;
}

function choiceMainTarget(choice) {
  if (choice.type === 'map') return choice.targetMapId || choice.targetId || '';
  return choice.targetId || choice.targetMapId || '';
}


function normalizeVisibleDaysForChoice(choice) {
  const days = Array.isArray(choice?.visibleDays) ? choice.visibleDays.filter(Boolean) : ['all'];
  if (!days.length || days.includes('all')) return ['all'];
  return days;
}

function makeVisibleDaysEditor(days = ['all']) {
  const wrap = document.createElement('div');
  wrap.className = 'choice-days-box';
  const title = document.createElement('div');
  title.className = 'choice-subtitle';
  title.textContent = '表示曜日';
  const checks = document.createElement('div');
  checks.className = 'choice-day-checks';
  const normalized = normalizeVisibleDaysForChoice({ visibleDays: days });
  DAY_OPTIONS.forEach(day => {
    const label = document.createElement('label');
    label.className = 'choice-day-check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'choice-visible-day';
    input.dataset.day = day.value;
    input.checked = normalized.includes('all') ? day.value === 'all' : normalized.includes(day.value);
    input.addEventListener('change', () => {
      const all = checks.querySelector('input[data-day="all"]');
      if (input.dataset.day === 'all' && input.checked) {
        checks.querySelectorAll('input.choice-visible-day').forEach(cb => { if (cb !== input) cb.checked = false; });
      }
      if (input.dataset.day !== 'all' && input.checked && all) all.checked = false;
      const anySpecific = [...checks.querySelectorAll('input.choice-visible-day')].some(cb => cb.dataset.day !== 'all' && cb.checked);
      if (!anySpecific && all) all.checked = true;
    });
    label.append(input, document.createTextNode(day.label));
    checks.appendChild(label);
  });
  wrap.append(title, checks);
  return wrap;
}

function conditionToEditorFields(condition) {
  if (!condition) return { type: 'none', key: '', value: '', json: '' };
  const type = condition.type;
  if (!type || condition.all || condition.any || condition.not) {
    return { type: 'customJson', key: '', value: '', json: JSON.stringify(condition, null, 2) };
  }
  switch (type) {
    case 'statAtLeast':
      return { type, key: condition.stat || '', value: condition.value ?? '', json: '' };
    case 'totalAtLeast':
      return { type, key: '', value: condition.value ?? '', json: '' };
    case 'actionAtLeast':
      return { type, key: condition.actionId || '', value: condition.value ?? '', json: '' };
    case 'visitedMap':
      return { type, key: condition.mapId || '', value: '', json: '' };
    case 'hiddenFound':
      return { type, key: condition.hiddenId || '', value: '', json: '' };
    case 'hiddenCountAtLeast':
      return { type, key: '', value: condition.value ?? '', json: '' };
    case 'achievementUnlocked':
      return { type, key: condition.achievementId || '', value: '', json: '' };
    case 'dayIs':
      return { type, key: condition.day || '', value: '', json: '' };
    default:
      return { type: 'customJson', key: '', value: '', json: JSON.stringify(condition, null, 2) };
  }
}

function makeChoiceConditionEditor(condition) {
  const fields = conditionToEditorFields(condition);
  const wrap = document.createElement('div');
  wrap.className = 'choice-condition-box';
  const title = document.createElement('div');
  title.className = 'choice-subtitle';
  title.textContent = '表示条件';

  const grid = document.createElement('div');
  grid.className = 'choice-grid-3';

  const typeLabel = document.createElement('label');
  typeLabel.textContent = '条件タイプ';
  const typeSelect = document.createElement('select');
  typeSelect.className = 'choice-condition-type';
  CHOICE_CONDITION_TYPES.forEach(item => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    if (item.value === fields.type) option.selected = true;
    typeSelect.appendChild(option);
  });
  typeLabel.appendChild(typeSelect);

  const keyLabel = makeChoiceInput('条件キー', 'choice-condition-key', fields.key, '例：talk / action_4u_drink / mapId');
  const valueLabel = makeChoiceInput('条件値', 'choice-condition-value', fields.value, '例：3');
  grid.append(typeLabel, keyLabel, valueLabel);

  const jsonLabel = document.createElement('label');
  jsonLabel.textContent = '詳細条件JSON';
  const textarea = document.createElement('textarea');
  textarea.className = 'choice-condition-json';
  textarea.rows = 3;
  textarea.placeholder = '{ "type": "statAtLeast", "stat": "talk", "value": 3 }';
  textarea.value = fields.json;
  jsonLabel.appendChild(textarea);

  const hint = document.createElement('p');
  hint.className = 'small-note choice-condition-hint';
  hint.textContent = '通常は条件タイプ・条件キー・条件値だけでOKです。複雑な条件は「詳細JSON条件」を選んで入力します。';

  function refresh() {
    const isNone = typeSelect.value === 'none';
    const isCustom = typeSelect.value === 'customJson';
    keyLabel.classList.toggle('hidden', isNone || isCustom || ['totalAtLeast', 'hiddenCountAtLeast'].includes(typeSelect.value));
    valueLabel.classList.toggle('hidden', isNone || isCustom || ['visitedMap', 'hiddenFound', 'achievementUnlocked', 'dayIs'].includes(typeSelect.value));
    jsonLabel.classList.toggle('hidden', !isCustom);
    hint.classList.toggle('hidden', isNone);
  }
  typeSelect.addEventListener('change', refresh);
  refresh();

  wrap.append(title, grid, jsonLabel, hint);
  return wrap;
}

function readChoiceVisibleDays(row) {
  const checks = [...row.querySelectorAll('.choice-visible-day')].filter(cb => cb.checked).map(cb => cb.dataset.day);
  if (!checks.length || checks.includes('all')) return ['all'];
  return checks;
}

function readChoiceCondition(row) {
  const type = row.querySelector('.choice-condition-type')?.value || 'none';
  const key = row.querySelector('.choice-condition-key')?.value.trim() || '';
  const rawValue = row.querySelector('.choice-condition-value')?.value.trim() || '';
  const value = rawValue === '' ? undefined : (Number.isNaN(Number(rawValue)) ? rawValue : Number(rawValue));
  const json = row.querySelector('.choice-condition-json')?.value.trim() || '';
  if (type === 'none') return null;
  if (type === 'customJson') {
    if (!json) return null;
    return JSON.parse(json);
  }
  if (type === 'statAtLeast') return { type, stat: key, value: value ?? 0 };
  if (type === 'totalAtLeast') return { type, value: value ?? 0 };
  if (type === 'actionAtLeast') return { type, actionId: key, value: value ?? 0 };
  if (type === 'visitedMap') return { type, mapId: key };
  if (type === 'hiddenFound') return { type, hiddenId: key };
  if (type === 'hiddenCountAtLeast') return { type, value: value ?? 0 };
  if (type === 'achievementUnlocked') return { type, achievementId: key };
  if (type === 'dayIs') return { type, day: key };
  return null;
}

function renderTargetMetaEditor(owner) {
  if (!targetMetaEditor.panel) return;
  targetMetaEditor.panel.classList.toggle('hidden', !owner);
  if (!owner) return;
  targetMetaEditor.visibleDays.innerHTML = '';
  targetMetaEditor.condition.innerHTML = '';
  targetMetaEditor.visibleDays.appendChild(makeVisibleDaysEditor(owner.visibleDays || ['all']));
  targetMetaEditor.condition.appendChild(makeChoiceConditionEditor(owner.visibleWhen || owner.condition || null));
}

function readVisibleDaysFromContainer(container) {
  const checks = [...container.querySelectorAll('.choice-visible-day')]
    .filter(cb => cb.checked)
    .map(cb => cb.dataset.day);
  if (!checks.length || checks.includes('all')) return ['all'];
  return checks;
}

function applyTargetMeta(owner) {
  if (!owner || !targetMetaEditor.panel) return;
  const visibleDays = readVisibleDaysFromContainer(targetMetaEditor.visibleDays);
  const condition = readChoiceCondition(targetMetaEditor.condition);
  delete owner.visibleDays;
  delete owner.visibleWhen;
  delete owner.condition;
  if (visibleDays.length && !visibleDays.includes('all')) owner.visibleDays = visibleDays;
  if (condition) owner.visibleWhen = condition;
}

function applyChoicesToData(data, choices) {
  if (!data || typeof data !== 'object') return;
  delete data.options;
  delete data.choices;
  if (Array.isArray(choices) && choices.length) data.options = choices;
}

function createChoiceRow(choice = {}, index = 0) {
  const normalized = {
    label: choice.label || '閉じる',
    type: choice.type || 'close',
    ...choice
  };
  const row = document.createElement('div');
  row.className = 'choice-row';
  row.__choiceOriginal = deepClone(normalized);

  const head = document.createElement('div');
  head.className = 'choice-row-head';
  const title = document.createElement('div');
  title.className = 'choice-row-title';
  title.textContent = `選択肢 ${index + 1}`;
  const actions = document.createElement('div');
  actions.className = 'choice-row-actions';

  const up = document.createElement('button');
  up.type = 'button';
  up.className = 'choice-mini-button';
  up.textContent = '↑';
  up.title = '上へ移動';
  up.addEventListener('click', () => {
    const prev = row.previousElementSibling;
    if (prev) choiceEditor.list.insertBefore(row, prev);
    updateChoiceRowTitles();
  });

  const down = document.createElement('button');
  down.type = 'button';
  down.className = 'choice-mini-button';
  down.textContent = '↓';
  down.title = '下へ移動';
  down.addEventListener('click', () => {
    const next = row.nextElementSibling;
    if (next) choiceEditor.list.insertBefore(next, row);
    updateChoiceRowTitles();
  });

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'choice-mini-button danger-button';
  del.textContent = '削除';
  del.addEventListener('click', () => {
    row.remove();
    updateChoiceRowTitles();
    if (!choiceEditor.list.children.length) showChoiceEmpty();
  });

  actions.append(up, down, del);
  head.append(title, actions);

  const fieldsWrap = document.createElement('div');
  fieldsWrap.className = 'choice-fields';
  const topGrid = document.createElement('div');
  topGrid.className = 'choice-grid-2';
  topGrid.append(
    makeChoiceInput('表示名', 'choice-label', normalized.label || '', '例：話す'),
    makeChoiceTypeSelect(normalized.type || 'close')
  );
  const midGrid = document.createElement('div');
  midGrid.className = 'choice-grid-2';
  midGrid.append(
    makeChoiceInput('対象ID / 移動先マップ', 'choice-target', choiceMainTarget(normalized), '例：talk_4u_inside_talk / menu_4u'),
    makeChoiceInput('URL', 'choice-url', normalized.url || '', '外部URLを開く場合')
  );
  const bottomGrid = document.createElement('div');
  bottomGrid.className = 'choice-grid-2';
  bottomGrid.append(
    makeChoiceInput('補足メッセージ', 'choice-message', normalized.message || '', '準備中などの案内文'),
    makeChoiceInput('見た目class', 'choice-className', normalized.className || '', 'link / secondary / achievement など')
  );
  const visibleDaysEditor = makeVisibleDaysEditor(normalized.visibleDays || ['all']);
  const conditionEditor = makeChoiceConditionEditor(normalized.visibleWhen || normalized.condition || null);
  fieldsWrap.append(topGrid, midGrid, bottomGrid, visibleDaysEditor, conditionEditor);
  row.append(head, fieldsWrap);
  row.querySelector('.choice-type')?.addEventListener('change', updateChoiceRowTitles);
  return row;
}

function showChoiceEmpty() {
  if (!choiceEditor.list) return;
  choiceEditor.list.innerHTML = '<div class="choice-empty">選択肢がありません。「＋選択肢」で追加できます。</div>';
}

function updateChoiceRowTitles() {
  if (!choiceEditor.list) return;
  const rows = [...choiceEditor.list.querySelectorAll('.choice-row')];
  rows.forEach((row, index) => {
    const title = row.querySelector('.choice-row-title');
    const type = row.querySelector('.choice-type')?.value || '';
    if (title) title.textContent = `選択肢 ${index + 1}｜${choiceTypeLabel(type)}`;
  });
}

function renderChoiceEditor(options = []) {
  if (!choiceEditor.list) return;
  choiceEditor.list.innerHTML = '';
  const rows = normalizeChoiceList({ options }, []);
  if (!rows.length) {
    showChoiceEmpty();
    return;
  }
  rows.forEach((choice, index) => choiceEditor.list.appendChild(createChoiceRow(choice, index)));
  updateChoiceRowTitles();
}

function addChoiceRow(choice = { label: '閉じる', type: 'close' }) {
  if (!choiceEditor.list) return;
  const empty = choiceEditor.list.querySelector('.choice-empty');
  if (empty) choiceEditor.list.innerHTML = '';
  choiceEditor.list.appendChild(createChoiceRow(choice, choiceEditor.list.querySelectorAll('.choice-row').length));
  updateChoiceRowTitles();
}

function readChoiceRows() {
  if (!choiceEditor.list) return [];
  const rows = [...choiceEditor.list.querySelectorAll('.choice-row')];
  if (!rows.length) return [];
  return rows.map(row => {
    const original = row.__choiceOriginal && typeof row.__choiceOriginal === 'object' ? deepClone(row.__choiceOriginal) : {};
    const type = row.querySelector('.choice-type')?.value || 'close';
    const label = row.querySelector('.choice-label')?.value.trim() || choiceTypeLabel(type);
    const target = row.querySelector('.choice-target')?.value.trim() || '';
    const url = row.querySelector('.choice-url')?.value.trim() || '';
    const message = row.querySelector('.choice-message')?.value.trim() || '';
    const className = row.querySelector('.choice-className')?.value.trim() || '';
    const visibleDays = readChoiceVisibleDays(row);
    const condition = readChoiceCondition(row);
    const choice = { ...original, label, type };
    delete choice.targetId;
    delete choice.targetMapId;
    delete choice.url;
    delete choice.message;
    delete choice.className;
    delete choice.visibleDays;
    delete choice.visibleWhen;
    delete choice.condition;
    if (target) {
      if (type === 'map') choice.targetMapId = target;
      else choice.targetId = target;
    }
    if (url) choice.url = url;
    if (message) choice.message = message;
    if (className) choice.className = className;
    if (visibleDays.length && !visibleDays.includes('all')) choice.visibleDays = visibleDays;
    if (condition) choice.condition = condition;
    return choice;
  });
}

function renderContentEditor() {
  const target = getSelectedContentTarget();
  if (!target) {
    setContentPanelVisibility(false);
    renderTargetMetaEditor(null);
    return;
  }
  setContentPanelVisibility(true);
  const locked = isLayerLocked();
  const data = target.data;
  const exists = !!data;
  const kindLabel = {
    dialogue: '会話データ',
    confirm: '入店確認データ',
    board: '掲示板データ',
    menu: 'メニューデータ',
    hidden: '隠し要素本文',
    npc: 'NPC本体データ',
    block: '通行不可ブロック',
    boardObject: '掲示板オブジェクト',
    menuObject: 'メニューオブジェクト',
    signObject: '看板オブジェクト',
    eventObject: 'イベントオブジェクト',
    doorObject: '扉オブジェクト',
    exitObject: '出口オブジェクト',
    entity: '対象データ'
  }[target.kind] || target.kind;

  contentKind.textContent = `${kindLabel}｜${target.id}${target.linked === false ? '（対象本体）' : ''}`;
  contentHelp.textContent = '選択中対象の本文・表示条件・選択肢を共通形式で編集できます。内容反映後に下書き保存→ゲームで確認してください。';

  contentFields.id.value = target.id || '';
  contentFields.title.value = '';
  contentFields.body.value = '';
  contentFields.linkLabel.value = '';
  contentFields.linkUrl.value = '';
  contentFields.json.value = '';
  hideContentRow(contentFields.linkLabelLabel, false);
  hideContentRow(contentFields.linkUrlLabel, false);
  hideContentRow(contentFields.jsonLabel, false);
  contentFields.titleLabel.firstChild.textContent = 'タイトル / 表示名';
  contentFields.bodyLabel.firstChild.textContent = '本文 / 説明';
  contentFields.linkLabelLabel.firstChild.textContent = 'リンクラベル / 補助項目';
  contentFields.linkUrlLabel.firstChild.textContent = 'URL / 補助項目';
  contentFields.jsonLabel.firstChild.textContent = '追加情報JSON';

  if (!exists) {
    setContentControlsDisabled(true);
    contentFields.id.disabled = false;
    return;
  }

  renderTargetMetaEditor(target.owner || data);

  if (target.kind === 'dialogue') {
    contentFields.titleLabel.firstChild.textContent = '話者';
    contentFields.bodyLabel.firstChild.textContent = 'セリフ本文';
    contentFields.title.value = data.speaker || '';
    contentFields.body.value = data.text || '';
    hideContentRow(contentFields.linkLabelLabel, true);
    hideContentRow(contentFields.linkUrlLabel, true);
    hideContentRow(contentFields.jsonLabel, true);
  } else if (target.kind === 'confirm') {
    contentFields.titleLabel.firstChild.textContent = '確認タイトル';
    contentFields.bodyLabel.firstChild.textContent = '確認本文';
    contentFields.linkLabelLabel.firstChild.textContent = 'YESボタン文言';
    contentFields.linkUrlLabel.firstChild.textContent = 'NOボタン文言';
    contentFields.title.value = data.title || '';
    contentFields.body.value = data.text || '';
    contentFields.linkLabel.value = data.yesLabel || '入る';
    contentFields.linkUrl.value = data.noLabel || 'やめる';
    hideContentRow(contentFields.jsonLabel, true);
  } else if (target.kind === 'board') {
    contentFields.titleLabel.firstChild.textContent = '掲示板タイトル';
    contentFields.bodyLabel.firstChild.textContent = '掲示板本文';
    contentFields.linkLabelLabel.firstChild.textContent = 'メインリンクボタン名';
    contentFields.linkUrlLabel.firstChild.textContent = 'メインリンクURL';
    contentFields.jsonLabel.firstChild.textContent = '曜日文言・リンク集IDなどJSON';
    contentFields.title.value = data.title || '';
    contentFields.body.value = data.body || '';
    contentFields.linkLabel.value = data.linkLabel || '';
    contentFields.linkUrl.value = data.linkUrl || '';
    contentFields.json.value = JSON.stringify({
      bodyByDay: data.bodyByDay || {},
      linkLabelByDay: data.linkLabelByDay || {},
      linkUrlByDay: data.linkUrlByDay || {},
      linkBoardId: data.linkBoardId || '',
      extraLinkLabel: data.extraLinkLabel || ''
    }, null, 2);
  } else if (target.kind === 'menu') {
    contentFields.titleLabel.firstChild.textContent = 'メニュータイトル';
    contentFields.bodyLabel.firstChild.textContent = 'メモ / 説明文';
    contentFields.linkLabelLabel.firstChild.textContent = 'アクション案内文';
    contentFields.jsonLabel.firstChild.textContent = 'メニュー項目・曜日別項目・actionIds JSON';
    contentFields.title.value = data.title || '';
    contentFields.body.value = data.note || '';
    contentFields.linkLabel.value = data.actionNote || '';
    contentFields.json.value = JSON.stringify({
      items: data.items || [],
      itemsByDay: data.itemsByDay || {},
      noteByDay: data.noteByDay || {},
      actionIds: data.actionIds || []
    }, null, 2);
    hideContentRow(contentFields.linkUrlLabel, true);
  } else if (target.kind === 'hidden') {
    contentFields.titleLabel.firstChild.textContent = '隠し要素タイトル';
    contentFields.bodyLabel.firstChild.textContent = '初回発見テキスト';
    contentFields.linkLabelLabel.firstChild.textContent = '再確認テキスト';
    contentFields.linkUrlLabel.firstChild.textContent = '体験メモに残す文';
    contentFields.jsonLabel.firstChild.textContent = 'stats JSON';
    contentFields.title.value = data.title || data.label || '';
    contentFields.body.value = data.text || '';
    contentFields.linkLabel.value = data.foundText || '';
    contentFields.linkUrl.value = data.log || '';
    contentFields.json.value = JSON.stringify({ stats: data.stats || {} }, null, 2);
  } else {
    contentFields.titleLabel.firstChild.textContent = '表示名';
    contentFields.bodyLabel.firstChild.textContent = '管理メモ / 説明';
    contentFields.linkLabelLabel.firstChild.textContent = '補助ラベル';
    contentFields.linkUrlLabel.firstChild.textContent = '補助URL / 対象ID';
    contentFields.jsonLabel.firstChild.textContent = '追加情報JSON';
    contentFields.title.value = data.label || data.name || data.title || '';
    contentFields.body.value = data.note || data.description || data.text || '';
    contentFields.linkLabel.value = data.linkLabel || '';
    contentFields.linkUrl.value = data.linkUrl || data.targetId || data.targetMapId || '';
    contentFields.json.value = JSON.stringify({
      actions: data.actions || [],
      stats: data.stats || {},
      custom: data.custom || {}
    }, null, 2);
  }

  renderChoiceEditor(data.options || data.choices || []);
  setChoiceEditorVisibility(true);
  setContentControlsDisabled(locked);
  contentFields.id.disabled = false;
}

function safeParseContentJson(fallback) {
  const raw = (contentFields.json?.value || '').trim();
  if (!raw) return fallback;
  try { return JSON.parse(raw); }
  catch (err) {
    helpText.textContent = `内容JSONの形式に誤りがあります: ${err.message}`;
    return undefined;
  }
}

function applyContentChanges() {
  const target = getSelectedContentTarget();
  if (!target || !target.data || isLayerLocked()) return;
  const extra = safeParseContentJson(null);
  if (extra === undefined) return;

  let choices = [];
  try {
    choices = readChoiceRows();
  } catch (err) {
    helpText.textContent = `選択肢の条件JSONに誤りがあります: ${err.message}`;
    return;
  }

  pushHistory();
  applyTargetMeta(target.owner || target.data);
  const data = target.data;

  if (target.kind === 'dialogue') {
    data.speaker = contentFields.title.value.trim() || data.speaker || '';
    data.text = contentFields.body.value;
  } else if (target.kind === 'confirm') {
    data.title = contentFields.title.value.trim() || data.title || '';
    data.text = contentFields.body.value;
    data.yesLabel = contentFields.linkLabel.value.trim() || '入る';
    data.noLabel = contentFields.linkUrl.value.trim() || 'やめる';
  } else if (target.kind === 'board') {
    data.title = contentFields.title.value.trim() || data.title || '';
    data.body = contentFields.body.value;
    data.linkLabel = contentFields.linkLabel.value.trim();
    data.linkUrl = contentFields.linkUrl.value.trim();
    if (extra && typeof extra === 'object') {
      data.bodyByDay = extra.bodyByDay || {};
      data.linkLabelByDay = extra.linkLabelByDay || {};
      data.linkUrlByDay = extra.linkUrlByDay || {};
      data.linkBoardId = extra.linkBoardId || '';
      data.extraLinkLabel = extra.extraLinkLabel || '';
    }
  } else if (target.kind === 'menu') {
    data.title = contentFields.title.value.trim() || data.title || '';
    data.note = contentFields.body.value;
    data.actionNote = contentFields.linkLabel.value.trim();
    if (extra && typeof extra === 'object') {
      data.items = Array.isArray(extra.items) ? extra.items : (data.items || []);
      data.itemsByDay = extra.itemsByDay || {};
      data.noteByDay = extra.noteByDay || {};
      data.actionIds = Array.isArray(extra.actionIds) ? extra.actionIds : (data.actionIds || []);
    }
  } else if (target.kind === 'hidden') {
    data.title = contentFields.title.value.trim() || data.title || '';
    data.label = data.label || data.title;
    data.text = contentFields.body.value;
    data.foundText = contentFields.linkLabel.value;
    data.log = contentFields.linkUrl.value;
    if (extra && typeof extra === 'object') {
      data.stats = extra.stats || {};
    }
  } else {
    const title = contentFields.title.value.trim();
    if (title) {
      if ('name' in data && !('label' in data)) data.name = title;
      else data.label = title;
    }
    data.note = contentFields.body.value;
    data.linkLabel = contentFields.linkLabel.value.trim();
    data.linkUrl = contentFields.linkUrl.value.trim();
    if (extra && typeof extra === 'object') {
      data.actions = Array.isArray(extra.actions) ? extra.actions : (data.actions || []);
      data.stats = extra.stats || data.stats || {};
      data.custom = extra.custom || data.custom || {};
    }
  }

  applyChoicesToData(data, choices);
  helpText.textContent = '紐づく内容・共通設定・選択肢を反映しました。ゲームで確認する場合は「下書き保存」→「ゲームで確認」を押してください。';
  renderAll();
}

async function copyContentJson() {
  const target = getSelectedContentTarget();
  if (!target || !target.data) return;
  const text = JSON.stringify(target.data, null, 2);
  outputBox.value = text;
  try {
    await navigator.clipboard.writeText(text);
    helpText.textContent = '紐づく内容JSONをコピーしました。';
  } catch (_) {
    helpText.textContent = 'コピーできない環境です。出力プレビューから手動でコピーしてください。';
  }
}

function validateCurrentMap() {
  if (!validationBox) return;
  const warnings = [];
  for (const e of entities().filter(isEntityVisible)) {
    const item = e.ref;
    const name = item.label || item.name || e.key;
    if (e.shape === 'point') {
      if (item.x < 0 || item.x > 100 || item.y < 0 || item.y > 100) warnings.push(`${name}: 座標がマップ外です。`);
      if ((Number(item.range) || 0) <= 0) warnings.push(`${name}: 反応範囲が0です。`);
    } else {
      if (item.x < 0 || item.y < 0 || item.x + item.w > 100 || item.y + item.h > 100) warnings.push(`${name}: 判定範囲がマップ外にはみ出しています。`);
      if ((Number(item.w) || 0) < 1 || (Number(item.h) || 0) < 1) warnings.push(`${name}: 範囲が小さすぎます。`);
    }
  }
  if (!warnings.length) {
    validationBox.className = 'validation-box ok';
    validationBox.textContent = 'このマップ・レイヤーの座標に大きな問題はありません。';
  } else {
    validationBox.className = 'validation-box warn';
    validationBox.innerHTML = warnings.map(w => `<div>⚠ ${w}</div>`).join('');
  }
}


function renderAll() {
  drawMap();
  drawGrid();
  drawAllOverlays();
  renderList();
  renderForm();
  renderContentEditor();
  validateCurrentMap();
  updateEntityButtons();
}

function selectEntity(key) {
  if (isLayerLocked()) {
    state.selectedKey = '';
    renderAll();
    showLockHelp();
    return;
  }
  state.selectedKey = key;
  renderAll();
}

function findEntityAt(p) {
  if (isLayerLocked()) return null;
  const list = entities().filter(isEntityVisible).slice().reverse();
  for (const e of list) {
    const item = e.ref;
    if (e.shape === 'point') {
      const dist = Math.hypot(p.x - item.x, p.y - item.y);
      if (dist <= (item.range || 12) / 2 + 3) return e;
    } else if (p.x >= item.x && p.x <= item.x + item.w && p.y >= item.y && p.y <= item.y + item.h) {
      return e;
    }
  }
  return null;
}

function pointerPct(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp(((ev.clientX - rect.left) / rect.width) * 100),
    y: clamp(((ev.clientY - rect.top) / rect.height) * 100)
  };
}

function updateCanvasCursor(p) {
  const h = handleAt(p);
  if (h) {
    canvas.style.cursor = RESIZE_CURSORS[h.name] || 'crosshair';
    return;
  }
  const found = findEntityAt(p);
  canvas.style.cursor = found ? 'grab' : 'default';
}

function resizeRectFromDrag(item, p, drag) {
  const dx = p.x - drag.startX;
  const dy = p.y - drag.startY;
  const x0 = drag.orig.x;
  const y0 = drag.orig.y;
  const w0 = drag.orig.w;
  const h0 = drag.orig.h;
  const right0 = x0 + w0;
  const bottom0 = y0 + h0;
  let x = x0;
  let y = y0;
  let w = w0;
  let h = h0;

  if (drag.handle.includes('w')) {
    x = clamp(x0 + dx, 0, right0 - MIN_RECT_SIZE_PCT);
    w = right0 - x;
  }
  if (drag.handle.includes('e')) {
    w = clamp(w0 + dx, MIN_RECT_SIZE_PCT, 100 - x0);
  }
  if (drag.handle.includes('n')) {
    y = clamp(y0 + dy, 0, bottom0 - MIN_RECT_SIZE_PCT);
    h = bottom0 - y;
  }
  if (drag.handle.includes('s')) {
    h = clamp(h0 + dy, MIN_RECT_SIZE_PCT, 100 - y0);
  }

  item.x = Number(x.toFixed(1));
  item.y = Number(y.toFixed(1));
  item.w = Number(w.toFixed(1));
  item.h = Number(h.toFixed(1));
  if (state.snapToGrid) maybeSnapRect(item);
}

canvas.addEventListener('pointerdown', ev => {
  ev.preventDefault();
  if (isLayerLocked()) { showLockHelp(); return; }
  canvas.setPointerCapture?.(ev.pointerId);
  const p = pointerPct(ev);
  const activeHandle = handleAt(p);

  if (activeHandle) {
    pushHistory();
    const e = selectedEntity();
    const item = e.ref;
    state.drag = {
      mode: 'resize',
      pointerId: ev.pointerId,
      key: e.key,
      handle: activeHandle.name,
      startX: p.x,
      startY: p.y,
      orig: {
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        w: Number(item.w) || 0,
        h: Number(item.h) || 0
      }
    };
    canvas.style.cursor = RESIZE_CURSORS[activeHandle.name] || 'crosshair';
    return;
  }

  const found = findEntityAt(p);
  if (found) {
    selectEntity(found.key);
  } else {
    state.selectedKey = '';
    renderAll();
    return;
  }

  const e = selectedEntity();
  if (!e) return;
  pushHistory();
  const item = e.ref;
  state.drag = {
    mode: 'move',
    pointerId: ev.pointerId,
    key: e.key,
    shape: e.shape,
    offsetX: p.x - item.x,
    offsetY: p.y - item.y
  };
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('pointermove', ev => {
  const p = pointerPct(ev);
  if (!state.drag) {
    updateCanvasCursor(p);
    return;
  }
  if (state.drag.pointerId !== ev.pointerId) return;
  ev.preventDefault();
  const e = selectedEntity();
  if (!e || e.key !== state.drag.key) return;
  const item = e.ref;

  if (state.drag.mode === 'resize' && e.shape !== 'point') {
    resizeRectFromDrag(item, p, state.drag);
  } else if (e.shape === 'point') {
    const nx = state.snapToGrid ? snapValue(p.x - state.drag.offsetX) : p.x - state.drag.offsetX;
    const ny = state.snapToGrid ? snapValue(p.y - state.drag.offsetY) : p.y - state.drag.offsetY;
    item.x = Number(clamp(nx).toFixed(1));
    item.y = Number(clamp(ny).toFixed(1));
  } else {
    const nx = state.snapToGrid ? snapValue(p.x - state.drag.offsetX) : p.x - state.drag.offsetX;
    const ny = state.snapToGrid ? snapValue(p.y - state.drag.offsetY) : p.y - state.drag.offsetY;
    item.x = Number(clamp(nx, 0, 100 - (item.w || 0)).toFixed(1));
    item.y = Number(clamp(ny, 0, 100 - (item.h || 0)).toFixed(1));
  }
  renderAll();
});

['pointerup','pointercancel','lostpointercapture'].forEach(type => canvas.addEventListener(type, ev => {
  if (!state.drag || !ev || state.drag.pointerId === ev.pointerId || type === 'lostpointercapture') {
    state.drag = null;
    canvas.style.cursor = 'default';
  }
}));

function applyFieldChanges() {
  if (isLayerLocked()) return;
  const e = selectedEntity();
  if (!e) return;
  const item = e.ref;
  if (fields.label.value.trim()) {
    if ('label' in item || e.shape !== 'point') item.label = fields.label.value.trim();
    else item.name = fields.label.value.trim();
  }
  if (state.layer === 'interactables') applyInteractableTypeDefaults(item, fields.type.value);
  setEntityTarget(e, fields.target.value);
  item.x = Number(clamp(fields.x.value).toFixed(1));
  item.y = Number(clamp(fields.y.value).toFixed(1));
  if (e.shape !== 'point') {
    item.w = Number(clamp(fields.w.value, 0.1, 100).toFixed(1));
    item.h = Number(clamp(fields.h.value, 0.1, 100).toFixed(1));
  }
  if (e.type !== 'block') item.range = Number(clamp(fields.range.value, 0, 100).toFixed(1));
  if (state.snapToGrid) {
    if (e.shape === 'point') {
      item.x = Number(clamp(snapValue(item.x)).toFixed(1));
      item.y = Number(clamp(snapValue(item.y)).toFixed(1));
    } else {
      maybeSnapRect(item);
    }
  }
  renderAll();
}


Object.values(fields).forEach(input => {
  input.addEventListener('focus', () => {
    if (!state.formHistoryArmed) {
      pushHistory();
      state.formHistoryArmed = true;
    }
  });
  input.addEventListener('blur', () => { state.formHistoryArmed = false; });
  input.addEventListener('input', applyFieldChanges);
});

mapSelect.addEventListener('change', () => {
  state.mapId = mapSelect.value;
  state.selectedKey = '';
  state.formHistoryArmed = false;
  renderAll();
});

layerSelect.addEventListener('change', () => {
  state.layer = layerSelect.value;
  state.selectedKey = '';
  state.formHistoryArmed = false;
  renderAll();
  if (isLayerLocked()) showLockHelp();
});


function syncEditorOptionsFromControls() {
  state.showGrid = !!editorOptions.showGrid?.checked;
  state.snapToGrid = !!editorOptions.snap?.checked;
  state.gridSize = Number(editorOptions.gridSize?.value) || 5;
  state.visibility.blocks = !!editorOptions.showBlocks?.checked;
  state.visibility.interactables = !!editorOptions.showInteractables?.checked;
  state.visibility.npcs = !!editorOptions.showNpcs?.checked;
  state.visibility.hidden = !!editorOptions.showHidden?.checked;
  state.visibility.transitions = !!editorOptions.showTransitions?.checked;
  state.locks.blocks = !!editorOptions.lockBlocks?.checked;
  state.locks.interactables = !!editorOptions.lockInteractables?.checked;
  state.locks.npcs = !!editorOptions.lockNpcs?.checked;
  state.locks.hidden = !!editorOptions.lockHidden?.checked;
  if (isLayerLocked()) state.selectedKey = '';
  renderAll();
  if (isLayerLocked()) showLockHelp();
}

Object.values(editorOptions).forEach(el => {
  el?.addEventListener('change', syncEditorOptionsFromControls);
});

function projectPackage() {
  return {
    schemaVersion: 'v031',
    exportedAt: new Date().toISOString(),
    mapsData: state.mapsData,
    npcsData: state.npcsData,
    hiddenData: state.hiddenData,
    dialoguesData: state.dialoguesData,
    boardsData: state.boardsData,
    menusData: state.menusData,
    linkBoardsData: state.linkBoardsData,
    actionsData: state.actionsData,
    achievementsData: state.achievementsData
  };
}

function normalizeVisibleDaysValue(days) {
  if (!Array.isArray(days) || !days.length) return ['all'];
  const clean = [...new Set(days.filter(Boolean).map(String))];
  if (!clean.length || clean.includes('all')) return ['all'];
  return clean.filter(day => DAY_OPTIONS.some(d => d.value === day));
}

function normalizeConditionFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj.condition && !obj.visibleWhen && !('kind' in obj && obj.kind === 'achievement')) {
    obj.visibleWhen = obj.condition;
    delete obj.condition;
  }
  return obj;
}

function normalizeChoice(choice) {
  const c = choice && typeof choice === 'object' ? { ...choice } : { label: String(choice || '閉じる') };
  c.label = String(c.label || '閉じる');
  c.type = String(c.type || 'close');
  if (c.type === 'externalLink') c.type = 'link';
  if (c.target && !c.targetId) c.targetId = c.target;
  delete c.target;
  c.visibleDays = normalizeVisibleDaysValue(c.visibleDays);
  if (c.visibleDays.includes('all')) delete c.visibleDays;
  if (c.condition && !c.visibleWhen) {
    c.visibleWhen = c.condition;
    delete c.condition;
  }
  return c;
}

function normalizeOptionsArray(obj, fallback = []) {
  if (!obj || typeof obj !== 'object') return [];
  let raw = [];
  if (Array.isArray(obj.options)) raw = obj.options;
  else if (Array.isArray(obj.choices)) raw = obj.choices;
  else if (obj.option1 || obj.option2 || obj.option3) {
    raw = [obj.option1, obj.option2, obj.option3]
      .filter(Boolean)
      .map(label => ({ label, type: 'close' }));
    delete obj.option1;
    delete obj.option2;
    delete obj.option3;
  } else raw = fallback;
  const out = Array.isArray(raw) ? raw.map(normalizeChoice).filter(c => c.label) : [];
  delete obj.choices;
  delete obj.options;
  if (out.length) obj.options = out;
  return out;
}

function normalizeCommonObject(obj, id, label = '') {
  if (!obj || typeof obj !== 'object') return obj;
  if (id && !obj.id) obj.id = id;
  if (!obj.visibleDays) obj.visibleDays = ['all'];
  obj.visibleDays = normalizeVisibleDaysValue(obj.visibleDays);
  normalizeConditionFields(obj);
  if (label && !obj.label && !obj.title && !obj.name) obj.label = label;
  if (!('note' in obj)) obj.note = '';
  normalizeOptionsArray(obj, []);
  return obj;
}

function normalizeAllData({ silent = false } = {}) {
  if (!state.mapsData) return;
  const maps = state.mapsData.maps || {};
  Object.entries(maps).forEach(([mapId, map]) => {
    map.id = map.id || mapId;
    map.label = map.label || map.name || map.title || mapId;
    map.note = map.note || '';
    (map.interactables || []).forEach((item, idx) => {
      normalizeCommonObject(item, item.id || `${mapId}_interactable_${idx + 1}`, item.label || item.type || '対象');
      if (item.condition && !item.visibleWhen) {
        item.visibleWhen = item.condition;
        delete item.condition;
      }
    });
    (map.blocks || []).forEach((item, idx) => {
      normalizeCommonObject(item, item.id || `${mapId}_block_${idx + 1}`, item.label || '通行不可');
    });
    (map.transitions || []).forEach((item, idx) => {
      normalizeCommonObject(item, item.id || `${mapId}_transition_${idx + 1}`, item.label || 'マップ移動');
    });
  });

  (state.npcsData?.npcs || []).forEach((npc, idx) => {
    normalizeCommonObject(npc, npc.id || `npc_${idx + 1}`, npc.name || npc.label || 'NPC');
    npc.name = npc.name || npc.label || npc.id;
  });

  Object.entries(state.dialoguesData?.dialogues || {}).forEach(([id, d]) => {
    normalizeCommonObject(d, id, d.speaker || id);
    d.speaker = d.speaker || d.label || id;
    d.text = d.text || d.body || '';
  });
  Object.entries(state.dialoguesData?.confirms || {}).forEach(([id, c]) => {
    c.id = c.id || id;
    c.title = c.title || c.label || id;
    c.text = c.text || '';
    c.visibleDays = normalizeVisibleDaysValue(c.visibleDays);
    if (c.condition && !c.visibleWhen) {
      c.visibleWhen = c.condition;
      delete c.condition;
    }
    // 入店確認はtargetMapIdを実行時に扉オブジェクトから補完するため、既存optionsがある場合のみ正規化。
    if (Array.isArray(c.options) || Array.isArray(c.choices)) normalizeOptionsArray(c, []);
    if (!('note' in c)) c.note = '';
  });

  Object.entries(state.boardsData?.boards || {}).forEach(([id, b]) => {
    normalizeCommonObject(b, id, b.title || id);
    b.title = b.title || b.label || id;
    b.body = b.body || '';
  });
  Object.entries(state.menusData?.menus || {}).forEach(([id, m]) => {
    normalizeCommonObject(m, id, m.title || id);
    m.title = m.title || m.label || id;
    m.items = Array.isArray(m.items) ? m.items : [];
    m.actionIds = Array.isArray(m.actionIds) ? m.actionIds : [];
  });
  (state.hiddenData?.hiddenSpots || []).forEach((h, idx) => {
    normalizeCommonObject(h, h.id || `hidden_${idx + 1}`, h.label || h.title || '隠し要素');
    h.title = h.title || h.label || h.id;
    h.text = h.text || '';
  });
  Object.entries(state.linkBoardsData?.linkBoards || {}).forEach(([id, lb]) => {
    lb.id = lb.id || id;
    lb.title = lb.title || id;
    lb.body = lb.body || '';
    lb.visibleDays = normalizeVisibleDaysValue(lb.visibleDays);
    lb.links = Array.isArray(lb.links) ? lb.links.map((link, idx) => {
      const l = { ...link };
      l.id = l.id || `${id}_link_${idx + 1}`;
      l.label = l.label || 'リンク';
      l.type = l.type || (l.targetId ? 'linkBoard' : 'link');
      l.enabled = l.enabled !== false;
      l.visibleDays = normalizeVisibleDaysValue(l.visibleDays);
      if (l.visibleDays.includes('all')) delete l.visibleDays;
      if (l.condition && !l.visibleWhen) {
        l.visibleWhen = l.condition;
        delete l.condition;
      }
      return l;
    }) : [];
    if (!('note' in lb)) lb.note = '';
  });


  Object.entries(state.actionsData?.actions || {}).forEach(([id, a]) => {
    a.id = a.id || id;
    a.title = a.title || id;
    a.category = a.category || '';
    a.resultTitle = a.resultTitle || a.title;
    a.resultText = a.resultText || '';
    a.log = a.log || '';
    a.stats = a.stats && typeof a.stats === 'object' ? a.stats : {};
    if (!('note' in a)) a.note = '';
  });
  (state.achievementsData?.achievements || []).forEach((a, idx) => {
    a.id = a.id || `achievement_${idx + 1}`;
    a.title = a.title || a.id;
    a.kind = a.kind || 'achievement';
    a.description = a.description || '';
    a.lockedHint = a.lockedHint || '';
    a.condition = a.condition || { type: 'totalAtLeast', value: 1 };
    if (!('note' in a)) a.note = '';
  });

  if (!silent) {
    helpText.textContent = 'データ正規化を実行しました。旧形式の選択肢を options 形式へ寄せ、共通項目を補完しました。';
    renderAll();
  }
}

function collectProjectValidation() {
  const errors = [];
  const warnings = [];
  const maps = state.mapsData?.maps || {};
  const mapIds = new Set(Object.keys(maps));
  const dialogueIds = new Set(Object.keys(state.dialoguesData?.dialogues || {}));
  const confirmIds = new Set(Object.keys(state.dialoguesData?.confirms || {}));
  const boardIds = new Set(Object.keys(state.boardsData?.boards || {}));
  const menuIds = new Set(Object.keys(state.menusData?.menus || {}));
  const actionIds = new Set(Object.keys(state.actionsData?.actions || {}));
  const achievementIds = new Set((state.achievementsData?.achievements || []).map(a => a.id).filter(Boolean));
  const linkBoardIds = new Set(Object.keys(state.linkBoardsData?.linkBoards || {}));
  const hiddenIds = new Set((state.hiddenData?.hiddenSpots || []).map(h => h.id).filter(Boolean));
  // actions.jsonは現状エディタ読み込み対象外のため、menus.actionIdsはID形式のみ軽く警告扱い。

  function checkDuplicate(list, label) {
    const seen = new Set();
    list.filter(Boolean).forEach(id => {
      if (seen.has(id)) errors.push(`${label}: IDが重複しています: ${id}`);
      seen.add(id);
    });
  }

  checkDuplicate((state.npcsData?.npcs || []).map(n => n.id), 'NPC');
  checkDuplicate((state.hiddenData?.hiddenSpots || []).map(h => h.id), '隠し要素');
  Object.entries(maps).forEach(([mapId, map]) => {
    if (!map.image) warnings.push(`maps.${mapId}: 画像パスが空です。`);
    (map.interactables || []).forEach(item => {
      const name = `${mapId}/${item.id || item.label || item.type}`;
      if (!item.id) errors.push(`${name}: idが空です。`);
      if (item.type === 'door' && item.confirmId && !confirmIds.has(item.confirmId)) errors.push(`${name}: confirmIdが存在しません: ${item.confirmId}`);
      if (item.type === 'board' && item.boardId && !boardIds.has(item.boardId)) errors.push(`${name}: boardIdが存在しません: ${item.boardId}`);
      if (item.type === 'menu' && item.menuId && !menuIds.has(item.menuId)) errors.push(`${name}: menuIdが存在しません: ${item.menuId}`);
      if ((item.type === 'sign' || item.type === 'event') && item.dialogueId && !dialogueIds.has(item.dialogueId)) errors.push(`${name}: dialogueIdが存在しません: ${item.dialogueId}`);
      if (item.targetMapId && !mapIds.has(item.targetMapId)) errors.push(`${name}: targetMapIdが存在しません: ${item.targetMapId}`);
    });
    (map.transitions || []).forEach(item => {
      const name = `${mapId}/${item.id || 'transition'}`;
      if (item.targetMapId && !mapIds.has(item.targetMapId)) errors.push(`${name}: targetMapIdが存在しません: ${item.targetMapId}`);
    });
  });

  (state.npcsData?.npcs || []).forEach(npc => {
    const name = `NPC/${npc.id || npc.name}`;
    if (!npc.id) errors.push(`${name}: idが空です。`);
    if (npc.mapId && !mapIds.has(npc.mapId)) errors.push(`${name}: mapIdが存在しません: ${npc.mapId}`);
    if (npc.dialogueId && !dialogueIds.has(npc.dialogueId)) errors.push(`${name}: dialogueIdが存在しません: ${npc.dialogueId}`);
    Object.entries(npc.dialogueByDay || {}).forEach(([day, did]) => {
      if (did && !dialogueIds.has(did)) errors.push(`${name}: dialogueByDay.${day} が存在しません: ${did}`);
    });
  });

  Object.entries(state.dialoguesData?.dialogues || {}).forEach(([id, d]) => {
    if (!d.text) warnings.push(`dialogues.${id}: 本文が空です。`);
    (d.options || d.choices || []).forEach((choice, idx) => validateChoice(choice, `dialogues.${id}.options[${idx}]`));
  });
  Object.entries(state.dialoguesData?.confirms || {}).forEach(([id, c]) => {
    (c.options || c.choices || []).forEach((choice, idx) => validateChoice(choice, `confirms.${id}.options[${idx}]`));
  });
  Object.entries(state.boardsData?.boards || {}).forEach(([id, b]) => {
    if (b.linkBoardId && !linkBoardIds.has(b.linkBoardId)) errors.push(`boards.${id}: linkBoardIdが存在しません: ${b.linkBoardId}`);
    if (!b.linkUrl && !b.linkBoardId && !Array.isArray(b.options)) warnings.push(`boards.${id}: URL/リンク集/選択肢が未設定です。`);
    (b.options || b.choices || []).forEach((choice, idx) => validateChoice(choice, `boards.${id}.options[${idx}]`));
  });
  Object.entries(state.menusData?.menus || {}).forEach(([id, m]) => {
    if (!Array.isArray(m.items)) warnings.push(`menus.${id}: items が配列ではありません。`);
    (m.options || m.choices || []).forEach((choice, idx) => validateChoice(choice, `menus.${id}.options[${idx}]`));
  });
  (state.hiddenData?.hiddenSpots || []).forEach(h => {
    const name = `hidden.${h.id || h.title}`;
    if (h.mapId && !mapIds.has(h.mapId)) errors.push(`${name}: mapIdが存在しません: ${h.mapId}`);
    (h.options || h.choices || []).forEach((choice, idx) => validateChoice(choice, `${name}.options[${idx}]`));
  });
  Object.entries(state.linkBoardsData?.linkBoards || {}).forEach(([id, lb]) => {
    (lb.links || []).forEach((link, idx) => {
      const label = `linkBoards.${id}.links[${idx}]`;
      if (link.enabled !== false && link.type === 'linkBoard' && link.targetId && !linkBoardIds.has(link.targetId)) errors.push(`${label}: targetIdのリンク集が存在しません: ${link.targetId}`);
      if (link.enabled !== false && link.type !== 'linkBoard' && !link.url) warnings.push(`${label}: 有効リンクですがURLが空です。`);
    });
  });

  function validateChoice(choice, label) {
    if (!choice || typeof choice !== 'object') {
      errors.push(`${label}: 選択肢データが不正です。`);
      return;
    }
    const type = choice.type || 'close';
    if (!choice.label) warnings.push(`${label}: 表示名が空です。`);
    if (type === 'dialogue' && choice.targetId && !dialogueIds.has(choice.targetId)) errors.push(`${label}: dialogue targetIdが存在しません: ${choice.targetId}`);
    if (type === 'board' && choice.targetId && !boardIds.has(choice.targetId)) errors.push(`${label}: board targetIdが存在しません: ${choice.targetId}`);
    if (type === 'menu' && choice.targetId && !menuIds.has(choice.targetId)) errors.push(`${label}: menu targetIdが存在しません: ${choice.targetId}`);
    if (type === 'linkBoard' && choice.targetId && !linkBoardIds.has(choice.targetId)) errors.push(`${label}: linkBoard targetIdが存在しません: ${choice.targetId}`);
    if (type === 'map' && choice.targetMapId && !mapIds.has(choice.targetMapId)) errors.push(`${label}: targetMapIdが存在しません: ${choice.targetMapId}`);
    if (type === 'action' && !choice.targetId) warnings.push(`${label}: action targetIdが空です。`);
    if (type === 'action' && choice.targetId && actionIds.size && !actionIds.has(choice.targetId)) errors.push(`${label}: action targetIdが存在しません: ${choice.targetId}`);
    if (type === 'link' && !choice.url) warnings.push(`${label}: link URLが空です。`);
    if (type === 'achievement' && choice.targetId && achievementIds.size && !achievementIds.has(choice.targetId)) warnings.push(`${label}: achievement targetIdが実績IDに見つかりません: ${choice.targetId}`);
    if (type === 'conditionalDialogue') {
      (choice.branches || []).forEach((b, i) => {
        if (b.targetId && !dialogueIds.has(b.targetId)) errors.push(`${label}.branches[${i}]: targetIdが存在しません: ${b.targetId}`);
      });
      if (choice.fallbackId && !dialogueIds.has(choice.fallbackId)) errors.push(`${label}: fallbackIdが存在しません: ${choice.fallbackId}`);
    }
  }

  return { errors, warnings };
}

function renderProjectValidation(result) {
  const { errors, warnings } = result;
  if (!errors.length && !warnings.length) {
    validationBox.className = 'validation-box ok';
    validationBox.textContent = '全体チェックOK：ID重複・参照切れ・未設定リンクの大きな問題は見つかりませんでした。';
    return;
  }
  validationBox.className = errors.length ? 'validation-box error' : 'validation-box warn';
  const lines = [];
  if (errors.length) lines.push(`<strong>エラー ${errors.length}件</strong>`, ...errors.map(e => `<div>❌ ${escapeHtml(e)}</div>`));
  if (warnings.length) lines.push(`<strong>警告 ${warnings.length}件</strong>`, ...warnings.map(w => `<div>⚠ ${escapeHtml(w)}</div>`));
  validationBox.innerHTML = lines.join('');
}

function validateProject() {
  normalizeAllData({ silent: true });
  const result = collectProjectValidation();
  renderProjectValidation(result);
  outputBox.value = JSON.stringify(result, null, 2);
  helpText.textContent = result.errors.length ? '全体チェックでエラーが見つかりました。出力プレビューで詳細を確認してください。' : '全体チェックを実行しました。';
}

function downloadProjectBundle() {
  normalizeAllData({ silent: true });
  downloadJson('vc4u_project_bundle_v036.json', projectPackage());
}

function exportBackup() {
  normalizeAllData({ silent: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadJson(`vc4u_backup_v036_${stamp}.json`, projectPackage());
  helpText.textContent = '全データバックアップを書き出しました。復元する場合は「バックアップ復元」からこのJSONを選択してください。';
}

function importBackupFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || '{}'));
      pushHistory();
      state.mapsData = deepClone(data.mapsData || data.maps || state.mapsData);
      state.npcsData = deepClone(data.npcsData || data.npcs || state.npcsData);
      state.hiddenData = deepClone(data.hiddenData || data.hidden || state.hiddenData);
      state.dialoguesData = deepClone(data.dialoguesData || data.dialogues || state.dialoguesData);
      state.boardsData = deepClone(data.boardsData || data.boards || state.boardsData);
      state.menusData = deepClone(data.menusData || data.menus || state.menusData);
      state.linkBoardsData = deepClone(data.linkBoardsData || data.linkBoards || state.linkBoardsData);
      state.actionsData = deepClone(data.actionsData || data.actions || state.actionsData);
      state.achievementsData = deepClone(data.achievementsData || data.achievements || state.achievementsData);
      normalizeAllData({ silent: true });
      renderAll();
      markCurrentData('Backup File', makeDraft());
      helpText.textContent = 'バックアップJSONを復元しました。必要に応じて「下書き保存」または各JSON保存を行ってください。';
      setLastAction('バックアップJSON復元OK', summaryText(makeDraft()), 'ok');
      updateStatusPanel();
    } catch (err) {
      validationBox.className = 'validation-box warn';
      validationBox.textContent = `バックアップ復元に失敗しました: ${err.message}`;
    } finally {
      buttons.importBackupInput.value = '';
    }
  };
  reader.readAsText(file, 'utf-8');
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}



function normalizeForSheet(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(',');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function compactJson(value) {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value) && !value.length) return '';
  if (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length) return '';
  return JSON.stringify(value);
}

function rowsToDelimited(rows, delimiter = '\t') {
  const headers = rows.headers || [];
  const data = rows.rows || [];
  const escapeCell = value => {
    const str = normalizeForSheet(value);
    if (delimiter === ',') {
      if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    }
    return str.replace(/\t/g, ' ').replace(/\r?\n/g, '\\n');
  };
  return [headers.map(escapeCell).join(delimiter), ...data.map(row => headers.map(h => escapeCell(row[h])).join(delimiter))].join('\n');
}

function buildSheetRows() {
  normalizeAllData({ silent: true });
  const maps = state.mapsData?.maps || {};
  const sheets = {};
  const add = (name, headers, rows) => { sheets[name] = { headers, rows }; };

  const commonTarget = item => ({
    visibleDays: item.visibleDays || ['all'],
    visibleWhenJson: compactJson(item.visibleWhen || item.condition || ''),
    optionsJson: compactJson(item.options || item.choices || []),
    note: item.note || ''
  });

  add('maps', ['id','name','type','shopId','image','startX','startY','startDir','collisionRadius','walkZonesJson','transitionsJson','label','note'],
    Object.values(maps).map(map => ({
      id: map.id || '', name: map.name || '', type: map.type || '', shopId: map.shopId || '', image: map.image || '',
      startX: map.start?.x ?? '', startY: map.start?.y ?? '', startDir: map.start?.dir || '', collisionRadius: map.collisionRadius ?? '',
      walkZonesJson: compactJson(map.walkZones || []), transitionsJson: compactJson(map.transitions || []), label: map.label || '', note: map.note || ''
    }))
  );

  add('interactables', ['id','mapId','type','label','x','y','w','h','range','targetMapId','spawnJson','confirmId','boardId','signId','menuId','dialogueId','visibleDays','visibleWhenJson','optionsJson','note'],
    Object.values(maps).flatMap(map => (map.interactables || []).map(item => ({
      id: item.id || '', mapId: map.id || '', type: item.type || '', label: item.label || '', x: item.x ?? '', y: item.y ?? '', w: item.w ?? '', h: item.h ?? '', range: item.range ?? '',
      targetMapId: item.targetMapId || '', spawnJson: compactJson(item.spawn || ''), confirmId: item.confirmId || '', boardId: item.boardId || '', signId: item.signId || '', menuId: item.menuId || '', dialogueId: item.dialogueId || '',
      ...commonTarget(item)
    })))
  );

  add('blocks', ['id','mapId','type','label','x','y','w','h','visibleDays','visibleWhenJson','note'],
    Object.values(maps).flatMap(map => (map.blocks || []).map(item => ({
      id: item.id || '', mapId: map.id || '', type: item.type || 'block', label: item.label || '', x: item.x ?? '', y: item.y ?? '', w: item.w ?? '', h: item.h ?? '',
      visibleDays: item.visibleDays || ['all'], visibleWhenJson: compactJson(item.visibleWhen || ''), note: item.note || ''
    })))
  );

  add('npcs', ['id','name','mapId','x','y','sprite','dialogueId','dialogueByDayJson','visibleDays','visibleWhenJson','range','optionsJson','note'],
    (state.npcsData?.npcs || []).map(item => ({
      id: item.id || '', name: item.name || '', mapId: item.mapId || '', x: item.x ?? '', y: item.y ?? '', sprite: item.sprite || '', dialogueId: item.dialogueId || '', dialogueByDayJson: compactJson(item.dialogueByDay || ''),
      visibleDays: item.visibleDays || ['all'], visibleWhenJson: compactJson(item.visibleWhen || item.condition || ''), range: item.range ?? '', optionsJson: compactJson(item.options || []), note: item.note || ''
    }))
  );

  add('hidden_spots', ['id','mapId','label','x','y','w','h','range','visibleDays','visibleWhenJson','title','text','foundText','log','statsJson','optionsJson','note'],
    (state.hiddenData?.hiddenSpots || []).map(item => ({
      id: item.id || '', mapId: item.mapId || '', label: item.label || '', x: item.x ?? '', y: item.y ?? '', w: item.w ?? '', h: item.h ?? '', range: item.range ?? '',
      visibleDays: item.visibleDays || ['all'], visibleWhenJson: compactJson(item.visibleWhen || item.condition || ''), title: item.title || '', text: item.text || '', foundText: item.foundText || '', log: item.log || '', statsJson: compactJson(item.stats || ''), optionsJson: compactJson(item.options || []), note: item.note || ''
    }))
  );

  add('dialogues', ['id','speaker','label','text','visibleDays','visibleWhenJson','textByDayJson','optionsJson','note'],
    Object.entries(state.dialoguesData?.dialogues || {}).map(([id, item]) => ({
      id, speaker: item.speaker || '', label: item.label || item.speaker || '', text: item.text || '', visibleDays: item.visibleDays || ['all'], visibleWhenJson: compactJson(item.visibleWhen || item.condition || ''), textByDayJson: compactJson(item.textByDay || item.bodyByDay || ''), optionsJson: compactJson(item.options || []), note: item.note || ''
    }))
  );

  add('confirms', ['id','title','text','yesLabel','noLabel','visibleDays','visibleWhenJson','optionsJson','note'],
    Object.entries(state.dialoguesData?.confirms || {}).map(([id, item]) => ({
      id, title: item.title || '', text: item.text || '', yesLabel: item.yesLabel || '', noLabel: item.noLabel || '', visibleDays: item.visibleDays || ['all'], visibleWhenJson: compactJson(item.visibleWhen || item.condition || ''), optionsJson: compactJson(item.options || []), note: item.note || ''
    }))
  );

  add('boards', ['id','title','body','bodyByDayJson','linkLabel','linkUrl','linkBoardId','extraLinkLabel','visibleDays','visibleWhenJson','optionsJson','note'],
    Object.entries(state.boardsData?.boards || {}).map(([id, item]) => ({
      id, title: item.title || '', body: item.body || '', bodyByDayJson: compactJson(item.bodyByDay || ''), linkLabel: item.linkLabel || '', linkUrl: item.linkUrl || '', linkBoardId: item.linkBoardId || '', extraLinkLabel: item.extraLinkLabel || '', visibleDays: item.visibleDays || ['all'], visibleWhenJson: compactJson(item.visibleWhen || item.condition || ''), optionsJson: compactJson(item.options || []), note: item.note || ''
    }))
  );

  add('menus', ['id','title','note','itemsJson','noteByDayJson','itemsByDayJson','actionIds','actionNote','visibleDays','visibleWhenJson','optionsJson'],
    Object.entries(state.menusData?.menus || {}).map(([id, item]) => ({
      id, title: item.title || '', note: item.note || '', itemsJson: compactJson(item.items || []), noteByDayJson: compactJson(item.noteByDay || ''), itemsByDayJson: compactJson(item.itemsByDay || ''), actionIds: item.actionIds || [], actionNote: item.actionNote || '', visibleDays: item.visibleDays || ['all'], visibleWhenJson: compactJson(item.visibleWhen || item.condition || ''), optionsJson: compactJson(item.options || [])
    }))
  );

  add('actions', ['id','title','category','resultTitle','resultText','log','statsJson','note'],
    Object.entries(state.actionsData?.actions || {}).map(([id, item]) => ({
      id, title: item.title || '', category: item.category || '', resultTitle: item.resultTitle || '', resultText: item.resultText || '', log: item.log || '', statsJson: compactJson(item.stats || ''), note: item.note || ''
    }))
  );

  add('achievements', ['id','title','kind','description','lockedHint','conditionJson','rewardText','note'],
    (state.achievementsData?.achievements || []).map(item => ({
      id: item.id || '', title: item.title || '', kind: item.kind || '', description: item.description || '', lockedHint: item.lockedHint || '', conditionJson: compactJson(item.condition || ''), rewardText: item.rewardText || '', note: item.note || ''
    }))
  );

  add('link_boards', ['id','title','body','visibleDays','visibleWhenJson','note'],
    Object.entries(state.linkBoardsData?.linkBoards || {}).map(([id, item]) => ({
      id, title: item.title || '', body: item.body || '', visibleDays: item.visibleDays || ['all'], visibleWhenJson: compactJson(item.visibleWhen || item.condition || ''), note: item.note || ''
    }))
  );

  add('link_items', ['parentId','id','order','label','type','url','targetId','note','enabled','visibleDays','visibleWhenJson'],
    Object.entries(state.linkBoardsData?.linkBoards || {}).flatMap(([parentId, board]) => (board.links || []).map((item, idx) => ({
      parentId, id: item.id || `${parentId}_link_${idx + 1}`, order: idx + 1, label: item.label || '', type: item.type || 'link', url: item.url || '', targetId: item.targetId || '', note: item.note || '', enabled: item.enabled !== false, visibleDays: item.visibleDays || ['all'], visibleWhenJson: compactJson(item.visibleWhen || item.condition || '')
    })))
  );

  const optionRows = [];
  const collectOptions = (parentType, parentId, options) => {
    (options || []).forEach((option, idx) => optionRows.push({
      parentType, parentId, order: idx + 1, label: option.label || '', type: option.type || 'close', targetId: option.targetId || '', targetMapId: option.targetMapId || '', url: option.url || '', message: option.message || '', className: option.className || '', visibleDays: option.visibleDays || ['all'], conditionJson: compactJson(option.visibleWhen || option.condition || ''), branchesJson: compactJson(option.branches || ''), fallbackId: option.fallbackId || '', note: option.note || ''
    }));
  };
  Object.entries(state.dialoguesData?.dialogues || {}).forEach(([id, item]) => collectOptions('dialogue', id, item.options || []));
  Object.entries(state.dialoguesData?.confirms || {}).forEach(([id, item]) => collectOptions('confirm', id, item.options || []));
  Object.entries(state.boardsData?.boards || {}).forEach(([id, item]) => collectOptions('board', id, item.options || []));
  Object.entries(state.menusData?.menus || {}).forEach(([id, item]) => collectOptions('menu', id, item.options || []));
  (state.hiddenData?.hiddenSpots || []).forEach(item => collectOptions('hidden', item.id, item.options || []));
  Object.values(maps).forEach(map => (map.interactables || []).forEach(item => collectOptions(`interactable:${map.id}`, item.id, item.options || [])));
  (state.npcsData?.npcs || []).forEach(item => collectOptions('npc', item.id, item.options || []));
  add('options', ['parentType','parentId','order','label','type','targetId','targetMapId','url','message','className','visibleDays','conditionJson','branchesJson','fallbackId','note'], optionRows);

  return sheets;
}

function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportSheetFiles(format = 'tsv') {
  const sheets = buildSheetRows();
  const delimiter = format === 'csv' ? ',' : '\t';
  const ext = format === 'csv' ? 'csv' : 'tsv';
  Object.entries(sheets).forEach(([name, rows], idx) => {
    setTimeout(() => downloadText(`${String(idx + 1).padStart(2, '0')}_${name}.${ext}`, rowsToDelimited(rows, delimiter), format === 'csv' ? 'text/csv' : 'text/tab-separated-values'), idx * 120);
  });
  outputBox.value = Object.entries(sheets).map(([name, rows]) => `【${name}】 ${rows.rows.length} rows`).join('\n');
  helpText.textContent = `${ext.toUpperCase()}を${Object.keys(sheets).length}シート分書き出しました。ブラウザによっては複数ダウンロード許可が必要です。`;
}

function previewSheetOutput() {
  const sheets = buildSheetRows();
  const lines = [];
  Object.entries(sheets).forEach(([name, rows]) => {
    lines.push(`===== ${name} (${rows.rows.length} rows) =====`);
    lines.push(rowsToDelimited({ headers: rows.headers, rows: rows.rows.slice(0, 5) }, '\t'));
    lines.push('');
  });
  outputBox.value = lines.join('\n');
  helpText.textContent = 'シート出力プレビューを表示しました。各シートの先頭5行を確認できます。';
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

buttons.undo?.addEventListener('click', undo);
buttons.redo?.addEventListener('click', redo);
buttons.saveDraft?.addEventListener('click', saveDraft);
buttons.loadDraft?.addEventListener('click', loadDraft);
buttons.clearDraft?.addEventListener('click', clearDraft);
buttons.preview?.addEventListener('click', previewGame);
buttons.addEntity?.addEventListener('click', addEntity);
buttons.duplicateEntity?.addEventListener('click', duplicateSelected);
buttons.deleteEntity?.addEventListener('click', deleteSelected);
buttons.downloadMaps.addEventListener('click', () => downloadJson('maps.json', state.mapsData));
buttons.downloadNpcs.addEventListener('click', () => downloadJson('npcs.json', state.npcsData));
buttons.downloadHidden.addEventListener('click', () => downloadJson('hidden.json', state.hiddenData));
buttons.downloadDialogues?.addEventListener('click', () => downloadJson('dialogues.json', state.dialoguesData));
buttons.downloadBoards?.addEventListener('click', () => downloadJson('boards.json', state.boardsData));
buttons.downloadMenus?.addEventListener('click', () => downloadJson('menus.json', state.menusData));
buttons.downloadLinkBoards?.addEventListener('click', () => downloadJson('linkBoards.json', state.linkBoardsData));
buttons.normalizeData?.addEventListener('click', () => { pushHistory(); normalizeAllData(); validateProject(); });
buttons.validateProject?.addEventListener('click', validateProject);
buttons.exportBackup?.addEventListener('click', exportBackup);
buttons.importBackup?.addEventListener('click', () => buttons.importBackupInput?.click());
buttons.importBackupInput?.addEventListener('change', ev => importBackupFile(ev.target.files?.[0]));
buttons.downloadProject?.addEventListener('click', downloadProjectBundle);
buttons.exportTsv?.addEventListener('click', () => exportSheetFiles('tsv'));
buttons.exportCsv?.addEventListener('click', () => exportSheetFiles('csv'));
buttons.previewSheets?.addEventListener('click', previewSheetOutput);
buttons.gasSettings?.addEventListener('click', openGasSettings);
buttons.gasTest?.addEventListener('click', testGasConnection);
buttons.loadGas?.addEventListener('click', loadFromGasIntoEditor);
buttons.compareGas?.addEventListener('click', compareGasWithCurrent);
buttons.gasBackup?.addEventListener('click', saveGasBackup);
buttons.gasBackupList?.addEventListener('click', listGasBackups);
buttons.gasBackupLoad?.addEventListener('click', loadGasBackupById);
buttons.gasBackupLatest?.addEventListener('click', loadLatestGasBackup);
buttons.applyContent?.addEventListener('click', applyContentChanges);
buttons.copyContent?.addEventListener('click', copyContentJson);
choiceEditor.addButton?.addEventListener('click', () => {
  addChoiceRow({ label: '閉じる', type: 'close' });
});
choiceEditor.list?.addEventListener('input', updateChoiceRowTitles);
choiceEditor.list?.addEventListener('change', updateChoiceRowTitles);
buttons.copySelected.addEventListener('click', async () => {
  const e = selectedEntity();
  const text = JSON.stringify(e ? e.ref : currentMap(), null, 2);
  outputBox.value = text;
  try {
    await navigator.clipboard.writeText(text);
    helpText.textContent = '選択中データをクリップボードにコピーしました。';
  } catch (_) {
    helpText.textContent = 'コピーできない環境です。下の出力プレビューから手動でコピーしてください。';
  }
});

boot().catch(err => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:white; padding:20px; white-space:pre-wrap;">読み込みに失敗しました。\nローカルで開く場合は python -m http.server 8000 などで起動してください。\n\n${err.message}</pre>`;
});
