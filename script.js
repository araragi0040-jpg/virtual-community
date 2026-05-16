const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const titleScreen = document.getElementById('titleScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const actionButton = document.getElementById('actionButton');
const areaName = document.getElementById('areaName');
const hintText = document.getElementById('hintText');
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

const state = {
  data: null,
  images: new Map(),
  currentMapId: null,
  player: { x: 50, y: 72, dir: 'front', speed: 0.48 },
  pressed: new Set(),
  modalOpen: false,
  ready: false,
  lastHintId: ''
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
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function pointInRect(p, r, margin = 0) {
  return p.x >= r.x - margin && p.x <= r.x + r.w + margin && p.y >= r.y - margin && p.y <= r.y + r.h + margin;
}
function rectCenter(r) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }

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
  state.data.npcs.forEach(npc => imagePaths.add(npc.sprite));
  await Promise.all([...imagePaths].map(loadImage));

  state.ready = true;
  loading.classList.add('hidden');
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
  updateHint();
}

function resetGame() {
  setMap(state.data.initialMapId);
  closeModal();
}

function currentMap() { return state.data.maps[state.currentMapId]; }
function currentNpcs() { return state.data.npcs.filter(npc => npc.mapId === state.currentMapId); }

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

  next.x = Math.max(0, Math.min(100, next.x));
  next.y = Math.max(0, Math.min(100, next.y));

  if (isWalkable(next.x, next.y)) {
    state.player.x = next.x;
    state.player.y = next.y;
  }
  updateHint();
}

function nearestAction() {
  const p = { x: state.player.x, y: state.player.y };
  const candidates = [];

  for (const npc of currentNpcs()) {
    const d = distance(p, npc);
    if (d <= 14) candidates.push({ kind: 'npc', data: npc, distance: d, label: `${npc.name}と話す` });
  }

  for (const item of currentMap().interactables || []) {
    const c = rectCenter(item);
    const d = distance(p, c);
    const margin = item.type === 'door' || item.type === 'exit' ? 5 : 6;
    if (pointInRect(p, item, margin) || d <= 10) {
      candidates.push({ kind: item.type, data: item, distance: d, label: item.label });
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0] || null;
}

function updateHint() {
  if (!state.ready || state.modalOpen) return;
  const action = nearestAction();
  const text = action ? `調べる：${action.label}` : '近くの人・看板・扉・掲示板の前で「調べる」を押してください。';
  if (text !== state.lastHintId) {
    hintText.textContent = text;
    state.lastHintId = text;
  }
}

function doAction() {
  if (state.modalOpen) return;
  const action = nearestAction();
  if (!action) {
    showMessage('周囲', 'ここには、今は特に調べられるものはなさそうです。', [{ label: '閉じる', type: 'close' }]);
    return;
  }

  const item = action.data;
  if (action.kind === 'npc') return openDialogue(item.dialogueId);
  if (action.kind === 'sign') return openDialogue(item.signId);
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
function closeModal() { state.modalOpen = false; modal.classList.add('hidden'); updateHint(); }

function openDialogue(dialogueId) {
  const dialogue = state.data.dialogues[dialogueId];
  if (!dialogue) return showMessage('会話', '会話データが見つかりません。', [{ label: '閉じる', type: 'close' }]);
  showModal(dialogue.speaker, dialogue.text, dialogue.options || [{ label: '閉じる', type: 'close' }]);
}

function openBoard(boardId) {
  const board = state.data.boards[boardId];
  if (!board) return showMessage('掲示板', '掲示板データが見つかりません。', [{ label: '閉じる', type: 'close' }]);
  const choices = [];
  if (board.linkUrl) choices.push({ label: board.linkLabel || 'リンクを開く', type: 'link', url: board.linkUrl, className: 'link' });
  choices.push({ label: '閉じる', type: 'close', className: 'secondary' });
  showModal(board.title, board.body, choices);
}

function openMenu(menuId) {
  const menu = state.data.menus[menuId];
  if (!menu) return showMessage('メニュー', 'メニューデータが見つかりません。', [{ label: '閉じる', type: 'close' }]);
  const body = `${menu.note}\n\n${menu.items.map(item => `・${item}`).join('\n')}`;
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

function drawDebugAction() {
  const action = nearestAction();
  if (!action) return;
  const d = action.data;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 230, 100, 0.85)';
  ctx.lineWidth = 4;
  if (action.kind === 'npc') {
    ctx.beginPath();
    ctx.arc(pctToPx(d.x), pctToPx(d.y) - 34, 28, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeRect(pctToPx(d.x), pctToPx(d.y), pctToPx(d.w), pctToPx(d.h));
  }
  ctx.restore();
}

function render() {
  if (!state.ready) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();

  const sprites = currentNpcs().slice().sort((a, b) => a.y - b.y);
  sprites.forEach(npc => drawSprite(npc.sprite, npc.x, npc.y, 48, 64));

  drawSprite(PLAYER_SPRITES[state.player.dir] || PLAYER_SPRITES.front, state.player.x, state.player.y, 50, 66);
  drawDebugAction();
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

function setupControls() {
  startButton.addEventListener('click', () => {
    titleScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    updateHint();
  });
  resetButton.addEventListener('click', resetGame);
  actionButton.addEventListener('click', doAction);

  document.querySelectorAll('[data-dir]').forEach(btn => {
    const dir = btn.dataset.dir;
    const press = (e) => { e.preventDefault(); state.pressed.add(dir); };
    const release = (e) => { e.preventDefault(); state.pressed.delete(dir); };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
  });

  window.addEventListener('keydown', (e) => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    if (keyMap[e.key]) { e.preventDefault(); state.pressed.add(keyMap[e.key]); }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doAction(); }
    if (e.key === 'Escape') closeModal();
  });

  window.addEventListener('keyup', (e) => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    if (keyMap[e.key]) state.pressed.delete(keyMap[e.key]);
  });

  canvas.addEventListener('click', () => doAction());
}

setupControls();
boot().catch(err => {
  console.error(err);
  loading.textContent = '読み込みに失敗しました。ローカルで開く場合はLive Server等で起動してください。';
});
