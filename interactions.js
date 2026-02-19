// =============================================
//  INTERACTIONS.JS – mini-game scenes
//  Mobile-friendly, full TV overhaul
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
    g.gain.setValueAtTime(0.4, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    o.start(); o.stop(c.currentTime + 0.2);
  } catch(e) {}
}
function sndGiggle() {
  try {
    const c = getAC();
    [440,520,490,560,480,540].forEach((f,i) => {
      const t = c.currentTime + i*0.065, o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.connect(g); g.connect(c.destination); o.frequency.value = f;
      g.gain.setValueAtTime(0.1,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.055);
      o.start(t); o.stop(t+0.06);
    });
  } catch(e) {}
}
function sndTvStatic() {
  try {
    const c = getAC();
    const buf = c.createBuffer(1, Math.floor(c.sampleRate*0.12), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length)*0.3;
    const s = c.createBufferSource(); s.buffer=buf;
    const g = c.createGain(); g.gain.value=1;
    s.connect(g); g.connect(c.destination); s.start();
  } catch(e) {}
}
function sndClick() {
  try {
    const c = getAC(), o = c.createOscillator(), g = c.createGain();
    o.type='square'; o.frequency.value=180;
    o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.12,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.06);
    o.start(); o.stop(c.currentTime+0.07);
  } catch(e) {}
}
function sndPat() {
  try {
    const c = getAC(), o = c.createOscillator(), g = c.createGain();
    o.type='sine'; o.frequency.value=200; o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.08,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.12);
    o.start(); o.stop(c.currentTime+0.12);
  } catch(e) {}
}
function sndLamp() {
  try {
    const c = getAC(), o = c.createOscillator(), g = c.createGain();
    o.type='square'; o.frequency.setValueAtTime(180,c.currentTime); o.frequency.exponentialRampToValueAtTime(40,c.currentTime+0.1);
    o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.12,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.1);
    o.start(); o.stop(c.currentTime+0.12);
  } catch(e) {}
}
function sndCheers() {
  try {
    const c = getAC();
    [260,330,390,520].forEach((f,i) => {
      const t=c.currentTime+i*0.08, o=c.createOscillator(), g=c.createGain();
      o.type='triangle'; o.frequency.value=f; o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0.08,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1);
      o.start(t); o.stop(t+0.11);
    });
  } catch(e) {}
}
function sndScared() {
  try {
    const c=getAC(), o=c.createOscillator(), g=c.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(80,c.currentTime); o.frequency.exponentialRampToValueAtTime(40,c.currentTime+0.25);
    o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.15,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.3);
    o.start(); o.stop(c.currentTime+0.3);
  } catch(e) {}
}

// ─── SCENE: FEED ────────────────────────────
function initFeedScene(animal, el, cb) {
  const onCooldown = Date.now() < (animal.feedCooldown || 0);
  const msLeft = onCooldown ? Math.ceil(((animal.feedCooldown||0)-Date.now())/1000) : 0;

  el.innerHTML = `
    <div class="s-feed">
      <div class="feed-hint">${onCooldown ? `⏳ Vänta ${msLeft}s…` : 'Dra honungsburken till munnen!'}</div>
      <div class="feed-stage" id="feedStage">
        <div class="feed-bear-wrap" id="feedBear">
          ${buildAnimalHTML(animal.type, false, 100)}
          <div class="feed-mouth-target" id="fmTarget"></div>
        </div>
        <div class="honey-jar ${onCooldown?'jar-cd':''}" id="hJar" ${onCooldown?'':'touch-action="none"'}>
          <div class="jar-inner">
            <div class="jar-lid"></div>
            <div class="jar-body-shape"><span class="jar-emoji">🍯</span></div>
          </div>
          ${!onCooldown ? '<div class="jar-label">Dra!</div>' : ''}
        </div>
      </div>
    </div>`;

  if (onCooldown) return;

  const jar = el.querySelector('#hJar');
  const bear = el.querySelector('#feedBear');
  const stage = el.querySelector('#feedStage');
  const target = el.querySelector('#fmTarget');

  let dragging=false, offX=0, offY=0, origLeft, origTop;

  function startDrag(clientX, clientY) {
    dragging=true;
    const jr=jar.getBoundingClientRect(), sr=stage.getBoundingClientRect();
    offX=clientX-jr.left; offY=clientY-jr.top;
    origLeft=jr.left-sr.left; origTop=jr.top-sr.top;
    jar.style.position='absolute'; jar.style.left=origLeft+'px'; jar.style.top=origTop+'px'; jar.style.margin='0';
    jar.classList.add('dragging');
  }
  function moveDrag(clientX, clientY) {
    if (!dragging) return;
    const sr=stage.getBoundingClientRect();
    jar.style.left=(clientX-sr.left-offX)+'px'; jar.style.top=(clientY-sr.top-offY)+'px';
    const jc=centerOf(jar), tc=centerOf(target);
    bear.classList.toggle('mouth-open', Math.hypot(jc.x-tc.x,jc.y-tc.y)<62);
  }
  function endDrag() {
    if (!dragging) return;
    dragging=false; jar.classList.remove('dragging');
    const jc=centerOf(jar), tc=centerOf(target);
    if (Math.hypot(jc.x-tc.x,jc.y-tc.y)<62) {
      bear.classList.remove('mouth-open'); bear.classList.add('eating');
      sndSmack(); spawnParticles(bear,['💛','🍯','✨','⭐'],6); cb.onFeed();
      jar.style.transition='opacity 0.3s,transform 0.3s'; jar.style.opacity='0'; jar.style.transform='scale(0.4)';
      setTimeout(()=>{ bear.classList.remove('eating'); jar.style=''; },750);
    } else {
      jar.style.transition='left 0.35s cubic-bezier(.34,1.56,.64,1),top 0.35s cubic-bezier(.34,1.56,.64,1)';
      jar.style.left=origLeft+'px'; jar.style.top=origTop+'px';
      setTimeout(()=>{ jar.style=''; },380);
    }
  }

  // Pointer events (works for both mouse and touch)
  jar.addEventListener('pointerdown', e => { jar.setPointerCapture(e.pointerId); startDrag(e.clientX,e.clientY); e.preventDefault(); });
  jar.addEventListener('pointermove', e => moveDrag(e.clientX,e.clientY));
  jar.addEventListener('pointerup', endDrag);
  jar.addEventListener('pointercancel', endDrag);
}

// ─── SCENE: PLAY (mobile-friendly tickle) ───
function initPlayScene(animal, el, cb) {
  el.innerHTML = `
    <div class="s-play">
      <div class="play-hint">Kila nallen snabbt fram & tillbaka! 🤣</div>
      <div class="play-hint-sub">📱 Svep snabbt på magen · 🖥️ Rör snabbt musen</div>
      <div class="play-bear-outer">
        <div class="play-bear-wrap" id="playBear">
          ${buildAnimalHTML(animal.type, false, 108)}
          <div class="tickle-overlay" id="tickleOv"></div>
          <div class="spark-layer" id="sparkLayer"></div>
        </div>
      </div>
      <div class="tickle-bar-wrap">
        <div class="tickle-track"><div class="tickle-fill" id="tickleFill" style="width:0%"></div></div>
        <span class="tickle-label">Killarglädje!</span>
      </div>
    </div>`;

  const bear   = el.querySelector('#playBear');
  const overlay = el.querySelector('#tickleOv');
  const sparks = el.querySelector('#sparkLayer');
  const fill   = el.querySelector('#tickleFill');

  let history=[], meterPct=0, lastTrigger=0, drainTimer=null;

  function triggerTickle() {
    const now=Date.now();
    if (now-lastTrigger<250) return;
    if (cb.noEnergy()) return;
    lastTrigger=now;
    bear.classList.add('giggling'); sndGiggle(); cb.onPlay();
    spawnParticles(sparks,['😂','💕','✨','🌟','💫'],5,true);
    meterPct=Math.min(100,meterPct+28); fill.style.width=meterPct+'%';
    setTimeout(()=>bear.classList.remove('giggling'),480);
    clearInterval(drainTimer);
    drainTimer=setInterval(()=>{ meterPct=Math.max(0,meterPct-1.5); fill.style.width=meterPct+'%'; if(meterPct<=0)clearInterval(drainTimer); },80);
  }

  function checkSwipe(x, t) {
    const now=Date.now();
    history.push({x,t:now});
    history=history.filter(p=>now-p.t<500);
    if (history.length<4) return;
    let changes=0;
    for (let i=2;i<history.length;i++) {
      const d1=history[i-1].x-history[i-2].x, d2=history[i].x-history[i-1].x;
      // Mobile: lower threshold (5px), desktop: 7px
      const thresh=('ontouchstart' in window)?5:7;
      if (d1*d2<0 && Math.abs(d1)>thresh && Math.abs(d2)>thresh) changes++;
    }
    if (changes>=2) { history=[]; triggerTickle(); }
  }

  // Works on both mobile (touch) and desktop (mouse)
  overlay.addEventListener('pointermove', e => {
    checkSwipe(e.clientX);
  }, {passive:true});

  // Extra: touch handlers directly for reliability on iOS
  overlay.addEventListener('touchmove', e => {
    if (e.touches.length>0) checkSwipe(e.touches[0].clientX);
  }, {passive:true});

  // Tap rapidly as fallback for mobile
  let tapCount=0, tapTimer=null;
  overlay.addEventListener('pointerdown', e => {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer=setTimeout(()=>tapCount=0, 800);
    if (tapCount>=4) { tapCount=0; triggerTickle(); }
  });

  return ()=>clearInterval(drainTimer);
}

// ─── SCENE: TV ──────────────────────────────

const CHANNELS = [
  {
    id:'film', name:'Skräckfilm', emoji:'👻',
    bg:'#08091a', glow:'#6644FF', screen:'#12103A',
    bearMood:'scared',    bearNote:'Nallen gömmer sig!',
    screenContent: `<div class="scr-film"><div class="scr-ghost">👻</div></div>`,
  },
  {
    id:'sport', name:'Fotboll', emoji:'⚽',
    bg:'#041208', glow:'#22DD55', screen:'#0A2010',
    bearMood:'cheering',  bearNote:'Nallen hejar!',
    screenContent: `<div class="scr-sport"><div class="scr-ball">⚽</div><div class="scr-score">2–1</div></div>`,
  },
  {
    id:'nature', name:'Naturprogram', emoji:'🌿',
    bg:'#051408', glow:'#55CC44', screen:'#0C2010',
    bearMood:'happy',     bearNote:'Nallen tycker om naturen!',
    screenContent: `<div class="scr-nature"><div class="scr-tree">🌲</div><div class="scr-deer">🦌</div></div>`,
  },
  {
    id:'cartoon', name:'Tecknat', emoji:'🎨',
    bg:'#180600', glow:'#FF9922', screen:'#301200',
    bearMood:'laughing',  bearNote:'Nallen skrattar!',
    screenContent: `<div class="scr-cartoon"><div class="scr-star-anim">⭐</div><div class="scr-star-anim2">🌟</div></div>`,
  },
  {
    id:'music', name:'Musikkanal', emoji:'🎵',
    bg:'#0c001e', glow:'#CC44FF', screen:'#1E0040',
    bearMood:'dancing',   bearNote:'Nallen dansar!',
    screenContent: `<div class="scr-music"><div class="scr-note n1">🎵</div><div class="scr-note n2">🎶</div><div class="scr-note n3">🎵</div></div>`,
  },
  {
    id:'honey', name:'HONUNG-REKLAM', emoji:'🍯',
    bg:'#1a0a00', glow:'#FFAA00', screen:'#2A1400',
    bearMood:'hungry',    bearNote:'Nallen vill ha honung!',
    screenContent: `<div class="scr-honey"><div class="scr-honeyjar">🍯</div><div class="scr-ad-text">SUPER HONUNG!</div></div>`,
    isAd: true,
  },
  {
    id:'static', name:'Ingen signal', emoji:'📡',
    bg:'#111', glow:'#888', screen:'#1a1a1a',
    bearMood:'confused',  bearNote:'Bara myrornas krig…',
    screenContent: `<div class="scr-static"><canvas class="static-canvas" id="staticCanvas" width="100" height="68"></canvas></div>`,
    hasStatic: true,
  },
];

function initTvScene(animal, el, cb) {
  let ch = 1; // start on sport
  let showRemote = false;
  let staticLevel = 100; // 0 = clear, 100 = full static
  let antennaDrag = false;
  let staticAnimId = null;

  function stopStatic() {
    if (staticAnimId) { cancelAnimationFrame(staticAnimId); staticAnimId=null; }
  }

  function drawStatic(canvas, level) {
    if (!canvas) return;
    const ctx=canvas.getContext('2d');
    const w=canvas.width, h=canvas.height;
    const img=ctx.createImageData(w,h);
    const d=img.data;
    for (let i=0;i<d.length;i+=4) {
      const g=Math.random()*255*(level/100);
      d[i]=d[i+1]=d[i+2]=g; d[i+3]=255;
    }
    ctx.putImageData(img,0,0);
  }

  function animateStatic(canvas) {
    stopStatic();
    function frame() { drawStatic(canvas,staticLevel); staticAnimId=requestAnimationFrame(frame); }
    frame();
  }

  function bearHTML(mood) {
    const base = buildAnimalHTML(animal.type, false, 78);
    const overlays = {
      scared:   `<div class="bear-mood scared"><div class="paw-cover"></div></div>`,
      cheering: `<div class="bear-mood cheering"><div class="cheer-paw">🐾</div></div>`,
      laughing: `<div class="bear-mood laughing"></div>`,
      dancing:  `<div class="bear-mood dancing"></div>`,
      hungry:   `<div class="bear-mood hungry"><div class="hunger-sweat">💦</div></div>`,
      confused: `<div class="bear-mood confused"><div class="question">?</div></div>`,
      happy:    ``,
    };
    return `<div class="tv-bear-inner bear-mood-${mood}">${base}${overlays[mood]||''}</div>`;
  }

  function remoteHTML() {
    return `
      <div class="remote-ctrl" id="remoteCtrl">
        <div class="remote-top">📺</div>
        <div class="remote-ch-btns">
          ${CHANNELS.map((c,i)=>`
            <button class="rmt-ch-btn ${i===ch?'rmt-active':''}" data-ch="${i}" title="${c.name}">
              <span>${c.emoji}</span>
            </button>`).join('')}
        </div>
        <div class="remote-vol">
          <button class="rmt-vol-btn" id="rVol">🔉</button>
        </div>
      </div>`;
  }

  function draw() {
    stopStatic();
    const c = CHANNELS[ch];

    el.innerHTML = `
      <div class="s-tv" id="stvScene" style="background:${c.bg}">

        <!-- ROOM -->
        <div class="tv-room">

          <!-- BEAR -->
          <div class="tv-bear-block">
            <div class="tv-bear-wrap" id="tvBear" style="--face-glow:${c.glow}44">
              ${bearHTML(c.bearMood)}
              <div class="face-glow-overlay"></div>
              <div class="eye-reflections" id="eyeRef">
                <div class="eye-ref eye-ref-l"></div>
                <div class="eye-ref eye-ref-r"></div>
              </div>
            </div>
            <div class="bear-mood-note" id="moodNote">${c.bearNote}</div>
            <div class="couch-shape"></div>
          </div>

          <!-- TV SET -->
          <div class="css-tv-wrap">
            <div class="css-tv">
              <div class="tv-cabinet">
                <div class="tv-bezel">
                  <div class="tv-screen-area" id="tvScreen"
                       style="background:${c.screen};box-shadow:0 0 24px ${c.glow}BB">
                    <div class="tv-scanlines"></div>
                    <div class="tv-content-display ${c.hasStatic?'':'tv-fx-'+c.id}" id="tvContent">
                      ${c.screenContent}
                    </div>
                    ${c.hasStatic?'':''}
                  </div>
                </div>
                <div class="tv-panel">
                  <div class="tv-knob"></div>
                  <button class="tv-remote-btn" id="tvRemoteBtn">📻</button>
                  <div class="tv-speaker-grille">
                    <div class="sg-line"></div><div class="sg-line"></div><div class="sg-line"></div>
                  </div>
                </div>
              </div>
              <!-- ANTENNA -->
              <div class="tv-antenna-wrap" id="antennaWrap">
                <div class="antenna-base"></div>
                <div class="antenna-rod" id="antennaRod" style="--angle:${c.hasStatic?'-30deg':'15deg'}"></div>
              </div>
              <div class="tv-stand-neck"></div>
              <div class="tv-stand-base"></div>
            </div>
          </div>

        </div><!-- /tv-room -->

        <!-- REMOTE (hidden initially) -->
        <div id="remoteSlot"></div>

        <!-- FLOOR GLOW -->
        <div class="tv-floor-glow" style="background:radial-gradient(ellipse at 70% 100%,${c.glow}28 0%,transparent 65%)"></div>

        <!-- ANTENNA HINT (only for static) -->
        ${c.hasStatic ? `<div class="antenna-hint">📡 Dra antennen för att fixa bilden!</div>` : ''}

        <!-- AD overlay for honey channel -->
        ${c.isAd ? `<div class="honey-ad-banner">🍯 Nallen är HUNGRIG! 🍯</div>` : ''}

      </div>`;

    // Animate static canvas
    if (c.hasStatic) {
      const canvas = el.querySelector('#staticCanvas');
      if (canvas) animateStatic(canvas);
    }

    // Eye reflections pulse with screen color
    const eyeRef = el.querySelector('#eyeRef');
    if (eyeRef) {
      eyeRef.style.setProperty('--ref-col', c.glow+'88');
    }

    // Remote toggle
    const remoteBtn = el.querySelector('#tvRemoteBtn');
    const remoteSlot = el.querySelector('#remoteSlot');
    remoteBtn.addEventListener('click', e => {
      e.stopPropagation();
      showRemote = !showRemote;
      if (showRemote) {
        remoteSlot.innerHTML = remoteHTML();
        remoteSlot.querySelector('#remoteCtrl').classList.add('remote-visible');
        // Channel buttons
        remoteSlot.querySelectorAll('.rmt-ch-btn').forEach(btn => {
          btn.addEventListener('click', e2 => {
            e2.stopPropagation();
            const newCh = parseInt(btn.dataset.ch);
            if (newCh === ch) return;
            ch = newCh;
            sndTvStatic();
            cb.onTv();
            showRemote = false;
            // Transition effect
            const screen = el.querySelector('#tvScreen');
            if (screen) { screen.classList.add('tv-switching'); setTimeout(()=>draw(), 200); }
            else draw();
          });
        });
      } else {
        remoteSlot.innerHTML = '';
      }
    });

    // Antenna drag (for static channel)
    if (c.hasStatic) {
      const rod = el.querySelector('#antennaRod');
      const wrap = el.querySelector('#antennaWrap');
      if (rod) {
        rod.addEventListener('pointerdown', e => {
          antennaDrag=true; rod.setPointerCapture(e.pointerId); e.preventDefault();
        });
        rod.addEventListener('pointermove', e => {
          if (!antennaDrag) return;
          const wr = wrap.getBoundingClientRect();
          const dx = e.clientX - (wr.left+wr.width/2);
          const dy = e.clientY - wr.top;
          const angle = Math.atan2(dx, -dy) * (180/Math.PI);
          const clampedAngle = Math.max(-60, Math.min(60, angle));
          rod.style.setProperty('--angle', clampedAngle+'deg');
          // How close to 15deg (optimal)?
          const diff = Math.abs(clampedAngle - 15);
          staticLevel = Math.max(0, Math.min(100, diff * 2.5));
          if (staticLevel < 5) {
            // Clear! Switch to nature
            antennaDrag=false; stopStatic(); sndClick();
            ch = CHANNELS.findIndex(x=>x.id==='nature');
            setTimeout(()=>draw(),150);
          }
        });
        rod.addEventListener('pointerup', ()=>{ antennaDrag=false; });
      }
    }

    // Hungry bear bonus: trigger hunger animation
    if (c.isAd) {
      const moodNote = el.querySelector('#moodNote');
      if (moodNote) {
        setTimeout(()=>{
          moodNote.innerHTML = '🍯 HUNGRIG! Ge mat snabbt!';
          moodNote.classList.add('hunger-flash');
        }, 1200);
      }
    }

    // Sport bear cheers sound
    if (c.id === 'sport') setTimeout(()=>sndCheers(), 400);
    if (c.id === 'film')  setTimeout(()=>sndScared(), 300);
  }

  draw();
  return ()=>stopStatic();
}

// ─── SCENE: SLEEP ───────────────────────────
function initSleepScene(animal, el, cb) {
  let covered=false, lightsOff=false, patCount=0;

  el.innerHTML = `
    <div class="s-sleep" id="sleepScene">
      <div class="sleep-room">
        <div class="sleep-lamp">
          <div class="lamp-head"></div>
          <div class="lamp-pole"></div>
          <div class="lamp-switch-btn" id="lampSwBtn"><div class="lamp-sw-inner"></div></div>
          <div class="lamp-base"></div>
        </div>
        <div class="sleep-bear-area">
          <div class="sleep-bear">${buildAnimalHTML(animal.type,false,88)}</div>
          <div class="blanket-cover" id="blanketCover" style="height:0%"></div>
        </div>
      </div>
      <div class="blanket-pull-area" id="blanketPull">
        <div class="blanket-puller" id="bPuller">
          <div class="puller-tab"><span>🛏️</span> Dra uppåt!</div>
          <div class="puller-blanket-vis"></div>
        </div>
      </div>
      <div class="sleep-progress">
        <div class="sp-step" id="spStep1">🛏️ Täcke</div>
        <div class="sp-step" id="spStep2">💡 Lampan</div>
        <div class="sp-step" id="spStep3">💤 Godnatt</div>
      </div>
      <div class="pat-area" id="patArea" style="display:none">
        <div class="pat-instruction">Klappa ${animal.name} godnatt 💤</div>
        <div class="pat-bear-btn">${buildAnimalHTML(animal.type,false,64)}</div>
        <div class="pat-hearts"><span class="ph">♡</span><span class="ph">♡</span><span class="ph">♡</span></div>
      </div>
    </div>`;

  el.querySelector('#lampSwBtn').addEventListener('click', ()=>{
    lightsOff=!lightsOff; sndLamp();
    el.querySelector('#sleepScene').classList.toggle('lights-off',lightsOff);
    el.querySelector('.lamp-head').classList.toggle('off',lightsOff);
    el.querySelector('#spStep2').classList.toggle('done',lightsOff);
    checkReady();
  });

  const puller=el.querySelector('#bPuller'), cover=el.querySelector('#blanketCover'), pullArea=el.querySelector('#blanketPull');
  let dragY=null;
  puller.addEventListener('pointerdown',e=>{ dragY=e.clientY; puller.setPointerCapture(e.pointerId); e.preventDefault(); });
  puller.addEventListener('pointermove',e=>{
    if (dragY===null) return;
    const dy=Math.max(0,dragY-e.clientY);
    const pct=Math.min(100,(dy/90)*100);
    cover.style.height=pct+'%';
    if (pct>=95) {
      covered=true; dragY=null; cover.style.height='78%'; pullArea.style.display='none';
      el.querySelector('#spStep1').classList.add('done'); checkReady();
    }
  });
  puller.addEventListener('pointerup',()=>{ if(!covered){cover.style.height='0%';} dragY=null; });
  puller.addEventListener('pointercancel',()=>{ if(!covered){cover.style.height='0%';} dragY=null; });

  function checkReady() {
    if (covered&&lightsOff) { el.querySelector('#spStep3').classList.add('ready'); el.querySelector('#patArea').style.display='flex'; }
  }

  let patCooldown=false;
  el.querySelector('#patArea').addEventListener('pointerdown',e=>{
    if(!covered||!lightsOff||patCount>=3||patCooldown) return;
    patCooldown=true; setTimeout(()=>patCooldown=false,350);
    patCount++; sndPat();
    const hearts=el.querySelectorAll('.ph');
    if(hearts[patCount-1]){hearts[patCount-1].textContent='♥'; hearts[patCount-1].classList.add('filled');}
    el.querySelector('#patArea').classList.add('patted');
    setTimeout(()=>el.querySelector('#patArea')?.classList.remove('patted'),250);
    if(patCount>=3) setTimeout(()=>cb.onSleep(),700);
  });
}

// ─── HELPERS ────────────────────────────────
function centerOf(el) {
  const r=el.getBoundingClientRect();
  return {x:r.left+r.width/2, y:r.top+r.height/2};
}
function spawnParticles(container, set, count) {
  for (let i=0;i<count;i++) {
    setTimeout(()=>{
      const p=document.createElement('div');
      p.className='burst-particle';
      p.textContent=set[Math.floor(Math.random()*set.length)];
      p.style.cssText=`left:${15+Math.random()*70}%;top:${20+Math.random()*60}%;animation-delay:${i*0.05}s`;
      container.appendChild(p);
      setTimeout(()=>p.remove(),900);
    },i*50);
  }
}

// ─── ENTRY ──────────────────────────────────
function initScene(tab, animal, container, callbacks) {
  if (tab==='feed')  return initFeedScene(animal, container, callbacks);
  if (tab==='play')  return initPlayScene(animal, container, callbacks);
  if (tab==='tv')    return initTvScene(animal, container, callbacks);
  if (tab==='sleep') return initSleepScene(animal, container, callbacks);
  if (tab==='read')  return initReadScene(animal, container, callbacks);
  if (tab==='fika')  return initFikaScene(animal, container, callbacks);
}

// ─── SCENE: READ ────────────────────────────
const BOOK_PAGES = [
  { title:'Receptet på mysbulle', content:'🧈+🍯+🌸 = Perfekt!',   emoji:'🧁' },
  { title:'Skogsdjurens hemlighet', content:'Alla nallor är magiska.', emoji:'🌲' },
  { title:'Drömmarnas atlas',      content:'Karta över drömland.',    emoji:'🗺️' },
  { title:'Honung för hjärtat',    content:'En bok om att vara snäll.', emoji:'💛' },
  { title:'Stjärnornas sång',      content:'Varje stjärna sjunger.',  emoji:'⭐' },
  { title:'Receptet på godnatt',   content:'Varm mjölk + lullaby.',  emoji:'🌙' },
];

function initReadScene(animal, el, cb) {
  let pageIdx = 0;
  let pagesRead = 0;
  let turning = false;

  function draw() {
    const page = BOOK_PAGES[pageIdx % BOOK_PAGES.length];
    const noEnergy = cb.noEnergyRead();

    el.innerHTML = `
      <div class="s-read">
        <div class="read-room">
          <div class="read-bear-side">
            <div class="read-lamp-glow"></div>
            ${buildAnimalHTML(animal.type, false, 78)}
          </div>
          <div class="book-wrap" id="bookWrap">
            <div class="book ${turning ? 'page-turning' : ''}">
              <div class="book-spine"></div>
              <div class="book-page book-left">
                <div class="page-num">s. ${pageIdx*2+1}</div>
                <div class="page-art">${BOOK_PAGES[(pageIdx-1+BOOK_PAGES.length)%BOOK_PAGES.length]?.emoji || '📖'}</div>
                <div class="page-text-lines">
                  <div class="ptl"></div><div class="ptl short"></div><div class="ptl"></div>
                </div>
              </div>
              <div class="book-page book-right">
                <div class="page-num">s. ${pageIdx*2+2}</div>
                <div class="page-art">${page.emoji}</div>
                <div class="page-title">${page.title}</div>
                <div class="page-quote">"${page.content}"</div>
              </div>
            </div>
            <button class="turn-page-btn ${noEnergy ? 'disabled' : ''}" id="turnBtn"
                    ${noEnergy ? 'disabled' : ''}>
              ${noEnergy ? '💤 För trött att läsa' : '👉 Bläddra'}
            </button>
          </div>
        </div>
        <div class="read-progress">
          <div class="read-pages-row">
            ${Array.from({length:6}).map((_,i) =>
              `<span class="read-dot ${i<pagesRead?'read-done':''}">${i<pagesRead?'📖':'○'}</span>`
            ).join('')}
          </div>
          <div class="read-mood-note">+🌸 humör per sida</div>
        </div>
      </div>`;

    const btn = el.querySelector('#turnBtn');
    if (!noEnergy && btn) {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (turning) return;
        const ok = cb.onRead(pagesRead);
        if (!ok) return;
        turning = true;
        pagesRead = Math.min(6, pagesRead + 1);
        pageIdx++;
        setTimeout(() => { turning = false; draw(); }, 500);
      });
    }
  }

  draw();
}

// ─── SCENE: FIKA ────────────────────────────
function sndSip() {
  try {
    const c = getAC();
    [320,280,260].forEach((f,i) => {
      const t = c.currentTime + i*0.07;
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t+0.09);
      o.start(t); o.stop(t+0.1);
    });
  } catch(e) {}
}

function initFikaScene(animal, el, cb) {
  let sipping = false;

  function msToSec(ms) { return Math.ceil(ms/1000); }

  function draw() {
    const onCooldown = cb.fikaOnCooldown();
    const secsLeft = onCooldown ? msToSec(cb.fikaCooldownMs()) : 0;

    el.innerHTML = `
      <div class="s-fika">
        <div class="fika-room">
          <div class="fika-bear-side">
            ${buildAnimalHTML(animal.type, sipping, 84)}
          </div>
          <div class="fika-table">
            <div class="fika-items">
              <div class="fika-cup ${onCooldown?'cup-empty':'cup-full'}" id="fikaBtn">
                <div class="cup-steam" id="steam">
                  ${!onCooldown ? `<div class="steam-wisp w1"></div><div class="steam-wisp w2"></div><div class="steam-wisp w3"></div>` : ''}
                </div>
                <div class="cup-body">
                  <div class="cup-liquid ${onCooldown?'':'liquid-hot'}"></div>
                </div>
                <div class="cup-saucer"></div>
                <div class="cup-handle"></div>
              </div>
              <div class="fika-plate">
                <div class="fika-cookie">🍪</div>
                <div class="fika-cookie small">🍪</div>
              </div>
            </div>
            <div class="table-surface"></div>
          </div>
        </div>

        <div class="fika-action">
          ${onCooldown
            ? `<div class="fika-wait">☕ Väntar ${secsLeft}s… koppen svalnar</div>
               <div class="fika-cool-bar"><div class="fika-cool-fill" style="width:${100-(cb.fikaCooldownMs()/130)}%"></div></div>`
            : `<button class="fika-drink-btn" id="drinkBtn">Ta en klunk! ☕</button>`}
        </div>

        <div class="fika-bonuses">
          <span class="fika-bonus">+${14} ⚡</span>
          <span class="fika-bonus">+${22} 🌸</span>
          <span class="fika-bonus">+${9} 💛 band</span>
        </div>
      </div>`;

    const btn = el.querySelector('#drinkBtn');
    if (btn) {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (sipping) return;
        sipping = true;
        sndSip();
        cb.onFika();
        el.querySelector('.fika-cup')?.classList.add('cup-tilt');
        setTimeout(() => { sipping = false; draw(); }, 800);
      });
    }

    // Live countdown update
    if (onCooldown) {
      const cdInterval = setInterval(() => {
        if (!el.querySelector('.fika-wait')) { clearInterval(cdInterval); return; }
        if (!cb.fikaOnCooldown()) { clearInterval(cdInterval); draw(); return; }
        const sec = msToSec(cb.fikaCooldownMs());
        const waitEl = el.querySelector('.fika-wait');
        if (waitEl) waitEl.textContent = `☕ Väntar ${sec}s… koppen svalnar`;
        const fill = el.querySelector('.fika-cool-fill');
        if (fill) fill.style.width = (100-(cb.fikaCooldownMs()/130))+'%';
      }, 500);
    }
  }

  draw();
}


