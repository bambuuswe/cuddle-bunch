// =============================================
//  ANIMALS.JS – shared CSS art builder
// =============================================

const ANIMAL_COLORS = {
  bear:   { main:'#C8855A', dark:'#8B4F2E', muzzle:'#D99870', inner:'#E5B090', eye:'#3D2810', ear:'#F2A0B8' },
  rabbit: { main:'#EDE4DC', dark:'#9A7A6A', muzzle:'#E0D0C4', inner:'#E8DCCC', eye:'#3C2860', ear:'#F2A0B8' },
  cat:    { main:'#C8A882', dark:'#8B6A4A', muzzle:'#D4B896', inner:'#DCC0A0', eye:'#2E5C2E', ear:'#F2A0B8' },
};

function buildAnimalEl(type, sleeping = false, size = 80) {
  const wrap = document.createElement('div');
  wrap.className = 'animal-art';
  wrap.style.cssText = `width:${size}px;height:${size}px;position:relative;flex-shrink:0;`;
  const inner = document.createElement('div');
  inner.className = `anim anim-${type}`;
  inner.style.cssText = 'width:100%;height:100%;position:relative;';
  inner.innerHTML = getPartsHTML(type, sleeping);
  wrap.appendChild(inner);
  return wrap;
}

function buildAnimalHTML(type, sleeping = false, size = 80) {
  return `<div class="animal-art" style="width:${size}px;height:${size}px;position:relative;flex-shrink:0;">
    <div class="anim anim-${type}" style="width:100%;height:100%;position:relative;">
      ${getPartsHTML(type, sleeping)}
    </div>
  </div>`;
}

function getPartsHTML(type, sleeping) {
  const eyeC = sleeping ? ' sleepy' : '';
  if (type === 'bear') return `
    <div class="a-ear a-ear-l"></div>
    <div class="a-ear a-ear-r"></div>
    <div class="a-head">
      <div class="a-eye a-eye-l${eyeC}"></div>
      <div class="a-eye a-eye-r${eyeC}"></div>
      <div class="a-muzzle">
        <div class="a-nose"></div>
        <div class="a-smile"></div>
      </div>
      <div class="a-cheek a-cheek-l"></div>
      <div class="a-cheek a-cheek-r"></div>
    </div>`;

  if (type === 'rabbit') return `
    <div class="a-rear a-rear-l"></div>
    <div class="a-rear a-rear-r"></div>
    <div class="a-head rabbit-head">
      <div class="a-eye a-eye-l${eyeC}"></div>
      <div class="a-eye a-eye-r${eyeC}"></div>
      <div class="a-muzzle rabbit-muzzle">
        <div class="a-nose rabbit-nose"></div>
        <div class="a-smile"></div>
      </div>
      <div class="a-cheek a-cheek-l"></div>
      <div class="a-cheek a-cheek-r"></div>
    </div>`;

  if (type === 'cat') return `
    <div class="a-cat-ear a-cat-ear-l"></div>
    <div class="a-cat-ear a-cat-ear-r"></div>
    <div class="a-head cat-head">
      <div class="a-eye a-eye-l cat-eye${eyeC}"></div>
      <div class="a-eye a-eye-r cat-eye${eyeC}"></div>
      <div class="a-muzzle cat-muzzle">
        <div class="a-nose cat-nose"></div>
        <div class="a-smile"></div>
        <div class="whisker w-l1"></div>
        <div class="whisker w-l2"></div>
        <div class="whisker w-r1"></div>
        <div class="whisker w-r2"></div>
      </div>
      <div class="a-cheek a-cheek-l"></div>
      <div class="a-cheek a-cheek-r"></div>
    </div>`;

  return '';
}

// ── BED (top-down view, animal head peeks above blanket) ─────
function buildBedHTML(type, sleeping = true, size = 130) {
  const headSize = Math.round(size * 0.46);
  return `
  <div class="bed-scene" style="width:${size}px">
    <div class="bed-headboard-bar">
      <div class="hb-knob hb-knob-l"></div>
      <div class="hb-knob hb-knob-r"></div>
    </div>
    <div class="bed-body">
      <div class="bed-mattress-bg"></div>
      <div class="bed-animal-peek">
        ${buildAnimalHTML(type, true, headSize)}
      </div>
      <div class="bed-blanket-layer">
        <div class="blanket-fold-line"></div>
        <div class="blanket-dot bd1"></div>
        <div class="blanket-dot bd2"></div>
        <div class="blanket-dot bd3"></div>
      </div>
    </div>
    <div class="bed-footboard-bar">
      <div class="fb-knob fb-knob-l"></div>
      <div class="fb-knob fb-knob-r"></div>
    </div>
  </div>`;
}

// ── RANDOM NAMES ─────────────────────────────
const NAMES = {
  bear:   ['Bulle','Teddi','Cocos','Mjukis','Brownie','Honey'],
  rabbit: ['Happe','Snöfling','Morot','Floppi','Nussy','Cotton'],
  cat:    ['Pippi','Misse','Lurvig','Fluffis','Nisse','Velvet'],
};
function randomName(type) {
  const list = NAMES[type] || NAMES.bear;
  return list[Math.floor(Math.random() * list.length)];
}
