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
  downloadHidden: document.getElementById('downloadHiddenButton')
};

const editorOptions = {
  showGrid: document.getElementById('showGridToggle'),
  snap: document.getElementById('snapToggle'),
  gridSize: document.getElementById('gridSizeSelect'),
  showBlocks: document.getElementById('showBlocksToggle'),
  showInteractables: document.getElementById('showInteractablesToggle'),
  showNpcs: document.getElementById('showNpcsToggle'),
  showHidden: document.getElementById('showHiddenToggle'),
  showTransitions: document.getElementById('showTransitionsToggle')
};

const state = {
  mapsData: null,
  npcsData: null,
  hiddenData: null,
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
  visibility: { blocks: true, interactables: true, npcs: true, hidden: true, transitions: true }
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

const DRAFT_KEY = 'vc4u_editor_draft_v018';
const PREVIEW_FLAG_KEY = 'vc4u_use_editor_draft_v018';
const HISTORY_LIMIT = 60;

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function snapshotData() {
  return {
    mapsData: deepClone(state.mapsData),
    npcsData: deepClone(state.npcsData),
    hiddenData: deepClone(state.hiddenData),
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
  state.mapId = snap.mapId || state.mapId;
  state.layer = snap.layer || state.layer;
  state.selectedKey = snap.selectedKey || '';
  mapSelect.value = state.mapId;
  layerSelect.value = state.layer;
  renderAll();
  updateHistoryButtons();
}

function pushHistory() {
  if (!state.mapsData || !state.npcsData || !state.hiddenData) return;
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
  const hasSelected = !!selectedEntity();
  if (buttons.duplicateEntity) buttons.duplicateEntity.disabled = !hasSelected;
  if (buttons.deleteEntity) buttons.deleteEntity.disabled = !hasSelected;
  if (buttons.copySelected) buttons.copySelected.disabled = !currentMap();
}

function makeDraft() {
  return {
    version: 'v020',
    savedAt: new Date().toISOString(),
    mapsData: state.mapsData,
    npcsData: state.npcsData,
    hiddenData: state.hiddenData
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
  const [mapsData, npcsData, hiddenData] = await Promise.all([
    loadJson('data/maps.json'),
    loadJson('data/npcs.json'),
    loadJson('data/hidden.json')
  ]);
  state.mapsData = mapsData;
  state.npcsData = npcsData;
  state.hiddenData = hiddenData;

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
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,.20)';
  for (let v = step; v < 100; v += step) {
    const px = pctToPx(v);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, px);
    ctx.lineTo(canvas.width, px);
    ctx.stroke();
  }
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
  list.forEach(e => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'entity-item' + (e.key === state.selectedKey ? ' active' : '');
    btn.textContent = `${e.ref.label || e.ref.name || e.key}｜${e.key}`;
    btn.addEventListener('click', () => selectEntity(e.key));
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
  fields.w.disabled = e.shape === 'point';
  fields.h.disabled = e.shape === 'point';
  fields.range.disabled = e.type === 'block';
  fields.type.disabled = e.type === 'npc' || e.type === 'hidden' || e.type === 'block';
  fields.target.disabled = e.type === 'hidden' || e.type === 'block';
  outputBox.value = JSON.stringify(item, null, 2);
  updateEntityButtons();
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
  validateCurrentMap();
  updateEntityButtons();
}

function selectEntity(key) {
  state.selectedKey = key;
  renderAll();
}

function findEntityAt(p) {
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
  renderAll();
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
