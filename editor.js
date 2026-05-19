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

const state = {
  mapsData: null,
  npcsData: null,
  hiddenData: null,
  dialoguesData: null,
  boardsData: null,
  menusData: null,
  linkBoardsData: null,
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
  locks: { blocks: false, interactables: false, npcs: false, hidden: false }
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

const DRAFT_KEY = 'vc4u_editor_draft_v023';
const PREVIEW_FLAG_KEY = 'vc4u_use_editor_draft_v023';
const HISTORY_LIMIT = 60;

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

function makeDraft() {
  return {
    version: 'v023',
    savedAt: new Date().toISOString(),
    mapsData: state.mapsData,
    npcsData: state.npcsData,
    hiddenData: state.hiddenData,
    dialoguesData: state.dialoguesData,
    boardsData: state.boardsData,
    menusData: state.menusData,
    linkBoardsData: state.linkBoardsData
  };
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(makeDraft()));
    helpText.textContent = '下書きをこのブラウザに保存しました。「ゲームで確認」でこの配置を反映できます。';
  } catch (err) {
    helpText.textContent = '下書き保存に失敗しました。ブラウザ容量やプライベートモードを確認してください。';
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) { helpText.textContent = '保存済みの下書きがありません。'; return; }
    pushHistory();
    const draft = JSON.parse(raw);
    state.mapsData = draft.mapsData || state.mapsData;
    state.npcsData = draft.npcsData || state.npcsData;
    state.hiddenData = draft.hiddenData || state.hiddenData;
    state.dialoguesData = draft.dialoguesData || state.dialoguesData;
    state.boardsData = draft.boardsData || state.boardsData;
    state.menusData = draft.menusData || state.menusData;
    state.linkBoardsData = draft.linkBoardsData || state.linkBoardsData;
    state.selectedKey = '';
    renderAll();
    helpText.textContent = '保存済みの下書きを読み込みました。';
  } catch (err) {
    helpText.textContent = '下書きの読み込みに失敗しました。';
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(PREVIEW_FLAG_KEY);
  helpText.textContent = '下書きとゲーム確認用フラグを削除しました。';
}

function previewGame() {
  saveDraft();
  localStorage.setItem(PREVIEW_FLAG_KEY, '1');
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

async function boot() {
  const [mapsData, npcsData, hiddenData, dialoguesData, boardsData, menusData, linkBoardsData] = await Promise.all([
    loadJson('data/maps.json'),
    loadJson('data/npcs.json'),
    loadJson('data/hidden.json'),
    loadJson('data/dialogues.json'),
    loadJson('data/boards.json'),
    loadJson('data/menus.json'),
    loadJson('data/linkBoards.json')
  ]);
  state.mapsData = mapsData;
  state.npcsData = npcsData;
  state.hiddenData = hiddenData;
  state.dialoguesData = dialoguesData;
  state.boardsData = boardsData;
  state.menusData = menusData;
  state.linkBoardsData = linkBoardsData;

  for (const map of Object.values(mapsData.maps)) {
    await loadImage(map.image);
    const option = document.createElement('option');
    option.value = map.id;
    option.textContent = map.name;
    mapSelect.appendChild(option);
  }

  state.mapId = mapsData.initialMapId;
  mapSelect.value = state.mapId;
  updateHistoryButtons();
  const missingButtons = Object.entries(buttons).filter(([, el]) => !el).map(([key]) => key);
  if (missingButtons.length) {
    helpText.textContent = `編集ボタンの読み込みに失敗しました: ${missingButtons.join(', ')}`;
    console.warn('Missing editor buttons:', missingButtons);
  }
  const hasDraft = !!localStorage.getItem(DRAFT_KEY);
  if (hasDraft) helpText.textContent = '保存済みの下書きがあります。必要なら「下書き読込」を押してください。';
  renderAll();
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
  if (e.type === 'npc') {
    const id = item.dialogueId;
    return id ? { kind: 'dialogue', id, data: state.dialoguesData?.dialogues?.[id], owner: item } : null;
  }
  if (e.type === 'hidden') {
    return { kind: 'hidden', id: item.id, data: item, owner: item };
  }
  const type = item.type || e.type;
  if (type === 'board') {
    const id = item.boardId;
    return id ? { kind: 'board', id, data: state.boardsData?.boards?.[id], owner: item } : null;
  }
  if (type === 'menu') {
    const id = item.menuId;
    return id ? { kind: 'menu', id, data: state.menusData?.menus?.[id], owner: item } : null;
  }
  if (type === 'sign' || type === 'event') {
    const id = item.signId || item.dialogueId;
    return id ? { kind: 'dialogue', id, data: state.dialoguesData?.dialogues?.[id], owner: item } : null;
  }
  if (type === 'door') {
    const id = item.confirmId;
    return id ? { kind: 'confirm', id, data: state.dialoguesData?.confirms?.[id], owner: item } : null;
  }
  return null;
}

function setContentPanelVisibility(show) {
  if (!contentEditor) return;
  contentEditor.classList.toggle('hidden', !show);
}

function setContentControlsDisabled(disabled) {
  Object.values(contentFields).forEach(el => {
    if (el && 'disabled' in el) el.disabled = !!disabled;
  });
  if (buttons.applyContent) buttons.applyContent.disabled = !!disabled;
  if (buttons.copyContent) buttons.copyContent.disabled = !!disabled;
}

function hideContentRow(el, hidden) {
  if (!el) return;
  el.classList.toggle('hidden', !!hidden);
}

function renderContentEditor() {
  const target = getSelectedContentTarget();
  if (!target) {
    setContentPanelVisibility(false);
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
    hidden: '隠し要素本文'
  }[target.kind] || target.kind;
  contentKind.textContent = `${kindLabel}｜${target.id}${exists ? '' : '（未作成）'}`;
  contentHelp.textContent = exists
    ? '選択中オブジェクトに紐づく表示内容を編集できます。「内容を反映」後に下書き保存→ゲームで確認してください。'
    : '紐づくIDのデータが見つかりません。先にIDを既存データへ変更するか、JSON側へ追加してください。';
  contentFields.id.value = target.id || '';
  contentFields.title.value = '';
  contentFields.body.value = '';
  contentFields.linkLabel.value = '';
  contentFields.linkUrl.value = '';
  contentFields.json.value = '';
  hideContentRow(contentFields.linkLabelLabel, false);
  hideContentRow(contentFields.linkUrlLabel, false);
  hideContentRow(contentFields.jsonLabel, false);
  contentFields.titleLabel.firstChild.textContent = 'タイトル / 話者';
  contentFields.bodyLabel.firstChild.textContent = '本文';
  contentFields.linkLabelLabel.firstChild.textContent = 'リンクラベル / 補助項目';
  contentFields.linkUrlLabel.firstChild.textContent = 'URL / 補助項目';
  contentFields.jsonLabel.firstChild.textContent = '選択肢・項目・追加情報JSON';

  if (!exists) {
    setContentControlsDisabled(true);
    contentFields.id.disabled = false;
    return;
  }

  if (target.kind === 'dialogue') {
    contentFields.titleLabel.firstChild.textContent = '話者';
    contentFields.bodyLabel.firstChild.textContent = 'セリフ本文';
    contentFields.jsonLabel.firstChild.textContent = '選択肢JSON';
    contentFields.title.value = data.speaker || '';
    contentFields.body.value = data.text || '';
    contentFields.json.value = JSON.stringify(data.options || [{ label: '閉じる', type: 'close' }], null, 2);
    hideContentRow(contentFields.linkLabelLabel, true);
    hideContentRow(contentFields.linkUrlLabel, true);
  }

  if (target.kind === 'confirm') {
    contentFields.titleLabel.firstChild.textContent = '確認タイトル';
    contentFields.bodyLabel.firstChild.textContent = '確認本文';
    contentFields.linkLabelLabel.firstChild.textContent = 'YESボタン文言';
    contentFields.linkUrlLabel.firstChild.textContent = 'NOボタン文言';
    contentFields.title.value = data.title || '';
    contentFields.body.value = data.text || '';
    contentFields.linkLabel.value = data.yesLabel || '入る';
    contentFields.linkUrl.value = data.noLabel || 'やめる';
    hideContentRow(contentFields.jsonLabel, true);
  }

  if (target.kind === 'board') {
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
      linkBoardId: data.linkBoardId || '',
      extraLinkLabel: data.extraLinkLabel || ''
    }, null, 2);
  }

  if (target.kind === 'menu') {
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
  }

  if (target.kind === 'hidden') {
    contentFields.titleLabel.firstChild.textContent = '隠し要素タイトル';
    contentFields.bodyLabel.firstChild.textContent = '初回発見テキスト';
    contentFields.linkLabelLabel.firstChild.textContent = '再確認テキスト';
    contentFields.linkUrlLabel.firstChild.textContent = '体験メモに残す文';
    contentFields.jsonLabel.firstChild.textContent = '出現条件・曜日・stats JSON';
    contentFields.title.value = data.title || '';
    contentFields.body.value = data.text || '';
    contentFields.linkLabel.value = data.foundText || '';
    contentFields.linkUrl.value = data.log || '';
    contentFields.json.value = JSON.stringify({
      visibleDays: data.visibleDays || ['all'],
      visibleWhen: data.visibleWhen || null,
      stats: data.stats || {}
    }, null, 2);
  }

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
  pushHistory();
  const data = target.data;
  if (target.kind === 'dialogue') {
    data.speaker = contentFields.title.value.trim() || data.speaker || '';
    data.text = contentFields.body.value;
    data.options = Array.isArray(extra) ? extra : (extra?.options || data.options || [{ label: '閉じる', type: 'close' }]);
  }
  if (target.kind === 'confirm') {
    data.title = contentFields.title.value.trim() || data.title || '';
    data.text = contentFields.body.value;
    data.yesLabel = contentFields.linkLabel.value.trim() || '入る';
    data.noLabel = contentFields.linkUrl.value.trim() || 'やめる';
  }
  if (target.kind === 'board') {
    data.title = contentFields.title.value.trim() || data.title || '';
    data.body = contentFields.body.value;
    data.linkLabel = contentFields.linkLabel.value.trim();
    data.linkUrl = contentFields.linkUrl.value.trim();
    if (extra && typeof extra === 'object') {
      data.bodyByDay = extra.bodyByDay || {};
      data.linkBoardId = extra.linkBoardId || '';
      data.extraLinkLabel = extra.extraLinkLabel || '';
    }
  }
  if (target.kind === 'menu') {
    data.title = contentFields.title.value.trim() || data.title || '';
    data.note = contentFields.body.value;
    data.actionNote = contentFields.linkLabel.value.trim();
    if (extra && typeof extra === 'object') {
      data.items = Array.isArray(extra.items) ? extra.items : (data.items || []);
      data.itemsByDay = extra.itemsByDay || {};
      data.noteByDay = extra.noteByDay || {};
      data.actionIds = Array.isArray(extra.actionIds) ? extra.actionIds : (data.actionIds || []);
    }
  }
  if (target.kind === 'hidden') {
    data.title = contentFields.title.value.trim() || data.title || '';
    data.text = contentFields.body.value;
    data.foundText = contentFields.linkLabel.value;
    data.log = contentFields.linkUrl.value;
    if (extra && typeof extra === 'object') {
      data.visibleDays = Array.isArray(extra.visibleDays) ? extra.visibleDays : (data.visibleDays || ['all']);
      data.visibleWhen = extra.visibleWhen ?? null;
      data.stats = extra.stats || {};
    }
  }
  helpText.textContent = '紐づく内容を反映しました。ゲームで確認する場合は「下書き保存」→「ゲームで確認」を押してください。';
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
buttons.applyContent?.addEventListener('click', applyContentChanges);
buttons.copyContent?.addEventListener('click', copyContentJson);
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
