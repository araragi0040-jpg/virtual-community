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

const fields = {
  id: document.getElementById('fieldId'),
  label: document.getElementById('fieldLabel'),
  x: document.getElementById('fieldX'),
  y: document.getElementById('fieldY'),
  w: document.getElementById('fieldW'),
  h: document.getElementById('fieldH'),
  range: document.getElementById('fieldRange')
};

const buttons = {
  copySelected: document.getElementById('copySelectedButton'),
  downloadMaps: document.getElementById('downloadMapsButton'),
  downloadNpcs: document.getElementById('downloadNpcsButton'),
  downloadHidden: document.getElementById('downloadHiddenButton')
};

const state = {
  mapsData: null,
  npcsData: null,
  hiddenData: null,
  images: new Map(),
  mapId: '',
  layer: 'interactables',
  selectedKey: '',
  drag: null
};

function pctToPx(v) { return (v / 100) * canvas.width; }
function pxToPct(v) { return (v / canvas.width) * 100; }
function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, Number(v) || 0)); }
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
  return [];
}

function selectedEntity() {
  return entities().find(e => e.key === state.selectedKey) || null;
}

function colorFor(type) {
  return {
    door: '#69b6ff', exit: '#69b6ff', board: '#8fffe7', sign: '#ffb45a',
    menu: '#d995ff', event: '#ff7ac8', npc: '#fff36d', hidden: '#ffe65a'
  }[type] || '#ffffff';
}

function drawMap() {
  const map = currentMap();
  const img = state.images.get(map.image);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function drawAllOverlays() {
  const map = currentMap();
  ctx.save();
  ctx.lineWidth = 3;

  // マップ遷移範囲は常に赤で表示
  (map.transitions || []).forEach(t => {
    const [a, b] = t.range || [0, 100];
    ctx.fillStyle = 'rgba(255, 100, 100, 0.24)';
    if (t.edge === 'right') ctx.fillRect(pctToPx(96), pctToPx(a), pctToPx(4), pctToPx(b - a));
    if (t.edge === 'left') ctx.fillRect(0, pctToPx(a), pctToPx(4), pctToPx(b - a));
    if (t.edge === 'bottom') ctx.fillRect(pctToPx(a), pctToPx(96), pctToPx(b - a), pctToPx(4));
    if (t.edge === 'top') ctx.fillRect(pctToPx(a), 0, pctToPx(b - a), pctToPx(4));
  });

  for (const e of entities()) {
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
  fields.w.disabled = e.shape === 'point';
  fields.h.disabled = e.shape === 'point';
  outputBox.value = JSON.stringify(item, null, 2);
}

function renderAll() {
  drawMap();
  drawAllOverlays();
  renderList();
  renderForm();
}

function selectEntity(key) {
  state.selectedKey = key;
  renderAll();
}

function findEntityAt(p) {
  const list = entities().slice().reverse();
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

canvas.addEventListener('pointerdown', ev => {
  ev.preventDefault();
  canvas.setPointerCapture?.(ev.pointerId);
  const p = pointerPct(ev);
  const found = findEntityAt(p);
  if (found) selectEntity(found.key);
  const e = selectedEntity();
  if (!e) return;
  const item = e.ref;
  state.drag = {
    pointerId: ev.pointerId,
    key: e.key,
    shape: e.shape,
    offsetX: e.shape === 'point' ? p.x - item.x : p.x - item.x,
    offsetY: e.shape === 'point' ? p.y - item.y : p.y - item.y
  };
});

canvas.addEventListener('pointermove', ev => {
  if (!state.drag || state.drag.pointerId !== ev.pointerId) return;
  ev.preventDefault();
  const e = selectedEntity();
  if (!e || e.key !== state.drag.key) return;
  const item = e.ref;
  const p = pointerPct(ev);
  if (e.shape === 'point') {
    item.x = Number(clamp(p.x - state.drag.offsetX).toFixed(1));
    item.y = Number(clamp(p.y - state.drag.offsetY).toFixed(1));
  } else {
    item.x = Number(clamp(p.x - state.drag.offsetX, 0, 100 - (item.w || 0)).toFixed(1));
    item.y = Number(clamp(p.y - state.drag.offsetY, 0, 100 - (item.h || 0)).toFixed(1));
  }
  renderAll();
});

['pointerup','pointercancel','lostpointercapture'].forEach(type => canvas.addEventListener(type, () => { state.drag = null; }));

function applyFieldChanges() {
  const e = selectedEntity();
  if (!e) return;
  const item = e.ref;
  if (fields.label.value.trim()) {
    if ('label' in item || e.shape !== 'point') item.label = fields.label.value.trim();
    else item.name = fields.label.value.trim();
  }
  item.x = Number(clamp(fields.x.value).toFixed(1));
  item.y = Number(clamp(fields.y.value).toFixed(1));
  if (e.shape !== 'point') {
    item.w = Number(clamp(fields.w.value, 0.1, 100).toFixed(1));
    item.h = Number(clamp(fields.h.value, 0.1, 100).toFixed(1));
  }
  item.range = Number(clamp(fields.range.value, 0, 100).toFixed(1));
  renderAll();
}

Object.values(fields).forEach(input => input.addEventListener('input', applyFieldChanges));

mapSelect.addEventListener('change', () => {
  state.mapId = mapSelect.value;
  state.selectedKey = '';
  renderAll();
});

layerSelect.addEventListener('change', () => {
  state.layer = layerSelect.value;
  state.selectedKey = '';
  renderAll();
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
