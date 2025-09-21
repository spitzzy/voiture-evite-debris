(() => {
  'use strict';

  const app = document.getElementById('app');
  // When opened from file://, disable PWA manifest to avoid CORS warnings
  if (location.protocol === 'file:') {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.remove();
  }
  // Reduce FX is initialized later (after state is defined)

  

  // ---- Daily Challenges ----
  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  }
  function ensureDaily() {
    try {
      const meta = JSON.parse(localStorage.getItem('daily_meta')||'null');
      const key = todayKey();
      if (!meta || meta.key !== key) {
        // New set of 3 simple challenges
        const tasks = [
          { id:'collect_coins', name:'Collecter 15 pièces', target:15, progress:0, done:false, reward:8 },
          { id:'reach_combo',   name:'Atteindre combo 5',   target:5,  progress:0, done:false, reward:6 },
          { id:'survive_time',  name:'Survivre 60s',        target:60, progress:0, done:false, reward:10 },
        ];
        localStorage.setItem('daily_meta', JSON.stringify({ key, tasks }));
      }
    } catch {}
    updateDailyUI();
  }
  function updateDailyUI() {
    try {
      const meta = JSON.parse(localStorage.getItem('daily_meta')||'null');
      if (!meta) return;
      const t = meta.tasks||[];
      if (challenge1El) challenge1El.textContent = t[0] ? `${t[0].name} (${t[0].progress||0}/${t[0].target})${t[0].done?' ✓':''}` : '—';
      if (challenge2El) challenge2El.textContent = t[1] ? `${t[1].name} (${t[1].progress||0}/${t[1].target})${t[1].done?' ✓':''}` : '—';
      if (challenge3El) challenge3El.textContent = t[2] ? `${t[2].name} (${t[2].progress||0}/${t[2].target})${t[2].done?' ✓':''}` : '—';
    } catch {}
  }
  function bumpDaily(id, delta) {
    try {
      const meta = JSON.parse(localStorage.getItem('daily_meta')||'null');
      if (!meta) return;
      for (const t of meta.tasks) {
        if (t.id !== id || t.done) continue;
        t.progress = Math.min(t.target, (t.progress||0) + delta);
        if (t.progress >= t.target) { t.done = true; showToast(`Défi: ${t.name} ✓ +${t.reward} 🪙`); state.coins += t.reward; saveCoins(); if (coinsEl) coinsEl.textContent = String(state.coins); }
      }
      localStorage.setItem('daily_meta', JSON.stringify(meta));
    } catch {}
    updateDailyUI();
  }

  // ---- Garage / Boutique ----
  const UPGRADE_MAX = { steering: 3, shield: 3, magnet: 3, ghost: 3 };
  const UPGRADE_BASE_COST = { steering: 10, shield: 15, magnet: 15, ghost: 20 };
  // Cosmetics pricing
  const PAINT_COSTS = { pearl: 20, graphite: 18, cyan: 15, pink: 15, gold: 25 };
  function loadUpgrades() {
    try {
      const raw = localStorage.getItem('upgrades');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && typeof u === 'object') state.upgrades = { ...state.upgrades, ...u };
      }
      const ach = localStorage.getItem('achievements');
      if (ach) state.achievements = JSON.parse(ach) || {};
    } catch {}
    // Cosmetics
    try {
      const c = JSON.parse(localStorage.getItem('cosmetics') || 'null');
      if (c && typeof c === 'object') state.cosmetics = { ...state.cosmetics, ...c };
    } catch {}
    applyUpgrades();
    updateUpgradeUI();
  }
  function saveUpgrades() {
    try { localStorage.setItem('upgrades', JSON.stringify(state.upgrades)); } catch {}
  }
  function saveCosmetics() {
    try { localStorage.setItem('cosmetics', JSON.stringify(state.cosmetics)); } catch {}
  }

  // Cosmetics helpers (paints)
  function isPaintUnlocked(key) { return key === 'none' || !!state.cosmetics.unlockedPaints[key]; }
  function getPaintPrice(key) { return PAINT_COSTS[key] || 0; }
  function buyPaint(key) {
    if (isPaintUnlocked(key)) return true;
    const price = getPaintPrice(key);
    if (!price) return false;
    if (!spendCoins(price)) { showToast(`Pas assez de coins (${price}🪙)`, 'error'); return false; }
    state.cosmetics.unlockedPaints[key] = true;
    saveCosmetics();
    showToast(`Peinture ${key} débloquée !`, 'success');
    updateCosmeticsUI();
    return true;
  }

  function updateCosmeticsUI() {
    // Paints UI
    document.querySelectorAll('[data-paint]').forEach(btn => {
      const key = btn.getAttribute('data-paint');
      const isSel = state.cosmetics.paint === key;
      const unlocked = isPaintUnlocked(key);
      btn.setAttribute('aria-pressed', String(isSel));
      btn.classList.toggle('locked', !unlocked);
      const price = getPaintPrice(key);
      if (!unlocked && price) btn.title = `Débloquer (${price}🪙)`; else btn.removeAttribute('title');
    });
  }
  function getUpgradePrice(key) {
    const lvl = state.upgrades[key] || 0;
    return Math.floor(UPGRADE_BASE_COST[key] * Math.pow(2, lvl));
  }
  function updateUpgradeUI() {
    if (!garageModal) return;
    const u = state.upgrades;
    if (lvlSteeringEl) lvlSteeringEl.textContent = `Niv. ${u.steering}`;
    if (lvlShieldEl)   lvlShieldEl.textContent   = `Niv. ${u.shield}`;
    if (lvlMagnetEl)   lvlMagnetEl.textContent   = `Niv. ${u.magnet}`;
    if (lvlGhostEl)    lvlGhostEl.textContent    = `Niv. ${u.ghost}`;
    if (prSteeringEl) prSteeringEl.textContent = String(getUpgradePrice('steering'));
    if (prShieldEl)   prShieldEl.textContent   = String(getUpgradePrice('shield'));
    if (prMagnetEl)   prMagnetEl.textContent   = String(getUpgradePrice('magnet'));
    if (prGhostEl)    prGhostEl.textContent    = String(getUpgradePrice('ghost'));
    // disable at max or insufficient coins
    function canBuy(k) { return (state.upgrades[k] < UPGRADE_MAX[k]) && (state.coins >= getUpgradePrice(k)); }
    if (buySteeringBtn) buySteeringBtn.disabled = !canBuy('steering');
    if (buyShieldBtn)   buyShieldBtn.disabled   = !canBuy('shield');
    if (buyMagnetBtn)   buyMagnetBtn.disabled   = !canBuy('magnet');
    if (buyGhostBtn)    buyGhostBtn.disabled    = !canBuy('ghost');
  }
  function applyUpgrades() {
    // Steering: increases car lateral speed
    if (!car.baseSpeed) car.baseSpeed = car.speed;
    const st = state.upgrades.steering || 0;
    car.speed = car.baseSpeed * (1 + st * 0.12);
    // Shield capacity: base 1, +1 per level up to 4
    state.shieldCapacity = Math.min(4, 1 + (state.upgrades.shield || 0));
    // Magnet/Ghost durations extended
    state.magnetDuration = 6 + (state.upgrades.magnet || 0) * 2;
    state.ghostDuration = 3 + (state.upgrades.ghost || 0) * 0.8;
  }
  function showToast(msg, type = 'success') {
    try {
      const host = document.getElementById('toasts');
      if (!host) return;
      const div = document.createElement('div');
      div.className = `toast ${type}`;
      div.textContent = msg;
      host.appendChild(div);
      setTimeout(() => { div.style.opacity = '0'; div.style.transform = 'translateY(-6px)'; setTimeout(() => div.remove(), 260); }, 3200);
    } catch {}
  }
  function openGarage() {
    if (!garageModal) return;
    garageModal.classList.remove('hidden');
    garageModal.setAttribute('aria-hidden', 'false');
    state.paused = true;
    updateUpgradeUI();
  }
  function closeGarage() {
    if (!garageModal) return;
    garageModal.classList.add('hidden');
    garageModal.setAttribute('aria-hidden', 'true');
    state.paused = false;
  }
  function spendCoins(amount) {
    if (state.coins < amount) return false;
    state.coins -= amount;
    state.coins = Math.max(0, Math.floor(state.coins));
    if (coinsEl) coinsEl.textContent = String(state.coins);
    saveCoins();
    return true;
  }
  function buyUpgrade(key) {
    if (state.upgrades[key] >= UPGRADE_MAX[key]) { showToast('Niveau max atteint', 'warn'); return; }
    const cost = getUpgradePrice(key);
    if (!spendCoins(cost)) { showToast('Pas assez de coins', 'error'); return; }
    state.upgrades[key]++;
    saveUpgrades();
    applyUpgrades();
    updateUpgradeUI();
    showToast(`Amélioration ${key} niveau ${state.upgrades[key]}`, 'success');
  }
  function setupGarage() {
    if (garageBtn) garageBtn.addEventListener('click', openGarage);
    if (closeGarageBtn) closeGarageBtn.addEventListener('click', closeGarage);
    if (buySteeringBtn) buySteeringBtn.addEventListener('click', () => buyUpgrade('steering'));
    if (buyShieldBtn)   buyShieldBtn.addEventListener('click', () => buyUpgrade('shield'));
    if (buyMagnetBtn)   buyMagnetBtn.addEventListener('click', () => buyUpgrade('magnet'));
    if (buyGhostBtn)    buyGhostBtn.addEventListener('click', () => buyUpgrade('ghost'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && garageModal && !garageModal.classList.contains('hidden')) closeGarage(); });
    loadUpgrades();

    // Tabs
    function selectTab(which) {
      const up = which === 'up';
      tabUpgrades?.classList.toggle('hidden', !up);
      tabCosmetics?.classList.toggle('hidden', up);
      tabUpgradesBtn?.setAttribute('aria-pressed', String(up));
      tabCosmeticsBtn?.setAttribute('aria-pressed', String(!up));
    }
    tabUpgradesBtn?.addEventListener('click', () => { selectTab('up'); });
    tabCosmeticsBtn?.addEventListener('click', () => { selectTab('cos'); updateCosmeticsUI(); });
    selectTab('up');
    updateCosmeticsUI();

    // Cosmetics purchases
    buySkinTaxiBtn?.addEventListener('click', () => buyCosmeticSkin('urban_taxi', 50));
    buySkinVaporBtn?.addEventListener('click', () => buyCosmeticSkin('vaporwave', 60));
    // Trail color
    tabCosmetics?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-trail]');
      if (b) { state.cosmetics.trail = b.getAttribute('data-trail'); saveCosmetics(); showToast(`Traînée: ${state.cosmetics.trail}`); }
      const s = e.target.closest('[data-sticker]');
      if (s) { state.cosmetics.sticker = s.getAttribute('data-sticker'); saveCosmetics(); showToast(`Sticker: ${state.cosmetics.sticker}`); }
      const u = e.target.closest('[data-underglow]');
      if (u) { state.cosmetics.underglow = u.getAttribute('data-underglow'); saveCosmetics(); showToast(`Under‑glow: ${state.cosmetics.underglow}`); }
      const p = e.target.closest('[data-paint]');
      if (p) {
        const key = p.getAttribute('data-paint');
        if (!isPaintUnlocked(key)) {
          // try to buy
          if (!buyPaint(key)) return;
        }
        state.cosmetics.paint = key;
        saveCosmetics();
        showToast(`Peinture: ${state.cosmetics.paint}`);
        updateCosmeticsUI();
      }
    });
  // Scores tab switching
  scoresTabClassic?.addEventListener('click', () => {
    scoresTabClassic.setAttribute('aria-pressed', 'true');
    scoresTabTA?.setAttribute('aria-pressed', 'false');
    renderHighscores('classic');
  });
  scoresTabTA?.addEventListener('click', () => {
    scoresTabTA.setAttribute('aria-pressed', 'true');
    scoresTabClassic?.setAttribute('aria-pressed', 'false');
    renderHighscores('ta');
  });
  }

  

  function isSkinUnlocked(key) {
    const defaults = { mint:1, red:1, blue:1, yellow:1 };
    return !!(defaults[key] || state.cosmetics.unlockedSkins[key]);
  }
  function buyCosmeticSkin(key, price) {
    if (isSkinUnlocked(key)) { showToast('Déjà débloqué', 'warn'); return; }
    if (!spendCoins(price)) { showToast('Pas assez de coins', 'error'); return; }
    state.cosmetics.unlockedSkins[key] = true;
    saveCosmetics();
    showToast(`Skin ${key} débloqué !`, 'success');
    updateSkinSelectionUI();
  }

  // ---- Achievements ----
  function saveAchievements() { try { localStorage.setItem('achievements', JSON.stringify(state.achievements)); } catch {} }
  function hasAch(id) { return !!state.achievements[id]; }
  function unlockAch(id, title, desc) {
    if (hasAch(id)) return;
    state.achievements[id] = { title, desc, time: Date.now() };
    saveAchievements();
    showToast(`Succès: ${title}`, 'success');
  }

  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const overlay = document.getElementById('overlay');
  const menuPanel = document.getElementById('menu');
  const gameoverPanel = document.getElementById('gameover');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const finalScoreEl = document.getElementById('finalScore');
  const finalBestEl = document.getElementById('finalBest');
  const finalGradeEl = document.getElementById('finalGrade');
  const leftZone = document.getElementById('leftZone');
  const rightZone = document.getElementById('rightZone');
  const skinGrid = document.getElementById('skinGrid');
  const muteBtn = document.getElementById('muteBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const difficultyGrid = document.getElementById('difficultyGrid');
  const modeGrid = document.getElementById('modeGrid');
  const scoresBtn = document.getElementById('scoresBtn');
  const scoresPanel = document.getElementById('scoresPanel');
  const scoresList = document.getElementById('scoresList');
  const scoresTabClassic = document.getElementById('scoresTabClassic');
  const scoresTabTA = document.getElementById('scoresTabTA');
  const closeScoresBtn = document.getElementById('closeScoresBtn');
  const initialsEntry = document.getElementById('initialsEntry');
  const initialsInput = document.getElementById('initialsInput');
  const saveScoreBtn = document.getElementById('saveScoreBtn');
  const shieldCountEl = document.getElementById('shieldCount');
  const barSlowEl = document.getElementById('barSlow');
  const barMagnetEl = document.getElementById('barMagnet');
  const nextSectionBtn = document.getElementById('nextSectionBtn');
  const rainBtn = document.getElementById('rainBtn');
  const scanBtn = document.getElementById('scanBtn');
  const vignetteBtn = document.getElementById('vignetteBtn');
  const bloomBtn = document.getElementById('bloomBtn');
  const npcBtn = document.getElementById('npcBtn');
  const npcCounterEl = document.getElementById('npcCounter');
  const hornBtn = document.getElementById('hornBtn');
  const npcDensityEl = document.getElementById('npcDensity');
  const retroBtn = document.getElementById('retroBtn');
  const crtBtn = document.getElementById('crtBtn');
  const pixelSizeEl = document.getElementById('pixelSize');
  const ditherBtn = document.getElementById('ditherBtn');
  const musicVolEl = document.getElementById('musicVol');
  const sfxVolEl = document.getElementById('sfxVol');
  // New HUD refs
  const barGhostEl = document.getElementById('barGhost');
  const barDoubleEl = document.getElementById('barDouble');
  const comboMultEl = document.getElementById('comboMult');
  const coinsEl = document.getElementById('coins');
  // Settings menu
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsMenu = document.getElementById('settingsMenu');
  const reduceFxBtn = document.getElementById('reduceFxBtn');
  // Daily challenges UI
  const challenge1El = document.getElementById('challenge1');
  const challenge2El = document.getElementById('challenge2');
  const challenge3El = document.getElementById('challenge3');
  // Garage / Boutique UI
  const garageBtn = document.getElementById('garageBtn');
  const garageModal = document.getElementById('garageModal');
  const closeGarageBtn = document.getElementById('closeGarageBtn');
  const buySteeringBtn = document.getElementById('buy_steering');
  const buyShieldBtn = document.getElementById('buy_shield');
  const buyMagnetBtn = document.getElementById('buy_magnet');
  const buyGhostBtn = document.getElementById('buy_ghost');
  const lvlSteeringEl = document.getElementById('lvl_steering');
  const lvlShieldEl = document.getElementById('lvl_shield');
  const lvlMagnetEl = document.getElementById('lvl_magnet');
  const lvlGhostEl = document.getElementById('lvl_ghost');
  const prSteeringEl = document.getElementById('pr_steering');
  const prShieldEl = document.getElementById('pr_shield');
  const prMagnetEl = document.getElementById('pr_magnet');
  const prGhostEl = document.getElementById('pr_ghost');
  // Cosmetics tab
  const tabUpgradesBtn = document.getElementById('tabUpgradesBtn');
  const tabCosmeticsBtn = document.getElementById('tabCosmeticsBtn');
  const tabUpgrades = document.getElementById('tab-upgrades');
  const tabCosmetics = document.getElementById('tab-cosmetics');
  const buySkinTaxiBtn = document.getElementById('buy_skin_urban_taxi');
  const buySkinVaporBtn = document.getElementById('buy_skin_vaporwave');


  function setupSettingsMenu() {
    if (!settingsBtn || !settingsMenu) return;
    function open() {
      settingsMenu.classList.remove('hidden');
      settingsBtn.setAttribute('aria-expanded', 'true');
    }
    function close() {
      settingsMenu.classList.add('hidden');
      settingsBtn.setAttribute('aria-expanded', 'false');
    }
    function isOpen() { return !settingsMenu.classList.contains('hidden'); }
    settingsBtn.addEventListener('click', () => {
      if (isOpen()) close(); else open();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) close();
    });
    document.addEventListener('mousedown', (e) => {
      if (!isOpen()) return;
      if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) close();
    });
  }

  

  // Objet voiture (doit être défini avant l'application des skins)
  const car = {
    x: 0, y: 0, w: 0, h: 0,
    color: '#29d19c',
    speed: 520, // vitesse latérale px/s
    targetX: null,
    tilt: 0, // rotation en radians (inclinaison)
  };

  // Sprite de voiture + Skins
  const carImg = new Image();
  let carImgLoaded = false;
  const SKINS = {
    mint:   { src: 'assets/car_mint.svg',   color: '#29d19c' },
    red:    { src: 'assets/car_red.svg',    color: '#ff5d6c' },
    blue:   { src: 'assets/car_blue.svg',   color: '#4f8cff' },
    yellow: { src: 'assets/car_yellow.svg', color: '#ffd166' },
    urban_taxi: { src: 'assets/car_urban_taxi.svg', color: '#ffc400' },
    vaporwave:  { src: 'assets/car_vaporwave.svg',  color: '#ff4fd8' },
  };
  let selectedSkin = localStorage.getItem('car_skin') || 'mint';
  function applySkin(key) {
    if (!SKINS[key]) key = 'mint';
    // gate premium skins if not unlocked
    if (!isSkinUnlocked(key)) {
      showToast('Skin verrouillé. Débloque-le dans Cosmétiques.', 'warn');
      // open garage cosmetics tab for convenience
      if (garageModal) {
        openGarage();
        document.getElementById('tab-upgrades')?.classList.add('hidden');
        document.getElementById('tab-cosmetics')?.classList.remove('hidden');
        document.getElementById('tabUpgradesBtn')?.setAttribute('aria-pressed', 'false');
        document.getElementById('tabCosmeticsBtn')?.setAttribute('aria-pressed', 'true');
      }
      return; // don't switch skin
    }
    selectedSkin = key;
    localStorage.setItem('car_skin', key);
    carImgLoaded = false;
    carImg.src = SKINS[key].src;
    car.color = SKINS[key].color; // fallback couleur
    updateSkinSelectionUI();
  }

  // Klaxon du joueur: faire réagir les NPC proches devant
  function playerHorn() {
    playHorn();
    if (!npcEnabled) return;
    const { left: roadLeft, right: roadRight } = roadBounds();
    const cx = car.x + car.w / 2;
    for (const n of npcs) {
      if (n.y < car.y && (car.y - n.y) < 240 * DPR && Math.abs((n.x + n.w / 2) - cx) < (roadRight - roadLeft) * 0.25) {
        // Tenter accélération ou changement de voie
        if (n.laneChangeT <= 0 && n.laneChangeCooldown <= 0 && Math.random() < 0.6) {
          const lanes = 3; const dir = Math.random() < 0.5 ? -1 : 1;
          const newLane = clamp(n.lane + dir, 0, lanes - 1);
          const center = roadLeft + (roadRight - roadLeft) * ((newLane + 0.5) / lanes);
          n.targetLane = newLane;
          n.laneStartX = n.x;
          n.laneEndX = center - n.w / 2;
          n.laneChangeT = 0.0001; n.laneChangeCooldown = rand(1.0, 2.0);
        } else {
          n.speedUpTime = Math.max(n.speedUpTime, 0.8);
        }
      }
    }
  }
  // Bloom pass (simple): blur downscaled frame and composite as screen
  function applyBloom() {
    if (!bloomEnabled) return;
    try {
      bloomCtx.save();
      bloomCtx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height);
      bloomCtx.filter = 'blur(6px) saturate(1.1)';
      bloomCtx.globalAlpha = 1;
      bloomCtx.drawImage(canvas, 0, 0, bloomCanvas.width, bloomCanvas.height);
      bloomCtx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = isNeonTheme() ? 0.38 : 0.22;
      ctx.drawImage(bloomCanvas, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } catch {}
  }

  let crtEnabled = false;
  let ditherEnabled = true;
  let crtPattern = null;
  let crtPatternCanvas = null;

  // PostFX: pixelisation style 8-bit
  function applyRetroPixelate() {
    if (!retroEnabled) return;
    try {
      const w = Math.max(1, Math.floor(canvas.width / retroPixelSize));
      const h = Math.max(1, Math.floor(canvas.height / retroPixelSize));
      if (retroCanvas.width !== w || retroCanvas.height !== h) {
        retroCanvas.width = w; retroCanvas.height = h;
      }
      // downscale
      retroCtx.imageSmoothingEnabled = false;
      retroCtx.clearRect(0, 0, w, h);
      retroCtx.drawImage(canvas, 0, 0, w, h);
      // Quantification de palette, avec ou sans dithering Floyd–Steinberg
      const img = retroCtx.getImageData(0, 0, w, h);
      const d = img.data;
      function nearest(r,g,b) {
        let best = 0, bestDist = 1e9;
        for (let i = 0; i < CYBER8_PALETTE.length; i++) {
          const p = CYBER8_PALETTE[i];
          const dr = r - p.r, dg = g - p.g, db = b - p.b;
          const dist = dr*dr + dg*dg + db*db;
          if (dist < bestDist) { bestDist = dist; best = i; }
        }
        return CYBER8_PALETTE[best];
      }
      const w4 = w * 4;
      if (ditherEnabled) {
        const buf = new Float32Array(d.length);
        for (let i = 0; i < d.length; i++) buf[i] = d[i];
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w4 + x * 4;
            const r = buf[idx], g = buf[idx+1], b = buf[idx+2];
            const q = nearest(r, g, b);
            d[idx] = q.r; d[idx+1] = q.g; d[idx+2] = q.b; // alpha conservée
            const er = r - q.r, eg = g - q.g, eb = b - q.b;
            function add(px, py, fr) {
              if (px < 0 || px >= w || py < 0 || py >= h) return;
              const j = py * w4 + px * 4;
              buf[j  ] = Math.max(0, Math.min(255, buf[j  ] + er * fr));
              buf[j+1] = Math.max(0, Math.min(255, buf[j+1] + eg * fr));
              buf[j+2] = Math.max(0, Math.min(255, buf[j+2] + eb * fr));
            }
            add(x+1, y  , 7/16);
            add(x-1, y+1, 3/16);
            add(x  , y+1, 5/16);
            add(x+1, y+1, 1/16);
          }
        }
      } else {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w4 + x * 4;
            const r = d[idx], g = d[idx+1], b = d[idx+2];
            const q = nearest(r, g, b);
            d[idx] = q.r; d[idx+1] = q.g; d[idx+2] = q.b;
          }
        }
      }
      retroCtx.putImageData(img, 0, 0);
      // upscale with nearest-neighbor
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(retroCanvas, 0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = prev;
    } catch {}
  }

  function drawCRTMask() {
    if (!crtEnabled) return;
    if (!crtPattern) {
      crtPatternCanvas = document.createElement('canvas');
      crtPatternCanvas.width = 3; crtPatternCanvas.height = 3;
      const pctx = crtPatternCanvas.getContext('2d');
      pctx.fillStyle = 'rgba(0,0,0,0.25)';
      pctx.fillRect(0, 0, 3, 3);
      pctx.clearRect(1, 1, 1, 1); // petit point clair au centre
      crtPattern = ctx.createPattern(crtPatternCanvas, 'repeat');
    }
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = crtPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Blackout overlay + phares renforcés
  function drawBlackoutOverlay() {
    ctx.save();
    // assombrir l'écran
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // cône de phares
    const hx = car.x + car.w / 2;
    const hy = car.y + car.h * 0.1;
    const farY = Math.max(0, hy - 260 * DPR);
    const grad = ctx.createLinearGradient(hx, hy, hx, farY);
    grad.addColorStop(0, 'rgba(255,255,220,0.85)');
    grad.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(hx - car.w * 0.55, hy);
    ctx.lineTo(hx - car.w * 2.0, farY);
    ctx.lineTo(hx + car.w * 2.0, farY);
    ctx.lineTo(hx + car.w * 0.55, hy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- Rochers décoratifs ----
  function makeRock(roadLeft, roadRight, side) {
    const sf = getSizeFactorsForTheme().rock;
    const w = rand(14, 28) * DPR * sf;
    const h = rand(10, 22) * DPR * sf;
    const y = -h - 6 * DPR;
    const x = side === 'left' ? (roadLeft - 8 * DPR - w) : (roadRight + 8 * DPR);
    const vy = world.baseSpeed * rand(0.85, 1.05);
    const pal = getSectionPalette();
    return { x, y, w, h, vy, side, light: pal.rockLight, dark: pal.rockDark, r: 6 * DPR };
  }
  function drawRock(rk) {
    ctx.save();
    // base dark shape
    roundRect(ctx, rk.x, rk.y, rk.w, rk.h, rk.r, rk.dark);
    // highlight
    ctx.fillStyle = rk.light;
    const hw = rk.w * 0.65, hh = rk.h * 0.45;
    ctx.globalAlpha = 0.6;
    roundRect(ctx, rk.x + rk.w * 0.18, rk.y + rk.h * 0.18, hw, hh, rk.r * 0.6, rk.light);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ---- Trafic NPC (décoratif) ----
  function makeNPC(roadLeft, roadRight) {
    const lanes = 3;
    const lane = (Math.random() * lanes) | 0; // 0..2
    const laneX = roadLeft + (roadRight - roadLeft) * ((lane + 0.5) / lanes);
    const models = ['sedan', 'suv', 'sport'];
    const model = randChoice(models);
    let w = Math.max(28 * DPR, (roadRight - roadLeft) * 0.085);
    let h = w * 2.0;
    if (model === 'suv') { w *= 1.1; h = w * 2.2; }
    if (model === 'sport') { w *= 0.95; h = w * 1.7; }
    const y = -h - 8 * DPR;
    const speedBase = world.baseSpeed * (0.9 + Math.random() * 0.35);
    // Realistic palettes by model
    const PALETTES = {
      sedan: ['#b0b7c3', '#6d7a88', '#9a3b3b', '#2f3a46', '#d1d5db'],
      suv:   ['#2a3340', '#3e5a7a', '#4c4c4c', '#1f6f5f', '#5a4836'],
      sport: ['#ff3344', '#ffbf00', '#00d0ff', '#ff4fd8', '#29d19c']
    };
    const color = randChoice(PALETTES[model]);
    return {
      x: laneX - w / 2, y, w, h,
      vy: speedBase, speedBase: speedBase,
      color, model, lane, targetLane: lane,
      laneChangeT: 0, laneChangeDur: 0.5,
      laneStartX: laneX - w / 2, laneEndX: laneX - w / 2,
      speedUpTime: 0, speedUpCooldown: rand(2.5, 5.5),
      laneChangeCooldown: rand(1.2, 2.6), hornCooldown: 0,
      prevY: y
    };
  }
  function drawNPC(n) {
    // Helper to slightly darken/lighten a hex color
    function shade(hex, k) {
      try {
        const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
        if (!m) return hex;
        let r = Math.min(255, Math.max(0, Math.round(parseInt(m[1],16) * k)));
        let g = Math.min(255, Math.max(0, Math.round(parseInt(m[2],16) * k)));
        let b = Math.min(255, Math.max(0, Math.round(parseInt(m[3],16) * k)));
        return `rgb(${r},${g},${b})`;
      } catch { return hex; }
    }

    // soft shadow under car
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    const sx = n.x + n.w/2, sy = n.y + n.h*0.9;
    ctx.beginPath();
    ctx.ellipse(sx, sy, n.w*0.55, n.h*0.18, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // body base
    roundRect(ctx, n.x, n.y, n.w, n.h, 6 * DPR, n.color);

    // paint gradient overlay (top highlight, bottom shade)
    const grad = ctx.createLinearGradient(n.x, n.y, n.x, n.y + n.h);
    grad.addColorStop(0, 'rgba(255,255,255,0.10)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = grad;
    roundRect(ctx, n.x, n.y, n.w, n.h, 6 * DPR, grad);

    // roof
    const roofW = n.w * (n.model === 'suv' ? 0.78 : 0.72);
    const roofH = n.h * (n.model === 'sport' ? 0.40 : 0.48);
    const roofX = n.x + (n.w - roofW) / 2;
    const roofY = n.y + n.h * 0.22;
    roundRect(ctx, roofX, roofY, roofW, roofH, 5 * DPR, shade(n.color, 0.85));

    // windows
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    // windshield
    ctx.fillRect(n.x + n.w * 0.18, n.y + n.h * 0.10, n.w * 0.64, n.h * 0.16);
    // rear window
    ctx.fillRect(n.x + n.w * 0.22, n.y + n.h * 0.72, n.w * 0.56, n.h * 0.12);

    // wheels
    function wheel(cx, cy, rx, ry) {
      ctx.save();
      ctx.fillStyle = '#0e0f15';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(rx, ry) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const wl = n.x + n.w * 0.18, wr = n.x + n.w * 0.82;
    wheel(wl, n.y + n.h * 0.26, n.w * 0.14, n.w * 0.11);
    wheel(wr, n.y + n.h * 0.26, n.w * 0.14, n.w * 0.11);
    wheel(wl, n.y + n.h * 0.78, n.w * 0.15, n.w * 0.12);
    wheel(wr, n.y + n.h * 0.78, n.w * 0.15, n.w * 0.12);

    // side trim lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1 * DPR;
    ctx.beginPath();
    ctx.moveTo(n.x + n.w * 0.08, n.y + n.h * 0.50);
    ctx.lineTo(n.x + n.w * 0.92, n.y + n.h * 0.50);
    ctx.stroke();

    // wheel arches (passages de roues)
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2 * DPR;
    function arch(cx, cy, r) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI*0.1, Math.PI*0.9);
      ctx.stroke();
    }
    arch(wl, n.y + n.h * 0.28, n.w * 0.20);
    arch(wr, n.y + n.h * 0.28, n.w * 0.20);
    arch(wl, n.y + n.h * 0.79, n.w * 0.22);
    arch(wr, n.y + n.h * 0.79, n.w * 0.22);

    // door handles (poignées)
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    const dhY = n.y + n.h * 0.5 - 3 * DPR;
    roundRect(ctx, n.x + n.w * 0.18, dhY, 10 * DPR, 3 * DPR, 2 * DPR, 'rgba(255,255,255,0.35)');
    roundRect(ctx, n.x + n.w * 0.68, dhY, 10 * DPR, 3 * DPR, 2 * DPR, 'rgba(255,255,255,0.35)');

    // side mirrors (rétroviseurs)
    ctx.fillStyle = shade(n.color, 0.7);
    roundRect(ctx, n.x - 2 * DPR, n.y + n.h * 0.18, 6 * DPR, 10 * DPR, 2 * DPR, ctx.fillStyle);
    roundRect(ctx, n.x + n.w - 4 * DPR, n.y + n.h * 0.18, 6 * DPR, 10 * DPR, 2 * DPR, ctx.fillStyle);

    // headlight glow (subtle)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const hx1 = n.x + n.w * 0.24, hx2 = n.x + n.w * 0.76, hy = n.y + n.h * 0.08;
    const hg1 = ctx.createRadialGradient(hx1, hy, 1 * DPR, hx1, hy, 8 * DPR);
    hg1.addColorStop(0, 'rgba(250,250,210,0.5)');
    hg1.addColorStop(1, 'rgba(250,250,210,0)');
    ctx.fillStyle = hg1;
    ctx.beginPath(); ctx.arc(hx1, hy, 8 * DPR, 0, Math.PI * 2); ctx.fill();
    const hg2 = ctx.createRadialGradient(hx2, hy, 1 * DPR, hx2, hy, 8 * DPR);
    hg2.addColorStop(0, 'rgba(250,250,210,0.5)');
    hg2.addColorStop(1, 'rgba(250,250,210,0)');
    ctx.fillStyle = hg2;
    ctx.beginPath(); ctx.arc(hx2, hy, 8 * DPR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // tail lights glow
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const tlx1 = n.x + n.w * 0.22, tlx2 = n.x + n.w * 0.78, tly = n.y + n.h * 0.90;
    const g1 = ctx.createRadialGradient(tlx1, tly, 1 * DPR, tlx1, tly, 10 * DPR);
    g1.addColorStop(0, 'rgba(255,60,60,0.7)');
    g1.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = g1;
    ctx.beginPath(); ctx.arc(tlx1, tly, 10 * DPR, 0, Math.PI * 2); ctx.fill();
    const g2 = ctx.createRadialGradient(tlx2, tly, 1 * DPR, tlx2, tly, 10 * DPR);
    g2.addColorStop(0, 'rgba(255,60,60,0.7)');
    g2.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(tlx2, tly, 10 * DPR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---- Musique de fond (pad simple) ----
  let padNodes = null; // {osc1, osc2, gain, filt}
  function startMusicPad() {
    try {
      if (!audioCtx) initAudio();
      if (!audioCtx || !musicGain) return;
      if (padNodes) return; // déjà en lecture

      // Bruit blanc filtré pour une ambiance de vent subtil
      const noise = audioCtx.createBufferSource();
      const bufferSize = audioCtx.sampleRate * 4; // 4 secondes de bruit
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;
      noise.loop = true;

      const bandpass = audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 800;
      bandpass.Q.value = 0.8;

      const lowpass = audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 400;

      const gain = audioCtx.createGain();
      gain.gain.value = 0.03; // Très bas volume

      noise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(musicGain);

      noise.start();

      padNodes = { osc1: noise, osc2: null, gain, filt: lowpass }; // Réutiliser la structure existante
    } catch {}
  }
  function stopMusicPad() {
    if (!padNodes) return;
    try {
      padNodes.osc1.stop();
      padNodes.osc2.stop();
      padNodes.osc1.disconnect();
      padNodes.osc2.disconnect();
      padNodes.gain.disconnect();
      padNodes.filt.disconnect();
    } catch {}
    padNodes = null;
  }

  // ---- Musique chiptune 8-bit ----
  let chip = null; // {osc1, osc2, gain, intervalId}
  function startChiptune() {
    try {
      if (!audioCtx) initAudio();
      if (!audioCtx || !musicGain) return;
      if (chip) return;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.type = 'square';
      osc2.type = 'square';
      gain.gain.value = 0.05;
      osc1.connect(gain); osc2.connect(gain); gain.connect(musicGain);
      osc1.start(); osc2.start();
      const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]; // C major
      let step = 0;
      const intervalId = setInterval(() => {
        // arp simple + basse pédale
        const base = scale[(step >> 2) % scale.length] / 2;
        const arp = scale[(step) % scale.length] * (step % 8 < 4 ? 1 : 2);
        osc1.frequency.setValueAtTime(arp, audioCtx.currentTime);
        osc2.frequency.setValueAtTime(base, audioCtx.currentTime);
        // petit tremolo
        gain.gain.cancelScheduledValues(audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.1);
        step++;
      }, 140); // tempo ~ 430bpm subdiv
      chip = { osc1, osc2, gain, intervalId };
    } catch {}
  }
  function stopChiptune() {
    try {
      if (!chip) return;
      clearInterval(chip.intervalId);
      chip.osc1.stop(); chip.osc2.stop();
      chip.osc1.disconnect(); chip.osc2.disconnect(); chip.gain.disconnect();
    } catch {}
    chip = null;
  }

  function getSizeFactorsForTheme() {
    switch (currentTheme?.name) {
      case 'Désert':
        return { palm: 1.2, rock: 1.3 };
      case 'Forêt':
        return { palm: 1.0, rock: 1.1 };
      case 'Nuit néon':
        return { palm: 1.1, rock: 1.0 };
      case 'Aube':
      default:
        return { palm: 1.0, rock: 1.0 };
    }
  }

  // ---- Néons au sol / Glissières lumineuses ----
  function drawGuardRails(roadLeft, roadRight, roadTop, roadBottom) {
    // Fine glowing rails alongside the shoulders
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createLinearGradient(roadLeft - 10 * DPR, 0, roadLeft, 0);
    glow.addColorStop(0, 'rgba(116,196,255,0)');
    glow.addColorStop(1, 'rgba(116,196,255,0.45)');
    ctx.fillStyle = glow;
    ctx.fillRect(roadLeft - 10 * DPR, roadTop, 10 * DPR, roadBottom - roadTop);

    const glow2 = ctx.createLinearGradient(roadRight, 0, roadRight + 10 * DPR, 0);
    glow2.addColorStop(0, 'rgba(116,196,255,0.45)');
    glow2.addColorStop(1, 'rgba(116,196,255,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(roadRight, roadTop, 10 * DPR, roadBottom - roadTop);
    ctx.restore();
  }

  function drawGroundNeonStrips(roadLeft, roadRight, roadTop, roadBottom) {
    // Moving horizontal neon strips across the road surface
    if (!isNeonTheme()) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const gap = 70 * DPR;
    const stripH = 6 * DPR;
    const offset = (world.lineOffset * 0.8) % gap;
    for (let y = roadTop + offset; y < roadBottom; y += gap) {
      const g = ctx.createLinearGradient(roadLeft, y, roadRight, y);
      g.addColorStop(0, 'rgba(163,116,255,0.0)');
      g.addColorStop(0.5, 'rgba(163,116,255,0.22)');
      g.addColorStop(1, 'rgba(163,116,255,0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(roadLeft, y, roadRight - roadLeft, stripH);
    }
    ctx.restore();
  }
  // ---- Cyberpunk background: skyline parallax ----
  const cityLayers = [];
  function initCyberpunkBackground() {
    cityLayers.length = 0;
    if (!isNeonTheme()) return;
    const w = canvas.width;
    const h = canvas.height;
    const band = Math.max(100 * DPR, Math.min(180 * DPR, h * 0.18));
    // Two layers: far and near
    cityLayers.push(makeSkylineLayer(w, band, 0.18, '#220a4a', '#8b55ff'));
    cityLayers.push(makeSkylineLayer(w, band, 0.28, '#0e0840', '#62d1ff'));
  }
  function makeSkylineLayer(width, height, speedFactor, baseColor, glowColor) {
    const buildings = [];
    let x = -20 * DPR;
    while (x < width + 20 * DPR) {
      const bw = rand(24 * DPR, 60 * DPR);
      const bh = rand(height * 0.35, height * 0.95);
      buildings.push({ x, w: bw, h: bh });
      x += bw + rand(6 * DPR, 18 * DPR);
    }
    return { buildings, y: 0, height, speed: Math.max(30, world.baseSpeed * speedFactor), baseColor, glowColor };
  }
  function updateCyberpunkBackground(dt) {
    if (!isNeonTheme()) return;
    for (const layer of cityLayers) {
      layer.y = (layer.y + layer.speed * dt) % (layer.height + 12 * DPR);
    }
  }
  function drawCyberpunkBackground(roadTop) {
    if (!isNeonTheme()) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const layer of cityLayers) {
      const baseY = roadTop - layer.height + layer.y;
      // draw twice for wrap
      for (let k = 0; k < 2; k++) {
        const y = baseY - k * (layer.height + 12 * DPR);
        // base silhouette
        ctx.fillStyle = layer.baseColor;
        for (const b of layer.buildings) {
          ctx.fillRect(b.x, y + (layer.height - b.h), b.w, b.h);
          // windows
          const stepX = 6 * DPR, stepY = 8 * DPR;
          ctx.fillStyle = 'rgba(255, 255, 180, 0.06)';
          for (let wx = b.x + stepX; wx < b.x + b.w - stepX; wx += stepX) {
            for (let wy = y + (layer.height - b.h) + stepY; wy < y + layer.height - stepY; wy += stepY) {
              if (((wx + wy) | 0) % 3 === 0) {
                ctx.fillRect(wx, wy, 2 * DPR, 3 * DPR);
              }
            }
          }
          ctx.fillStyle = layer.baseColor;
        }
        // glow overlay
        ctx.fillStyle = layer.glowColor;
        ctx.globalAlpha = 0.06;
        ctx.fillRect(0, y, canvas.width, layer.height);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  // ---- Rain overlay ----
  const raindrops = [];
  let rainIntensity = 0.6; // 0..1
  function initRain() { raindrops.length = 0; }
  function updateRain(dt) {
    if (!isNeonTheme() || !rainEnabled) return;
    const spawnRate = 500 * rainIntensity * fxScale(); // drops per second
    const count = Math.floor(spawnRate * dt);
    for (let i = 0; i < count; i++) {
      raindrops.push(makeDrop());
    }
    for (let i = raindrops.length - 1; i >= 0; i--) {
      const d = raindrops[i];
      d.x += d.vx * dt * DPR;
      d.y += d.vy * dt * DPR;
      d.life -= dt;
      if (d.y > canvas.height + 20 * DPR || d.life <= 0) raindrops.splice(i, 1);
    }
  }
  let rainEnabled = true, scanlinesEnabled = true, vignetteEnabled = true;
  let bloomEnabled = true;
  let npcEnabled = true;
  let npcDensityMultiplier = 1.0; // 0..3 (slider)
  let retroEnabled = false;
  let retroPixelSize = 3; // taille de pixel virtuel
  let retroCanvas = document.createElement('canvas');
  let retroCtx = retroCanvas.getContext('2d');
  // Palette 8-bit cyberpunk (violet/cyan/rose + tons route)
  const CYBER8_PALETTE = [
    '#000000','#0a0e2a','#141424','#1a103d','#2b2f4a','#526076',
    '#7b88ff','#4ad2ff','#00f6ff','#29d19c',
    '#a374ff','#e044ff','#ff5acd','#ff7bf3',
    '#ffd166','#e6e7ff'
  ].map(hex => { const c = hex.slice(1); return { r: parseInt(c.slice(0,2),16), g: parseInt(c.slice(2,4),16), b: parseInt(c.slice(4,6),16) }; });
  // Bloom offscreen
  let bloomCanvas = document.createElement('canvas');
  let bloomCtx = bloomCanvas.getContext('2d');
  function drawRain() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(120,200,255,0.25)';
    ctx.lineWidth = 1 * DPR;
    ctx.beginPath();
    for (const d of raindrops) {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.vx * 0.03, d.y - d.vy * 0.03);
    }
    ctx.stroke();
    ctx.restore();
  }
  function makeDrop() {
    const speed = rand(600, 1000);
    const angle = Math.PI * 1.12; // slight diagonal
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    return { x: Math.random() * canvas.width, y: -10 * DPR, vx, vy, life: rand(0.6, 1.2) };
  }
  
  // PostFX: scanlines & vignette
  function drawScanlines() {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    const step = 3 * DPR;
    for (let y = 0; y < canvas.height; y += step) {
      ctx.fillRect(0, y, canvas.width, 1 * DPR);
    }
    ctx.restore();
  }
  function drawVignette() {
    ctx.save();
    const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.55, Math.min(canvas.width, canvas.height) * 0.2,
                                          canvas.width / 2, canvas.height * 0.55, Math.hypot(canvas.width, canvas.height) * 0.6);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // ---- Palmiers décoratifs ----
  function makePalm(roadLeft, roadRight, side) {
    const sf = getSizeFactorsForTheme().palm;
    const baseW = 24 * DPR * sf;
    const baseH = 120 * DPR * sf;
    const trunkW = 10 * DPR * sf;
    const trunkH = baseH;
    const y = -baseH;
    const shoulder = 6 * DPR;
    const x = side === 'left' ? (roadLeft - shoulder - baseW) : (roadRight + shoulder);
    const vy = world.baseSpeed * (0.9 + Math.random() * 0.2);
    const swaySpeed = 1.6 + Math.random() * 0.8;
    const swayAmp = 8 * DPR;
    return { x, y, w: baseW, h: baseH, trunkW, trunkH, side, vy, swaySpeed, swayAmp, phase: Math.random() * Math.PI * 2 };
  }
  function drawPalm(p) {
    // trunk
    const sway = Math.sin(p.phase) * p.swayAmp;
    const tx = p.x + (p.side === 'left' ? sway * 0.5 : -sway * 0.5);
    const ty = p.y;
    ctx.save();
    const pal = getSectionPalette();
    ctx.fillStyle = pal.trunk;
    ctx.fillRect(tx + p.w * 0.5 - p.trunkW * 0.5, ty, p.trunkW, p.trunkH);
    // leaves
    ctx.translate(tx + p.w * 0.5, ty + p.trunkH * 0.1);
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2 + sway * 0.003;
      drawPalmLeaf(ang, p.trunkH * 0.95);
    }
    // neon glow at crown
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 2 * DPR, 0, 0, 36 * DPR);
    g.addColorStop(0, 'rgba(80,200,120,0.25)');
    g.addColorStop(1, 'rgba(80,200,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 36 * DPR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawPalmLeaf(angle, length) {
    ctx.save();
    ctx.rotate(angle);
    const pal = getSectionPalette();
    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, pal.palmLeafStart);
    grad.addColorStop(1, pal.palmLeafEnd);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.35, -10 * DPR, length * 0.7, 0);
    ctx.quadraticCurveTo(length * 0.35, 10 * DPR, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  function drawPowerup(p) {
    ctx.save();
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const pulse = 0.8 + 0.2 * Math.sin(performance.now() / 150 + p.x);

    // Lueur extérieure pulsante
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(cx, cy, p.w * 0.3 * pulse, cx, cy, p.w * 0.9 * pulse);
    glow.addColorStop(0, `${p.color}60`);
    glow.addColorStop(1, `${p.color}00`);
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, p.w * 0.9 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Icône animée au centre
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(performance.now() / 400 + p.y) * 0.1);
    ctx.font = `${p.w * 0.7}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icons = { shield: '🛡️', slow: '🐢', magnet: '🧲', ghost: '👻', double: '✖️2', coin: '🪙' };
    ctx.globalAlpha = 0.9;
    ctx.fillText(icons[p.type], 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // ---- Panneaux rétro ----
  function makeSign(roadLeft, roadRight, side) {
    const w = 70 * DPR;
    const h = 26 * DPR;
    const poleH = 16 * DPR;
    const y = -poleH - h - 10 * DPR;
    const vy = Math.max(60, world.baseSpeed * 0.95);
    const palette = ['#a374ff', '#4ad2ff', '#ffd166', '#ff7bf3', '#e6e7ff'];
    const color = palette[(Math.random() * palette.length) | 0];
    const texts = ['MOTEL', 'PALMS', 'CAFE', 'CITY', 'GAS'];
    const txt = texts[(Math.random() * texts.length) | 0];
    const margin = 12 * DPR;
    const x = side === 'left' ? (roadLeft - margin - w) : (roadRight + margin);
    return { x, y, w, h, poleH, vy, side, color, txt, pulse: Math.random() * Math.PI * 2 };
  }

  function drawSign(s) {
    ctx.save();
    // pole
    ctx.fillStyle = '#4b4b56';
    const poleX = s.side === 'left' ? s.x + s.w * 0.85 : s.x + s.w * 0.15;
    ctx.fillRect(poleX - 2 * DPR, s.y, 4 * DPR, s.poleH + s.h);
    // panel glow
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300 + (s.pulse || 0));
    ctx.fillStyle = s.color || '#e6e7ff';
    ctx.globalAlpha = 0.15 + 0.2 * pulse;
    ctx.fillRect(s.x - 4 * DPR, s.y + s.poleH - 4 * DPR, s.w + 8 * DPR, s.h + 8 * DPR);
    ctx.globalAlpha = 1;
    // panel body
    roundRect(ctx, s.x, s.y + s.poleH, s.w, s.h, 4 * DPR, 'rgba(14,14,24,0.95)');
    // text
    ctx.fillStyle = s.color || '#e6e7ff';
    ctx.font = `${Math.floor(10 * DPR)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.txt || 'MOTEL', s.x + s.w / 2, s.y + s.poleH + s.h / 2);
    ctx.restore();
  }

  // ---- Vaisseaux de fond ----
  function makeShip(roadTop) {
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -40 * DPR : canvas.width + 40 * DPR;
    const y = rand(8 * DPR, Math.max(10 * DPR, roadTop - 18 * DPR));
    const vx = (fromLeft ? 1 : -1) * rand(60, 120);
    const bobSpeed = rand(1.4, 2.2);
    const bobAmp = rand(2, 5) * DPR;
    const scale = rand(0.6, 1.2) * (isNeonTheme() ? 1.2 : 1);
    return { x, y, vx, bobT: Math.random() * Math.PI * 2, bobSpeed, bobAmp, scale };
  }
  function drawShips(roadTop) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, roadTop);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    for (const s of ships) {
      const yy = s.y + Math.sin(s.bobT) * s.bobAmp;
      // body
      ctx.fillStyle = 'rgba(180,200,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(s.x, yy, 12 * s.scale * DPR, 4 * s.scale * DPR, 0, 0, Math.PI * 2);
      ctx.fill();
      // glow
      const g = ctx.createRadialGradient(s.x, yy, 2 * DPR, s.x, yy, 20 * s.scale * DPR);
      g.addColorStop(0, 'rgba(116,196,255,0.35)');
      g.addColorStop(1, 'rgba(116,196,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, yy, 20 * s.scale * DPR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  carImg.onload = () => { carImgLoaded = true; };

  function updateSkinSelectionUI() {
    const options = document.querySelectorAll('.skin-option');
    options.forEach((btn) => {
      const isSel = btn.dataset.skin === selectedSkin;
      btn.classList.toggle('selected', isSel);
      btn.setAttribute('aria-pressed', String(isSel));
      // mark locked cosmetics
      const key = btn.dataset.skin;
      const locked = !isSkinUnlocked(key);
      btn.classList.toggle('locked', locked);
      if (locked) btn.title = 'Débloque ce skin dans Cosmétiques'; else btn.removeAttribute('title');
    });
  }

  // Thèmes de sections (couleurs route/accotements/lignes)
  const THEMES = [
    { name: 'Aube',      roadTop: '#1b2634', roadBottom: '#141c28', shoulder: '#2a3a4f', median: 'rgba(255,255,255,0.55)', outside: '#10202c' },
    { name: 'Désert',    roadTop: '#3b2f1b', roadBottom: '#2a2115', shoulder: '#5b4a2b', median: 'rgba(255,245,200,0.65)', outside: '#2a2016' },
    { name: 'Forêt',     roadTop: '#1e2a22', roadBottom: '#121a14', shoulder: '#294132', median: 'rgba(200,255,200,0.55)', outside: '#0f1712' },
    { name: 'Nuit néon', roadTop: '#0f1020', roadBottom: '#090a12', shoulder: '#27306b', median: 'rgba(163,116,255,0.65)', outside: '#070812' },
  ];
  let currentTheme = THEMES[0];
  function applyThemeIndex(i) {
    const prev = currentTheme;
    currentTheme = THEMES[i % THEMES.length];
    // Re-init visuals when entering/leaving neon theme
    if (!prev || prev.name !== currentTheme.name) {
      initCyberpunkBackground();
      initRain();
    }
  }

  // Palette couleurs dépendante de la section / thème
  function getSectionPalette() {
    switch (currentTheme?.name) {
      case 'Désert':
        return {
          palmLeafStart: 'rgba(220,200,100,0.9)', palmLeafEnd: 'rgba(180,150,60,0.7)',
          trunk: '#7b4a2a', rockLight: '#c9a46b', rockDark: '#946c3a'
        };
      case 'Forêt':
        return {
          palmLeafStart: 'rgba(90,220,140,0.95)', palmLeafEnd: 'rgba(50,160,100,0.7)',
          trunk: '#5a3a26', rockLight: '#7fa17a', rockDark: '#4f6d4c'
        };
      case 'Nuit néon':
        return {
          palmLeafStart: 'rgba(140,255,220,0.95)', palmLeafEnd: 'rgba(80,180,255,0.7)',
          trunk: '#52306b', rockLight: '#9a7bff', rockDark: '#5a3aa6'
        };
      case 'Aube':
      default:
        return {
          palmLeafStart: 'rgba(80,200,120,0.9)', palmLeafEnd: 'rgba(40,160,90,0.6)',
          trunk: '#6b3f2a', rockLight: '#9aa7b6', rockDark: '#526076'
        };
    }
  }

  let DPR = Math.min(window.devicePixelRatio || 1, 2);

  const state = {
    running: false,
    gameOver: false,
    exploding: false,
    paused: false,
    muted: localStorage.getItem('muted') === 'true',
    countdown: 0,
    countdownTimer: 0,
    selectedDifficulty: localStorage.getItem('difficulty') || 'normal',
    askingInitials: false,
    pendingScore: 0,
    timeScale: 1,
    shieldCount: 0,
    slowTime: 0,
    slowDuration: 4,
    magnetTime: 0,
    magnetDuration: 6,
    ghostTime: 0,
    ghostDuration: 3,
    doubleTime: 0,
    doubleDuration: 8,
    combo: 0,
    comboTimer: 0,
    sectionIndex: 0,
    sectionTime: 0,
    sectionDuration: 40, // s par section
    sectionBanner: 0, // temps restant pour afficher le titre de section
    sectionName: THEMES[0].name,
    score: 0,
    best: Number(localStorage.getItem('best_score') || 0),
    coins: Number(localStorage.getItem('coins_total') || 0),
    time: 0,
    difficulty: 1, // augmente avec le temps
    // Upgrades & capacities
    upgrades: { steering: 0, shield: 0, magnet: 0, ghost: 0 },
    shieldCapacity: 1,
    // Cosmetics
    cosmetics: { unlockedSkins: {}, unlockedPaints: {}, trail: null, sticker: 'none', underglow: 'none', paint: 'none' },
    // FX
    reduceFx: localStorage.getItem('reduce_fx') === 'true',
    // Achievements
    achievements: {},
    runCoins: 0,
    maxCombo: 0,
    nearMissCount: 0,
    // Mode
    mode: localStorage.getItem('mode') || 'classic', // 'classic' | 'ta'
    taRemaining: 0,
    // Events
    nextEventTime: 28,
    eventActive: false,
    eventType: null,
    eventTimer: 0,
    debrisTrain: null, // {lane:0..2, timer, interval, duration}
  };
  bestEl.textContent = String(state.best);
  if (coinsEl) coinsEl.textContent = String(state.coins);

  function computeGrade() {
    // Normalise metrics 0..100
    const s = Math.max(0, Math.floor(state.score));
    const timeScore = Math.min(1, state.time / (state.mode === 'ta' ? 90 : 120));
    const scoreScore = Math.min(1, s / 1200);
    const comboScore = Math.min(1, (state.maxCombo || 0) / 10);
    const coinScore = Math.min(1, (state.runCoins || 0) / 20);
    const total = (scoreScore * 0.4 + timeScore * 0.25 + comboScore * 0.2 + coinScore * 0.15) * 100;
    if (total >= 85) return 'S';
    if (total >= 70) return 'A';
    if (total >= 55) return 'B';
    if (total >= 40) return 'C';
    return 'D';
  }

  // Mode select UI (after state is initialized)
  function updateModeUI() {
    if (!modeGrid) return;
    modeGrid.querySelectorAll('.difficulty-option').forEach(btn => {
      const isSel = btn.dataset.mode === state.mode;
      btn.setAttribute('aria-pressed', String(isSel));
    });
  }
  if (modeGrid) {
    updateModeUI();
    modeGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.difficulty-option');
      if (!btn) return;
      state.mode = btn.dataset.mode || 'classic';
      updateModeUI();
      try { localStorage.setItem('mode', state.mode); } catch {}
      playClick();
    });
  }

  // ---- Reduce FX (after state is initialized) ----
  function setReduceFx(on) {
    state.reduceFx = !!on;
    try { localStorage.setItem('reduce_fx', String(state.reduceFx)); } catch {}
    if (reduceFxBtn) reduceFxBtn.setAttribute('aria-pressed', String(state.reduceFx));
  }
  function fxScale() { return state.reduceFx ? 0.6 : 1; }
  if (reduceFxBtn) {
    reduceFxBtn.addEventListener('click', () => setReduceFx(!state.reduceFx));
    reduceFxBtn.setAttribute('aria-pressed', String(state.reduceFx));
  }

  function saveCoins() {
    try { localStorage.setItem('coins_total', String(Math.max(0, Math.floor(state.coins || 0)))); } catch {}
  }

  const world = {
    roadPadding: 0.14, // pourcentage sur la largeur
    roadTopPadding: 0.06,
    roadBottomPadding: 0.06,
    lineOffset: 0,
    baseSpeed: 260, // px/s
  };

  // Difficulté presets
  const DIFFICULTIES = {
    easy:   { baseSpeed: 220, spawnInterval: 1.1 },
    normal: { baseSpeed: 260, spawnInterval: 0.9 },
    hard:   { baseSpeed: 320, spawnInterval: 0.7 },
  };

  /**
   * Entité obstacle
   */
  function makeObstacleAtX(roadLeft, roadRight, xCenter) {
    const roadWidth = roadRight - roadLeft;
    const w = rand(28, 70) * DPR;
    const h = rand(18, 42) * DPR;
    const x = xCenter - w / 2;
    const y = -h - 8;
    const speedMultiplier = 0.85 + state.difficulty * 0.15 + state.time * 0.001;
    // Créer plusieurs couches pour un effet de volume
    const layers = [];
    const layerCount = Math.max(2, Math.floor(w / 15));
    for (let i = 0; i < layerCount; i++) {
      layers.push({
        x: rand(-w * 0.1, w * 0.1),
        y: rand(-h * 0.1, h * 0.1),
        w: rand(w * 0.4, w * 0.9),
        h: rand(h * 0.4, h * 0.9),
        color: `hsl(${rand(20, 40)}, 15%, ${rand(20, 50)}%)` // Tons de gris/marron
      });
    }
    return { x, y, w, h, layers, vy: world.baseSpeed * speedMultiplier, isDebris: true };
  }

  // Wrapper: spawn obstacle at a random lane center
  function makeObstacle(roadLeft, roadRight) {
    const lanes = 3;
    const lane = (Math.random() * lanes) | 0; // 0..2
    const xCenter = roadLeft + (roadRight - roadLeft) * ((lane + 0.5) / lanes);
    return makeObstacleAtX(roadLeft, roadRight, xCenter);
  }

  const obstacles = [];
  let spawnTimer = 0;
  let spawnInterval = 0.9; // secondes, diminue avec la difficulté
  // Powerups
  const powerups = [];
  let puSpawnTimer = 0;
  let puSpawnInterval = 7.5; // spawn de base (s)

  // Particules d'explosion
  const particles = [];
  let explosionTimer = 0;
  let explosionDuration = 0.85;
  // Tremblement d'écran
  let shakeTime = 0, shakeDuration = 0, shakeIntensity = 0;

  // Onde de choc
  let shockwave = null; // {x,y,r,alpha}

  // Traînée
  const trail = []; // {x,y,alpha}
  const TRAIL_MAX = 18;
  function getTrailColor() {
    switch (state.cosmetics?.trail) {
      case 'cyan': return '#37d7ff';
      case 'gold': return '#ffd166';
      case 'magenta': return '#ff4fd8';
      default: return car.color;
    }
  }

  // Décor: Palmiers le long de la route
  const palms = [];
  let palmSpawnTimer = 0;
  let palmSpawnInterval = 0.6; // secondes entre palmiers (plus fréquent)
  let palmSideLeft = true; // alterner gauche/droite

  // Décor: Panneaux rétro et vaisseaux
  const signs = [];
  let signSpawnTimer = 0;
  let signSpawnInterval = 2.2; // base
  let signSideLeft = false;

  const ships = [];
  let shipSpawnTimer = 0;
  let shipSpawnInterval = 3.8; // base

  // Décor: Rochers (bord de route)
  const rocks = [];
  let rockSpawnTimer = 0;
  let rockSpawnInterval = 1.6; // base

  // Trafic: Voitures NPC décoratives (sans collision)
  const npcs = [];
  let npcSpawnTimer = 0;
  let npcSpawnInterval = 2.8; // base

  // Audio (WebAudio)
  let audioCtx = null, masterGain = null, musicGain = null, sfxGain = null;
  let audioUnlocked = false; // becomes true after a user gesture
  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      musicGain = audioCtx.createGain();
      sfxGain = audioCtx.createGain();
      const hp = audioCtx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 140;
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);
      masterGain.connect(hp);
      hp.connect(audioCtx.destination);
      masterGain.gain.value = state.muted ? 0 : 1;
      musicGain.gain.value = 0.5;
      sfxGain.gain.value = 0.7;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  // Chrome blocks WebAudio until a user gesture; set up unlockers
  function setupAudioUnlock() {
    const unlock = async () => {
      try {
        if (!audioCtx) initAudio();
        if (audioCtx && audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        // Play a silent buffer to satisfy the gesture
        if (audioCtx) {
          const b = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
          const s = audioCtx.createBufferSource();
          s.buffer = b; s.connect(masterGain || audioCtx.destination); s.start(0);
        }
        audioUnlocked = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        // If a game is already running, start background music now
        if (!state.muted && state.running) {
          if (retroEnabled) { stopMusicPad(); startChiptune(); }
          else { stopChiptune(); startMusicPad(); }
        }
      } catch {}
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock,   { once: true });
  }
  function setMuted(m) {
    state.muted = m;
    localStorage.setItem('muted', String(m));
    if (!audioCtx) initAudio();
    if (masterGain) masterGain.gain.value = m ? 0 : 0.8;
    if (muteBtn) muteBtn.textContent = m ? '🔇' : '🔊';
  }
  function playClick() {
    if (!audioCtx || !sfxGain || state.muted) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = 600;
    g.gain.value = 0.001;
    o.connect(g); g.connect(sfxGain);
    o.start();
    o.frequency.setValueAtTime(600, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    o.stop(audioCtx.currentTime + 0.11);
  }
  function playExplosionSound() {
    if (!audioCtx || !sfxGain) return;
    const noise = audioCtx.createBufferSource();
    const dur = 0.35;
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    noise.buffer = buffer;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1000; bp.Q.value = 0.7;
    const g = audioCtx.createGain();
    g.gain.value = 0.8;
    noise.connect(bp); bp.connect(g); g.connect(sfxGain);
    noise.start();
    const now = audioCtx.currentTime;
    bp.frequency.exponentialRampToValueAtTime(250, now + dur * 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noise.stop(now + dur + 0.01);
  }

  // SFX: klaxon (court) & whoosh de dépassement
  function playHorn() {
    if (!audioCtx || !sfxGain || state.muted) return;
    const nowT = audioCtx.currentTime || 0;
    sfxLast.horn = sfxLast.horn || 0;
    if (nowT - sfxLast.horn < 0.2) return;
    sfxLast.horn = nowT;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = 540;
    g.gain.value = 0.001;
    o.connect(g); g.connect(sfxGain);
    const now = audioCtx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.10, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    o.frequency.exponentialRampToValueAtTime(480, now + 0.1);
    o.start(); o.stop(now + 0.11);
  }
  function playWhoosh() {
    if (!audioCtx || !sfxGain || state.muted) return;
    const nowT = audioCtx.currentTime || 0;
    sfxLast.whoosh = sfxLast.whoosh || 0;
    if (nowT - sfxLast.whoosh < 0.5) return;
    sfxLast.whoosh = nowT;
    const noise = audioCtx.createBufferSource();
    const dur = 0.14;
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    noise.buffer = buffer;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400; bp.Q.value = 0.9;
    const g = audioCtx.createGain(); g.gain.value = 0.12;
    noise.connect(bp); bp.connect(g); g.connect(sfxGain);
    noise.start();
    const now = audioCtx.currentTime;
    bp.frequency.linearRampToValueAtTime(1000, now + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noise.stop(now + dur + 0.01);
  }
  // SFX last-play timestamps (rate limiting)
  const sfxLast = { whoosh: 0, horn: 0 };

  const keys = new Set();
  const inputs = { left: false, right: false };

  function handleResize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    // Adapter le canvas à la taille visible tout en étant net sur écran Retina
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    const targetW = Math.floor(cssWidth * DPR);
    const targetH = Math.floor(cssHeight * DPR);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    // Positionner la voiture selon la route
    const { left: roadLeft, right: roadRight, bottom: roadBottom } = roadBounds();
    const roadWidth = roadRight - roadLeft;
    car.w = Math.max(36 * DPR, Math.floor(roadWidth * 0.085));
    // ratio du sprite ~ 1:2
    car.h = Math.floor(car.w * 2.0);
    car.x = (roadLeft + roadRight) / 2 - car.w / 2;
    car.y = roadBottom - car.h - 16 * DPR;
    // Re-init background elements relying on sizes
    initCyberpunkBackground();
    // resize bloom canvas lower resolution for perf
    bloomCanvas.width = Math.max(1, Math.floor(canvas.width / 2));
    bloomCanvas.height = Math.max(1, Math.floor(canvas.height / 2));
    // retro canvas size adjusted lazily in applyRetroPixelate()
  }

  function roadBounds() {
    const left = Math.floor(canvas.width * world.roadPadding);
    const right = Math.floor(canvas.width * (1 - world.roadPadding));
    const top = Math.floor(canvas.height * world.roadTopPadding);
    const bottom = Math.floor(canvas.height * (1 - world.roadBottomPadding));
    return { left, right, top, bottom };
  }

  function startGame() {
    console.debug('[Game] Start button pressed');
    state.running = true;
    state.gameOver = false;
    state.exploding = false;
    state.paused = false;
    state.timeScale = 1;
    state.score = 0;
    state.time = 0;
    state.difficulty = 1;
    // sections
    state.sectionIndex = 0;
    state.sectionTime = 0;
    state.sectionBanner = 0;
    state.sectionName = THEMES[0].name;
    applyThemeIndex(0);
    spawnTimer = 0;
    // appliquer difficulté
    const diffKey = state.selectedDifficulty in DIFFICULTIES ? state.selectedDifficulty : 'normal';
    world.baseSpeed = DIFFICULTIES[diffKey].baseSpeed;
    spawnInterval = DIFFICULTIES[diffKey].spawnInterval;
    obstacles.length = 0;
    powerups.length = 0;
    particles.length = 0;
    explosionTimer = 0;
    shakeTime = 0; shakeDuration = 0; shakeIntensity = 0;
    shockwave = null;
    trail.length = 0;
    state.shieldCount = 0;
    state.slowTime = 0;
    state.magnetTime = 0;
    state.ghostTime = 0;
    state.doubleTime = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.runCoins = 0;
    state.maxCombo = 0; state.nearMissCount = 0;
    // Mode
    if (modeGrid) {
      // read selected button
      const sel = modeGrid.querySelector('[aria-pressed="true"]');
      if (sel) state.mode = sel.getAttribute('data-mode') || 'classic';
      try { localStorage.setItem('mode', state.mode); } catch {}
    }
    state.taRemaining = state.mode === 'ta' ? 90 : 0;
    state.eventActive = false; state.eventType = null; state.eventTimer = 0; state.debrisTrain = null;
    puSpawnTimer = 0;
    puSpawnInterval = 7.5;
    initCyberpunkBackground();
    initRain();
    palms.length = 0;
    palmSpawnTimer = 0;
    signs.length = 0;
    signSpawnTimer = 0;
    ships.length = 0;
    shipSpawnTimer = 0;
    npcs.length = 0;
    npcSpawnTimer = 0;
    rocks.length = 0;
    rockSpawnTimer = 0;
    // compte à rebours
    state.countdown = 3;
    state.countdownTimer = 1;
    overlay.style.display = 'none';
    overlay.style.pointerEvents = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    menuPanel.classList.add('hidden');
    gameoverPanel.classList.add('hidden');
    lastTime = performance.now();
    // rendre immédiatement une frame après mise à jour de l'UI
    handleResize();
    // seed initial palms for visibility
    {
      const { left: sLeft, right: sRight, top: sTop, bottom: sBottom } = roadBounds();
      for (let i = 0; i < 4; i++) {
        const side = i % 2 === 0 ? 'left' : 'right';
        const p = makePalm(sLeft, sRight, side);
        p.y = rand(sTop + 20 * DPR, sBottom - 180 * DPR);
        palms.push(p);
      }
      // seed initial rocks for visibility
      for (let i = 0; i < 3; i++) {
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const r = makeRock(sLeft, sRight, side);
        r.y = rand(sTop + 40 * DPR, sBottom - 140 * DPR);
        rocks.push(r);
      }
    }
    draw();
    console.debug('[Game] Tick loop scheduled');
    requestAnimationFrame(tick);
    playClick();
    // démarrer la musique selon le mode
    if (!state.muted && audioUnlocked) {
      if (retroEnabled) { stopMusicPad(); startChiptune(); }
      else { stopChiptune(); startMusicPad(); }
    }
  }

  function gameOver() {
    state.running = false;
    state.gameOver = true;
    overlay.style.display = 'grid';
    overlay.style.pointerEvents = 'auto';
    overlay.setAttribute('aria-hidden', 'false');
    menuPanel.classList.add('hidden');
    gameoverPanel.classList.remove('hidden');
    finalScoreEl.textContent = `Score: ${Math.floor(state.score)}`;
    if (state.score > state.best) {
      state.best = Math.floor(state.score);
      localStorage.setItem('best_score', String(state.best));
    }
    finalBestEl.textContent = `Meilleur: ${state.best}`;
    // Grade computation
    const grd = computeGrade();
    if (finalGradeEl) finalGradeEl.textContent = `Grade: ${grd}`;

    // Gestion high scores: proposer initiales si qualifié top 10
    const s = Math.floor(state.score);
    state.pendingScore = s;
    const hs = loadHighscores();
    const qualifies = hs.length < 10 || s > hs[hs.length - 1].score;
    if (initialsEntry) {
      state.askingInitials = qualifies;
      initialsEntry.classList.toggle('hidden', !qualifies);
      if (qualifies) {
        const lastInit = (localStorage.getItem('player_initials') || '').toUpperCase().slice(0,3);
        if (initialsInput) {
          initialsInput.value = lastInit;
          setTimeout(() => initialsInput.focus(), 50);
        }
      }
    }
  }

  function update(dt) {
    // limiter dt pour éviter les sauts
    dt = Math.min(dt, 0.033);

    // pause
    if (state.paused) return;

    // Si en explosion, on met à jour l'effet et on termine éventuellement
    if (state.exploding) {
      updateExplosion(dt);
      return;
    }

    // Compte à rebours
    if (state.countdown > 0) {
      state.countdownTimer -= dt;
      if (state.countdownTimer <= 0) {
        state.countdown--;
        state.countdownTimer = 1;
      }
      // animer route doucement
      const slow = world.baseSpeed * 0.4;
      world.lineOffset = (world.lineOffset + slow * dt) % 60;
      updateCyberpunkBackground(dt);
      updateRain(dt);
      return;
    }

    // Effets temps (slow/magnet/ghost/double)
    state.timeScale = state.slowTime > 0 ? 0.55 : 1;
    if (state.slowTime > 0) state.slowTime = Math.max(0, state.slowTime - dt);
    if (state.magnetTime > 0) state.magnetTime = Math.max(0, state.magnetTime - dt);
    if (state.ghostTime > 0) state.ghostTime = Math.max(0, state.ghostTime - dt);
    if (state.doubleTime > 0) state.doubleTime = Math.max(0, state.doubleTime - dt);
    // HUD update
    if (shieldCountEl) shieldCountEl.textContent = String(state.shieldCount);
    if (barSlowEl) barSlowEl.style.width = (state.slowTime > 0 ? (state.slowTime / state.slowDuration) * 100 : 0) + '%';
    if (barMagnetEl) barMagnetEl.style.width = (state.magnetTime > 0 ? (state.magnetTime / state.magnetDuration) * 100 : 0) + '%';
    if (barGhostEl) barGhostEl.style.width = (state.ghostTime > 0 ? (state.ghostTime / state.ghostDuration) * 100 : 0) + '%';
    if (barDoubleEl) barDoubleEl.style.width = (state.doubleTime > 0 ? (state.doubleTime / state.doubleDuration) * 100 : 0) + '%';
    if (comboMultEl) {
      const mult = 1 + state.combo * 0.1;
      comboMultEl.textContent = 'x' + mult.toFixed(1);
    }
    // combo decay
    if (state.combo > 0) {
      state.comboTimer = Math.max(0, state.comboTimer - dt);
      if (state.comboTimer <= 0) {
        state.combo = Math.max(0, state.combo - 1);
        state.comboTimer = state.combo > 0 ? 2.0 : 0; // palier doux
      }
    }

    // difficulté progresse avec le temps
    state.time += dt;
    state.difficulty = 1 + state.time * 0.08; // hausse progressive
    // Achievements: survive 60s
    if (state.time >= 60 && !hasAch('survive_60')) unlockAch('survive_60', 'Survivant', 'Survivre 60 secondes');
    // Daily: survive time
    bumpDaily('survive_time', dt);

    // Time Attack mode timer
    if (state.mode === 'ta') {
      state.taRemaining -= dt * state.timeScale;
      if (state.taRemaining <= 0) {
        state.taRemaining = 0;
        gameOver();
        return;
      }
    }

    // route / animations décoratives
    const speed = world.baseSpeed * (0.9 + (state.difficulty - 1) * 0.25);
    world.lineOffset = (world.lineOffset + speed * dt * state.timeScale) % 60;
    updateCyberpunkBackground(dt * state.timeScale);
    updateRain(dt * state.timeScale);

    // Sections (changement de thème par paliers)
    state.sectionTime += dt;
    if (state.sectionTime >= state.sectionDuration) {
      state.sectionTime = 0;
      state.sectionIndex++;
      applyThemeIndex(state.sectionIndex);
      state.sectionName = THEMES[state.sectionIndex % THEMES.length].name;
      state.sectionBanner = 2.2; // afficher le nom de section 2.2s
    }
    if (state.sectionBanner > 0) state.sectionBanner = Math.max(0, state.sectionBanner - dt);

    // entrée utilisateur
    const beforeX = car.x;
    const steer = (inputs.left ? -1 : 0) + (inputs.right ? 1 : 0);
    if (steer !== 0) {
      car.x += steer * car.speed * dt * DPR;
      car.targetX = null; // on annule le suivi du doigt si l'utilisateur appuie au clavier
    } else if (car.targetX != null) {
      const diff = car.targetX - (car.x + car.w / 2);
      car.x += clamp(diff, -car.speed * dt * DPR, car.speed * dt * DPR);
    }

    // limites de la route
    const { left: roadLeft, right: roadRight, top: roadTop, bottom: roadBottom } = roadBounds();
    car.x = clamp(car.x, roadLeft + 2, roadRight - car.w - 2);
    car.y = roadBottom - car.h - 16 * DPR;

    // Inclinaison de la voiture basée sur la vitesse latérale
    const velX = (car.x - beforeX) / Math.max(dt, 0.0001);
    const maxTilt = 14 * Math.PI / 180; // 14° en radians
    const targetTilt = clamp((velX / (car.speed * DPR)) * maxTilt * 1.2, -maxTilt, maxTilt);
    car.tilt += (targetTilt - car.tilt) * 0.18;

    // Traînée
    trail.push({ x: car.x + car.w / 2, y: car.y + car.h * 0.9, alpha: 1 });
    if (trail.length > TRAIL_MAX) trail.shift();
    for (const t of trail) t.alpha *= 0.92;

    // spawns
    spawnTimer += dt;
    const currentInterval = Math.max(0.35, spawnInterval - state.time * 0.01);
    if (spawnTimer >= currentInterval) {
      if (typeof makeObstacle === 'function') {
        obstacles.push(makeObstacle(roadLeft, roadRight));
      } else {
        const lanes = 3;
        const lane = (Math.random() * lanes) | 0; // 0..2
        const xCenter = roadLeft + (roadRight - roadLeft) * ((lane + 0.5) / lanes);
        obstacles.push(makeObstacleAtX(roadLeft, roadRight, xCenter));
      }
      spawnTimer = 0;
    }

    // Events scheduler
    if (!state.eventActive && state.time >= state.nextEventTime) {
      // start a random event
      const roll = Math.random();
      let type = 'NarrowRoad';
      if (roll < 0.25) type = 'NarrowRoad'; else if (roll < 0.5) type = 'DebrisTrain'; else if (roll < 0.7) type = 'NPCRush'; else if (roll < 0.85) type = 'HeavyRain'; else type = 'Blackout';
      state.eventActive = true; state.eventType = type;
      if (type === 'NarrowRoad') {
        state.eventTimer = 9; // seconds
        state._roadPaddingPrev = world.roadPadding;
        world.roadPadding = 0.09;
        state.sectionName = 'Travaux - route étroite';
        state.sectionBanner = 3;
      } else {
        if (type === 'DebrisTrain') {
          state.eventTimer = 3.5;
          const lanes = 3;
          const lane = (Math.random() * lanes) | 0;
          state.debrisTrain = { lane, timer: 0, interval: 0.25, duration: 3.5 };
          state.sectionName = 'Convoi de débris';
          state.sectionBanner = 3;
        } else if (type === 'NPCRush') {
          state.eventTimer = 8;
          state._npcPrev = npcDensityMultiplier;
          npcDensityMultiplier = Math.min(3, npcDensityMultiplier * 2.2);
          state.sectionName = 'Trafic dense';
          state.sectionBanner = 3;
        } else if (type === 'HeavyRain') {
          state.eventTimer = 10;
          state._rainPrev = rainIntensity; state._rainEnabledPrev = rainEnabled;
          rainEnabled = true; rainIntensity = 1.0;
          state.sectionName = 'Pluie battante';
          state.sectionBanner = 3;
        } else if (type === 'Blackout') {
          state.eventTimer = 7;
          state.blackout = true;
          state.sectionName = 'Blackout';
          state.sectionBanner = 3;
        }
      }
    }
    if (state.eventActive) {
      state.eventTimer -= dt * state.timeScale;
      if (state.debrisTrain) {
        const lanes = 3;
        const xCenter = roadLeft + (roadRight - roadLeft) * ((state.debrisTrain.lane + 0.5) / lanes);
        state.debrisTrain.timer += dt;
        if (state.debrisTrain.timer >= state.debrisTrain.interval) {
          state.debrisTrain.timer = 0;
          obstacles.push(makeObstacleAtX(roadLeft, roadRight, xCenter));
        }
        state.debrisTrain.duration -= dt;
        if (state.debrisTrain.duration <= 0) state.debrisTrain = null;
      }
      if (state.eventTimer <= 0) {
        if (state.eventType === 'NarrowRoad' && state._roadPaddingPrev != null) {
          world.roadPadding = state._roadPaddingPrev;
          state._roadPaddingPrev = null;
        }
        if (state.eventType === 'NPCRush' && state._npcPrev != null) {
          npcDensityMultiplier = state._npcPrev; state._npcPrev = null;
        }
        if (state.eventType === 'HeavyRain') {
          if (state._rainPrev != null) { rainIntensity = state._rainPrev; state._rainPrev = null; }
          if (state._rainEnabledPrev != null) { rainEnabled = state._rainEnabledPrev; state._rainEnabledPrev = null; }
        }
        if (state.eventType === 'Blackout') {
          state.blackout = false;
        }
        state.eventActive = false; state.eventType = null;
        state.nextEventTime = state.time + 28 + Math.random() * 18;
      }
    }

    // spawns powerups
    puSpawnTimer += dt;
    const puIntervalNow = Math.max(4.5, puSpawnInterval - state.time * 0.02);
    if (puSpawnTimer >= puIntervalNow) {
      powerups.push(makePowerup(roadLeft, roadRight));
      puSpawnTimer = 0;
    }

    // spawn palmiers décoratifs
    palmSpawnTimer += dt;
    const palmIntervalNow = Math.max(0.4, palmSpawnInterval - state.time * 0.005);
    if (palmSpawnTimer >= palmIntervalNow) {
      palms.push(makePalm(roadLeft, roadRight, palmSideLeft ? 'left' : 'right'));
      palmSideLeft = !palmSideLeft;
      palmSpawnTimer = 0;
    }

    // spawn panneaux rétro
    signSpawnTimer += dt;
    const signIntervalNow = Math.max(1.2, signSpawnInterval - state.sectionIndex * 0.15);
    if (signSpawnTimer >= signIntervalNow) {
      signs.push(makeSign(roadLeft, roadRight, signSideLeft ? 'left' : 'right'));
      signSideLeft = !signSideLeft;
      signSpawnTimer = 0;
    }

    // spawn vaisseaux de fond (plus fréquents en thème néon)
    shipSpawnTimer += dt;
    const shipIntervalNow = Math.max(1.4, shipSpawnInterval - (isNeonTheme() ? 1.0 : 0) - state.sectionIndex * 0.1);
    if (shipSpawnTimer >= shipIntervalNow) {
      ships.push(makeShip(roadTop));
      shipSpawnTimer = 0;
    }

    // spawn rochers décoratifs
    rockSpawnTimer += dt;
    const rockIntervalNow = Math.max(0.8, rockSpawnInterval - state.sectionIndex * 0.08);
    if (rockSpawnTimer >= rockIntervalNow) {
      const side = Math.random() < 0.5 ? 'left' : 'right';
      rocks.push(makeRock(roadLeft, roadRight, side));
      rockSpawnTimer = 0;
    }

    // spawn NPCs décoratifs (trafic)
    if (npcEnabled) {
      npcSpawnTimer += dt;
      const dens = Math.max(0.1, npcDensityMultiplier);
      const npcIntervalNow = Math.max(0.6, (npcSpawnInterval / dens) - (state.difficulty - 1) * 0.2);
      if (npcSpawnTimer >= npcIntervalNow) {
        npcs.push(makeNPC(roadLeft, roadRight));
        npcSpawnTimer = 0;
      }
    }

    // maj obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.y += ob.vy * dt * DPR * state.timeScale;
      // collision
      if (carCollidesWithRect(ob)) {
        if (state.ghostTime > 0) {
          // fantôme: pas de collision, petit burst et score léger
          spawnSoftBurst(ob.x + ob.w / 2, ob.y + ob.h / 2);
          obstacles.splice(i, 1);
          state.score += 2; // petit bonus
          continue;
        } else if (state.shieldCount > 0) {
          state.shieldCount--;
          spawnSoftBurst(ob.x + ob.w / 2, ob.y + ob.h / 2);
          obstacles.splice(i, 1);
          continue;
        } else {
          triggerExplosion();
          return;
        }
      }
      // near-miss detection (frôlement)
      if (!ob.nearMissed) {
        const cx = car.x + car.w / 2, ox = ob.x + ob.w / 2;
        const edge = Math.abs(cx - ox) - (car.w + ob.w) / 2;
        const verticalOverlap = !(ob.y + ob.h < car.y || ob.y > car.y + car.h);
        if (verticalOverlap && edge > 0 && edge < 16 * DPR) {
          ob.nearMissed = true;
          state.combo = Math.min(50, state.combo + 1);
          state.comboTimer = 3.0;
          state.maxCombo = Math.max(state.maxCombo||0, state.combo);
          state.nearMissCount = (state.nearMissCount||0) + 1;
          // feedback
          try { navigator.vibrate && navigator.vibrate(20); } catch {}
          playWhoosh();
          // petit score instantané
          let bonus = 3;
          let mult = 1 + state.combo * 0.1;
          if (state.doubleTime > 0) mult *= 2;
          state.score += bonus * mult;
          if (state.combo >= 3 && !hasAch('combo_3')) unlockAch('combo_3', 'Frisson', 'Atteindre un combo 3');
          if (state.combo >= 5) bumpDaily('reach_combo', 1);
        }
      }
      // score si passé
      if (ob.y - ob.h > car.y + car.h && !ob.counted) {
        ob.counted = true;
        let base = 5; // bonus obstacle évité
        let mult = 1 + state.combo * 0.1;
        if (state.doubleTime > 0) mult *= 2;
        state.score += base * mult;
      }
      // cleanup
      if (ob.y > canvas.height + 60) {
        obstacles.splice(i, 1);
      }
    }

    // maj powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      // attraction aimant
      if (state.magnetTime > 0) {
        const cx = car.x + car.w / 2, cy = car.y + car.h / 2;
        const dx = cx - (p.x + p.w / 2);
        const dy = cy - (p.y + p.h / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < 280 * DPR) {
          const ax = (dx / Math.max(dist, 1)) * 420 * dt;
          const ay = (dy / Math.max(dist, 1)) * 420 * dt;
          p.vx = (p.vx || 0) + ax;
          p.vy += ay;
        }
      }
      p.x += (p.vx || 0) * dt * DPR;
      p.y += p.vy * dt * DPR * state.timeScale;
      // collision pickup
      if (rectsOverlap(car, p)) {
        applyPowerup(p.type);
        playClick();
        powerups.splice(i, 1);
        continue;
      }
      if (p.y > canvas.height + 60) powerups.splice(i, 1);
    }

    // maj palmiers
    for (let i = palms.length - 1; i >= 0; i--) {
      const pm = palms[i];
      pm.y += pm.vy * dt * DPR * state.timeScale;
      pm.phase += dt * pm.swaySpeed;
      if (pm.y > canvas.height + 80 * DPR) palms.splice(i, 1);
    }

    // maj panneaux
    for (let i = signs.length - 1; i >= 0; i--) {
      const sg = signs[i];
      sg.y += sg.vy * dt * DPR * state.timeScale;
      if (sg.y > canvas.height + 60 * DPR) signs.splice(i, 1);
    }

    // maj vaisseaux
    for (let i = ships.length - 1; i >= 0; i--) {
      const sh = ships[i];
      sh.x += sh.vx * dt * DPR;
      sh.bobT += sh.bobSpeed * dt;
      if (sh.x < -60 * DPR || sh.x > canvas.width + 60 * DPR) ships.splice(i, 1);
    }

    // maj rochers
    for (let i = rocks.length - 1; i >= 0; i--) {
      const rk = rocks[i];
      rk.y += rk.vy * dt * DPR * state.timeScale;
      if (rk.y > canvas.height + 60 * DPR) rocks.splice(i, 1);
    }

    // maj NPCs + comportements
    if (npcEnabled) {
      const lanes = 3;
      const laneCenterX = (lane) => roadLeft + (roadRight - roadLeft) * ((lane + 0.5) / lanes) - (npcs[0]?.w || 0) / 2;
      for (let i = npcs.length - 1; i >= 0; i--) {
        const n = npcs[i];
        // speed-up scheduling
        n.speedUpTime = Math.max(0, (n.speedUpTime || 0) - dt);
        n.speedUpCooldown = Math.max(0, (n.speedUpCooldown || 0) - dt);
        if (n.speedUpCooldown <= 0 && Math.random() < 0.03) {
          n.speedUpTime = rand(0.8, 1.5);
          n.speedUpCooldown = rand(2.5, 6.0);
          playWhoosh();
        }
        const speedMul = n.speedUpTime > 0 ? 1.35 : 1.0;
        n.vy = n.speedBase * speedMul;

        // tentative de changement de voie périodique (DÉSACTIVÉ)
        /*
        n.laneChangeCooldown = Math.max(0, (n.laneChangeCooldown || 0) - dt);
        if (n.laneChangeT <= 0 && n.laneChangeCooldown <= 0 && Math.random() < 0.05) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          const newLane = clamp(n.lane + dir, 0, lanes - 1);
          if (newLane !== n.lane) {
            n.targetLane = newLane;
            n.laneStartX = n.x;
            const center = roadLeft + (roadRight - roadLeft) * ((newLane + 0.5) / lanes);
            n.laneEndX = center - n.w / 2;
            n.laneChangeT = 0.0001; // start
            n.laneChangeCooldown = rand(1.4, 3.0);
          }
        }
        */

        // NPC vs NPC avoidance (simple)
        // Chercher un NPC devant dans la même voie et très proche
        let front = null;
        for (let j = 0; j < npcs.length; j++) {
          if (j === i) continue;
          const m = npcs[j];
          if (m.lane === n.lane && m.y < n.y && (n.y - m.y) < 160 * DPR) {
            if (!front || m.y > front.y) front = m;
          }
        }
        if (front) {
          // Essayer de changer de voie si libre
          const tryDir = Math.random() < 0.5 ? -1 : 1;
          const candLane = clamp(n.lane + tryDir, 0, lanes - 1);
          const laneFree = (laneIdx) => {
            for (let k = 0; k < npcs.length; k++) {
              if (k === i) continue;
              const o = npcs[k];
              if (o.lane === laneIdx && Math.abs(o.y - n.y) < 180 * DPR) return false;
            }
            return true;
          };
          if (candLane !== n.lane && laneFree(candLane) && n.laneChangeT <= 0 && n.laneChangeCooldown <= 0) {
            n.targetLane = candLane;
            n.laneStartX = n.x;
            const center = roadLeft + (roadRight - roadLeft) * ((candLane + 0.5) / lanes);
            n.laneEndX = center - n.w / 2;
            n.laneChangeT = 0.0001;
            n.laneChangeCooldown = rand(1.4, 3.0);
          } else {
            // ralentir pour éviter collision, et klaxonner parfois
            n.vy = Math.min(n.vy, front.vy * 0.9);
            n.hornCooldown = Math.max(0, (n.hornCooldown || 0) - dt);
            if (n.hornCooldown <= 0 && Math.random() < 0.06) {
              playHorn();
              n.hornCooldown = rand(1.2, 2.4);
            }
          }
        }
        // progression du changement de voie
        if (n.laneChangeT > 0) {
          n.laneChangeT += dt / n.laneChangeDur;
          const t = clamp(n.laneChangeT, 0, 1);
          const e = easeInOutQuad(t);
          n.x = n.laneStartX + (n.laneEndX - n.laneStartX) * e;
          if (t >= 1) {
            n.laneChangeT = 0;
            n.lane = n.targetLane;
            n.x = n.laneEndX;
          }
        }

        // déplacement
        // passer proche du joueur -> whoosh
        if ((n.prevY || n.y) < car.y && (n.y + n.vy * dt * DPR * state.timeScale) >= car.y && n.vy > world.baseSpeed * 0.9) {
          playWhoosh();
        }
        n.prevY = n.y;
        n.y += n.vy * dt * DPR * state.timeScale;
        if (n.y > canvas.height + 80 * DPR) { npcs.splice(i, 1); continue; }
      }
    }

    // NPC vs NPC soft collisions (séparation & réaction)
    if (npcEnabled && npcs.length > 1) {
      for (let i = 0; i < npcs.length; i++) {
        const a = npcs[i];
        for (let j = i + 1; j < npcs.length; j++) {
          const b = npcs[j];
          if (rectsOverlap(a, b)) {
            // Séparation douce
            const overlap = (a.y + a.h) - b.y;
            const push = Math.sign(a.y - b.y) || 1;
            a.y += push * 6 * DPR;
            b.y -= push * 6 * DPR;
            // Ralentir un peu les deux
            a.vy *= 0.9; b.vy *= 0.9;
            // Tenter un changement de voie pour l'un
            const take = Math.random() < 0.5 ? a : b;
            if (take.laneChangeT <= 0 && take.laneChangeCooldown <= 0) {
              const lanes = 3;
              const dir = Math.random() < 0.5 ? -1 : 1;
              const newLane = clamp(take.lane + dir, 0, lanes - 1);
              if (newLane !== take.lane) {
                const { left: roadLeft, right: roadRight } = roadBounds();
                take.targetLane = newLane;
                take.laneStartX = take.x;
                const center = roadLeft + (roadRight - roadLeft) * ((newLane + 0.5) / lanes);
                take.laneEndX = center - take.w / 2;
                take.laneChangeT = 0.0001;
                take.laneChangeCooldown = rand(1.2, 2.6);
              }
            }
            // Parfois, un petit klaxon
            if (Math.random() < 0.2) playHorn();
          }
        }
      }
    }

    // Collisions voiture vs NPCs (dangers réels)
    if (npcEnabled) {
      for (let i = npcs.length - 1; i >= 0; i--) {
        const n = npcs[i];
        const rect = { x: n.x, y: n.y, w: n.w, h: n.h };
        if (carCollidesWithRect(rect)) {
          if (state.shieldCount > 0) {
            state.shieldCount--;
            spawnSoftBurst(n.x + n.w / 2, n.y + n.h / 2);
            npcs.splice(i, 1);
          } else {
            triggerExplosion();
            return;
          }
        }
      }
    }

    // score temps
    state.score += dt * 10; // 10 points par seconde
    scoreEl.textContent = String(Math.floor(state.score));
    bestEl.textContent = String(Math.max(Math.floor(state.score), state.best));
    // HUD NPC density
    if (npcCounterEl) npcCounterEl.textContent = `NPC: ${npcs.length}`;
  }

  function draw() {
    // fond
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tremblement d'écran (offset aléatoire décroissant)
    ctx.save();
    if (shakeTime > 0 && shakeDuration > 0) {
      const t = shakeTime / shakeDuration; // 1 -> 0
      const amp = shakeIntensity * t * t; // ease-out quad
      const ox = (Math.random() * 2 - 1) * amp;
      const oy = (Math.random() * 2 - 1) * amp;
      ctx.translate(ox, oy);
    }

    const { left: roadLeft, right: roadRight, top: roadTop, bottom: roadBottom } = roadBounds();

    // Ciel / accotements
    if (isNeonTheme()) {
      const sky = ctx.createLinearGradient(0, 0, 0, roadTop);
      sky.addColorStop(0, '#180035');
      sky.addColorStop(1, '#0a0b17');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, roadTop);
      // zone en dessous du ciel
      ctx.fillStyle = currentTheme.outside;
      ctx.fillRect(0, roadTop, canvas.width, canvas.height - roadTop);
      // skyline parallax (dans la zone du ciel)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, roadTop);
      ctx.clip();
      drawCyberpunkBackground(roadTop);
      ctx.restore();
    } else {
      ctx.fillStyle = currentTheme.outside;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // route
    const roadGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
    roadGrad.addColorStop(0, currentTheme.roadTop);
    roadGrad.addColorStop(1, currentTheme.roadBottom);
    ctx.fillStyle = roadGrad;
    ctx.fillRect(roadLeft, roadTop, roadRight - roadLeft, roadBottom - roadTop);

    // bords route
    ctx.fillStyle = currentTheme.shoulder;
    ctx.fillRect(roadLeft - 6 * DPR, roadTop, 6 * DPR, roadBottom - roadTop);
    ctx.fillRect(roadRight, roadTop, 6 * DPR, roadBottom - roadTop);

    // Néons au sol et glissières lumineuses
    drawGuardRails(roadLeft, roadRight, roadTop, roadBottom);
    drawGroundNeonStrips(roadLeft, roadRight, roadTop, roadBottom);

    // lignes médianes (pointillées qui défilent)
    const lanes = 3; // visuel seulement
    ctx.strokeStyle = currentTheme.median;
    ctx.lineWidth = 4 * DPR;
    ctx.setLineDash([14 * DPR, 14 * DPR]);
    ctx.lineDashOffset = world.lineOffset;
    for (let i = 1; i < lanes; i++) {
      const x = roadLeft + (roadRight - roadLeft) * (i / lanes);
      ctx.beginPath();
      ctx.moveTo(x, roadTop);
      ctx.lineTo(x, roadBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Effet néon (shader-like) pour le thème "Nuit néon"
    if (isNeonTheme()) {
      drawNeonPulse(roadLeft, roadRight, roadTop, roadBottom);
      // vaisseaux dans le ciel
      drawShips(roadTop);
    }

    // Ombres douces sous les décors et obstacles
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    // palmiers
    for (const p of palms) {
      const bx = p.x + p.w * 0.5;
      const by = p.y + p.h;
      ctx.beginPath();
      ctx.ellipse(bx, by, p.w * 0.8, p.w * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // NPCs
    for (const n of npcs) {
      const bx = n.x + n.w * 0.5;
      const by = n.y + n.h;
      ctx.beginPath();
      ctx.ellipse(bx, by, n.w * 0.6, n.h * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // rochers
    for (const rk of rocks) {
      const bx = rk.x + rk.w * 0.5;
      const by = rk.y + rk.h;
      ctx.beginPath();
      ctx.ellipse(bx, by, rk.w * 0.65, rk.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // obstacles
    for (const ob of obstacles) {
      const bx = ob.x + ob.w * 0.5;
      const by = ob.y + ob.h;
      ctx.beginPath();
      ctx.ellipse(bx, by, ob.w * 0.6, ob.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // palmiers décoratifs (avant les obstacles)
    for (const p of palms) {
      drawPalm(p);
    }

    // panneaux rétro
    for (const s of signs) {
      drawSign(s);
    }

    // NPCs trafic (avant les obstacles)
    for (const n of npcs) {
      drawNPC(n);
    }

    // rochers décoratifs
    for (const rk of rocks) {
      drawRock(rk);
    }

    // obstacles
    for (const ob of obstacles) {
      if (ob.layers && Array.isArray(ob.layers)) {
        ctx.save();
        ctx.translate(ob.x, ob.y);
        for (const layer of ob.layers) {
          ctx.fillStyle = layer.color || '#7a6a5a';
          ctx.fillRect(layer.x, layer.y, layer.w, layer.h);
        }
        // contour léger
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1 * DPR;
        ctx.strokeRect(0, 0, ob.w, ob.h);
        ctx.restore();
      } else {
        roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 6 * DPR, ob.color || '#7a6a5a');
      }
    }

    // powerups visuels
    for (const p of powerups) {
      drawPowerup(p);
    }

    // particules d'explosion
    drawParticles(ctx);

    // onde de choc
    if (shockwave) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${shockwave.alpha})`;
      ctx.lineWidth = 6 * DPR;
      ctx.beginPath();
      ctx.arc(shockwave.x, shockwave.y, shockwave.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // voiture
    if (!state.exploding) {
      // ombre
      const ox = car.x + car.w / 2;
      const oy = car.y + car.h - 4 * DPR;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(ox, oy, car.w * 0.42, car.h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // traînée
      ctx.save();
      for (const t of trail) {
        if (t.alpha < 0.05) continue;
        ctx.globalAlpha = t.alpha * (0.3 * fxScale());
        ctx.fillStyle = getTrailColor();
        ctx.beginPath();
        ctx.ellipse(t.x, t.y, car.w * 0.22, car.h * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      drawCarSprite();

      // sous-glow néon sous la voiture (personnalisable)
      if (isNeonTheme()) {
        ctx.save();
        const choice = state.cosmetics?.underglow || 'none';
        if (choice !== 'none') {
          ctx.globalCompositeOperation = 'lighter';
          const ugx = car.x + car.w / 2;
          const ugy = car.y + car.h * 0.95;
          const pulse = (0.6 + 0.4 * Math.sin(performance.now() / 220)) * fxScale();
          const color = (choice === 'cyan') ? '0,245,255' : (choice === 'pink') ? '255,79,216' : '163,116,255';
          const grad = ctx.createRadialGradient(ugx, ugy, 2 * DPR, ugx, ugy, Math.max(car.w, 42 * DPR) * (0.65 + 0.1 * fxScale()));
          grad.addColorStop(0, `rgba(${color},${0.35 * pulse})`);
          grad.addColorStop(1, `rgba(${color},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(ugx, ugy, car.w * (0.65 + 0.05 * fxScale()), car.h * (0.18 + 0.02 * fxScale()), 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // aura de bouclier
      if (state.shieldCount > 0) {
        ctx.save();
        const cx = car.x + car.w / 2, cy = car.y + car.h / 2;
        const pulse = (Math.sin(performance.now() / 200) * 0.5 + 0.5) * 0.35 + 0.2;
        ctx.strokeStyle = `rgba(41, 209, 156, ${0.5 + pulse * 0.4})`;
        ctx.lineWidth = 6 * DPR;
        ctx.beginPath();
        ctx.ellipse(cx, cy, car.w * (0.6 + pulse * 0.1), car.h * (0.6 + pulse * 0.1), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // aura fantôme
      if (state.ghostTime > 0) {
        ctx.save();
        const cx = car.x + car.w / 2, cy = car.y + car.h / 2;
        const pulse = (Math.sin(performance.now() / 220) * 0.5 + 0.5) * 0.3 + 0.2;
        ctx.globalCompositeOperation = 'screen';
        const g = ctx.createRadialGradient(cx, cy, 6 * DPR, cx, cy, Math.max(car.w, 42 * DPR));
        g.addColorStop(0, 'rgba(65,224,201,0.28)');
        g.addColorStop(1, 'rgba(65,224,201,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, cy, car.w * (0.7 + pulse * 0.1), car.h * (0.7 + pulse * 0.1), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Countdown overlay
    if (state.countdown > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.floor(120 * DPR)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const txt = state.countdown;
      ctx.fillText(String(txt), canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }

    // Bandeau de section
    if (state.sectionBanner > 0) {
      ctx.save();
      const alpha = Math.min(1, state.sectionBanner / 0.4);
      ctx.globalAlpha = alpha;
      const bannerW = Math.min(canvas.width * 0.8, 600 * DPR);
      const bannerH = 60 * DPR;
      const x = (canvas.width - bannerW) / 2;
      const y = 40 * DPR;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x, y, bannerW, bannerH);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2 * DPR;
      ctx.strokeRect(x, y, bannerW, bannerH);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.floor(26 * DPR)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Section: ${state.sectionName}`, x + bannerW / 2, y + bannerH / 2);
      ctx.restore();
    }

    // Pluie (au-dessus de tout)
    if (isNeonTheme() && rainEnabled && raindrops.length) {
      drawRain();
    }
    // Blackout event overlay (phares renforcés)
    if (state.blackout) {
      drawBlackoutOverlay();
    }
    // Time Attack HUD timer (on-canvas)
    if (state.mode === 'ta' && state.running && state.countdown <= 0) {
      ctx.save();
      const t = Math.ceil(state.taRemaining);
      const mm = Math.floor(t / 60).toString().padStart(2, '0');
      const ss = Math.floor(t % 60).toString().padStart(2, '0');
      const text = `${mm}:${ss}`;
      ctx.font = `${Math.floor(28 * DPR)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      const cx = canvas.width / 2;
      ctx.fillRect(cx - 60 * DPR, 10 * DPR, 120 * DPR, 36 * DPR);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx, 16 * DPR);
      ctx.restore();
    }

    // PostFX: scanlines + vignette
    applyBloom();
    applyRetroPixelate();
    drawCRTMask();
    if (scanlinesEnabled) drawScanlines();
    if (vignetteEnabled) drawVignette();

    ctx.restore();
  }

  let lastTime = performance.now();
  function tick(now) {
    if (!state.running) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    update(dt);
    if (state.running) {
      draw();
      requestAnimationFrame(tick);
    }
  }

  // Utils
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a, b) { return Math.random() * (b - a) + a; }
  function randChoice(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // ---- Collisions précises (SAT) voiture vs obstacle rect ----
  function getCarPolygon() {
    const cx = car.x + car.w / 2;
    const cy = car.y + car.h / 2;
    const hw = car.w / 2;
    const hh = car.h / 2;
    const c = Math.cos(car.tilt);
    const s = Math.sin(car.tilt);
    const pts = [
      { x: -hw, y: -hh },
      { x:  hw, y: -hh },
      { x:  hw, y:  hh },
      { x: -hw, y:  hh },
    ];
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i].x;
      const py = pts[i].y;
      pts[i] = { x: cx + px * c - py * s, y: cy + px * s + py * c };
    }
    return pts;
  }
  function rectToPolygon(r) {
    return [
      { x: r.x,       y: r.y },
      { x: r.x + r.w, y: r.y },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x,       y: r.y + r.h },
    ];
  }
  function polyBounds(poly) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of poly) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y; }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  function dot(ax, ay, bx, by) { return ax * bx + ay * by; }
  function project(poly, ax, ay) {
    let min = Infinity, max = -Infinity;
    for (const p of poly) {
      const d = dot(p.x, p.y, ax, ay);
      if (d < min) min = d; if (d > max) max = d;
    }
    return { min, max };
  }
  function axesFromPoly(poly) {
    const axes = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const ex = q.x - p.x;
      const ey = q.y - p.y;
      // normal (perpendicular)
      let ax = -ey, ay = ex;
      const len = Math.hypot(ax, ay) || 1;
      ax /= len; ay /= len;
      axes.push({ x: ax, y: ay });
    }
    return axes;
  }
  function polygonsOverlapSAT(polyA, polyB) {
    const axesA = axesFromPoly(polyA);
    const axesB = axesFromPoly(polyB);
    for (const ax of axesA) {
      const pa = project(polyA, ax.x, ax.y);
      const pb = project(polyB, ax.x, ax.y);
      if (pa.max < pb.min || pb.max < pa.min) return false;
    }
    for (const ax of axesB) {
      const pa = project(polyA, ax.x, ax.y);
      const pb = project(polyB, ax.x, ax.y);
      if (pa.max < pb.min || pb.max < pa.min) return false;
    }
    return true;
  }
  function carCollidesWithRect(r) {
    const carPoly = getCarPolygon();
    // pré-vérification AABB
    const aabb = polyBounds(carPoly);
    if (!rectsOverlap(aabb, r)) return false;
    const rectPoly = rectToPolygon(r);
    return polygonsOverlapSAT(carPoly, rectPoly);
  }

  function drawCarSprite() {
    const cx = car.x + car.w / 2;
    const cy = car.y + car.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(car.tilt);
    if (carImgLoaded) {
      const imgW = carImg.width;
      const imgH = carImg.height;
      const scale = Math.min(car.w / imgW, car.h / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      ctx.drawImage(carImg, -drawW / 2, -drawH / 2, drawW, drawH);
      // Premium paint tint overlay (clipped to sprite)
      const paint = state.cosmetics?.paint || 'none';
      if (paint && paint !== 'none') {
        let col = 'rgba(255,255,255,0.0)';
        if (paint === 'pearl') col = 'rgba(255,255,255,0.32)';
        else if (paint === 'graphite') col = 'rgba(50,50,60,0.45)';
        else if (paint === 'cyan') col = 'rgba(0,245,255,0.35)';
        else if (paint === 'pink') col = 'rgba(255,120,180,0.35)';
        else if (paint === 'gold') col = 'rgba(255,200,60,0.35)';
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = col;
        ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }
    } else {
      // fallback rectangle si l'image n'est pas encore chargée
      roundRect(ctx, -car.w / 2, -car.h / 2, car.w, car.h, 8 * DPR, car.color);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-car.w * 0.32, -car.h * 0.28, car.w * 0.64, car.h * 0.28);
    }
    // Sticker sur le toit (emoji)
    if (state.cosmetics?.sticker && state.cosmetics.sticker !== 'none') {
      ctx.save();
      ctx.translate(0, -car.h * 0.22);
      ctx.font = `${Math.floor(18 * DPR)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const sym = state.cosmetics.sticker === 'star' ? '⭐' : (state.cosmetics.sticker === 'bolt' ? '⚡' : '');
      ctx.globalAlpha = 0.9;
      ctx.fillText(sym, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // Explosion: particules + tremblement + délai avant game over
  function triggerExplosion() {
    if (state.exploding) return;
    state.exploding = true;
    explosionTimer = 0;
    explosionDuration = 0.9;
    const cx = car.x + car.w / 2;
    const cy = car.y + car.h * 0.5;
    spawnExplosion(cx, cy);
    // tremblement
    shakeDuration = 0.55;
    shakeIntensity = 14 * DPR;
    shakeTime = shakeDuration;
    // onde de choc
    shockwave = { x: cx, y: cy, r: 10 * DPR, alpha: 0.7 };
    playExplosionSound();
  }

  function spawnSoftBurst(cx, cy) {
    const colors = ['#ffd166', '#ffffff'];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(80, 220) * DPR;
      const life = rand(0.2, 0.5);
      const size = rand(1.5, 3.5) * DPR;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life, maxLife: life,
        size,
        color: randChoice(colors)
      });
    }
  }

  function spawnExplosion(cx, cy) {
    particles.length = 0;
    const colors = ['#ffd166', '#ff7a59', '#ff5d6c', '#ffffff', '#ffe29a'];
    const n = 70;
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(120, 420) * DPR;
      const life = rand(0.4, 0.95);
      const size = rand(2.5, 6.5) * DPR;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life, maxLife: life,
        size,
        color: randChoice(colors)
      });
    }
  }

  function updateExplosion(dt) {
    // animation de route légère pendant l'explosion
    const speed = world.baseSpeed * 0.6;
    world.lineOffset = (world.lineOffset + speed * dt) % 60;

    // tremblement
    if (shakeTime > 0) {
      shakeTime = Math.max(0, shakeTime - dt);
    }

    // particules
    const gravity = 520 * DPR;
    const drag = 0.98;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= drag;
      p.vy = p.vy * drag + gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // onde de choc
    if (shockwave) {
      shockwave.r += 380 * dt * DPR;
      shockwave.alpha *= 0.9;
      if (shockwave.alpha < 0.03) shockwave = null;
    }

    explosionTimer += dt;
    if (explosionTimer >= explosionDuration) {
      gameOver();
    }
  }

  function drawParticles(ctx) {
    if (particles.length === 0) return;
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = hexToRgba(p.color, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function hexToRgba(hex, a) {
    const c = hex.replace('#','');
    const r = parseInt(c.substring(0,2),16);
    const g = parseInt(c.substring(2,4),16);
    const b = parseInt(c.substring(4,6),16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Perspective scaling helper: returns scale based on y position on the road area
  function scaleForY(y) {
    const { top, bottom } = roadBounds();
    const t = clamp((y - top) / Math.max(1, (bottom - top)), 0, 1);
    // nearer bottom => larger; tweak curve for depth feel
    return 0.6 + t * 0.9; // 0.6 .. 1.5
  }

  // Entrées clavier
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputs.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputs.right = true;
    if (e.key === 'h' || e.key === 'H') playerHorn();
    if (!state.running && !state.gameOver && (e.key === ' ' || e.key === 'Enter')) startGame();
    if (state.gameOver && (e.key === ' ' || e.key === 'Enter')) startGame();
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputs.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputs.right = false;
  });

  // Entrées tactiles / souris
  function setTargetFromPointer(ev) {
    const rect = canvas.getBoundingClientRect();
    const px = (ev.clientX - rect.left) * DPR;
    car.targetX = px - car.w / 2; // viser le centre de la voiture
  }
  canvas.addEventListener('pointerdown', (e) => {
    setTargetFromPointer(e);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pressure > 0 || e.buttons) setTargetFromPointer(e);
  });

  // Sélection de skin sur tout l'overlay (menu + gameover)
  overlay.addEventListener('click', (e) => {
    const btn = e.target.closest('.skin-option');
    if (!btn) return;
    const key = btn.dataset.skin;
    applySkin(key);
    playClick();
  });
  document.querySelectorAll('.skin-option').forEach(btn => {
    btn.setAttribute('tabindex', '0');
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        applySkin(btn.dataset.skin);
        playClick();
      }
    });
  });
  // initial state
  updateSkinSelectionUI();

  // Sélection difficulté
  function updateDifficultyUI() {
    if (!difficultyGrid) return;
    difficultyGrid.querySelectorAll('.difficulty-option').forEach(btn => {
      const isSel = btn.dataset.diff === state.selectedDifficulty;
      btn.setAttribute('aria-pressed', String(isSel));
    });
  }
  if (difficultyGrid) {
    updateDifficultyUI();
    difficultyGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.difficulty-option');
      if (!btn) return;
      state.selectedDifficulty = btn.dataset.diff;
      localStorage.setItem('difficulty', state.selectedDifficulty);
      updateDifficultyUI();
      playClick();
    });
  }

  // Zones gauche/droite
  function zoneDown(side) { inputs[side] = true; }
  function zoneUp(side) { inputs[side] = false; }
  ;['pointerdown','touchstart','mousedown'].forEach(ev => {
    leftZone.addEventListener(ev, () => zoneDown('left'));
    rightZone.addEventListener(ev, () => zoneDown('right'));
  });
  ;['pointerup','pointercancel','touchend','mouseup','mouseleave'].forEach(ev => {
    leftZone.addEventListener(ev, () => zoneUp('left'));
    rightZone.addEventListener(ev, () => zoneUp('right'));
  });

  // Boutons UI
  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
  if (pauseBtn) pauseBtn.addEventListener('click', () => togglePause());
  if (resumeBtn) resumeBtn.addEventListener('click', () => togglePause(true));
  if (muteBtn) muteBtn.addEventListener('click', () => setMuted(!state.muted));
  if (nextSectionBtn) nextSectionBtn.addEventListener('click', () => {
    state.sectionTime = state.sectionDuration;
  });
  if (rainBtn) rainBtn.addEventListener('click', () => {
    rainEnabled = !rainEnabled;
    rainBtn.setAttribute('aria-pressed', String(rainEnabled));
  });
  if (scanBtn) scanBtn.addEventListener('click', () => {
    scanlinesEnabled = !scanlinesEnabled;
    scanBtn.setAttribute('aria-pressed', String(scanlinesEnabled));
  });
  if (vignetteBtn) vignetteBtn.addEventListener('click', () => {
    vignetteEnabled = !vignetteEnabled;
    vignetteBtn.setAttribute('aria-pressed', String(vignetteEnabled));
  });
  if (bloomBtn) bloomBtn.addEventListener('click', () => {
    bloomEnabled = !bloomEnabled;
    bloomBtn.setAttribute('aria-pressed', String(bloomEnabled));
  });
  if (npcBtn) npcBtn.addEventListener('click', () => {
    npcEnabled = !npcEnabled;
    npcBtn.setAttribute('aria-pressed', String(npcEnabled));
    if (!npcEnabled) npcs.length = 0;
  });
  if (hornBtn) hornBtn.addEventListener('click', () => {
    playerHorn();
  });
  if (npcDensityEl) npcDensityEl.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) npcDensityMultiplier = clamp(v, 0, 3);
  });
  if (retroBtn) retroBtn.addEventListener('click', () => {
    retroEnabled = !retroEnabled;
    retroBtn.setAttribute('aria-pressed', String(retroEnabled));
    if (retroEnabled) { stopMusicPad(); if (!state.muted) startChiptune(); }
    else { stopChiptune(); if (!state.muted) startMusicPad(); }
  });
  if (crtBtn) crtBtn.addEventListener('click', () => {
    crtEnabled = !crtEnabled;
    crtBtn.setAttribute('aria-pressed', String(crtEnabled));
  });
  if (pixelSizeEl) pixelSizeEl.addEventListener('input', (e) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) retroPixelSize = clamp(v, 1, 6);
  });
  if (ditherBtn) ditherBtn.addEventListener('click', () => {
    ditherEnabled = !ditherEnabled;
    ditherBtn.setAttribute('aria-pressed', String(ditherEnabled));
  });
  if (musicVolEl) musicVolEl.addEventListener('input', (e) => {
    if (musicGain) musicGain.gain.value = parseFloat(e.target.value);
  });
  if (sfxVolEl) sfxVolEl.addEventListener('input', (e) => {
    if (sfxGain) sfxGain.gain.value = parseFloat(e.target.value);
  });

  // PWA: Service worker registration
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
      });
    }
  }
  if (scoresBtn) scoresBtn.addEventListener('click', () => {
    // default view based on current mode
    const view = (state.mode === 'ta') ? 'ta' : 'classic';
    scoresTabClassic?.setAttribute('aria-pressed', String(view === 'classic'));
    scoresTabTA?.setAttribute('aria-pressed', String(view === 'ta'));
    renderHighscores(view);
    overlay.style.display = 'grid';
    overlay.style.pointerEvents = 'auto';
    overlay.setAttribute('aria-hidden', 'false');
    scoresPanel.classList.remove('hidden');
    menuPanel.classList.add('hidden');
    gameoverPanel.classList.add('hidden');
    document.getElementById('paused')?.classList.add('hidden');
  });
  // register SW at module init (skip on file:// for CORS/policy reasons)
  if (location.protocol !== 'file:') {
    registerServiceWorker();
  }
  if (closeScoresBtn) closeScoresBtn.addEventListener('click', () => {
    scoresPanel.classList.add('hidden');
    if (!state.running) {
      // revenir au menu si pas en partie
      menuPanel.classList.remove('hidden');
    } else {
      overlay.style.display = 'none';
      overlay.style.pointerEvents = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
  });
  if (saveScoreBtn) saveScoreBtn.addEventListener('click', savePendingScore);
  if (initialsInput) initialsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); savePendingScore(); }
  });

  // Resize initial
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);
  }
  window.addEventListener('resize', handleResize);
  handleResize();
  draw();
  // Ensure WebAudio gets unlocked on first user gesture in file:// context
  setupAudioUnlock();
  // Init settings dropdown menu
  setupSettingsMenu();
  // Init Garage system
  setupGarage();
  // Apply saved skin after cosmetics are loaded
  try {
    if (!isSkinUnlocked(selectedSkin)) selectedSkin = 'mint';
    applySkin(selectedSkin);
  } catch {}
  // Daily challenges
  ensureDaily();
  // Auto-start game on load when opened directly from file
  startGame();

  // Pause/Resume logique
  function togglePause(forceResume = false) {
    if (!state.running || state.exploding) return; // pas pendant explosion ou hors partie
    const wantResume = forceResume || state.paused;
    if (wantResume) {
      state.paused = false;
      overlay.style.display = 'none';
      overlay.style.pointerEvents = 'none';
      document.getElementById('paused')?.classList.add('hidden');
      requestAnimationFrame(tick);
    } else {
      state.paused = true;
      overlay.style.display = 'grid';
      overlay.style.pointerEvents = 'auto';
      overlay.setAttribute('aria-hidden', 'false');
      document.getElementById('paused')?.classList.remove('hidden');
      menuPanel.classList.add('hidden');
      gameoverPanel.classList.add('hidden');
    }
    playClick();
  }

  // Clavier global: pause (P) et mute (M)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') togglePause();
    if (e.key === 'm' || e.key === 'M') setMuted(!state.muted);
    if (e.key === 't' || e.key === 'T') { state.sectionTime = state.sectionDuration; }
  });

  // ---- Effets néon pour le thème "Nuit néon" ----
  function isNeonTheme() { return currentTheme && currentTheme.name === 'Nuit néon'; }
  function drawNeonPulse(roadLeft, roadRight, roadTop, roadBottom) {
    const t = performance.now() / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4.2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Glow des lignes médianes
    const fx = fxScale();
    ctx.strokeStyle = `rgba(163,116,255,${(0.25 + 0.35 * pulse) * fx})`;
    ctx.lineWidth = 8 * DPR * (0.8 + 0.4 * fx);
    ctx.shadowBlur = 18 * DPR * (0.6 + 0.6 * pulse) * fx;
    ctx.shadowColor = 'rgba(163,116,255,0.8)';
    const lanes = 3;
    for (let i = 1; i < lanes; i++) {
      const x = roadLeft + (roadRight - roadLeft) * (i / lanes);
      ctx.beginPath();
      ctx.moveTo(x, roadTop);
      ctx.lineTo(x, roadBottom);
      ctx.stroke();
    }

    // Lueur des bords de route
    ctx.shadowBlur = 14 * DPR * (0.6 + 0.6 * (1 - pulse)) * fx;
    ctx.shadowColor = 'rgba(116,196,255,0.65)';
    ctx.fillStyle = `rgba(116,196,255,${0.10 * fx})`;
    ctx.fillRect(roadLeft - 10 * DPR, roadTop, 10 * DPR, roadBottom - roadTop);
    ctx.fillRect(roadRight, roadTop, 10 * DPR, roadBottom - roadTop);

    // Léger voile coloré sur la route
    const vg = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
    vg.addColorStop(0, `rgba(20,20,60,${0.08 + 0.06 * pulse})`);
    vg.addColorStop(1, `rgba(10,10,30,${0.08 + 0.06 * pulse})`);
    ctx.fillStyle = vg;
    ctx.fillRect(roadLeft, roadTop, roadRight - roadLeft, roadBottom - roadTop);

    ctx.restore();
  }

  // Powerups utils
  function makePowerup(roadLeft, roadRight) {
    // Weighted distribution: coin 45%, others share remaining
    const r = Math.random();
    let type = 'shield';
    if (r < 0.45) type = 'coin';
    else if (r < 0.65) type = 'slow';
    else if (r < 0.8) type = 'magnet';
    else if (r < 0.9) type = 'ghost';
    else type = 'double';
    const w = 32 * DPR, h = 32 * DPR;
    const x = rand(roadLeft + w, roadRight - w);
    const y = -h - 20 * DPR;
    const vy = world.baseSpeed * 0.7;
    const colors = { shield: '#4f8cff', slow: '#ffd166', magnet: '#ff7bf3', ghost: '#41e0c9', double: '#ffae42', coin: '#ffcc33' };
    return { x, y, w, h, vy, type, color: colors[type] };
  }
  function pickPowerupType() {
    const r = Math.random();
    if (r < 0.5) return 'shield';
    if (r < 0.8) return 'slow';
    return 'magnet';
  }
  function applyPowerup(type) {
    if (type === 'shield') {
      state.shieldCount = Math.min((state.shieldCapacity || 1), state.shieldCount + 1);
    } else if (type === 'slow') {
      state.slowTime = state.slowDuration;
    } else if (type === 'magnet') {
      state.magnetTime = state.magnetDuration;
    } else if (type === 'ghost') {
      state.ghostTime = state.ghostDuration;
      if (!hasAch('use_ghost')) unlockAch('use_ghost', 'Intouchable', 'Utiliser Fantôme');
    } else if (type === 'double') {
      state.doubleTime = state.doubleDuration;
    } else if (type === 'coin') {
      const add = 1 + (Math.random() < 0.2 ? 1 : 0); // 1 or 2 coins
      state.coins = Math.max(0, (state.coins || 0) + add);
      state.runCoins = (state.runCoins || 0) + add;
      if (coinsEl) coinsEl.textContent = String(state.coins);
      saveCoins();
      if (!hasAch('first_coin')) unlockAch('first_coin', 'Première pièce', 'Collecter une pièce');
      if (state.runCoins >= 10 && !hasAch('collect_10')) unlockAch('collect_10', 'Chasseur', 'Collecter 10 pièces en une partie');
      bumpDaily('collect_coins', add);
    }
  }

  // Highscores helpers
  function loadHighscores(modeOverride) {
    try {
      const modeKey = modeOverride || state?.mode;
      const key = (modeKey === 'ta') ? 'highscores_ta' : 'highscores';
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter(it => typeof it.name === 'string' && typeof it.score === 'number');
      return [];
    } catch { return []; }
  }
  function saveHighscores(list) {
    const key = (state?.mode === 'ta') ? 'highscores_ta' : 'highscores';
    localStorage.setItem(key, JSON.stringify(list));
  }
  function renderHighscores(viewMode) {
    const hs = loadHighscores(viewMode);
    hs.sort((a,b) => b.score - a.score);
    const top = hs.slice(0,10);
    if (scoresList) {
      scoresList.innerHTML = '';
      top.forEach((it, idx) => {
        const li = document.createElement('li');
        const rank = idx + 1;
        li.innerHTML = `<strong>${rank.toString().padStart(2,'0')}.</strong> <span>${escapeHtml(it.name)}</span> <span>${it.score}</span>`;
        scoresList.appendChild(li);
      });
    }
  }
  function savePendingScore() {
    if (!state.askingInitials) return;
    const name = (initialsInput?.value || '').toUpperCase().replace(/[^A-Z]/g,'').slice(0,3) || 'AAA';
    localStorage.setItem('player_initials', name);
    const hs = loadHighscores();
    hs.push({ name, score: state.pendingScore, ts: Date.now() });
    hs.sort((a,b) => b.score - a.score || a.ts - b.ts);
    const top = hs.slice(0,10);
    saveHighscores(top);
    state.askingInitials = false;
    initialsEntry?.classList.add('hidden');
    renderHighscores();
    // afficher panneau scores
    scoresPanel?.classList.remove('hidden');
    menuPanel.classList.add('hidden');
    gameoverPanel.classList.add('hidden');
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
})();
