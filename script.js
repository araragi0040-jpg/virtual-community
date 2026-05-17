const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const titleScreen = document.getElementById('titleScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const menuButton = document.getElementById('menuButton');
const topActions = document.getElementById('topActions');
const memoButton = document.getElementById('memoButton');
const achievementButton = document.getElementById('achievementButton');
const dayButton = document.getElementById('dayButton');
const debugButton = document.getElementById('debugButton');
const actionButton = document.getElementById('actionButton');
const areaName = document.getElementById('areaName');
const dayBadge = document.getElementById('dayBadge');
const experienceBadge = document.getElementById('experienceBadge');
const achievementBadge = document.getElementById('achievementBadge');
const hintText = document.getElementById('hintText');
const debugText = document.getElementById('debugText');
const loading = document.getElementById('loading');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalChoices = document.getElementById('modalChoices');
const modalXButton = document.getElementById('modalXButton');

// v010: スマホでボタン操作が固まらないよう、tap処理とモーダル操作を再設計。
const DATA_URLS = {
  maps: 'data/maps.json',
  npcs: 'data/npcs.json',
  dialogues: 'data/dialogues.json',
  boards: 'data/boards.json',
  menus: 'data/menus.json',
  actions: 'data/actions.json',
  achievements: 'data/achievements.json',
  hidden: 'data/hidden.json'
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
  today: DAY_INFO[new Date().getDay()],
  experience: createEmptyExperience()
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


function createEmptyExperience() {
  return {
    stats: { talk: 0, drink: 0, food: 0, karaoke: 0, event: 0, relax: 0 },
    actionCounts: {},
    visitedMaps: {},
    hiddenFound: {},
    achievements: [],
    log: []
  };
}

function pctToPx(v) { return (v / 100) * canvas.width; }
function pxToPct(v) { return (v / canvas.width) * 100; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function pointInRect(p, r, margin = 0) {
  return p.x >= r.x - margin && p.x <= r.x + r.w + margin && p.y >= r.y - margin && p.y <= r.y + r.h + margin;
}
function rectCenter(r) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function loadExperience() {
  try {
    // v007から称号・実績・隠し要素を保存。v006の体験メモがあれば移行する。
    const raw = localStorage.getItem('vc4u_experience_v007') || localStorage.getItem('vc4u_experience_v006');
    if (!raw) return;
    const saved = JSON.parse(raw);
    const empty = createEmptyExperience();
    state.experience.stats = { ...empty.stats, ...(saved.stats || {}) };
    state.experience.actionCounts = { ...(saved.actionCounts || {}) };
    state.experience.visitedMaps = { ...(saved.visitedMaps || {}) };
    state.experience.hiddenFound = { ...(saved.hiddenFound || {}) };
    state.experience.achievements = Array.isArray(saved.achievements) ? saved.achievements : [];
    state.experience.log = Array.isArray(saved.log) ? saved.log.slice(0, 40) : [];
  } catch (_) {}
}

function saveExperience() {
  try {
    localStorage.setItem('vc4u_experience_v007', JSON.stringify(state.experience));
  } catch (_) {}
}

function totalExperienceCount() {
  return Object.values(state.experience.stats).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function updateExperienceBadge() {
  if (experienceBadge) experienceBadge.textContent = `体験 ${totalExperienceCount()}`;
  updateAchievementBadge();
}

function updateAchievementBadge() {
  if (!achievementBadge || !state.data || !state.data.achievements) return;
  const total = state.data.achievements.length;
  const unlocked = state.experience.achievements.length;
  achievementBadge.textContent = `実績 ${unlocked}/${total}`;
}

function resetExperience() {
  state.experience = createEmptyExperience();
  saveExperience();
  updateExperienceBadge();
}

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
  const [mapsData, npcsData, dialoguesData, boardsData, menusData, actionsData, achievementsData, hiddenData] = await Promise.all([
    loadJson(DATA_URLS.maps), loadJson(DATA_URLS.npcs), loadJson(DATA_URLS.dialogues), loadJson(DATA_URLS.boards), loadJson(DATA_URLS.menus), loadJson(DATA_URLS.actions),
    loadJson(DATA_URLS.achievements), loadJson(DATA_URLS.hidden)
  ]);

  state.data = {
    maps: mapsData.maps,
    initialMapId: mapsData.initialMapId,
    npcs: npcsData.npcs,
    dialogues: dialoguesData.dialogues,
    confirms: dialoguesData.confirms,
    boards: boardsData.boards,
    menus: menusData.menus,
    actions: actionsData.actions,
    achievements: achievementsData.achievements || [],
    hiddenSpots: hiddenData.hiddenSpots || []
  };

  const imagePaths = new Set();
  Object.values(state.data.maps).forEach(map => imagePaths.add(map.image));
  Object.values(PLAYER_SPRITES).forEach(src => imagePaths.add(src));
  if (SHOW_NPC_SPRITES) state.data.npcs.forEach(npc => imagePaths.add(npc.sprite));
  await Promise.all([...imagePaths].map(loadImage));

  state.ready = true;
  loadExperience();
  updateExperienceBadge();

  // v005 fix: currentMapId が未設定の状態で render() が走ると、
  // マップ画像を参照できず黒画面になるため、先に初期マップをセットする。
  setMap(state.data.initialMapId);
  setDay(state.todayIndex);
  dayButton.textContent = '曜日切替';
  loading.classList.add('hidden');

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
  recordMapVisit(mapId);
  updateHint(true);
}

function resetGame() {
  closeActionDrawer();
  setMap(state.data.initialMapId);
  closeModal();
}

function currentMap() {
  if (!state.data || !state.currentMapId) return null;
  return state.data.maps[state.currentMapId] || null;
}
function isVisibleByDay(entity) {
  const visibleDays = entity.visibleDays;
  if (!visibleDays || visibleDays.length === 0 || visibleDays.includes('all')) return true;
  return visibleDays.includes(state.today.key);
}
function currentInteractables() {
  const map = currentMap();
  if (!map) return [];
  return [ ...(map.interactables || []).filter(isVisibleByDay), ...currentHiddenSpots() ];
}
function currentNpcs() {
  return state.data.npcs.filter(npc => npc.mapId === state.currentMapId && isVisibleByDay(npc));
}

function recordMapVisit(mapId) {
  if (!state.experience || !mapId) return;
  state.experience.visitedMaps[mapId] = (state.experience.visitedMaps[mapId] || 0) + 1;
  saveExperience();
  const newly = evaluateAchievements();
  if (newly.length && state.ready && !state.modalOpen) updateHint(true);
}

function evaluateCondition(condition) {
  if (!condition) return true;
  if (Array.isArray(condition.all)) return condition.all.every(evaluateCondition);
  if (Array.isArray(condition.any)) return condition.any.some(evaluateCondition);
  if (condition.not) return !evaluateCondition(condition.not);

  const exp = state.experience || createEmptyExperience();
  const stats = exp.stats || {};
  const actionCounts = exp.actionCounts || {};
  const visitedMaps = exp.visitedMaps || {};
  const hiddenFound = exp.hiddenFound || {};

  switch (condition.type) {
    case 'statAtLeast':
      return (stats[condition.stat] || 0) >= Number(condition.value || 0);
    case 'totalAtLeast':
      return totalExperienceCount() >= Number(condition.value || 0);
    case 'actionAtLeast':
      return (actionCounts[condition.actionId] || 0) >= Number(condition.value || 0);
    case 'visitedMap':
      return (visitedMaps[condition.mapId] || 0) > 0;
    case 'hiddenFound':
      return !!hiddenFound[condition.hiddenId];
    case 'hiddenCountAtLeast':
      return Object.values(hiddenFound).filter(Boolean).length >= Number(condition.value || 0);
    case 'achievementUnlocked':
      return (exp.achievements || []).includes(condition.achievementId);
    case 'dayIs':
      return state.today && state.today.key === condition.day;
    default:
      return true;
  }
}

function currentHiddenSpots() {
  if (!state.data || !state.data.hiddenSpots) return [];
  return state.data.hiddenSpots
    .filter(spot => spot.mapId === state.currentMapId)
    .filter(isVisibleByDay)
    .filter(spot => evaluateCondition(spot.visibleWhen))
    .map(spot => ({
      id: spot.id,
      type: 'hidden',
      label: spot.label || spot.title || '隠し要素',
      x: spot.x,
      y: spot.y,
      w: spot.w,
      h: spot.h,
      range: spot.range || 10,
      hiddenId: spot.id
    }));
}

function getAchievement(id) {
  return (state.data.achievements || []).find(a => a.id === id);
}

function evaluateAchievements() {
  if (!state.data || !state.data.achievements) return [];
  const newly = [];
  for (const achievement of state.data.achievements) {
    if ((state.experience.achievements || []).includes(achievement.id)) continue;
    if (evaluateCondition(achievement.condition)) {
      state.experience.achievements.push(achievement.id);
      const stamp = makeStamp();
      state.experience.log.unshift({ text: `実績獲得：${achievement.title}`, stamp, mapId: state.currentMapId });
      newly.push(achievement);
    }
  }
  if (newly.length) {
    saveExperience();
    updateAchievementBadge();
  }
  return newly;
}

function formatUnlockedAchievements(achievements) {
  if (!achievements || achievements.length === 0) return '';
  return '\n\n---\n新しく開放：\n' + achievements.map(a => `★ ${a.title}\n${a.rewardText || a.description || ''}`).join('\n');
}

function makeStamp() {
  const now = new Date();
  return `${state.today.label} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function isWalkable(x, y) {
  const map = currentMap();
  if (!map) return false;
  if (!map.walkZones || map.walkZones.length === 0) return x >= 0 && x <= 100 && y >= 0 && y <= 100;
  return map.walkZones.some(z => pointInRect({ x, y }, z, 0));
}

function tryTransition(x, y) {
  const map = currentMap();
  if (!map) return false;
  const transitions = map.transitions || [];
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
  if (action.kind === 'hidden') return openHidden(item.hiddenId);
  if (action.kind === 'board') return openBoard(item.boardId);
  if (action.kind === 'menu') return openMenu(item.menuId);
  if (action.kind === 'door') return openConfirm(item.confirmId, item);
  if (action.kind === 'exit') return setMap(item.targetMapId, item.spawn);
}

function showModal(title, body, choices = [], options = {}) {
  state.modalOpen = true;
  modal.classList.toggle('long-modal', !!options.long);
  closeActionDrawer();
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modalBody.scrollTop = 0;
  modalChoices.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice.label;
    if (choice.className) btn.classList.add(choice.className);
    bindTap(btn, (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleChoice(choice);
    });
    modalChoices.appendChild(btn);
  });
  modal.classList.remove('hidden');
}

function showMessage(title, body, choices) { showModal(title, body, choices); }
function closeModal() {
  state.modalOpen = false;
  state.pressed.clear();
  modal.classList.remove('long-modal');
  modal.classList.add('hidden');
  updateHint(true);
}

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
  const actionNote = menu.actionNote ? `\n\n${menu.actionNote}` : '';
  const body = `${note}\n\n${items.map(item => `・${item}`).join('\n')}${actionNote}`;
  const choices = [];
  (menu.actionIds || []).forEach(actionId => {
    const action = state.data.actions[actionId];
    if (action) choices.push({ label: `▶ ${action.title}`, type: 'action', targetId: actionId, className: 'link' });
  });
  choices.push({ label: '閉じる', type: 'close', className: 'secondary' });
  showModal(menu.title, body, choices);
}

function openAction(actionId) {
  const action = state.data.actions[actionId];
  if (!action) return showMessage('アクション', 'アクションデータが見つかりません。', [{ label: '閉じる', type: 'close' }]);
  Object.entries(action.stats || {}).forEach(([key, value]) => {
    state.experience.stats[key] = (state.experience.stats[key] || 0) + Number(value || 0);
  });
  state.experience.actionCounts[actionId] = (state.experience.actionCounts[actionId] || 0) + 1;
  const stamp = makeStamp();
  state.experience.log.unshift({ text: action.log || action.title, stamp, mapId: state.currentMapId });
  state.experience.log = state.experience.log.slice(0, 30);
  saveExperience();
  updateExperienceBadge();
  const newly = evaluateAchievements();
  showModal(action.resultTitle || action.title, (action.resultText || '少しだけ、この場所の空気を味わった。') + formatUnlockedAchievements(newly), [
    { label: '体験メモを見る', type: 'memo', className: 'link' },
    { label: '実績を見る', type: 'achievements', className: 'achievement' },
    { label: '閉じる', type: 'close', className: 'secondary' }
  ]);
}

function openHidden(hiddenId) {
  const hidden = (state.data.hiddenSpots || []).find(spot => spot.id === hiddenId);
  if (!hidden) return showMessage('隠し要素', '隠し要素データが見つかりません。', [{ label: '閉じる', type: 'close' }]);
  const alreadyFound = !!state.experience.hiddenFound[hiddenId];
  let body = alreadyFound ? (hidden.foundText || hidden.text) : hidden.text;

  if (!alreadyFound) {
    state.experience.hiddenFound[hiddenId] = true;
    Object.entries(hidden.stats || {}).forEach(([key, value]) => {
      state.experience.stats[key] = (state.experience.stats[key] || 0) + Number(value || 0);
    });
    state.experience.log.unshift({ text: hidden.log || `隠し要素を発見：${hidden.title}`, stamp: makeStamp(), mapId: state.currentMapId });
    state.experience.log = state.experience.log.slice(0, 40);
    saveExperience();
    updateExperienceBadge();
    const newly = evaluateAchievements();
    body += formatUnlockedAchievements(newly);
  }

  showModal(hidden.title || '隠し要素', body, [
    { label: '実績を見る', type: 'achievements', className: 'achievement' },
    { label: '閉じる', type: 'close', className: 'secondary' }
  ]);
}

function openAchievements() {
  const unlockedIds = new Set(state.experience.achievements || []);
  const lines = (state.data.achievements || []).map(a => {
    const mark = unlockedIds.has(a.id) ? '★' : '□';
    const kind = a.kind === 'title' ? '称号' : '実績';
    const desc = unlockedIds.has(a.id) ? a.description : (a.lockedHint || '条件未達成');
    return `${mark} ${a.title}（${kind}）\n${desc}`;
  });
  const hiddenTotal = (state.data.hiddenSpots || []).length;
  const hiddenCount = Object.values(state.experience.hiddenFound || {}).filter(Boolean).length;
  const body = `開放済み：${unlockedIds.size}/${(state.data.achievements || []).length}\n隠し要素：${hiddenCount}/${hiddenTotal}\n\n${lines.join('\n\n')}`;
  showModal('称号・実績', body, [
    { label: '体験メモを見る', type: 'memo', className: 'link' },
    { label: '閉じる', type: 'close', className: 'secondary' }
  ], { long: true });
}

function openMemo() {
  const s = state.experience.stats;
  const total = totalExperienceCount();
  const logLines = state.experience.log.length
    ? state.experience.log.slice(0, 8).map(item => `・${item.stamp}　${item.text}`).join('\n')
    : 'まだ体験メモはありません。店内メニューから行動を選んでみてください。';
  const body = `合計体験値：${total}\n\n会話：${s.talk || 0}\nドリンク：${s.drink || 0}\nフード：${s.food || 0}\nカラオケ：${s.karaoke || 0}\nイベント気配：${s.event || 0}\n休憩：${s.relax || 0}\n\n最近の体験\n${logLines}`;
  showModal('体験メモ', body, [
    { label: '称号・実績を見る', type: 'achievements', className: 'achievement' },
    { label: 'メモをリセット', type: 'resetExperience', className: 'secondary' },
    { label: '閉じる', type: 'close' }
  ]);
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
  if (choice.type === 'action') return openAction(choice.targetId);
  if (choice.type === 'memo') return openMemo();
  if (choice.type === 'achievements') return openAchievements();
  if (choice.type === 'resetExperience') { resetExperience(); return openMemo(); }
  if (choice.type === 'map') { closeModal(); setMap(choice.targetMapId, choice.spawn); return; }
  if (choice.type === 'link') { window.open(choice.url, '_blank', 'noopener,noreferrer'); return; }
  closeModal();
}

function drawMap() {
  const map = currentMap();
  if (!map) {
    ctx.fillStyle = '#0f0d0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const img = state.images.get(map.image);
  if (img) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#0f0d0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
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
  if (!map) return;
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
      event: 'rgba(255, 120, 200, 0.9)',
      hidden: 'rgba(255, 230, 80, 0.95)'
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
  if (!state.ready || !state.currentMapId) return;
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

function bindTap(el, handler) {
  if (!el) return;
  let lastPointerUpAt = 0;
  let pointerStarted = false;

  const run = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handler(e);
  };

  el.addEventListener('pointerdown', (e) => {
    pointerStarted = true;
    // ボタン操作がブラウザの選択・長押しメニューに奪われないようにする。
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });

  el.addEventListener('pointerup', (e) => {
    if (!pointerStarted) return;
    pointerStarted = false;
    lastPointerUpAt = Date.now();
    run(e);
  }, { passive: false });

  el.addEventListener('pointercancel', () => { pointerStarted = false; });
  el.addEventListener('lostpointercapture', () => { pointerStarted = false; });

  // 一部ブラウザのフォールバック。pointerup直後の互換clickは無視する。
  el.addEventListener('click', (e) => {
    if (Date.now() - lastPointerUpAt < 450) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    run(e);
  }, { passive: false });
}

function setupControls() {
  bindTap(startButton, () => {
    titleScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    updateHint(true);
  });
  bindTap(resetButton, resetGame);
  bindTap(memoButton, openMemo);
  bindTap(achievementButton, openAchievements);
  bindTap(dayButton, cycleDay);
  bindTap(debugButton, toggleDebug);
  bindTap(actionButton, doAction);
  bindTap(menuButton, () => toggleActionDrawer());
  bindTap(modalXButton, closeModal);

  // メニュー外をタップしたら閉じる。ただしモーダル表示中は何もしない。
  document.addEventListener('pointerdown', (e) => {
    if (state.modalOpen) return;
    if (!topActions || !menuButton) return;
    if (topActions.contains(e.target) || menuButton.contains(e.target)) return;
    closeActionDrawer();
  }, { passive: true });

  // モーダル背景タップで閉じる。内部操作は止める。
  const modalPanel = document.querySelector('.modal-panel');
  ['pointerdown', 'pointerup', 'click'].forEach(type => {
    modalPanel.addEventListener(type, (e) => e.stopPropagation());
  });
  modal.addEventListener('pointerup', (e) => {
    if (e.target === modal) closeModal();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.querySelectorAll('[data-dir]').forEach(btn => {
    const dir = btn.dataset.dir;
    const press = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.setPointerCapture && e.pointerId != null) {
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      }
      state.pressed.add(dir);
    };
    const release = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      state.pressed.delete(dir);
    };
    btn.addEventListener('pointerdown', press, { passive: false });
    btn.addEventListener('pointerup', release, { passive: false });
    btn.addEventListener('pointercancel', release, { passive: false });
    btn.addEventListener('pointerleave', release, { passive: false });
    btn.addEventListener('lostpointercapture', release, { passive: false });
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
    if (e.key === 'Escape') { if (state.modalOpen) closeModal(); else closeActionDrawer(); }
    if (e.key === '`' || e.key === 'Tab') { e.preventDefault(); toggleDebug(); }
    if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); cycleDay(); }
    if (e.key === 'm' || e.key === 'M') { e.preventDefault(); openMemo(); }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); openAchievements(); }
  });

  window.addEventListener('keyup', (e) => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    if (keyMap[e.key]) state.pressed.delete(keyMap[e.key]);
  });

  canvas.addEventListener('pointerdown', (e) => {
    state.lastPointer = canvasPointToPct(e);
    updateDebugText();
  });
  bindTap(canvas, () => doAction());
}


setupControls();
boot().catch(err => {
  console.error(err);
  loading.textContent = '読み込みに失敗しました。ローカルで開く場合はLive Server等で起動してください。';
});
