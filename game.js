// =============================================
//  GAME.JS – Cuddle Bunch  ·  Cozy Edition
// =============================================

// ── CONSTANTS ────────────────────────────────
const DRAIN_TICK    = 4000;
const DRAIN_AMT     = 2;
const SLEEP_RESTORE = 3;
const FEED_BOOST    = 25;
const PLAY_COST     = 8;
const TV_COST       = 4;
const READ_COST     = 3;   // energy per page
const READ_MOOD     = 12;
const FIKA_ENERGY   = 14;
const FIKA_MOOD     = 22;
const FEED_CD       = 10000;
const FIKA_CD       = 13000;

// mood drains when energy is very low
const MOOD_DRAIN_THRESHOLD = 28;
const MOOD_DRAIN_AMT       = 0.6;
const MOOD_RESTORE_SLEEP   = 1.5;

// bond per interaction
const BOND = { feed:8, play:5, tv:3, read:10, fika:9, pat:18 };

const BOND_TIERS = [
  { min:0,    emoji:'💛', name:'Bekant',    next:100  },
  { min:100,  emoji:'🧡', name:'Kompis',    next:250  },
  { min:250,  emoji:'❤️', name:'Vän',       next:500  },
  { min:500,  emoji:'💜', name:'Nära vän',  next:800  },
  { min:800,  emoji:'💙', name:'BFF',       next:null },
];

// Diary entry pools
const DIARY = {
  sad:     ['Jag mår lite trist idag…','Var är min honung? 🍯','Jag behöver en kram. 🤗','Hmm.'],
  okay:    ['Jag undrar vad vi gör idag!','Det luktar gott härifrån 🌸','Jag tänkte på dig!','Mysigt.'],
  happy:   ['Idag är en SUPER dag! ✨','Allt är fint och gosigt!','Jag hoppar av glädje! 🎉','Woooo!'],
  bff:     ['Du är min bästa vän! 💙','Jag drömde om oss igår 🌙','Tack för att du finns 🥹','♾️'],
  morning: ['God morgon! ☀️ Jag sov JÄTTEGOTT!','Morgon! Dags för honung?','Pippi pippi! Ny dag!'],
  evening: ['Kväll… mysigt med lampljus 🕯️','Det börjar bli sängdags snart…','Kvällsstämning 🌙'],
  night:   ['Sshhh… det är natt 🌟','Alla goda nallor sover nu…','Stilla natt, gosig natt ⭐'],
  reading: ['Den boken var magisk! 📖','Jag lärde mig något nytt!','Ord är som honung för hjärnan.'],
  fika:    ['Mmmm, det bästa av allt ☕','Fikastund = livets höjdpunkt 🍵','Kaffe + nalle = perfekt.'],
  lowEnergy:['Jag är SO trött…','Jag behöver sova. Snälla?','…zzz…snart…'],
};

let animals   = [];
let activeId  = null;
let activeTab = 'feed';
let sceneCleanup = null;

// ── STORAGE ─────────────────────────────────
function loadAnimals() {
  try {
    const raw = JSON.parse(localStorage.getItem('cuddleBunch') || '[]');
    // Migrate old animals missing new fields
    return raw.map(a => ({
      mood:          a.mood          ?? 70,
      bond:          a.bond          ?? 0,
      streakDays:    a.streakDays    ?? 0,
      lastCaredDate: a.lastCaredDate ?? null,
      lastActivity:  a.lastActivity  ?? null,
      diaryEntry:    a.diaryEntry    ?? pickDiary('okay'),
      ...a,
    }));
  } catch { return []; }
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

// ── HELPERS ──────────────────────────────────
function timeOfDay() {
  const h = new Date().getHours();
  if (h >= 6  && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function pickDiary(pool) {
  const arr = DIARY[pool] || DIARY.okay;
  return arr[Math.floor(Math.random() * arr.length)];
}

function refreshDiary(a) {
  const tier = bondTier(a.bond || 0);
  const tod  = timeOfDay();

  // Priority: special states first
  if (a.energy <= 10)  return pickDiary('lowEnergy');
  if (a.mood >= 85 && tier.min >= 500) return pickDiary('bff');
  if (tod === 'morning') return pickDiary('morning');
  if (tod === 'evening') return pickDiary('evening');
  if (tod === 'night')   return pickDiary('night');
  if (a.lastActivity === 'read')  return pickDiary('reading');
  if (a.lastActivity === 'fika')  return pickDiary('fika');
  if (a.mood >= 80)  return pickDiary('happy');
  if (a.mood >= 45)  return pickDiary('okay');
  return pickDiary('sad');
}

function bondTier(bond) {
  for (let i = BOND_TIERS.length - 1; i >= 0; i--) {
    if (bond >= BOND_TIERS[i].min) return BOND_TIERS[i];
  }
  return BOND_TIERS[0];
}

function addBond(a, type) {
  a.bond = (a.bond || 0) + (BOND[type] || 5);
}

function checkStreak(a) {
  const today = new Date().toDateString();
  if (a.lastCaredDate === today) return; // already logged
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  a.streakDays = (a.lastCaredDate === yesterday) ? (a.streakDays || 0) + 1 : 1;
  a.lastCaredDate = today;
  if (a.streakDays >= 2) {
    const bonus = Math.min(25, a.streakDays * 4);
    a.bond = (a.bond || 0) + bonus;
    setTimeout(() => toast(`🔥 ${a.streakDays} dagar i rad! +${bonus} band`), 800);
  }
}

function moodEmoji(mood) {
  if (mood >= 85) return '🤩';
  if (mood >= 70) return '😊';
  if (mood >= 50) return '🙂';
  if (mood >= 30) return '😐';
  if (mood >= 15) return '😟';
  return '😢';
}

function typeLabel(t) {
  return { bear:'🐻 Björn', rabbit:'🐰 Kanin', cat:'🐱 Katt' }[t] || t;
}

function statusText(a) {
  if (a.sleeping)      return '😴 Sover & laddar…';
  if (a.energy >= 85)  return '🌟 Full av energi!';
  if (a.energy >= 60)  return '😊 Glad och pigg';
  if (a.energy >= 35)  return '😐 Lite trött';
  if (a.energy >= 15)  return '😪 Väldigt trött';
  return '😫 Utmattad!';
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
  // Refresh diary entries on load
  animals.forEach(a => { a.diaryEntry = refreshDiary(a); });
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
    const mood = Math.round(a.mood || 70);
    const moodClass = mood >= 70 ? 'mood-good' : mood >= 40 ? 'mood-mid' : 'mood-low';
    card.className = `animal-card ${a.sleeping ? 'sleeping' : ''} ${moodClass}`;
    card.id = `card-${a.id}`;
    card.onclick = () => openModal(a.id);

    const pct  = Math.round(a.energy);
    const lc   = pct <= 25 ? 'bar-low' : pct <= 55 ? 'bar-mid' : 'bar-high';
    const tier = bondTier(a.bond || 0);
    const streak = (a.streakDays || 0) >= 2 ? `<span class="card-streak">🔥${a.streakDays}</span>` : '';
    const diary = a.diaryEntry ? `<div class="card-diary">"${a.diaryEntry}"</div>` : '';

    card.innerHTML = `
      ${a.sleeping ? `<div class="zzz-cloud"><span class="z">z</span><span class="z">z</span><span class="z">Z</span></div>` : ''}
      <div class="card-badges">
        <span class="card-bond" title="${tier.name}">${tier.emoji} ${tier.name}</span>
        ${streak}
      </div>
      <div class="card-inner">
        ${a.sleeping
          ? `<div class="card-bed">${buildBedHTML(a.type, true, 118)}</div>`
          : `<div class="card-animal">${buildAnimalHTML(a.type, false, 82)}</div>`}
        <div class="card-info">
          <div class="card-name">${a.name}</div>
          <div class="card-type">${typeLabel(a.type)}</div>
          <div class="card-energy-row">
            <span class="meter-mini-label">⚡</span>
            <div class="energy-track">
              <div class="energy-fill ${lc}" style="width:${pct}%"></div>
            </div>
            <span class="energy-num">${pct}</span>
          </div>
          <div class="card-energy-row">
            <span class="meter-mini-label">🌸</span>
            <div class="energy-track">
              <div class="mood-fill-bar" style="width:${mood}%;background:${moodBarColor(mood)}"></div>
            </div>
            <span class="energy-num">${moodEmoji(mood)}</span>
          </div>
          <div class="card-status">${statusText(a)}</div>
          ${diary}
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function moodBarColor(mood) {
  if (mood >= 75) return 'linear-gradient(90deg,#F9A8D4,#C084FC)';
  if (mood >= 45) return 'linear-gradient(90deg,#FCD34D,#F59E0B)';
  return 'linear-gradient(90deg,#94A3B8,#64748B)';
}

// ── MODAL ────────────────────────────────────
function openModal(id) {
  activeId  = id;
  const a   = animals.find(x => x.id === id);
  if (!a) return;
  activeTab = a.sleeping ? 'sleep' : 'feed';
  checkStreak(a);
  saveAnimals();
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
    tabs.style.display    = 'grid';
    wakeDiv.style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === activeTab)
    );
  }
}

function updateModalInfo(a) {
  const pct  = Math.round(a.energy);
  const mood = Math.round(a.mood || 70);
  const lc   = pct <= 25 ? 'bar-low' : pct <= 55 ? 'bar-mid' : 'bar-high';
  const tier = bondTier(a.bond || 0);
  const nextBond = tier.next;
  const bondPct  = nextBond ? Math.min(100, ((a.bond - tier.min) / (nextBond - tier.min)) * 100) : 100;

  const nameEl   = document.getElementById('modalName');
  const fillEl   = document.getElementById('modalEnergyFill');
  const numEl    = document.getElementById('modalEnergyNum');
  const moodEl   = document.getElementById('modalMoodFill');
  const moodEmEl = document.getElementById('modalMoodEmoji');
  const bondEl   = document.getElementById('modalBond');
  const diaryEl  = document.getElementById('modalDiary');
  const statEl   = document.getElementById('modalStatus');

  if (nameEl)   nameEl.textContent = a.name;
  if (fillEl)   { fillEl.style.width = pct + '%'; fillEl.className = `energy-fill ${lc}`; }
  if (numEl)    numEl.textContent = pct;
  if (moodEl)   { moodEl.style.width = mood + '%'; moodEl.style.background = moodBarColor(mood); }
  if (moodEmEl) moodEmEl.textContent = moodEmoji(mood);
  if (bondEl)   bondEl.innerHTML = `
    <div class="bond-tier">${tier.emoji} <span>${tier.name}</span></div>
    <div class="bond-bar-wrap" title="${a.bond || 0} band">
      <div class="bond-bar-fill" style="width:${bondPct}%"></div>
    </div>
    ${(a.streakDays||0) >= 2 ? `<span class="bond-streak">🔥 ${a.streakDays} dagars svit</span>` : ''}`;
  if (diaryEl && a.diaryEntry) diaryEl.innerHTML = `<span class="diary-bubble">"${a.diaryEntry}"</span>`;
  if (statEl)   statEl.textContent = statusText(a);
}

function renderScene(a) {
  if (sceneCleanup) { sceneCleanup(); sceneCleanup = null; }
  const container = document.getElementById('modalScene');

  if (a.sleeping) {
    container.innerHTML = `<div class="sleeping-scene">${buildBedHTML(a.type, true, 170)}</div>`;
    return;
  }

  const cbs = {
    onFeed: () => {
      a.energy = Math.min(100, a.energy + FEED_BOOST);
      a.mood   = Math.min(100, (a.mood||70) + 8);
      a.feedCooldown = Date.now() + FEED_CD;
      a.lastActivity = 'feed';
      addBond(a, 'feed');
      checkStreak(a);
      a.diaryEntry = refreshDiary(a);
      saveAnimals(); updateModalInfo(a); renderGrid();
      toast(`${a.name} åt upp allt! 😋`);
    },
    onPlay: () => {
      if (a.energy < PLAY_COST + 1) return;
      a.energy = Math.max(0, a.energy - PLAY_COST);
      a.mood   = Math.min(100, (a.mood||70) + 14);
      a.lastActivity = 'play';
      addBond(a, 'play');
      checkStreak(a);
      a.diaryEntry = refreshDiary(a);
      saveAnimals(); updateModalInfo(a); renderGrid();
    },
    noEnergy: () => a.energy < PLAY_COST + 1,
    onTv: () => {
      if (a.energy < TV_COST + 1) return;
      a.energy = Math.max(0, a.energy - TV_COST);
      a.mood   = Math.min(100, (a.mood||70) + 6);
      a.lastActivity = 'tv';
      addBond(a, 'tv');
      checkStreak(a);
      a.diaryEntry = refreshDiary(a);
      saveAnimals(); updateModalInfo(a); renderGrid();
    },
    onRead: (pages) => {
      if (a.energy < READ_COST + 1) return false;
      a.energy = Math.max(0, a.energy - READ_COST);
      a.mood   = Math.min(100, (a.mood||70) + READ_MOOD);
      a.lastActivity = 'read';
      addBond(a, 'read');
      checkStreak(a);
      a.diaryEntry = refreshDiary(a);
      saveAnimals(); updateModalInfo(a); renderGrid();
      return true;
    },
    noEnergyRead: () => a.energy < READ_COST + 1,
    onFika: () => {
      if (Date.now() < (a.fikaCooldown || 0)) return;
      a.energy = Math.min(100, a.energy + FIKA_ENERGY);
      a.mood   = Math.min(100, (a.mood||70) + FIKA_MOOD);
      a.fikaCooldown = Date.now() + FIKA_CD;
      a.lastActivity = 'fika';
      addBond(a, 'fika');
      checkStreak(a);
      a.diaryEntry = refreshDiary(a);
      saveAnimals(); updateModalInfo(a); renderGrid();
      toast(`${a.name} myser med sin fika! ☕`);
    },
    fikaOnCooldown: () => Date.now() < (a.fikaCooldown || 0),
    fikaCooldownMs: () => Math.max(0, (a.fikaCooldown || 0) - Date.now()),
    onSleep: () => {
      a.sleeping = true;
      a.lastActivity = 'sleep';
      addBond(a, 'pat');
      checkStreak(a);
      a.diaryEntry = refreshDiary(a);
      saveAnimals();
      renderModalShell(a);
      renderScene(a);
      renderGrid();
      toast(`God natt, ${a.name}! 🌙`);
    },
    animalName: a.name,
    animalType: a.type,
    feedCooldown: a.feedCooldown,
  };

  const cleanup = initScene(activeTab, a, container, cbs);
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
        // Mood restores slowly during sleep
        if ((a.mood || 70) < 100) {
          a.mood = Math.min(100, (a.mood || 70) + MOOD_RESTORE_SLEEP);
          changed = true;
        }
        if (a.energy >= 100) {
          a.sleeping = false;
          a.diaryEntry = refreshDiary(a);
          toast(`${a.name} vaknar full av energi! ⭐`);
          changed = true;
        }
      } else {
        if (a.energy > 0) {
          a.energy = Math.max(0, a.energy - DRAIN_AMT);
          changed = true;
        }
        // Mood drains when low energy
        if (a.energy < MOOD_DRAIN_THRESHOLD && (a.mood || 70) > 0) {
          a.mood = Math.max(0, (a.mood || 70) - MOOD_DRAIN_AMT);
          changed = true;
        }
      }
    });

    if (changed) {
      saveAnimals();
      renderGrid();
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
