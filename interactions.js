// =============================================
//  INTERACTIONS.JS – mini-game scenes
// =============================================

// ─── WEB AUDIO ────────────────────────────
let _ac = null;
function getAC() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  if (_ac.state === 'suspended') _ac.resume();
  return _ac;
}

function sndSmack() {
  try {
    const c = getAC(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.setValueAtTime(320, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(55, c.currentTime + 0.16);
    g.gain.setValueAtTime(0.4, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    o.start(); o.stop(c.currentTime + 0.2);
  } catch(e) {}
}

function sndGiggle() {
  try {
    const c = getAC();
    [440, 520, 490, 560, 480, 540].forEach((f, i) => {
      const t = c.currentTime + i * 0.065;
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle';
      o.connect(g); g.connect(c.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      o.start(t); o.stop(t + 0.06);
    });
  } catch(e) {}
}

function sndTvClick() {
  try {
    const c = getAC();
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.04), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * (1-i/d.length) * 0.25;
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain(); g.gain.value = 1;
    s.connect(g); g.connect(c.destination); s.start();
  } catch(e) {}
}

function sndPat() {
  try {
    const c = getAC(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = 200;
    o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    o.start(); o.stop(c.currentTime + 0.12);
  } catch(e) {}
}

function sndLamp() {
  try {
    const c = getAC(), o = c.createOscillator(), g = c.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.1);
    o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    o.start(); o.stop(c.currentTime + 0.12);
  } catch(e) {}
}

// ─── SCENE: FEED ──────────────────────────
function initFeedScene(animal, el, cb) {
  const onCooldown = Date.now() < (animal.feedCooldown || 0);
  const msLeft = onCooldown ? Math.ceil(((animal.feedCooldown||0) - Date.now())/1000) : 0;

  el.innerHTML = `
    <div class="s-feed">
      <div class="feed-hint">${onCooldown
        ? `⏳ Vänta ${msLeft}s, maten smälter!`
        : `Dra honungsburken till munnen!`}
      </div>
      <div class="feed-stage" id="feedStage">
        <div class="feed-bear-wrap" id="feedBear">
          ${buildAnimalHTML(animal.type, false, 100)}
          <div class="feed-mouth-target" id="fmTarget"></div>
        </div>
        <div class="honey-jar ${onCooldown ? 'jar-cd' : ''}" id="hJar">
          <div class="jar-inner">
            <div class="jar-lid"></div>
            <div class="jar-body-shape">
              <span class="jar-emoji">🍯</span>
            </div>
          </div>
          ${!onCooldown ? '<div class="jar-label">Dra!</div>' : ''}
        </div>
      </div>
    </div>`;

  if (onCooldown) return;

  const jar   = el.querySelector('#hJar');
  const bear  = el.querySelector('#feedBear');
  const stage = el.querySelector('#feedStage');
  const target = el.querySelector('#fmTarget');

  let dragging = false, offX = 0, offY = 0, origLeft, origTop;

  jar.addEventListener('pointerdown', e => {
    dragging = true;
    jar.setPointerCapture(e.pointerId);
    const jr = jar.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    offX = e.clientX - jr.left;
    offY = e.clientY - jr.top;
    origLeft = jr.left - sr.left;
    origTop  = jr.top  - sr.top;
    jar.style.position = 'absolute';
    jar.style.left = origLeft + 'px';
    jar.style.top  = origTop  + 'px';
    jar.style.margin = '0';
    jar.classList.add('dragging');
    e.preventDefault();
  });

  jar.addEventListener('pointermove', e => {
    if (!dragging) return;
    const sr = stage.getBoundingClientRect();
    jar.style.left = (e.clientX - sr.left - offX) + 'px';
    jar.style.top  = (e.clientY - sr.top  - offY) + 'px';

    const jc = centerOf(jar), tc = centerOf(target);
    const dist = Math.hypot(jc.x - tc.x, jc.y - tc.y);
    bear.classList.toggle('mouth-open', dist < 58);
  });

  jar.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;
    jar.classList.remove('dragging');

    const jc = centerOf(jar), tc = centerOf(target);
    const dist = Math.hypot(jc.x - tc.x, jc.y - tc.y);

    if (dist < 58) {
      bear.classList.remove('mouth-open');
      bear.classList.add('eating');
      sndSmack();

      // Particle burst
      spawnParticles(bear, ['💛','🍯','✨','⭐'], 6);
      cb.onFeed();

      jar.style.transition = 'opacity 0.3s, transform 0.3s';
      jar.style.opacity = '0';
      jar.style.transform = 'scale(0.4)';
      setTimeout(() => {
        bear.classList.remove('eating');
        jar.style = '';
      }, 750);
    } else {
      jar.style.transition = 'left 0.35s cubic-bezier(.34,1.56,.64,1), top 0.35s cubic-bezier(.34,1.56,.64,1)';
      jar.style.left = origLeft + 'px';
      jar.style.top  = origTop  + 'px';
      setTimeout(() => {
        jar.style = '';
      }, 380);
    }
  });
}

// ─── SCENE: PLAY ───────────────────────────
function initPlayScene(animal, el, cb) {
  el.innerHTML = `
    <div class="s-play">
      <div class="play-hint">Rör snabbt fram & tillbaka på magen! 🤣</div>
      <div class="play-bear-outer">
        <div class="play-bear-wrap" id="playBear">
          ${buildAnimalHTML(animal.type, false, 108)}
          <div class="tickle-overlay" id="tickleOv"></div>
          <div class="spark-layer" id="sparkLayer"></div>
        </div>
      </div>
      <div class="tickle-bar-wrap">
        <div class="tickle-track">
          <div class="tickle-fill" id="tickleFill" style="width:0%"></div>
        </div>
        <span class="tickle-label">Killarglädje!</span>
      </div>
    </div>`;

  const bear   = el.querySelector('#playBear');
  const overlay = el.querySelector('#tickleOv');
  const sparks = el.querySelector('#sparkLayer');
  const fill   = el.querySelector('#tickleFill');

  let history = [], meterPct = 0, lastTrigger = 0, drainTimer = null;

  function triggerTickle() {
    const now = Date.now();
    if (now - lastTrigger < 280) return;
    if (cb.noEnergy()) return;
    lastTrigger = now;

    bear.classList.add('giggling');
    sndGiggle();
    cb.onPlay();

    spawnParticles(sparks, ['😂','💕','✨','🌟','💫'], 5, true);
    meterPct = Math.min(100, meterPct + 28);
    fill.style.width = meterPct + '%';

    setTimeout(() => bear.classList.remove('giggling'), 480);

    clearInterval(drainTimer);
    drainTimer = setInterval(() => {
      meterPct = Math.max(0, meterPct - 1.5);
      fill.style.width = meterPct + '%';
      if (meterPct <= 0) clearInterval(drainTimer);
    }, 80);
  }

  overlay.addEventListener('pointermove', e => {
    const r = overlay.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right ||
        e.clientY < r.top  || e.clientY > r.bottom) return;

    const now = Date.now();
    history.push({ x: e.clientX, t: now });
    history = history.filter(p => now - p.t < 450);
    if (history.length < 5) return;

    let changes = 0;
    for (let i = 2; i < history.length; i++) {
      const d1 = history[i-1].x - history[i-2].x;
      const d2 = history[i].x   - history[i-1].x;
      if (d1 * d2 < 0 && Math.abs(d1) > 7 && Math.abs(d2) > 7) changes++;
    }
    if (changes >= 3) { history = []; triggerTickle(); }
  });

  return () => clearInterval(drainTimer);
}

// ─── SCENE: TV ─────────────────────────────
const CHANNELS = [
  { name:'🎬 Film',      bg:'#060d1f', glow:'#4488FF', screen:'#0d1d40', fx:'film'    },
  { name:'⚽ Sport',     bg:'#04120a', glow:'#22DD55', screen:'#0a2814', fx:'sport'   },
  { name:'🌿 Natur',     bg:'#051508', glow:'#66EE88', screen:'#0d2a10', fx:'nature'  },
  { name:'🎨 Tecknat',   bg:'#1a0800', glow:'#FF9922', screen:'#3a1500', fx:'cartoon' },
  { name:'🎵 Musik',     bg:'#0e0020', glow:'#CC44FF', screen:'#1e0040', fx:'music'   },
  { name:'🍳 Kockar',    bg:'#1a0900', glow:'#FF5522', screen:'#2e1000', fx:'cooking' },
];

function initTvScene(animal, el, cb) {
  let ch = 0;

  function draw() {
    const c = CHANNELS[ch];
    el.innerHTML = `
      <div class="s-tv" style="background:${c.bg}">
        <div class="tv-room">
          <div class="tv-bear-block">
            <div class="tv-bear-wrap" id="tvBear" style="--face-glow:${c.glow}33">
              ${buildAnimalHTML(animal.type, false, 84)}
              <div class="face-glow-overlay"></div>
            </div>
            <div class="couch-shape"></div>
          </div>
          <div class="css-tv-wrap" id="tvSet">
            <div class="css-tv">
              <div class="tv-cabinet">
                <div class="tv-bezel">
                  <div class="tv-screen-area" style="background:${c.screen};box-shadow:0 0 22px ${c.glow}AA">
                    <div class="tv-scanlines"></div>
                    <div class="tv-content-display tv-fx-${c.fx}">
                      <div class="tv-channel-text">${c.name}</div>
                    </div>
                  </div>
                </div>
                <div class="tv-panel">
                  <div class="tv-knob"></div>
                  <div class="tv-knob"></div>
                  <div class="tv-speaker-grille">
                    <div class="sg-line"></div><div class="sg-line"></div><div class="sg-line"></div>
                  </div>
                </div>
              </div>
              <div class="tv-stand-neck"></div>
              <div class="tv-stand-base"></div>
            </div>
            <div class="tv-click-prompt">Klicka för att byta kanal!</div>
          </div>
        </div>
        <div class="tv-floor-glow" style="background:radial-gradient(ellipse at bottom,${c.glow}22 0%,transparent 70%)"></div>
      </div>`;

    el.querySelector('#tvSet').addEventListener('click', () => {
      ch = (ch + 1) % CHANNELS.length;
      sndTvClick();
      cb.onTv();
      draw();
    });
  }
  draw();
}

// ─── SCENE: SLEEP ──────────────────────────
function initSleepScene(animal, el, cb) {
  let blanketPct = 0;    // 0-100: how far blanket is pulled up
  let covered    = false;
  let lightsOff  = false;
  let patCount   = 0;

  el.innerHTML = `
    <div class="s-sleep" id="sleepScene">
      <div class="sleep-room" id="sleepRoom">
        <div class="sleep-lamp" id="lampBtn">
          <div class="lamp-head ${lightsOff ? 'off' : ''}"></div>
          <div class="lamp-pole"></div>
          <div class="lamp-switch-btn" id="lampSwBtn">
            <div class="lamp-sw-inner"></div>
          </div>
          <div class="lamp-base"></div>
        </div>
        <div class="sleep-bear-area">
          <div class="sleep-bear" id="sleepBear">
            ${buildAnimalHTML(animal.type, false, 88)}
          </div>
          <div class="blanket-cover" id="blanketCover" style="height:0%"></div>
        </div>
      </div>

      <div class="blanket-pull-area" id="blanketPull">
        <div class="blanket-puller" id="bPuller">
          <div class="puller-tab">
            <span>🛏️</span> Dra uppåt!
          </div>
          <div class="puller-blanket-vis"></div>
        </div>
      </div>

      <div class="sleep-progress">
        <div class="sp-step ${covered ? 'done' : ''}" id="spStep1">🛏️ Täcke</div>
        <div class="sp-step ${lightsOff ? 'done' : ''}" id="spStep2">💡 Lampan</div>
        <div class="sp-step" id="spStep3">💤 Godnatt</div>
      </div>

      <div class="pat-area" id="patArea" style="display:none">
        <div class="pat-instruction">Klappa ${animal.name} godnatt 💤</div>
        <div class="pat-bear-btn" id="patBtn">
          ${buildAnimalHTML(animal.type, false, 64)}
        </div>
        <div class="pat-hearts" id="patHearts">
          <span class="ph">♡</span><span class="ph">♡</span><span class="ph">♡</span>
        </div>
      </div>
    </div>`;

  // ── Lamp ──
  const lampSwBtn = el.querySelector('#lampSwBtn');
  lampSwBtn.addEventListener('click', () => {
    lightsOff = !lightsOff;
    sndLamp();
    el.querySelector('#sleepScene').classList.toggle('lights-off', lightsOff);
    el.querySelector('.lamp-head').classList.toggle('off', lightsOff);
    el.querySelector('#spStep2').classList.toggle('done', lightsOff);
    checkReady();
  });

  // ── Blanket drag ──
  const puller = el.querySelector('#bPuller');
  const cover  = el.querySelector('#blanketCover');
  const pullArea = el.querySelector('#blanketPull');
  let dragY = null;

  puller.addEventListener('pointerdown', e => {
    dragY = e.clientY;
    puller.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  puller.addEventListener('pointermove', e => {
    if (dragY === null) return;
    const dy = Math.max(0, dragY - e.clientY);
    blanketPct = Math.min(100, (dy / 90) * 100);
    cover.style.height = blanketPct + '%';

    if (blanketPct >= 95) {
      covered = true; dragY = null;
      cover.style.height = '78%';
      pullArea.style.display = 'none';
      el.querySelector('#spStep1').classList.add('done');
      checkReady();
    }
  });
  puller.addEventListener('pointerup', () => {
    if (!covered) { cover.style.height = '0%'; blanketPct = 0; }
    dragY = null;
  });

  // ── Pat ──
  function checkReady() {
    if (covered && lightsOff) {
      el.querySelector('#spStep3').classList.add('ready');
      el.querySelector('#patArea').style.display = 'flex';
    }
  }

  let patCooldown = false;
  el.querySelector('#patArea').addEventListener('click', e => {
    if (!covered || !lightsOff) return;
    if (patCount >= 3 || patCooldown) return;
    patCooldown = true;
    setTimeout(() => patCooldown = false, 350);

    patCount++;
    sndPat();

    const hearts = el.querySelectorAll('.ph');
    if (hearts[patCount-1]) {
      hearts[patCount-1].textContent = '♥';
      hearts[patCount-1].classList.add('filled');
    }
    el.querySelector('#patArea').classList.add('patted');
    setTimeout(() => el.querySelector('#patArea')?.classList.remove('patted'), 250);

    if (patCount >= 3) {
      setTimeout(() => cb.onSleep(), 700);
    }
  });
}


// ─── HELPERS ──────────────────────────────
function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width/2, y: r.top + r.height/2 };
}

function spawnParticles(container, set, count, relative = false) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'burst-particle';
      p.textContent = set[Math.floor(Math.random() * set.length)];
      const x = 15 + Math.random() * 70;
      const y = 20 + Math.random() * 60;
      p.style.cssText = `left:${x}%;top:${y}%;animation-delay:${i*0.05}s`;
      container.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }, i * 50);
  }
}

// ─── ENTRY POINT ─────────────────────────
function initScene(tab, animal, container, callbacks) {
  if (tab === 'feed')  return initFeedScene(animal, container, callbacks);
  if (tab === 'play')  return initPlayScene(animal, container, callbacks);
  if (tab === 'tv')    return initTvScene(animal, container, callbacks);
  if (tab === 'sleep') return initSleepScene(animal, container, callbacks);
}
