// =============================================
//  ADOPT.JS – adoption screen logic
// =============================================

let selectedType = 'bear';

// ── STARS ──
(function() {
  const c = document.getElementById('stars');
  for (let i = 0; i < 45; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 4 + 2;
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--dur:${(Math.random()*3+2).toFixed(1)}s;animation-delay:${(Math.random()*5).toFixed(1)}s`;
    c.appendChild(s);
  }
  // Floaties
  const floaties = document.getElementById('floaties');
  if (floaties) {
    const emojis = ['✨','🌸','💫','🌙','⭐','🍀','🌷','💕'];
    for (let i = 0; i < 14; i++) {
      const f = document.createElement('div');
      f.className = 'floaty';
      f.textContent = emojis[i % emojis.length];
      f.style.cssText = `left:${Math.random()*100}%;animation-delay:${(Math.random()*10).toFixed(1)}s;animation-duration:${(Math.random()*8+10).toFixed(1)}s;font-size:${(Math.random()*14+10).toFixed(0)}px`;
      floaties.appendChild(f);
    }
  }
})();

// ── INIT ──
window.addEventListener('DOMContentLoaded', () => {
  // Build mini icons in picker
  ['bear','rabbit','cat'].forEach(t => {
    const el = document.getElementById(`mini-${t}`);
    if (el) el.innerHTML = buildAnimalHTML(t, false, 46);
  });

  // Header logo
  const logo = document.getElementById('logoAnimal');
  if (logo) logo.innerHTML = buildAnimalHTML('bear', false, 54);

  // Initial preview
  updatePreview();
  checkExisting();
});

function updatePreview() {
  const el = document.getElementById('previewAnimal');
  if (el) {
    el.innerHTML = '';
    el.appendChild(buildAnimalEl(selectedType, false, 130));
  }
}

function selectType(type, btn) {
  selectedType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
  updatePreview();
}

function doAdopt() {
  const input = document.getElementById('nameInput');
  const name = (input.value || '').trim() || randomName(selectedType);

  const animals = loadAnimals();
  animals.push({
    id:           Date.now(),
    name,
    type:         selectedType,
    energy:       90,
    sleeping:     false,
    feedCooldown: 0,
    adoptedAt:    Date.now(),
  });
  saveAnimals(animals);

  // Redirect to game
  window.location.href = 'game.html';
}

function checkExisting() {
  const animals = loadAnimals();
  const bar = document.getElementById('returnBar');
  const txt = document.getElementById('returnText');
  if (animals.length > 0 && bar && txt) {
    txt.textContent = `Du har redan ${animals.length} nalle${animals.length > 1 ? 'r' : ''}.`;
    bar.style.display = 'flex';
  }
}

// ── STORAGE ──
function loadAnimals() {
  try { return JSON.parse(localStorage.getItem('cuddleBunch') || '[]'); }
  catch { return []; }
}
function saveAnimals(arr) {
  localStorage.setItem('cuddleBunch', JSON.stringify(arr));
}
