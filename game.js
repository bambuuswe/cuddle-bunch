// =============================================
//  GAME.JS – main game screen logic
// =============================================

const DRAIN_TICK    = 4000;
const DRAIN_AMT     = 2;
const SLEEP_RESTORE = 3;
const FEED_BOOST    = 25;
const PLAY_COST     = 8;
const TV_COST       = 4;
const FEED_CD       = 10000;

let animals   = [];
let activeId  = null;
let activeTab = 'feed';
let sceneCleanup = null;

// ── STORAGE ─────────────────────────────────
function loadAnimals() {
  try { return JSON.parse(localStorage.getItem('cuddleBunch') || '[]'); }
  catch { return []; }
}
function saveAnimals() {
  localStorage.setItem('cuddleBunch', JSON.stringify(animals));
}

// ── DARK MODE ────────────────────────────────
function toggleDark() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('cuddleDark', isDark ? '1' : '0');
  document.getElementById('toggleIcon').textContent = isDark ? '☀️' : '🌙';
}
function initDark() {
  if (localStorage.getItem('cuddleDark') === '1') {
    document.body.classList.add('dark');
    const icon = document.getElementById('toggleIcon');
    if (icon) icon.textContent = '☀️';
  }
}

// ── INIT ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initDark();
  const sc = document.getElementById('stars');
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 4 + 2;
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--dur:${(Math.random()*3+2).toFixed(1)}s;animation-delay:${(Math.random()*5).toFixed(1)}s`;
    sc.appendChild(s);
  }
  const hl = document.getElementById('headerLogo');
  if (hl) hl.innerHTML = buildAnimalHTML('bear', false, 38);
  animals = loadAnimals();
  renderGrid();
  startLoop();
});

// ── RENDER GRID ──────────────────────────────
function renderGrid() {
  const grid  = document.getElementById('animalGrid');
  const empty = document.getElementById('emptyState');
  if (animals.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    const eb = document.getElementById('emptyBear');
    if (eb) eb.innerHTML = buildAnimalHTML('bear', false, 90);
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = '';
  animals.forEach(a => {
    const card = document.createElement('div');
    card.className = 'animal-card' + (a.sleeping ? ' sleeping' : '');
    card.id = `card-${a.id}`;
    card.onclick = () => openModal(a.id);
    const pct = Math.round(a.energy);
    const lc  = pct <= 25 ? 'bar-low' : pct <= 55 ? 'bar-mid' : 'bar-high';
    card.innerHTML = `
      ${a.sleeping ? `<div class="zzz-cloud"><span class="z">z</span><span class="z">z</span><span class="z">Z</span></div>` : ''}
      <div class="card-inner">
        ${a.sleeping
          ? `<div class="card-bed">${buildBedHTML(a.type, true, 118)}</div>`
          : `<div class="card-animal">${buildAnimalHTML(a.type, false, 82)}</div>`
        }
        <div class="card-info">
          <div class="card-name">${a.name}</div>
          <div class="card-type">${typeLabel(a.type)}</div>
          <div class="card-energy-row">
            <div class="energy-track">
              <div class="energy-fill ${lc}" style="width:${pct}%"></div>
            </div>
            <span class="energy-num">${pct}</span>
          </div>
          <div class="card-status">${statusText(a)}</div>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function typeLabel(t) {
  return { bear:'🐻 Björn', rabbit:'🐰 Kanin', cat:'🐱 Katt' }[t] || t;
}
function statusText(a) {
  if (a.sleeping)     return '😴 Sover & laddar…';
  if (a.energy >= 85) return '🌟 Full av energi!';
  if (a.energy >= 60) return '😊 Glad och pigg';
  if (a.energy >= 35) return '😐 Lite trött';
  if (a.energy >= 15) return '😪 Väldigt trött';
  return '😫 Utmattad!';
}

// ── MODAL ────────────────────────────────────
function openModal(id) {
  activeId  = id;
  const a   = animals.find(x => x.id === id);
  if (!a) return;
  activeTab = a.sleeping ? 'sleep' : 'feed';
  renderModalShell(a);
  renderScene(a);
  document.getElementById('modal').classList.add('open');
}

function renderModalShell(a) {
  updateModalInfo(a);
  const tabs    = document.getElementById('modalTabs');
  const wakeDiv = document.getElementById('wakeDiv');
  if (a.sleeping) {
    tabs.style.display    = 'none';
    wakeDiv.style.display = 'block';
  } else {
    tabs.style.display    = 'flex';
    wakeDiv.style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === activeTab)
    );
  }
}

function updateModalInfo(a) {
  const pct  = Math.round(a.energy);
  const lc   = pct <= 25 ? 'bar-low' : pct <= 55 ? 'bar-mid' : 'bar-high';
  const nameEl = document.getElementById('modalName');
  const fillEl = document.getElementById('modalEnergyFill');
  const numEl  = document.getElementById('modalEnergyNum');
  const statEl = document.getElementById('modalStatus');
  if (nameEl) nameEl.textContent = a.name;
  if (fillEl) { fillEl.style.width = pct + '%'; fillEl.className = `energy-fill ${lc}`; }
  if (numEl)  numEl.textContent = pct;
  if (statEl) statEl.textContent = statusText(a);
}

function renderScene(a) {
  if (sceneCleanup) { sceneCleanup(); sceneCleanup = null; }
  const container = document.getElementById('modalScene');
  if (a.sleeping) {
    container.innerHTML = `<div class="sleeping-scene">${buildBedHTML(a.type, true, 170)}</div>`;
    return;
  }
  const cleanup = initScene(activeTab, a, container, {
    onFeed: () => {
      a.energy = Math.min(100, a.energy + FEED_BOOST);
      a.feedCooldown = Date.now() + FEED_CD;
      saveAnimals(); updateModalInfo(a); renderGrid();
      toast(`${a.name} åt upp allt! 😋`);
    },
    onPlay: () => {
      if (a.energy < PLAY_COST + 1) return;
      a.energy = Math.max(0, a.energy - PLAY_COST);
      saveAnimals(); updateModalInfo(a); renderGrid();
    },
    noEnergy: () => a.energy < PLAY_COST + 1,
    onTv: () => {
      if (a.energy < TV_COST + 1) return;
      a.energy = Math.max(0, a.energy - TV_COST);
      saveAnimals(); updateModalInfo(a); renderGrid();
    },
    onSleep: () => {
      a.sleeping = true;
      saveAnimals();
      renderModalShell(a);
      renderScene(a);
      renderGrid();
      toast(`God natt, ${a.name}! 🌙`);
    },
  });
  if (typeof cleanup === 'function') sceneCleanup = cleanup;
}

function switchTab(tab) {
  activeTab = tab;
  const a = animals.find(x => x.id === activeId);
  if (!a || a.sleeping) return;
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  renderScene(a);
}

function doWake() {
  const a = animals.find(x => x.id === activeId);
  if (!a) return;
  a.sleeping = false;
  activeTab  = 'feed';
  saveAnimals();
  renderModalShell(a);
  renderScene(a);
  renderGrid();
  toast(`${a.name} vaknar upp! ☀️`);
}

function closeModal() {
  if (sceneCleanup) { sceneCleanup(); sceneCleanup = null; }
  document.getElementById('modal').classList.remove('open');
  activeId = null;
}

function handleBackdropClick(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

// ── GAME LOOP ────────────────────────────────
function startLoop() {
  setInterval(() => {
    let changed = false;
    animals.forEach(a => {
      if (a.sleeping) {
        if (a.energy < 100) {
          a.energy = Math.min(100, a.energy + SLEEP_RESTORE);
          changed = true;
        }
        if (a.energy >= 100) {
          a.sleeping = false;
          toast(`${a.name} vaknar full av energi! ⭐`);
          changed = true;
        }
      } else {
        if (a.energy > 0) {
          a.energy = Math.max(0, a.energy - DRAIN_AMT);
          changed = true;
        }
      }
    });
    if (changed) {
      saveAnimals();
      renderGrid();
      // Only update info, NOT re-render scene (would destroy mini-games)
      if (activeId !== null) {
        const a = animals.find(x => x.id === activeId);
        if (a) updateModalInfo(a);
      }
    }
  }, DRAIN_TICK);
}

// ── TOAST ────────────────────────────────────
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
