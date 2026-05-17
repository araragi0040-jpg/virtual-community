const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const titleScreen = document.getElementById('titleScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const dayButton = document.getElementById('dayButton');
const debugButton = document.getElementById('debugButton');
const actionButton = document.getElementById('actionButton');
const areaName = document.getElementById('areaName');
const dayBadge = document.getElementById('dayBadge');
const hintText = document.getElementById('hintText');
const debugText = document.getElementById('debugText');
const loading = document.getElementById('loading');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalChoices = document.getElementById('modalChoices');

const DATA_URLS = {
  maps: 'data/maps.json',
  npcs: 'data/npcs.json',
  dialogues: 'data/dialogues.json',
  boards: 'data/boards.json',
  menus: 'data/menus.json'
};

// v004: 背景画像に人物が描き込まれているため、NPCスプライトは重ねず、近づいた時の！マーカーで会話可能地点を示す。
const SHOW_NPC_SPRITES = false;

const DAY_INFO = [
  { key: 'sun', label: '日曜', mood: '少し特別な空気' },
  { key: 'mon', label: '月曜', mood: 'ゆっくり始まる日' },
  { key: 'tue', label: '火曜', mood: 'いつもの街' },
  { key: 'wed', label: '水曜', mood: '折り返しの雑談日' },
  { key: 'thu', label: '木曜', mood: '週末前の静けさ' },
  { key: 'fri', label: '金曜', mood: '少しにぎやか' },
  { key: 'sat', label: '土曜', mood: 'イベントの予感' }
];

const state = {
  data: null,
  images: new Map(),
  currentMapId: null,
  player: { x: 50, y: 72, dir: 'front', speed: 0.48 },
  pressed: new Set(),
  modalOpen: false,
  ready: false,
  debug: false,
  lastHintId: '',
  lastPointer: null,
  todayIndex: new Date().getDay(),
  today: DAY_INFO[new Date().getDay()]
};

const DIRS = {
  up: { dx: 0, dy: -1, dir: 'back' },
  down: { dx: 0, dy: 1, dir: 'front' },
  left: { dx: -1, dy: 0, dir: 'left' },
  right: { dx: 1, dy: 0, dir: 'right' }
};

const PLAYER_SPRITES = {
  front: 'assets/characters/player_front.png',
  back: 'assets/characters/player_back.png',
  left: 'assets/characters/player_left.png',
  right: 'assets/characters/player_right.png'
};

function pctToPx(v) { return (v / 100) * canvas.width; }
function pxToPct(v) { return (v / canvas.width) * 100; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function pointInRect(p, r, margin = 0) {
  return p.x >= r.x - margin && p.x <= r.x + r.w + margin && p.y >= r.y - margin && p.y <= r.y + r.h + margin;
}
function rectCenter(r) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

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
    img.onerror = () => reject(new Error(`${src} を読み込めませんでした`));
    img.src = src;
  });
}

async function boot() {
  const [mapsData, npcsData, dialoguesData, boardsData, menusData] = await Promise.all([
    loadJson(DATA_URLS.maps), loadJson(DATA_URLS.npcs), loadJson(DATA_URLS.dialogues), loadJson(DATA_URLS.boards), loadJson(DATA_URLS.menus)
  ]);

  state.data = {
    maps: mapsData.maps,
    initialMapId: mapsData.initialMapId,
    npcs: npcsData.npcs,
    dialogues: dialoguesData.dialogues,
    confirms: dialoguesData.confirms,
    boards: boardsData.boards,
    menus: menusData.menus
  };

  const imagePaths = new Set();
  Object.values(state.data.maps).forEach(map => imagePaths.add(map.image));
  Object.values(PLAYER_SPRITES).forEach(src => imagePaths.add(src));
  if (SHOW_NPC_SPRITES) state.data.npcs.forEach(npc => imagePaths.add(npc.sprite));
  await Promise.all([...imagePaths].map(loadImage));

  state.ready = true;
  loading.classList.add('hidden');
  setDay(state.todayIndex);
  dayButton.textContent = '曜日切替';
  setMap(state.data.initialMapId);
  requestAnimationFrame(loop);
}

function setMap(mapId, spawn = null) {
  const map = state.data.maps[mapId];
  if (!map) return;
  state.currentMapId = mapId;
  const start = spawn || map.start || { x: 50, y: 50, dir: 'front' };
  state.player.x = start.x;
  state.player.y = start.y;
  state.player.dir = start.dir || state.player.dir || 'front';
  areaName.textContent = map.name;
  updateHint(true);
}

function resetGame() {
  setMap(state.data.initialMapId);
  closeModal();
}

function currentMap() { return state.data.maps[state.currentMapId]; }
function isVisibleByDay(entity) {
  const visibleDays = entity.visibleDays;
  if (!visibleDays || visibleDays.length === 0 || visibleDays.includes('all')) return true;
  return visibleDays.includes(state.today.key);
}
function currentInteractables() {
  return (currentMap().interactables || []).filter(isVisibleByDay);
}
function currentNpcs() {
  return state.data.npcs.filter(npc => npc.mapId === state.currentMapId && isVisibleByDay(npc));
}

function isWalkable(x, y) {
  const map = currentMap();
  if (!map.walkZones || map.walkZones.length === 0) return x >= 0 && x <= 100 && y >= 0 && y <= 100;
  return map.walkZones.some(z => pointInRect({ x, y }, z, 0));
}

function tryTransition(x, y) {
  const transitions = currentMap().transitions || [];
  for (const t of transitions) {
    const range = t.range || [0, 100];
    if (t.edge === 'right' && x > 100 && y >= range[0] && y <= range[1]) { setMap(t.targetMapId, t.spawn); return true; }
    if (t.edge === 'left' && x < 0 && y >= range[0] && y <= range[1]) { setMap(t.targetMapId, t.spawn); return true; }
    if (t.edge === 'bottom' && y > 100 && x >= range[0] && x <= range[1]) { setMap(t.targetMapId, t.spawn); return true; }
    if (t.edge === 'top' && y < 0 && x >= range[0] && x <= range[1]) { setMap(t.targetMapId, t.spawn); return true; }
  }
  return false;
}

function movePlayer(dx, dy, dir) {
  if (state.modalOpen) return;
  state.player.dir = dir;
  const next = { x: state.player.x + dx * state.player.speed, y: state.player.y + dy * state.player.speed };

  if (tryTransition(next.x, next.y)) return;

  next.x = clamp(next.x, 0, 100);
  next.y = clamp(next.y, 0, 100);

  if (isWalkable(next.x, next.y)) {
    state.player.x = next.x;
    state.player.y = next.y;
  }
  updateHint();
}

function getNpcDialogueId(npc) {
  if (!npc.dialogueByDay) return npc.dialogueId;
  return npc.dialogueByDay[state.today.key] || npc.dialogueByDay.default || npc.dialogueId;
}

function nearestAction() {
  const p = { x: state.player.x, y: state.player.y };
  const candidates = [];

  for (const npc of currentNpcs()) {
    const d = distance(p, npc);
    if (d <= (npc.range || 14)) candidates.push({ kind: 'npc', data: npc, distance: d, label: `${npc.name}と話す` });
  }

  for (const item of currentInteractables()) {
    const c = rectCenter(item);
    const d = distance(p, c);
    const margin = item.type === 'door' || item.type === 'exit' ? 5 : 6;
    if (pointInRect(p, item, margin) || d <= (item.range || 10)) {
      candidates.push({ kind: item.type, data: item, distance: d, label: item.label });
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0] || null;
}

function updateHint(force = false) {
  if (!state.ready || state.modalOpen) return;
  const action = nearestAction();
  const text = action ? `調べる：${action.label}` : '近くの人・看板・扉・掲示板の前で「調べる」を押してください。';
  if (force || text !== state.lastHintId) {
    hintText.textContent = text;
    state.lastHintId = text;
  }
  updateDebugText();
}

function updateDebugText() {
  if (!debugText) return;
  if (!state.debug) return;
  const action = nearestAction();
  const pointer = state.lastPointer ? ` / tap x=${state.lastPointer.x.toFixed(1)} y=${state.lastPointer.y.toFixed(1)}` : '';
  debugText.textContent = `map=${state.currentMapId} / player x=${state.player.x.toFixed(1)} y=${state.player.y.toFixed(1)} / action=${action ? action.label : 'なし'}${pointer}`;
}

function doAction() {
  if (state.modalOpen) return;
  const action = nearestAction();
  if (!action) {
    showMessage('周囲', 'ここには、今は特に調べられるものはなさそうです。', [{ label: '閉じる', type: 'close' }]);
    return;
  }

  const item = action.data;
  if (action.kind === 'npc') return openDialogue(getNpcDialogueId(item));
  if (action.kind === 'sign') return openDialogue(item.signId);
  if (action.kind === 'event') return openDialogue(item.dialogueId);
  if (action.kind === 'board') return openBoard(item.boardId);
  if (action.kind === 'menu') return openMenu(item.menuId);
  if (action.kind === 'door') return openConfirm(item.confirmId, item);
  if (action.kind === 'exit') return setMap(item.targetMapId, item.spawn);
}

function showModal(title, body, choices = []) {
  state.modalOpen = true;
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modalChoices.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice.label;
    if (choice.className) btn.classList.add(choice.className);
    btn.addEventListener('click', () => handleChoice(choice));
    modalChoices.appendChild(btn);
  });
  modal.classList.remove('hidden');
}

function showMessage(title, body, choices) { showModal(title, body, choices); }
function closeModal() { state.modalOpen = false; modal.classList.add('hidden'); updateHint(true); }

function openDialogue(dialogueId) {
  const dialogue = state.data.dialogues[dialogueId];
  if (!dialogue) return showMessage('会話', '会話データが見つかりません。', [{ label: '閉じる', type: 'close' }]);
  showModal(dialogue.speaker, dialogue.text, dialogue.options || [{ label: '閉じる', type: 'close' }]);
}

function openBoard(boardId) {
  const board = state.data.boards[boardId];
  if (!board) return showMessage('掲示板', '掲示板データが見つかりません。', [{ label: '閉じる', type: 'close' }]);
  const dayKey = state.today.key;
  const body = (board.bodyByDay && board.bodyByDay[dayKey]) || board.body;
  const linkLabel = (board.linkLabelByDay && board.linkLabelByDay[dayKey]) || board.linkLabel || 'リンクを開く';
  const linkUrl = (board.linkUrlByDay && board.linkUrlByDay[dayKey]) || board.linkUrl;
  const choices = [];
  if (linkUrl) choices.push({ label: linkLabel, type: 'link', url: linkUrl, className: 'link' });
  choices.push({ label: '閉じる', type: 'close', className: 'secondary' });
  showModal(board.title, body, choices);
}

function openMenu(menuId) {
  const menu = state.data.menus[menuId];
  if (!menu) return showMessage('メニュー', 'メニューデータが見つかりません。', [{ label: '閉じる', type: 'close' }]);
  const dayKey = state.today.key;
  const note = (menu.noteByDay && menu.noteByDay[dayKey]) || menu.note;
  const items = (menu.itemsByDay && menu.itemsByDay[dayKey]) || menu.items || [];
  const body = `${note}\n\n${items.map(item => `・${item}`).join('\n')}`;
  showModal(menu.title, body, [{ label: '閉じる', type: 'close' }]);
}

function openConfirm(confirmId, item) {
  const confirm = state.data.confirms[confirmId] || { title: item.label, text: `${item.label}しますか？`, yesLabel: 'はい', noLabel: 'いいえ' };
  showModal(confirm.title, confirm.text, [
    { label: confirm.yesLabel || 'はい', type: 'map', targetMapId: item.targetMapId, spawn: item.spawn },
    { label: confirm.noLabel || 'いいえ', type: 'close', className: 'secondary' }
  ]);
}

function handleChoice(choice) {
  if (choice.type === 'close') return closeModal();
  if (choice.type === 'dialogue') return openDialogue(choice.targetId);
  if (choice.type === 'board') return openBoard(choice.targetId);
  if (choice.type === 'menu') return openMenu(choice.targetId);
  if (choice.type === 'map') { closeModal(); setMap(choice.targetMapId, choice.spawn); return; }
  if (choice.type === 'link') { window.open(choice.url, '_blank', 'noopener,noreferrer'); return; }
  closeModal();
}

function drawMap() {
  const map = currentMap();
  const img = state.images.get(map.image);
  if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function drawSprite(src, xPct, yPct, widthPx = 52, heightPx = 68) {
  const img = state.images.get(src);
  if (!img) return;
  const x = pctToPx(xPct) - widthPx / 2;
  const y = pctToPx(yPct) - heightPx;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(img, x, y, widthPx, heightPx);
  ctx.restore();
}

function drawMarker(xPct, yPct, text = '!') {
  const x = pctToPx(xPct);
  const y = pctToPx(yPct);
  ctx.save();
  ctx.fillStyle = 'rgba(20, 12, 5, 0.78)';
  ctx.strokeStyle = '#f4d15f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 56, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff8d8';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - 57);
  ctx.restore();
}

function drawNearestMarker() {
  const action = nearestAction();
  if (!action) return;
  if (action.kind === 'npc') return drawMarker(action.data.x, action.data.y, '!');
  const c = rectCenter(action.data);
  drawMarker(c.x, c.y + 5, '!');
}

function drawDebugOverlay() {
  if (!state.debug) return;
  const map = currentMap();
  ctx.save();
  ctx.lineWidth = 3;

  // walk zones
  ctx.strokeStyle = 'rgba(120, 255, 120, 0.6)';
  (map.walkZones || []).forEach(z => ctx.strokeRect(pctToPx(z.x), pctToPx(z.y), pctToPx(z.w), pctToPx(z.h)));

  // interactables
  currentInteractables().forEach(item => {
    const colors = {
      door: 'rgba(80, 180, 255, 0.9)',
      exit: 'rgba(80, 180, 255, 0.9)',
      npc: 'rgba(255, 255, 120, 0.9)',
      board: 'rgba(120, 255, 220, 0.9)',
      sign: 'rgba(255, 180, 90, 0.9)',
      menu: 'rgba(220, 150, 255, 0.9)',
      event: 'rgba(255, 120, 200, 0.9)'
    };
    ctx.strokeStyle = colors[item.type] || 'rgba(255,255,255,0.9)';
    ctx.strokeRect(pctToPx(item.x), pctToPx(item.y), pctToPx(item.w), pctToPx(item.h));
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = colors[item.type] || '#fff';
    ctx.fillText(item.id, pctToPx(item.x), pctToPx(item.y) - 4);
  });

  // npcs
  currentNpcs().forEach(npc => {
    ctx.strokeStyle = 'rgba(255, 255, 100, 0.9)';
    ctx.beginPath();
    ctx.arc(pctToPx(npc.x), pctToPx(npc.y), pctToPx((npc.range || 14) / 2), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 100, 0.95)';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(npc.id, pctToPx(npc.x) + 8, pctToPx(npc.y) - 8);
  });

  // transitions
  (map.transitions || []).forEach(t => {
    const [a, b] = t.range || [0, 100];
    ctx.fillStyle = 'rgba(255, 100, 100, 0.24)';
    if (t.edge === 'right') ctx.fillRect(pctToPx(96), pctToPx(a), pctToPx(4), pctToPx(b - a));
    if (t.edge === 'left') ctx.fillRect(0, pctToPx(a), pctToPx(4), pctToPx(b - a));
    if (t.edge === 'bottom') ctx.fillRect(pctToPx(a), pctToPx(96), pctToPx(b - a), pctToPx(4));
    if (t.edge === 'top') ctx.fillRect(pctToPx(a), 0, pctToPx(b - a), pctToPx(4));
  });

  // player coordinate crosshair
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`P ${state.player.x.toFixed(1)},${state.player.y.toFixed(1)}`, pctToPx(state.player.x) + 10, pctToPx(state.player.y) + 10);
  ctx.restore();
}

function render() {
  if (!state.ready) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();

  if (SHOW_NPC_SPRITES) {
    const sprites = currentNpcs().slice().sort((a, b) => a.y - b.y);
    sprites.forEach(npc => drawSprite(npc.sprite, npc.x, npc.y, 48, 64));
  }

  drawSprite(PLAYER_SPRITES[state.player.dir] || PLAYER_SPRITES.front, state.player.x, state.player.y, 50, 66);
  drawNearestMarker();
  drawDebugOverlay();
}

function loop() {
  if (state.ready && !state.modalOpen) {
    const directions = [...state.pressed].filter(dir => DIRS[dir]);
    if (directions.length) {
      const last = directions[directions.length - 1];
      const d = DIRS[last];
      movePlayer(d.dx, d.dy, d.dir);
    }
  }
  render();
  requestAnimationFrame(loop);
}

function setDay(index) {
  state.todayIndex = (index + DAY_INFO.length) % DAY_INFO.length;
  state.today = DAY_INFO[state.todayIndex];
  dayBadge.textContent = `${state.today.label}｜${state.today.mood}`;
  dayButton.textContent = '曜日切替';
  updateHint(true);
  render();
}

function cycleDay() {
  setDay(state.todayIndex + 1);
}

function toggleDebug() {
  state.debug = !state.debug;
  debugButton.textContent = state.debug ? '座標ON' : '座標OFF';
  debugText.classList.toggle('hidden', !state.debug);
  updateDebugText();
}

function canvasPointToPct(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
  };
}

function setupControls() {
  startButton.addEventListener('click', () => {
    titleScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    updateHint(true);
  });
  resetButton.addEventListener('click', resetGame);
  dayButton.addEventListener('click', cycleDay);
  debugButton.addEventListener('click', toggleDebug);
  actionButton.addEventListener('click', doAction);

  document.querySelectorAll('[data-dir]').forEach(btn => {
    const dir = btn.dataset.dir;
    const press = (e) => {
      e.preventDefault();
      if (btn.setPointerCapture && e.pointerId != null) {
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      }
      state.pressed.add(dir);
    };
    const release = (e) => {
      if (e) e.preventDefault();
      state.pressed.delete(dir);
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('lostpointercapture', release);
  });

  // 長押し時の文字選択・コンテキストメニューを抑止
  const preventSelection = (e) => e.preventDefault();
  document.querySelector('.controls').addEventListener('contextmenu', preventSelection);
  document.querySelector('.controls').addEventListener('selectstart', preventSelection);
  document.querySelector('.canvas-wrap').addEventListener('contextmenu', preventSelection);
  window.addEventListener('pointerup', () => state.pressed.clear());
  window.addEventListener('blur', () => state.pressed.clear());

  window.addEventListener('keydown', (e) => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    if (keyMap[e.key]) { e.preventDefault(); state.pressed.add(keyMap[e.key]); }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doAction(); }
    if (e.key === 'Escape' && state.modalOpen) closeModal();
    if (e.key === '`' || e.key === 'Tab') { e.preventDefault(); toggleDebug(); }
    if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); cycleDay(); }
  });

  window.addEventListener('keyup', (e) => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    if (keyMap[e.key]) state.pressed.delete(keyMap[e.key]);
  });

  canvas.addEventListener('pointerdown', (e) => {
    state.lastPointer = canvasPointToPct(e);
    updateDebugText();
  });
  canvas.addEventListener('click', () => doAction());
}

setupControls();
boot().catch(err => {
  console.error(err);
  loading.textContent = '読み込みに失敗しました。ローカルで開く場合はLive Server等で起動してください。';
});
