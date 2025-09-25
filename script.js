(() => {
  'use strict';

  const app = document.getElementById('app');
  // When opened from file://, disable PWA manifest to avoid CORS warnings
  if (location.protocol === 'file:') {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.remove();
  }

  // ---- Holo-pubs (panneaux holographiques avec logos cycliques) ----
  function getHoloLogosSet() {
    // Pack thématique pour le thème Néon
    const base = ['CYBER','BYTE','NET','CITY','AI','Ξ','Σ','忍','龍','電','東京','都市','ネオン'];
    try {
      const name = state.sectionName || currentTheme?.name || '';
      if (/city|ville|urbain|Nuit/i.test(name)) {
        return ['CITY','BLOCK','NEON','GRID','AI','Ξ','忍','都市'];
      }
      if (/rain|pluie|storm|orage/i.test(name)) {
        return ['STORM','WET','FLOW','VOLT','電','雷','Ξ'];
      }
      if (/blackout|noir/i.test(name)) {
        return ['NOIR','VOID','GHOST','NULL','Σ','Ξ'];
      }
    } catch {}
    return base;
  }
  function makeHoloAd(roadLeft, roadRight, side) {
    const sizes = [0.8, 1.0, 1.4];
    const scale = randChoice(sizes);
    const w = 64 * DPR * scale;
    const h = 40 * DPR * scale;
    const y = -h - 14 * DPR;
    const margin = 10 * DPR;
    const x = side === 'left' ? (roadLeft - margin - w) : (roadRight + margin);
    const vy = Math.max(60, world.baseSpeed * 0.95);
    const colors = ['#a374ff', '#4ad2ff', '#ff7bf3', '#ffd166', '#e6e7ff'];
    const color = randChoice(colors);
    // Logos cycliques (glyphes variés) selon section
    const logos = getHoloLogosSet();
    const phase = Math.random() * logos.length;
    return { x, y, w, h, vy, side, color, logos, phase, high: false };
  }
  function makeHoloPylonAd(roadLeft, roadRight, side, roadTop) {
    const scale = randChoice([1.2, 1.6, 2.0]);
    const w = 64 * DPR * scale;
    const h = 44 * DPR * scale;
    const margin = 16 * DPR;
    const x = side === 'left' ? (roadLeft - margin - w) : (roadRight + margin);
    // position dans le ciel
    const y = rand(8 * DPR, Math.max(10 * DPR, roadTop - h - 8 * DPR));
    const vy = Math.max(40, world.baseSpeed * 0.55); // parallax plus fort (plus lent)
    const colors = ['#a374ff', '#4ad2ff', '#ff7bf3', '#ffd166', '#e6e7ff'];
    const color = randChoice(colors);
    const logos = getHoloLogosSet();
    const phase = Math.random() * logos.length;
    return { x, y, w, h, vy, side, color, logos, phase, high: true };
  }
  function drawHoloAd(ad) {
    if (!isNeonTheme()) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    // cadre
    roundRect(ctx, ad.x, ad.y, ad.w, ad.h, 6 * DPR, 'rgba(14,14,24,0.6)');
    ctx.strokeStyle = ad.color; ctx.lineWidth = Math.max(1, 2 * DPR);
    ctx.strokeRect(ad.x + 1 * DPR, ad.y + 1 * DPR, ad.w - 2 * DPR, ad.h - 2 * DPR);
    // scanlines
    const t = performance.now() / 300;
    ctx.globalAlpha = 0.12; ctx.fillStyle = 'rgba(180,220,255,0.8)';
    for (let yy = ad.y + (t % 3) * DPR; yy < ad.y + ad.h; yy += 3 * DPR) ctx.fillRect(ad.x + 3 * DPR, yy, ad.w - 6 * DPR, 1 * DPR);
    ctx.globalAlpha = 1;
    // logo cyclique
    const idx = Math.floor((performance.now() / 1000 + ad.phase) % ad.logos.length);
    ctx.fillStyle = ad.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.floor(ad.h * 0.6)}px monospace`;
    ctx.fillText(ad.logos[idx], ad.x + ad.w / 2, ad.y + ad.h / 2);
    ctx.restore();
  }
  function drawHoloAdProjected(ad, x, y, s) {
    if (!isNeonTheme()) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const w = (ad.w || 64 * DPR) * s; const h = (ad.h || 40 * DPR) * s;
    const left = x - w / 2; const top = y - h / 2;
    roundRect(ctx, left, top, w, h, 6 * DPR * s, 'rgba(14,14,24,0.6)');
    ctx.strokeStyle = ad.color; ctx.lineWidth = Math.max(1, 2 * DPR * s);
    ctx.strokeRect(left + 1 * DPR * s, top + 1 * DPR * s, w - 2 * DPR * s, h - 2 * DPR * s);
    const t = performance.now() / 300;
    ctx.globalAlpha = 0.12; ctx.fillStyle = 'rgba(180,220,255,0.8)';
    for (let yy = top + (t % 3) * DPR; yy < top + h; yy += 3 * DPR) ctx.fillRect(left + 3 * DPR * s, yy, w - 6 * DPR * s, 1 * DPR);
    ctx.globalAlpha = 1;
    const idx = Math.floor((performance.now() / 1000 + (ad.phase || 0)) % (ad.logos?.length || 1));
    const logo = ad.logos ? ad.logos[idx] : 'Ξ';
    ctx.fillStyle = ad.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.floor(h * 0.6)}px monospace`;
    ctx.fillText(logo, x, y);
    ctx.restore();
  }

  // ---- Drones-lumière ----
  function makeDrone(roadLeft, roadRight, side) {
    const sz = rand(8, 14) * DPR;
    const y = -sz - 6 * DPR;
    const margin = 10 * DPR;
    const x = side === 'left' ? (roadLeft - margin - sz * 0.5) : (roadRight + margin - sz * 0.5);
    const vy = world.baseSpeed * rand(0.9, 1.1);
    const hue = randChoice(['163,116,255','98,209,255','255,122,200']);
    const phase = Math.random() * Math.PI * 2;
    return { x, y, w: sz, h: sz * 0.4, vy, side, hue, phase };
  }
  function spawnDroneGroup(roadLeft, roadRight, side) {
    const groupSize = (Math.random() < 0.5 ? 2 : 3);
    const groupPhase = Math.random() * Math.PI * 2;
    const base = [];
    for (let i = 0; i < groupSize; i++) {
      const d = makeDrone(roadLeft, roadRight, side);
      d.phase = groupPhase + i * 0.6;
      d.y -= i * 14 * DPR; // espacement léger
      base.push(d);
    }
    return base;
  }
  function drawDrone(d) {
    if (!isNeonTheme()) return;
    const cx = d.x + d.w * 0.5, cy = d.y + d.h * 0.5;
    const breath = 0.5 + 0.5 * Math.sin(performance.now() / 500 + d.phase);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const rg = ctx.createRadialGradient(cx, cy, 1 * DPR, cx, cy, 10 * DPR);
    rg.addColorStop(0, `rgba(${d.hue},${(0.25 + 0.35 * breath).toFixed(3)})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, 10 * DPR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${d.hue},${(0.5 + 0.4 * breath).toFixed(3)})`;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.restore();
  }
  function drawDroneProjected(d, x, y, s) {
    if (!isNeonTheme()) return;
    const w = (d.w || 10 * DPR) * s; const h = (d.h || 4 * DPR) * s;
    const cx = x; const cy = y;
    const breath = 0.5 + 0.5 * Math.sin(performance.now() / 500 + d.phase);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const rg = ctx.createRadialGradient(cx, cy, 1 * DPR, cx, cy, 10 * DPR * s);
    rg.addColorStop(0, `rgba(${d.hue},${(0.25 + 0.35 * breath).toFixed(3)})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, 10 * DPR * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${d.hue},${(0.5 + 0.4 * breath).toFixed(3)})`;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.restore();
  }

  // ---- Arcs électriques (pluie forte) ----
  function maybeSpawnNeonArc(roadTop, roadBottom) {
    if (!isNeonTheme() || !rainEnabled || rainIntensity < 0.85) return;
    // faible proba par seconde
    if (Math.random() > 0.04) return;
    // trouver deux totems visibles
    const vis = palms.filter(p => p.y > roadTop && p.y < roadBottom);
    if (vis.length < 2) return;
    const a = vis[(Math.random() * vis.length) | 0];
    let b = vis[(Math.random() * vis.length) | 0];
    if (a === b && vis.length > 1) b = vis[(Math.random() * vis.length) | 0];
    const life = rand(0.08, 0.18);
    neonArcs.push({ ax: a.x + a.w * 0.5, ay: a.y + a.h * 0.05, bx: b.x + b.w * 0.5, by: b.y + b.h * 0.05, life, max: life });
  }
  function updateNeonArcs(dt) {
    for (let i = neonArcs.length - 1; i >= 0; i--) {
      const arc = neonArcs[i];
      arc.life -= dt;
      if (arc.life <= 0) neonArcs.splice(i, 1);
    }
  }
  function drawNeonArcs() {
    if (!neonArcs.length) return;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const a of neonArcs) {
      const t = 1 - Math.max(0, a.life / a.max);
      const alpha = 0.55 * (1 - t);
      ctx.strokeStyle = `rgba(163,116,255,${alpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, 1.5 * DPR);
      ctx.beginPath();
      // zigzag segments
      const segs = 6;
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const x = a.ax + (a.bx - a.ax) * u + Math.sin(u * Math.PI * 4 + performance.now() / 80) * 4 * DPR;
        const y = a.ay + (a.by - a.ay) * u + Math.cos(u * Math.PI * 3 + performance.now() / 70) * 3 * DPR;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  function duckMusicFor(ms = 220, depth = 0.3) {
    try {
      if (!audioCtx || !musicGain) return;
      const now = audioCtx.currentTime;
      const low = Math.max(0, musicUserVol * (1 - depth));
      musicGain.gain.cancelScheduledValues(now);
      musicGain.gain.setTargetAtTime(low, now, 0.01);
      musicGain.gain.setTargetAtTime(musicUserVol, now + ms / 1000, 0.06);
    } catch {}
  }
  function playBlasterShot() {
    if (!audioCtx || !sfxGain || state.muted) return;
    const o = audioCtx.createOscillator();
    const n = audioCtx.createBufferSource();
    const g = audioCtx.createGain();
    const bp = audioCtx.createBiquadFilter();
    g.gain.value = 0.0008;
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 3.0;
    o.type = 'square'; o.frequency.value = 1200;
    o.connect(g); g.connect(sfxGain);
    // subtle noise crack
    const dur = 0.12;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = buf; n.connect(bp); bp.connect(sfxGain);
    const now = audioCtx.currentTime;
    o.start(); o.frequency.exponentialRampToValueAtTime(340, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.00005, now + 0.12);
    n.start(); n.stop(now + dur + 0.01);
    o.stop(now + 0.12);
    duckMusicFor(200, 0.2);
  }
  function playPickup(type) {
    if (!audioCtx || !sfxGain || state.muted) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    g.gain.value = 0.0008; o.connect(g); g.connect(sfxGain);
    o.type = 'sine';
    const now = audioCtx.currentTime;
    let f1 = 880, f2 = 1320;
    if (type === 'coin') { f1 = 1100; f2 = 1760; }
    if (type === 'shield') { f1 = 600; f2 = 900; }
    if (type === 'slow') { f1 = 520; f2 = 780; }
    if (type === 'magnet') { f1 = 740; f2 = 1240; }
    if (type === 'ghost') { f1 = 400; f2 = 680; }
    if (type === 'double') { f1 = 700; f2 = 1400; }
    if (type === 'blaster') { f1 = 900; f2 = 1500; }
    o.frequency.setValueAtTime(f1, now);
    o.frequency.linearRampToValueAtTime(f2, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.00005, now + 0.14);
    o.start(); o.stop(now + 0.16);
    duckMusicFor(140, 0.12);
  }
  function drawPerfHud() {
    if (!state.fpsHud) return;
    const txt = `FPS ${Math.round(fpsAvg)}  |  Perf ${(perfScale * 100).toFixed(0)}%`;
    ctx.save();
    ctx.font = `${Math.max(10, Math.floor(12 * DPR))}px monospace`;
    ctx.textBaseline = 'bottom';
    const pad = 6 * DPR;
    const metrics = ctx.measureText(txt);
    const tw = metrics.width;
    const th = Math.max(14 * DPR, Math.floor(14 * DPR));
    const x = pad;
    const y = canvas.height - pad;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - pad * 0.5, y - th - pad * 0.5, tw + pad * 1.0, th + pad * 0.8);
    ctx.fillStyle = fpsAvg < 50 ? '#ffd166' : '#e6e7ff';
    if (fpsAvg < 42) ctx.fillStyle = '#ff5d6c';
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  // ---- Wet road reflections (when raining) ----
  function drawWetReflections(roadLeft, roadRight, roadTop, roadBottom) {
    if (!isNeonTheme() || !rainEnabled || rainIntensity <= 0.2) return;
    const wet = Math.min(1, 0.4 + rainIntensity * 0.8);
    ctx.save();
    ctx.beginPath();
    ctx.rect(roadLeft, roadTop, roadRight - roadLeft, roadBottom - roadTop);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    const vm = visMul();

    // Mirror 2.1: reflet du ciel retourné avec ondulation par tranches (ripple)
    try {
      const reflectAlpha = 0.18 * wet * vm; // base 18% modulé par pluie+mode
      if (reflectAlpha > 0.01) {
        const w = canvas.width;
        const h = Math.max(1, Math.floor(roadTop));
        if (reflectCanvas.width !== w || reflectCanvas.height !== h) {
          reflectCanvas.width = w; reflectCanvas.height = h;
        }
        // Capture le ciel [0..roadTop], y-flip dans reflectCanvas
        reflectCtx.save();
        reflectCtx.setTransform(1, 0, 0, -1, 0, h);
        reflectCtx.clearRect(0, 0, w, h);
        reflectCtx.drawImage(canvas, 0, 0, w, h, 0, 0, w, h);
        reflectCtx.restore();

        const prevAlpha = ctx.globalAlpha;
        const prevFilter = ctx.filter;
        ctx.globalAlpha = reflectAlpha;
        ctx.filter = 'blur(1.8px)';
        const p = fxScale();
        const sliceH = Math.max(1, Math.floor(2 * DPR * (p < 1 ? (1 / p) : 1)));
        const bandH = roadBottom - roadTop;
        const t = performance.now() / 1000;
        for (let sy = 0; sy < h; sy += sliceH) {
          const depth = sy / h; // 0 top -> 1 bottom of reflection
          const amp = (3.2 * DPR) * (1 - depth) * (0.6 + 0.6 * wet) * Math.min(1, p + 0.2);
          const speed = 8 + 24 * wet;
          const freq = 0.03 + 0.04 * (1 - depth);
          const offset = Math.sin((sy * freq) + t * speed) * amp;
          const dy = Math.floor(roadTop + sy + offset);
          // draw only inside road clip (already clipped)
          ctx.drawImage(reflectCanvas, 0, sy, w, sliceH, 0, dy, w, sliceH);
        }
        ctx.filter = prevFilter;
        ctx.globalAlpha = prevAlpha;
        // Dégradé d'atténuation vers le bas de la route
        const fade = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
        fade.addColorStop(0, 'rgba(255,255,255,0.18)');
        fade.addColorStop(0.4, 'rgba(255,255,255,0.10)');
        fade.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = fade;
        ctx.fillRect(roadLeft, roadTop, roadRight - roadLeft, bandH);
      }
    } catch {}

    // broad vertical gradient tint (glaçage coloré)
    let g = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
    g.addColorStop(0, `rgba(98,209,255,${(0.072 * wet * vm).toFixed(3)})`);
    g.addColorStop(0.5, `rgba(163,116,255,${(0.054 * wet * vm).toFixed(3)})`);
    g.addColorStop(1, `rgba(255,122,200,${(0.024 * wet * vm).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(roadLeft, roadTop, roadRight - roadLeft, roadBottom - roadTop);
    // moving reflection streaks
    const count = 9;
    for (let i = 0; i < count; i++) {
      const y = roadTop + ((i / count) * (roadBottom - roadTop) + (world.lineOffset * 0.8)) % (roadBottom - roadTop);
      const gg = ctx.createLinearGradient(roadLeft, y - 6 * DPR, roadLeft, y + 6 * DPR);
      gg.addColorStop(0, 'rgba(255,255,255,0)');
      gg.addColorStop(0.5, `rgba(200,220,255,${(0.072 * wet * vm).toFixed(3)})`);
      gg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gg;
      ctx.fillRect(roadLeft, y - 6 * DPR, roadRight - roadLeft, 12 * DPR);
    }
    ctx.restore();
  }
  // ---- Volumetric fog bands over road ----
  const fogBands = [];
  let fogTimer = 0;
  function updateFogBands(dt, roadTop, roadBottom) {
    if (!isNeonTheme()) return;
    fogTimer += dt;
    const want = Math.max(1, Math.round(3 * fxScale()));
    if (fogBands.length < want && fogTimer > 1.2) {
      fogTimer = 0;
      const y = rand(roadTop - 60 * DPR, roadBottom + 40 * DPR);
      const speed = rand(12, 28) * (0.7 + 0.6 * Math.random());
      const alpha = rand(0.08, 0.16) * (state.ultraNeon ? 1.2 : 1.0) * 1.10;
      const height = rand(40 * DPR, 110 * DPR);
      fogBands.push({ y, speed, alpha, height });
    }
    for (let i = fogBands.length - 1; i >= 0; i--) {
      const f = fogBands[i];
      f.y += f.speed * dt;
      if (f.y - f.height > roadBottom + 140 * DPR) fogBands.splice(i,1);
    }
  }
  function drawFogBands(roadLeft, roadRight, roadTop, roadBottom) {
    if (!isNeonTheme() || !fogBands.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(roadLeft, roadTop, roadRight - roadLeft, roadBottom - roadTop);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    for (const f of fogBands) {
      const g = ctx.createLinearGradient(0, f.y - f.height, 0, f.y + f.height);
      g.addColorStop(0, 'rgba(200,220,255,0)');
      g.addColorStop(0.5, `rgba(180,200,255,${f.alpha})`);
      g.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(roadLeft, f.y - f.height, roadRight - roadLeft, f.height * 2);
    }
    ctx.restore();
  }

  // ---- Starfield (twinkling) ----
  let stars = [];
  function initStars() {
    stars = [];
    if (!isNeonTheme()) return;
    const count = Math.floor(Math.min(160, (canvas.width * canvas.height) / (9000 * DPR) * 1.10));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * Math.max(40 * DPR, canvas.height * 0.25),
        a: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.4,
        size: Math.random() * 1.6 * DPR,
        hue: Math.random() < 0.5 ? '180,200,255' : '255,200,255'
      });
    }
  }
  function updateStars(dt) {
    if (!isNeonTheme()) return;
    for (const s of stars) { s.a += dt * s.speed; }
  }
  function drawStars(roadTop) {
    if (!isNeonTheme() || !stars.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, roadTop);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    const vm = visMul();
    // Réduction de charge: saute des étoiles si perfScale < 1
    const p = state.autoPerf ? perfScale : 1;
    const step = Math.max(1, Math.round(1 / Math.max(0.65, p)));
    for (let i = 0; i < stars.length; i += step) {
      const s = stars[i];
      const t = Math.min(1, ((Math.sin(s.a) * 0.5 + 0.5) * 0.6 + 0.2) * 1.05 * vm);
      ctx.fillStyle = `rgba(${s.hue},${t})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.6 * DPR, s.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- Neon pillars along road edges ----
  function drawNeonPillars(roadLeft, roadRight, roadTop, roadBottom) {
    if (!isNeonTheme()) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const spacing = 140 * DPR;
    const width = 4 * DPR; // pillar width
    const offset = (world.lineOffset * 1.8) % spacing;
    const startY = roadTop - offset;
    const vm = visMul();
    for (let y = startY; y < roadBottom + spacing; y += spacing) {
      // left pillar
      let g1 = ctx.createLinearGradient(0, y - 18 * DPR, 0, y + 18 * DPR);
      g1.addColorStop(0, 'rgba(163,116,255,0)');
      g1.addColorStop(0.5, `rgba(163,116,255,${(0.55 * vm).toFixed(3)})`);
      g1.addColorStop(1, 'rgba(163,116,255,0)');
      ctx.fillStyle = g1;
      ctx.fillRect(roadLeft - 10 * DPR, y - 18 * DPR, width, 36 * DPR);
      // right pillar
      let g2 = ctx.createLinearGradient(0, y - 18 * DPR, 0, y + 18 * DPR);
      g2.addColorStop(0, 'rgba(98,209,255,0)');
      g2.addColorStop(0.5, `rgba(98,209,255,${(0.55 * vm).toFixed(3)})`);
      g2.addColorStop(1, 'rgba(98,209,255,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(roadRight + 6 * DPR, y - 18 * DPR, width, 36 * DPR);
    }
    ctx.restore();
  }

  // Muzzle flash court lors du tir
  function spawnMuzzleFlash(cx, cy) {
    const colors = ['#ffe29a', '#ffd166', '#ffffff'];
    const n = 12;
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI - Math.PI / 2; // cône vers le haut
      const speed = rand(180, 360) * DPR;
      const life = rand(0.06, 0.14);
      const size = rand(1.2, 2.4) * DPR;
      particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, size, color: randChoice(colors) });
    }
  }

  // PostFX: chromatic aberration approximation (RGB fringing)
  function applyChromaticAberration() {
    if (!chromaEnabled) return;
    try {
      fxCanvas.width = canvas.width; fxCanvas.height = canvas.height;
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      fxCtx.drawImage(canvas, 0, 0);
      // Clear main and recompose with shifted hue-rotated copies
      const prevFilter = ctx.filter;
      const prevAlpha = ctx.globalAlpha;
      ctx.globalCompositeOperation = 'lighter';
      // Red-ish fringe
      ctx.filter = 'hue-rotate(20deg) saturate(1.2)';
      ctx.globalAlpha = 0.45;
      ctx.drawImage(fxCanvas, 1 * DPR, 0);
      // Cyan-ish fringe
      ctx.filter = 'hue-rotate(-20deg) saturate(1.2)';
      ctx.globalAlpha = 0.45;
      ctx.drawImage(fxCanvas, -1 * DPR, 0);
      // Restore
      ctx.filter = prevFilter;
      ctx.globalAlpha = prevAlpha;
      ctx.globalCompositeOperation = 'source-over';
    } catch {}
  }

  // PostFX: film grain overlay
  function applyFilmGrain() {
    if (!grainEnabled) return;
    // Si auto perf réduit, on peut ignorer le grain pour sauver du CPU
    if (state.autoPerf && perfScale < 0.85) return;
    try {
      const w = canvas.width, h = canvas.height;
      if (grainCanvas.width !== w || grainCanvas.height !== h) { grainCanvas.width = w; grainCanvas.height = h; }
      const img = grainCtx.createImageData(w, h);
      const d = img.data;
      // sparse noise for performance
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() * 255) | 0;
        const a = 28 + (Math.random() * 18) | 0; // alpha 28..46
        d[i] = n; d[i+1] = n; d[i+2] = n; d[i+3] = a;
      }
      grainCtx.putImageData(img, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const p = state.autoPerf ? perfScale : 1;
      ctx.globalAlpha = (isNeonTheme() ? 0.22 : 0.15) * p;
      ctx.drawImage(grainCanvas, 0, 0);
      ctx.restore();
    } catch {}
  }

  // Shards burst
  function spawnShards(cx, cy) {
    const n = 36;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.15, 0.15);
      const sp = rand(260, 680) * DPR;
      const len = rand(8, 26) * DPR;
      const rotSpeed = rand(-6, 6);
      const life = rand(0.45, 1.0);
      const color = randChoice(['#ffe29a', '#ff7a59', '#ff5d6c', '#ffffff']);
      shards.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, maxLife: life, len, rot: a, rotSpeed, color });
    }
  }
  function drawShards(ctx) {
    if (!shards.length) return;
    ctx.save();
    for (const s of shards) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.globalAlpha = alpha * 0.95;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = s.color;
      ctx.fillRect(-1.5 * DPR, -s.len * 0.5, 3 * DPR, s.len);
      ctx.rotate(-s.rot);
      ctx.translate(-s.x, -s.y);
    }
    ctx.restore();
  }

  // ---- Sky searchlights (neon theme) ----
  const searchlights = [];
  function initSearchlights() {
    searchlights.length = 0;
    if (!isNeonTheme()) return;
    const count = Math.max(1, Math.round(3 * fxScale()));
    for (let i = 0; i < count; i++) {
      const baseX = rand(40 * DPR, canvas.width - 40 * DPR);
      const speed = rand(0.15, 0.28);
      const range = rand(0.6, 1.0);
      const hue = randChoice(['163,116,255','98,209,255','255,122,200']);
      searchlights.push({ baseX, angle: rand(-0.6, 0.6), speed, range, hue });
    }
  }
  function updateSearchlights(dt) {
    if (!isNeonTheme()) return;
    for (const s of searchlights) {
      s.angle += s.speed * dt * (Math.random() < 0.5 ? -1 : 1);
      s.angle = clamp(s.angle, -0.9, 0.9);
    }
  }
  function drawSearchlights(roadTop) {
    if (!isNeonTheme() || !searchlights.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, roadTop);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    const p = state.autoPerf ? perfScale : 1;
    const step = Math.max(1, Math.round(1 / Math.max(0.65, p)));
    for (let i = 0; i < searchlights.length; i += step) {
      const s = searchlights[i];
      const x = s.baseX;
      const y = roadTop + 6 * DPR; // just below sky band
      const len = Math.max(220 * DPR, roadTop * 0.9);
      const dx = Math.sin(s.angle) * len * s.range;
      const dy = -Math.cos(s.angle) * len * 0.9;
      const w = Math.max(28 * DPR, (46 * 1.15) * DPR * (1 + 0.2 * Math.sin(performance.now()/600)));
      const g = ctx.createLinearGradient(x, y, x + dx, y + dy);
      g.addColorStop(0, `rgba(${s.hue},${(0.40 * visMul() * p).toFixed(3)})`);
      g.addColorStop(1, `rgba(${s.hue},0.0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y);
      ctx.lineTo(x + w * 0.5, y);
      ctx.lineTo(x + dx + w * 0.15, y + dy);
      ctx.lineTo(x + dx - w * 0.15, y + dy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  function drawExplosionOverlays() {
    if (!state.exploding) return;
    // screen flash
    if (megaFX && megaFX.flash > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, megaFX.flash);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    // shockwave glow (screen)
    if (shockwave) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(shockwave.x, shockwave.y, shockwave.r * 0.6, shockwave.x, shockwave.y, shockwave.r * 1.2);
      g.addColorStop(0, 'rgba(255,200,120,0.24)');
      g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(shockwave.x, shockwave.y, shockwave.r * 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // glitch bars
    if (megaFX && megaFX.glitch > 0.02) {
      ctx.save();
      const bars = 6;
      for (let i = 0; i < bars; i++) {
        const y = Math.random() * canvas.height;
        const h = rand(2 * DPR, 8 * DPR);
        ctx.globalAlpha = 0.08 + 0.12 * Math.random() * megaFX.glitch;
        ctx.fillStyle = ['#ff7bf3','#4ad2ff','#ffd166'][i % 3];
        ctx.fillRect(0, y, canvas.width, h);
      }
      ctx.restore();
    }
  }

  // ---- 2D spaceship renderer for player ----
  function drawPlayerShip2D() {
    const x = car.x + car.w / 2;
    const y = car.y + car.h / 2;
    drawGenericShipProjected(x, y, car.w, car.h, car.color, 1, /*isPlayer*/ true);
  }

  // ---- 2D bullet ----
  function drawBullet2D(b) {
    ctx.save();
    const x = b.x + b.w / 2;
    const y = b.y + b.h / 2;
    // glow
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(x, y - b.h * 0.3, 2 * DPR, x, y - b.h * 0.3, Math.max(b.w, b.h));
    g.addColorStop(0, 'rgba(255,220,120,0.8)');
    g.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y - b.h * 0.3, Math.max(b.w, b.h) * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // core
    ctx.fillStyle = '#ffe29a';
    roundRect(ctx, b.x + b.w * 0.25, b.y, b.w * 0.5, b.h, 2 * DPR, '#ffe29a');
    ctx.restore();
  }

  // ---- Fire control ----
  function tryFire() {
    if (state.vehicle !== 'ship') return;
    if (fireCooldown > 0) return;
    if ((state.blasterAmmo || 0) <= 0) { showToast('Pas de munitions', 'warn'); return; }
    const w = 6 * DPR, h = 14 * DPR;
    const bx = car.x + car.w / 2 - w / 2;
    const by = car.y - h * 0.6;
    bullets.push({ x: bx, y: by, w, h, vy: 900, dmg: 1 });
    fireCooldown = 0.18;
    state.blasterAmmo = Math.max(0, (state.blasterAmmo || 0) - 1);
    playBlasterShot();
    // Effets tir
    spawnMuzzleFlash(bx + w / 2, by + h * 0.2);
    // petite secousse douce
    shakeDuration = 0.08; shakeIntensity = 4 * DPR; shakeTime = shakeDuration;
  }

  // ---- Generic spaceship renderer (used for player and NPCs when vehicle=ship) ----
  function drawGenericShipProjected(x, y, w, h, color, s, isPlayer) {
    const left = x - w / 2;
    const top = y - h / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((isPlayer ? car.tilt : 0) || 0);
    // Hull
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(-w * 0.36, h * 0.30);
    ctx.lineTo(0, h * 0.48);
    ctx.lineTo(w * 0.36, h * 0.30);
    ctx.closePath(); ctx.fill();
    // Cockpit
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, -w * 0.16, -h * 0.18, w * 0.32, h * 0.22, 4 * DPR, ctx.fillStyle);
    // Hull shading gradient for depth
    const shade = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
    shade.addColorStop(0.0, 'rgba(255,255,255,0.08)');
    shade.addColorStop(0.5, 'rgba(0,0,0,0)');
    shade.addColorStop(1.0, 'rgba(0,0,0,0.22)');
    roundRect(ctx, -w * 0.46, -h * 0.50, w * 0.92, h * 0.96, 6 * DPR, shade);
    // Fins
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.moveTo(-w * 0.36, h * 0.12); ctx.lineTo(-w * 0.52, h * 0.22); ctx.lineTo(-w * 0.28, h * 0.28); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w * 0.36, h * 0.12); ctx.lineTo(w * 0.52, h * 0.22); ctx.lineTo(w * 0.28, h * 0.28); ctx.closePath(); ctx.fill();
    // Thruster glow
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(0, h * 0.44, 2 * DPR, 0, h * 0.44, Math.max(w, 36 * DPR));
    glow.addColorStop(0, 'rgba(0,245,255,0.35)');
    glow.addColorStop(1, 'rgba(0,245,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(0, h * 0.44, w * 0.35, h * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Subtle panel lines for NPCs too
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = Math.max(1, 1 * DPR);
    const sx = w / 6, sy = h / 9;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-sx * i, -h * 0.3); ctx.lineTo(-sx * i, h * 0.34); ctx.stroke(); }
    for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.moveTo(-w * 0.32, sy * j); ctx.lineTo(w * 0.32, sy * j); ctx.stroke(); }
    ctx.restore();
    // Outline neon
    if (isNeonTheme()) {
      ctx.save();
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 240);
      ctx.strokeStyle = `rgba(163,116,255,${(0.60 * pulse * visMul()).toFixed(3)})`;
      ctx.lineWidth = Math.max(1, 1.8 * DPR);
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.5);
      ctx.lineTo(-w * 0.36, h * 0.30);
      ctx.lineTo(0, h * 0.48);
      ctx.lineTo(w * 0.36, h * 0.30);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPlayerShipProjected(x, y, s) {
    // Base size derived from car but slightly sleeker
    let w = car.w * s * 1.0;
    let h = car.h * s * 0.9;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(car.tilt || 0);
    if (carImgLoaded && playerShipCanvas) {
      // Draw detailed prerendered ship image
      ctx.drawImage(playerShipCanvas, -w / 2, -h / 2, w, h);
      // Dynamic cockpit reflection
      ctx.save();
      const t = performance.now() / 1000;
      const refAlpha = 0.10 + 0.08 * Math.sin(t * 2.7);
      const g = ctx.createLinearGradient(0, -h * 0.30, 0, -h * 0.08);
      g.addColorStop(0, `rgba(255,255,255,${0.22 + refAlpha})`);
      g.addColorStop(1, 'rgba(180,220,255,0)');
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = g;
      roundRect(ctx, -w * 0.18, -h * 0.22, w * 0.36, h * 0.20, 6 * DPR, ctx.fillStyle);
      ctx.restore();
      // Rim neon light (theme dependent)
      if (isNeonTheme()) {
        ctx.save();
        const pulse = 0.65 + 0.35 * Math.sin(performance.now() / 300);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(163,116,255,${(0.50 * pulse * visMul()).toFixed(3)})`;
        ctx.lineWidth = Math.max(1, 1.6 * DPR);
        ctx.strokeRect(-w * 0.46, -h * 0.50, w * 0.92, h * 0.96);
        ctx.restore();
      }
      // Thruster flare
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const flick = 0.85 + 0.25 * Math.sin(performance.now() / 90 + Math.random() * 0.5);
      const gg = ctx.createRadialGradient(0, h * 0.44, 2 * DPR, 0, h * 0.44, Math.max(w, 36 * DPR));
      gg.addColorStop(0, `rgba(0,245,255,${0.35 * flick})`);
      gg.addColorStop(1, 'rgba(0,245,255,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(0, h * 0.44, w * 0.34, h * 0.16, 0, 0, Math.PI * 2); ctx.fill();
      // twin nozzles subtle
      ctx.fillStyle = `rgba(255,220,120,${0.35 * flick})`;
      ctx.beginPath(); ctx.ellipse(-w * 0.18, h * 0.40, w * 0.10, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.18, h * 0.40, w * 0.10, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else {
      // Fallback vector if image not yet loaded
      drawGenericShipProjected(0, 0, w, h, car.color, s, /*isPlayer*/ true);
    }
    ctx.restore();
  }

  // ---- Bullets (projected) ----
  function drawBulletProjected(b, x, y, s) {
    ctx.save();
    const w = Math.max(4 * DPR, (b.w || 6 * DPR) * s);
    const h = Math.max(8 * DPR, (b.h || 14 * DPR) * s);
    // glow
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(x, y - h * 0.2, 2 * DPR, x, y - h * 0.2, Math.max(w, h));
    g.addColorStop(0, 'rgba(255,220,120,0.8)');
    g.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y - h * 0.2, Math.max(w, h) * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // core
    ctx.fillStyle = '#ffe29a';
    roundRect(ctx, x - w * 0.25, y - h * 0.6, w * 0.5, h * 0.9, 2 * DPR, '#ffe29a');
    // trail
    ctx.fillStyle = 'rgba(255,200,80,0.6)';
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - w * 0.6, y + h * 0.9);
    ctx.lineTo(x + w * 0.6, y + h * 0.9);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---- Parterres de fleurs (flower beds) ----
  function makeFlowerBed(roadLeft, roadRight, side) {
    const w = rand(60, 140) * DPR;
    const h = rand(10, 22) * DPR;
    const y = -h - 8 * DPR;
    const margin = 8 * DPR;
    const x = side === 'left' ? (roadLeft - margin - w * 0.4) : (roadRight + margin);
    const vy = world.baseSpeed * rand(0.85, 1.05);
    const palette = isNeonTheme()
      ? ['#ff7bf3', '#4ad2ff', '#ffd166', '#a374ff']
      : ['#ff7aa2', '#ffd166', '#a2ff8a', '#7ab6ff'];
    // pré-génère la composition du parterre
    const blooms = [];
    const count = (Math.random() < 0.4 ? rand(16, 26) : rand(10, 18)) | 0;
    for (let i = 0; i < count; i++) {
      const dx = rand(-w * 0.45, w * 0.45);
      const dy = rand(-h * 0.35, h * 0.05);
      const petal = randChoice(palette);
      blooms.push({ dx, dy, petal });
    }
    return { x, y, w, h, vy, side, blooms };
  }
  function drawFlowerBed(bed) {
    // base de verdure
    ctx.save();
    const cx = bed.x + bed.w * 0.5;
    const cy = bed.y + bed.h * 0.8;
    const rx = bed.w * 0.6;
    const ry = bed.h * 0.6;
    const g = ctx.createRadialGradient(cx, cy, ry * 0.3, cx, cy, rx);
    g.addColorStop(0, 'rgba(40,120,80,0.6)');
    g.addColorStop(1, 'rgba(25,60,45,0.0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    // fleurs du parterre
    for (const b of (bed.blooms || [])) {
      const bx = cx + b.dx;
      const by = cy + b.dy - bed.h * 0.25;
      // coeur
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath(); ctx.arc(bx, by, 1.6 * DPR, 0, Math.PI * 2); ctx.fill();
      // pétales
      ctx.fillStyle = b.petal;
      const rad = 2.6 * DPR;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(bx + Math.cos(a) * rad, by + Math.sin(a) * (rad * 0.8), 1.2 * DPR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawFlowerBedProjected(bed, x, y, s) {
    ctx.save();
    const w = (bed.w || 80 * DPR) * s;
    const h = (bed.h || 16 * DPR) * s;
    const rx = w * 0.6;
    const ry = h * 0.6;
    const g = ctx.createRadialGradient(x, y + h * 0.3, ry * 0.3, x, y + h * 0.3, rx);
    g.addColorStop(0, 'rgba(40,120,80,0.55)');
    g.addColorStop(1, 'rgba(25,60,45,0.0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y + h * 0.35, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    // fleurs du parterre (projetées)
    for (const b of (bed.blooms || [])) {
      const bx = x + (b.dx || 0) * s;
      const by = y - h * 0.15 + (b.dy || 0) * s;
      // coeur
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath(); ctx.arc(bx, by, 1.4 * DPR * s, 0, Math.PI * 2); ctx.fill();
      // pétales
      ctx.fillStyle = b.petal || '#ff7aa2';
      const rad = 2.2 * DPR * s;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(bx + Math.cos(a) * rad, by + Math.sin(a) * (rad * 0.8), 1.0 * DPR * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // --- Third-person chase camera rendering ---
  function drawChase3D() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tremblement d'écran
    ctx.save();
    if (shakeTime > 0 && shakeDuration > 0) {
      const t = shakeTime / shakeDuration;
      const amp = shakeIntensity * t * t;
      const ox = (Math.random() * 2 - 1) * amp;
      const oy = (Math.random() * 2 - 1) * amp;
      ctx.translate(ox, oy);
    }

    const { left: roadLeft, right: roadRight, top: roadTop, bottom: roadBottom } = roadBounds();
    const cx = canvas.width / 2;
    const baseW = (roadRight - roadLeft);

    function widthAt(t) {
      const minScale = 0.28; // largeur en haut
      return baseW * (minScale + (1 - minScale) * Math.pow(t, 1.05));
    }
    function yAt(t) { return roadTop + (roadBottom - roadTop) * t; }
    function projectX(screenX, t) {
      const u = (screenX - (roadLeft + roadRight) / 2) / baseW; // -0.5..0.5
      return cx + u * widthAt(t);
    }

    // Fond
    if (isNeonTheme()) {
      const sky = ctx.createLinearGradient(0, 0, 0, roadTop);
      sky.addColorStop(0, '#180035');
      sky.addColorStop(1, '#0a0b17');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, roadTop);
      ctx.fillStyle = currentTheme.outside;
      ctx.fillRect(0, roadTop, canvas.width, canvas.height - roadTop);
      // Sky layer: draw high holo-ads inside sky clip
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, canvas.width, roadTop); ctx.clip();
      if (isNeonTheme() && holoAds.length) {
        for (const ad of holoAds) { if (ad.high) drawHoloAd(ad); }
      }
      ctx.restore();
    } else {
      ctx.fillStyle = currentTheme.outside;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Route en trapèze
    const wTop = widthAt(0);
    const wBot = widthAt(1);
    ctx.save();
    const roadGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
    roadGrad.addColorStop(0, currentTheme.roadTop);
    roadGrad.addColorStop(1, currentTheme.roadBottom);
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(cx - wBot / 2, roadBottom);
    ctx.lineTo(cx + wBot / 2, roadBottom);
    ctx.lineTo(cx + wTop / 2, roadTop);
    ctx.lineTo(cx - wTop / 2, roadTop);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Lignes médianes projetées
    ctx.save();
    ctx.fillStyle = currentTheme.median;
    const dashWorld = 38 * DPR;
    let offset = world.lineOffset % dashWorld; if (offset < 0) offset += dashWorld;
    const steps = 36;
    for (let i = -2; i < steps; i++) {
      const yWorld = i * dashWorld + offset;
      const t = Math.min(1, Math.max(0, (yWorld) / (roadBottom - roadTop)));
      const y = yAt(t);
      const w = Math.max(2 * DPR, widthAt(t) * 0.012);
      const h = Math.max(6 * DPR, 12 * DPR * (0.4 + 0.6 * t));
      ctx.fillRect(cx - w / 2, y - h / 2, w, h);
    }
    ctx.restore();

    // Rendu trié par profondeur (décors + entités)
    // Player projected size baseline for NPC clamping
    const sCarBase = 0.75;
    let playerW = car.w * sCarBase;
    let playerH = car.h * sCarBase;
    const bs = state.cosmetics?.bodyStyle || 'stock';
    let wMulP = 1, hMulP = 1;
    if (bs === 'sport') { wMulP = 1.05; hMulP = 0.92; }
    else if (bs === 'wide') { wMulP = 1.18; hMulP = 1.02; }
    else if (bs === 'slim') { wMulP = 0.86; hMulP = 1.06; }
    else if (bs === 'suv') { wMulP = 1.06; hMulP = 1.18; }
    playerW *= wMulP; playerH *= hMulP;

    const renderables = [];
    const denom = (roadBottom - roadTop) || 1;
    // Décors
    for (const p of palms) {
      const t = Math.min(1, Math.max(0, (p.y - roadTop) / denom));
      renderables.push({ type: 'palm', t, x: projectX(p.x + p.w / 2, t), y: yAt(t), s: 0.35 + 1.15 * Math.pow(t, 1.2), ref: p });
    }
    for (const sgn of signs) {
      const t = Math.min(1, Math.max(0, (sgn.y - roadTop) / denom));
      renderables.push({ type: 'sign', t, x: projectX(sgn.x + sgn.w / 2, t), y: yAt(t), s: 0.35 + 1.15 * Math.pow(t, 1.2), ref: sgn });
    }
    // Holo-ads (Néon)
    if (isNeonTheme() && holoAds.length) {
      for (const ad of holoAds) {
        if (ad.high) continue; // high sky ads drawn in sky layer
        const t = Math.min(1, Math.max(0, (ad.y - roadTop) / denom));
        renderables.push({ type: 'holo', t, x: projectX(ad.x + ad.w / 2, t), y: yAt(t), s: 0.35 + 1.15 * Math.pow(t, 1.2), ref: ad });
      }
    }
    for (const rk of rocks) {
      const t = Math.min(1, Math.max(0, (rk.y - roadTop) / denom));
      renderables.push({ type: 'rock', t, x: projectX(rk.x + rk.w / 2, t), y: yAt(t), s: 0.35 + 1.15 * Math.pow(t, 1.2), ref: rk });
    }
    // Fleurs/buissons: décimation par perfScale (Auto Perf)
    {
      const stepF = Math.max(1, Math.round(1 / Math.max(0.65, perfScale)));
      for (let i = 0; i < flowers.length; i += stepF) {
        const fl = flowers[i];
        const t = Math.min(1, Math.max(0, (fl.y - roadTop) / denom));
        renderables.push({ type: 'flower', t, x: projectX(fl.x + fl.w / 2, t), y: yAt(t), s: 0.35 + 1.15 * Math.pow(t, 1.2), ref: fl });
      }
    }
    // Drones-lumière
    if (isNeonTheme() && drones.length) {
      for (const d of drones) {
        const t = Math.min(1, Math.max(0, (d.y - roadTop) / denom));
        renderables.push({ type: 'drone', t, x: projectX(d.x + d.w / 2, t), y: yAt(t), s: 0.35 + 1.15 * Math.pow(t, 1.2), ref: d });
      }
    }
    // Parterres de fleurs
    for (const bd of flowerBeds) {
      const t = Math.min(1, Math.max(0, ((bd.y + bd.h * 0.5) - roadTop) / denom));
      renderables.push({ type: 'bed', t, x: projectX(bd.x + bd.w / 2, t), y: yAt(t), s: 0.35 + 1.15 * Math.pow(t, 1.2), ref: bd });
    }
    // Powerups (bonus)
    for (const p of powerups) {
      const t = Math.min(1, Math.max(0, ((p.y + p.h * 0.5) - roadTop) / denom));
      const baseS = 0.4 + 2.0 * Math.pow(t, 1.35);
      // Slightly larger near camera to increase visibility
      const sBoost = 1 + 0.2 * t; // up to +20%
      const s = baseS * sBoost;
      renderables.push({ type: 'powerup', t, x: projectX(p.x + p.w / 2, t), y: yAt(t), s, ref: p });
    }
    // Bullets
    for (const b of bullets) {
      const t = Math.min(1, Math.max(0, ((b.y + b.h * 0.5) - roadTop) / denom));
      renderables.push({ type: 'bullet', t, x: projectX(b.x + b.w / 2, t), y: yAt(t), s: 0.4 + 2.0 * Math.pow(t, 1.35), ref: b });
    }
    // Obstacles & NPCs
    for (const ob of obstacles) {
      const t = Math.min(1, Math.max(0, ((ob.y + ob.h * 0.5) - roadTop) / denom));
      renderables.push({ type: 'ob', t, x: projectX(ob.x + ob.w / 2, t), y: yAt(t), s: 0.4 + 2.0 * Math.pow(t, 1.35), ref: ob });
    }
    if (npcEnabled) {
      for (const n of npcs) {
        const t = Math.min(1, Math.max(0, ((n.y + n.h * 0.5) - roadTop) / denom));
        const baseS = 0.4 + 2.0 * Math.pow(t, 1.35);
        // Cap NPC visual size to not exceed player's projected styled size
        const maxSByW = (playerW > 0 && (n.w || 0) > 0) ? (playerW) / (n.w || 1) : baseS;
        const maxSByH = (playerH > 0 && (n.h || 0) > 0) ? (playerH) / (n.h || 1) : baseS;
        const maxS = Math.max(0.12, Math.min(maxSByW, maxSByH));
        const s = Math.min(baseS, maxS);
        renderables.push({ type: 'npc', t, x: projectX(n.x + n.w / 2, t), y: yAt(t), s, ref: n });
      }
    }

    // Trier, puis dessiner
    renderables.sort((a, b) => a.t - b.t);
    for (const it of renderables) {
      const { x, y, s } = it;
      let w = (it.ref.w || 40) * s;
      let h = (it.ref.h || 70) * s;
      if (it.type === 'flower') {
        w = (it.ref.w || 8 * DPR) * s;
        h = (it.ref.h || 14 * DPR) * s;
      } else if (it.type === 'powerup') {
        w = (it.ref.w || 32 * DPR) * s;
        h = (it.ref.h || 32 * DPR) * s;
      } else if (it.type === 'bullet') {
        w = (it.ref.w || 6 * DPR) * s;
        h = (it.ref.h || 14 * DPR) * s;
      } else if (it.type === 'bed') {
        w = (it.ref.w || 80 * DPR) * s;
        h = (it.ref.h || 16 * DPR) * s;
      }
      // ombre
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.48, w * 0.55, h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // corps
      if (it.type === 'palm') drawPalmProjected(it.ref, x, y, s);
      else if (it.type === 'sign') drawSignProjected(it.ref, x, y, s);
      else if (it.type === 'holo') drawHoloAdProjected(it.ref, x, y, s);
      else if (it.type === 'rock') drawRockProjected(it.ref, x, y, s);
      else if (it.type === 'flower') drawFlowerProjected(it.ref, x, y, s);
      else if (it.type === 'drone') drawDroneProjected(it.ref, x, y, s);
      else if (it.type === 'bed') drawFlowerBedProjected(it.ref, x, y, s);
      else if (it.type === 'powerup') drawPowerupProjected(it.ref, x, y, s);
      else if (it.type === 'bullet') drawBulletProjected(it.ref, x, y, s);
      else if (it.type === 'npc') drawNPCProjected(it.ref, x, y, s);
      else drawObstacleProjected(it.ref, x, y, s);
    }

    // Voiture du joueur (chase cam): profondeur contrôlée (haut/bas)
    const tCar = state.carDepth;
    const xCar = projectX(car.x + car.w / 2, tCar);
    const yCar = yAt(tCar);
    // Échelle réduite pour une voiture moins imposante en 3D
    const sCar = 0.75; // valeur fixe plus petite
    if (state.vehicle === 'ship') drawPlayerShipProjected(xCar, yCar, sCar);
    else drawCarProjected(xCar, yCar, sCar);

    ctx.restore();
    // FX explosion overlays
    drawShards(ctx);
    drawExplosionOverlays();
    // Arcs néon (pluie forte)
    drawNeonArcs();
    // Camera lens raindrops overlay (screen-space)
    drawCameraDrops();
    // Perf HUD
    drawPerfHud();
  }

  // Version projetée 3D
  function drawPowerupProjected(p, x, y, s) {
    ctx.save();
    const w = (p.w || 32 * DPR) * s;
    const h = (p.h || 32 * DPR) * s;
    const cx = x;
    const cy = y;
    const pulse = 0.8 + 0.2 * Math.sin(performance.now() / 150 + (p.x || 0));

    // Lueur extérieure pulsante (screen)
    ctx.globalCompositeOperation = 'screen';
    const neonBoost3D = state.ultraNeon ? 1.35 : 1.0;
    const alphaHex3D = state.ultraNeon ? 'A0' : '60';
    const rInner = Math.max(2 * DPR, w * 0.28 * pulse);
    const rOuter = Math.max(rInner + 2 * DPR, w * 0.92 * pulse) * neonBoost3D;
    const glow = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
    const col = p.color || '#4f8cff';
    glow.addColorStop(0, `${col}${alphaHex3D}`);
    glow.addColorStop(1, `${col}00`);
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, rOuter, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Icône animée au centre
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(performance.now() / 400 + (p.y || 0)) * 0.1);
    ctx.font = `${Math.max(8, Math.floor(w * 0.7))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icons = { shield: '🛡️', slow: '🐢', magnet: '🧲', ghost: '👻', double: '✖️2', coin: '🪙', blaster: '🔫' };
    ctx.globalAlpha = 0.95;
    ctx.fillText(icons[p.type] || '★', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // ---- Player car vector renderer (structure varies by model) ----
  function drawPlayerCarVector(w, h, color) {
    const model = getCarModelParams();
    // body
    roundRect(ctx, -w / 2, -h / 2, w, h, 8 * DPR, color);
    // paint overlay (cosmetic paint)
    const paint = state.cosmetics?.paint || 'none';
    if (paint && paint !== 'none') {
      let col = 'rgba(255,255,255,0.0)';
      if (paint === 'pearl') col = 'rgba(255,255,255,0.30)';
      else if (paint === 'graphite') col = 'rgba(50,50,60,0.45)';
      else if (paint === 'cyan') col = 'rgba(0,245,255,0.32)';
      else if (paint === 'pink') col = 'rgba(255,120,180,0.32)';
      else if (paint === 'gold') col = 'rgba(255,200,60,0.32)';
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
    // roof
    const roofW = w * 0.72;
    const roofH = h * (model.roofH || 0.42);
    const roofX = -roofW / 2;
    const roofY = -h / 2 + h * 0.20;
    roundRect(ctx, roofX, roofY, roofW, roofH, 5 * DPR, 'rgba(0,0,0,0.25)');
    // windows
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(-w * 0.32, -h * 0.34, w * 0.64, h * 0.14); // windshield
    ctx.fillRect(-w * 0.28, h * 0.18, w * 0.56, h * 0.12);  // rear window
    // wheels
    const wlX = -w * 0.32, wrX = w * 0.32;
    const yF = -h / 2 + h * (model.wheelYFront || 0.28);
    const yR = -h / 2 + h * (model.wheelYRear || 0.78);
    const wheel = (cx, cy, rx, ry) => {
      ctx.save(); ctx.fillStyle = '#0e0f15';
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(rx, ry) * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    wheel(wlX, yF, w * 0.14, w * 0.11);
    wheel(wrX, yF, w * 0.14, w * 0.11);
    wheel(wlX, yR, w * 0.15, w * 0.12);
    wheel(wrX, yR, w * 0.15, w * 0.12);
    // arches
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2 * DPR;
    const arch = (cx, cy, r) => { ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke(); };
    arch(wlX, yF + 0.02 * h, w * 0.20); arch(wrX, yF + 0.02 * h, w * 0.20);
    arch(wlX, yR + 0.01 * h, w * 0.22); arch(wrX, yR + 0.01 * h, w * 0.22);
    // side stripe accent
    ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, -w * 0.40, -h * 0.02, w * 0.80, h * 0.06, 3 * DPR, ctx.fillStyle); ctx.restore();
    // mirrors
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, -w / 2 - 2 * DPR, -h * 0.20, 6 * DPR, 10 * DPR, 2 * DPR, ctx.fillStyle);
    roundRect(ctx,  w / 2 - 4 * DPR, -h * 0.20, 6 * DPR, 10 * DPR, 2 * DPR, ctx.fillStyle);
    // model extras
    if (model.spoiler) {
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)';
      const spY = h * 0.38; ctx.beginPath();
      ctx.moveTo(-w * 0.28, spY); ctx.lineTo(w * 0.28, spY);
      ctx.lineTo(w * 0.20, spY + 4 * DPR); ctx.lineTo(-w * 0.20, spY + 4 * DPR);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    if (model.rails) {
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, -w * 0.26, -h * 0.18, w * 0.22, 4 * DPR, 2 * DPR, ctx.fillStyle);
      roundRect(ctx,  w * 0.04, -h * 0.18, w * 0.22, 4 * DPR, 2 * DPR, ctx.fillStyle);
      ctx.restore();
    }
    if (model.grille) {
      ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1 * DPR;
      for (let i = 0; i < 3; i++) {
        const gy = -h * 0.38 + i * (h * 0.02);
        ctx.beginPath(); ctx.moveTo(-w * 0.22, gy); ctx.lineTo(w * 0.22, gy); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawCarProjected(x, y, s) {
    // Base size
    let w = car.w * s;
    let h = car.h * s;
    // Body style multipliers (cosmetics)
    const body = (state.cosmetics?.bodyStyle || 'stock');
    let wMul = 1, hMul = 1;
    if (body === 'sport') { wMul = 1.05; hMul = 0.92; }
    else if (body === 'wide') { wMul = 1.18; hMul = 1.02; }
    else if (body === 'slim') { wMul = 0.86; hMul = 1.06; }
    else if (body === 'suv') { wMul = 1.06; hMul = 1.18; }
    // Model-specific multipliers
    const model = getCarModelParams();
    w *= wMul * (model.wMul || 1);
    h *= hMul * (model.hMul || 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(car.tilt || 0);
    // Vector-rendered player car
    drawPlayerCarVector(w, h, car.color);
    // sticker sur le toit
    if (state.cosmetics?.sticker && state.cosmetics.sticker !== 'none') {
      ctx.save();
      ctx.translate(0, -h * 0.22);
      ctx.font = `${Math.floor(18 * DPR)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const sym = state.cosmetics.sticker === 'star' ? '⭐' : (state.cosmetics.sticker === 'bolt' ? '⚡' : '');
      ctx.globalAlpha = 0.9;
      ctx.fillText(sym, 0, 0);
      ctx.restore();
    }

    // Cyberpunk extras: underglow + head/tail lights + side accents
    if (isNeonTheme()) {
      const neonBoost = state.ultraNeon ? 1.5 : 1.0;
      // Underglow
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const ugx = 0, ugy = h * 0.45;
      const choice = state.cosmetics?.underglow || 'cyan';
      const color = (choice === 'cyan') ? '0,245,255' : (choice === 'pink') ? '255,79,216' : '163,116,255';
      const ug = ctx.createRadialGradient(ugx, ugy, 2 * DPR, ugx, ugy, Math.max(w, 46 * DPR));
      ug.addColorStop(0, `rgba(${color},${0.35 * neonBoost})`);
      ug.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = ug;
      ctx.beginPath(); ctx.ellipse(0, ugy, w * 0.72, h * 0.24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Headlights (soft cones)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255,255,200,${0.5 * neonBoost})`;
      const hx = 0, hy = -h * 0.48;
      const headGrad = ctx.createRadialGradient(hx, hy, 4 * DPR, hx, hy, h * 0.8);
      headGrad.addColorStop(0, `rgba(255,255,220,${0.28 * neonBoost})`);
      headGrad.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = headGrad;
      ctx.beginPath(); ctx.ellipse(hx, hy, w * 0.22, h, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Tail lights
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255,80,90,${0.95 * neonBoost})`;
      const rW = w * 0.16, rH = h * 0.10;
      ctx.fillRect(-w * 0.34, h * 0.38, rW, rH);
      ctx.fillRect(w * 0.18, h * 0.38, rW, rH);
      ctx.restore();

      // Side neon accents
      ctx.save();
      ctx.globalAlpha = 0.6 * neonBoost;
      ctx.strokeStyle = `rgba(${color},0.8)`;
      ctx.lineWidth = Math.max(2, 2.5 * DPR);
      ctx.beginPath();
      ctx.moveTo(-w * 0.45, -h * 0.15);
      ctx.lineTo(-w * 0.45, h * 0.15);
      ctx.moveTo(w * 0.45, -h * 0.15);
      ctx.lineTo(w * 0.45, h * 0.15);
      ctx.stroke();
      ctx.restore();

      // Wheel glow (front/back)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const wg = ctx.createRadialGradient(0, h * 0.35, 2 * DPR, 0, h * 0.35, w * 0.5);
      wg.addColorStop(0, `rgba(${color},${0.22 * neonBoost})`);
      wg.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.ellipse(-w * 0.26, h * 0.32, w * 0.16, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.26, h * 0.32, w * 0.16, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Roof neon stripes
      ctx.save();
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 240);
      ctx.strokeStyle = `rgba(${color},${0.55 * pulse * neonBoost})`;
      ctx.lineWidth = Math.max(1, 2 * DPR);
      ctx.beginPath();
      ctx.moveTo(-w * 0.08, -h * 0.42); ctx.lineTo(-w * 0.08, h * 0.42);
      ctx.moveTo(w * 0.08, -h * 0.42); ctx.lineTo(w * 0.08, h * 0.42);
      ctx.stroke();
      ctx.restore();

      // Hologram outline
      ctx.save();
      ctx.globalAlpha = 0.6 * pulse * neonBoost;
      ctx.strokeStyle = `rgba(${color},0.65)`;
      ctx.lineWidth = Math.max(1, 1.8 * DPR);
      roundRect(ctx, -w / 2 - 1 * DPR, -h / 2 - 1 * DPR, w + 2 * DPR, h + 2 * DPR, 10 * DPR, 'rgba(0,0,0,0)');
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
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
  if (chromaBtn) chromaBtn.addEventListener('click', () => {
    chromaEnabled = !chromaEnabled;
    chromaBtn.setAttribute('aria-pressed', String(chromaEnabled));
  });
  if (grainBtn) grainBtn.addEventListener('click', () => {
    grainEnabled = !grainEnabled;
    grainBtn.setAttribute('aria-pressed', String(grainEnabled));
  });
    // Body style UI
    document.querySelectorAll('[data-body]').forEach(btn => {
      const key = btn.getAttribute('data-body');
      const isSel = (state.cosmetics.bodyStyle || 'stock') === key;
      btn.setAttribute('aria-pressed', String(isSel));
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
    if (playFromGarageBtn) playFromGarageBtn.addEventListener('click', () => { closeGarage(); startGame(); });
    if (buySteeringBtn) buySteeringBtn.addEventListener('click', () => buyUpgrade('steering'));
    if (buyShieldBtn)   buyShieldBtn.addEventListener('click', () => buyUpgrade('shield'));
    if (buyMagnetBtn)   buyMagnetBtn.addEventListener('click', () => buyUpgrade('magnet'));
    if (buyGhostBtn)    buyGhostBtn.addEventListener('click', () => buyUpgrade('ghost'));
    document.addEventListener('keydown', (e) => {
      if (!garageModal) return;
      const isOpen = !garageModal.classList.contains('hidden');
      if (e.key === 'Escape' && isOpen) { closeGarage(); }
    });
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

    // Cosmetics purchases (premium spaceship skins)
    buySkinTaxiBtn?.addEventListener('click', () => buyCosmeticSkin('phantom', 50));
    buySkinVaporBtn?.addEventListener('click', () => buyCosmeticSkin('freighter', 60));
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
      const bd = e.target.closest('[data-body]');
      if (bd) {
        state.cosmetics.bodyStyle = bd.getAttribute('data-body');
        saveCosmetics();
        showToast(`Carrosserie: ${state.cosmetics.bodyStyle}`);
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
    const defaults = { mint:1, red:1, blue:1, yellow:1, hyper:1, micro:1 };
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
  // Offscreen buffer for 3D composite
  const tiltCanvas = document.createElement('canvas');
  const tiltCtx = tiltCanvas.getContext('2d');
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
  const visualModeBtn = document.getElementById('visualModeBtn');
  const autoPerfBtn = document.getElementById('autoPerfBtn');
  const fpsTargetEl = document.getElementById('fpsTarget');
  const fpsTargetValEl = document.getElementById('fpsTargetVal');
  const fpsHudBtn = document.getElementById('fpsHudBtn');
  const musicVolEl = document.getElementById('musicVol');
  const sfxVolEl = document.getElementById('sfxVol');
  // New HUD refs
  const barGhostEl = document.getElementById('barGhost');
  const barDoubleEl = document.getElementById('barDouble');
  const comboMultEl = document.getElementById('comboMult');
  const coinsEl = document.getElementById('coins');
  const blasterAmmoEl = document.getElementById('blasterAmmo');
  // Settings menu
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsMenu = document.getElementById('settingsMenu');
  const reduceFxBtn = document.getElementById('reduceFxBtn');
  const ultraBtn = document.getElementById('ultraBtn');
  const chromaBtn = document.getElementById('chromaBtn');
  const grainBtn = document.getElementById('grainBtn');
  const visualModeMainBtn = document.getElementById('visualModeMainBtn');
  const visualModeGarageBtn = document.getElementById('visualModeGarageBtn');
  // Daily challenges UI
  const challenge1El = document.getElementById('challenge1');
  const challenge2El = document.getElementById('challenge2');
  const challenge3El = document.getElementById('challenge3');
  // Garage / Boutique UI
  const garageBtn = document.getElementById('garageBtn');
  const garageModal = document.getElementById('garageModal');
  const closeGarageBtn = document.getElementById('closeGarageBtn');
  const playFromGarageBtn = document.getElementById('playFromGarageBtn');
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
    vy: 0,   // vitesse verticale pour 2D (vaisseau)
  };

  // Sprite/Skins (vaisseaux)
  const carImg = new Image();
  let carImgLoaded = false;
  const SKINS = {
    scout:       { src: 'assets/ship_scout.svg',       color: '#23e5ff' },
    interceptor: { src: 'assets/ship_interceptor.svg', color: '#ff7a7a' },
    explorer:    { src: 'assets/ship_explorer.svg',    color: '#7bc6ff' },
    courier:     { src: 'assets/ship_courier.svg',     color: '#ffcd00' },
    phantom:     { src: 'assets/ship_phantom.svg',     color: '#a374ff' },
    freighter:   { src: 'assets/ship_freighter.svg',   color: '#ffd166' },
  };
  // Prerendered player ship for rich details
  let playerShipCanvas = null;
  let playerShipCtx = null;
  function rebuildPlayerShipCanvas() {
    try {
      if (!carImgLoaded || !carImg || !carImg.width) return;
      const baseW = Math.max(160 * DPR, carImg.width);
      const baseH = Math.max(240 * DPR, carImg.height);
      if (!playerShipCanvas) playerShipCanvas = document.createElement('canvas');
      playerShipCanvas.width = baseW;
      playerShipCanvas.height = baseH;
      playerShipCtx = playerShipCanvas.getContext('2d');
      const c = playerShipCtx;
      c.clearRect(0, 0, baseW, baseH);
      // Draw base SVG
      c.drawImage(carImg, 0, 0, baseW, baseH);
      // Panel lines overlay (subtle)
      c.save();
      c.globalAlpha = 0.08;
      c.strokeStyle = 'rgba(255,255,255,0.28)';
      c.lineWidth = Math.max(1, 1 * DPR);
      const stepX = baseW / 8, stepY = baseH / 12;
      for (let x = stepX; x < baseW; x += stepX) { c.beginPath(); c.moveTo(x, baseH * 0.18); c.lineTo(x, baseH * 0.80); c.stroke(); }
      for (let y = baseH * 0.18 + stepY; y < baseH * 0.80; y += stepY) { c.beginPath(); c.moveTo(baseW * 0.18, y); c.lineTo(baseW * 0.82, y); c.stroke(); }
      c.restore();
      // Specular sweep (baked light)
      c.save();
      c.globalCompositeOperation = 'screen';
      const gx = baseW * 0.5, gy = baseH * 0.36;
      const rg = c.createRadialGradient(gx, gy, baseW * 0.05, gx, gy, baseW * 0.46);
      rg.addColorStop(0, 'rgba(255,255,255,0.18)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = rg;
      c.beginPath(); c.ellipse(gx, gy, baseW * 0.46, baseH * 0.28, -0.12, 0, Math.PI * 2); c.fill();
      c.restore();
    } catch {}
  }
  // Structural models per skin (fallback when car mode)
  const CAR_MODELS = {
    roadster: { wMul: 0.94, hMul: 0.86, roofH: 0.34, wheelYFront: 0.26, wheelYRear: 0.78, spoiler: true, rails: false, grille: false },
    muscle:   { wMul: 1.12, hMul: 0.90, roofH: 0.38, wheelYFront: 0.30, wheelYRear: 0.78, spoiler: false, rails: false, grille: true },
    hatch:    { wMul: 0.98, hMul: 1.02, roofH: 0.52, wheelYFront: 0.28, wheelYRear: 0.80, spoiler: false, rails: false, grille: false },
    suv:      { wMul: 1.08, hMul: 1.16, roofH: 0.50, wheelYFront: 0.28, wheelYRear: 0.80, spoiler: false, rails: true, grille: true },
    hyper:    { wMul: 1.02, hMul: 0.82, roofH: 0.30, wheelYFront: 0.26, wheelYRear: 0.76, spoiler: true, rails: false, grille: false },
    micro:    { wMul: 0.90, hMul: 1.10, roofH: 0.58, wheelYFront: 0.30, wheelYRear: 0.82, spoiler: false, rails: false, grille: false },
  };
  const CAR_MODEL_BY_SKIN = {
    scout: 'roadster',
    interceptor: 'hyper',
    explorer: 'hatch',
    courier: 'suv',
    phantom: 'roadster',
    freighter: 'suv',
  };
  function getCarModelParams() {
    const key = car.modelKey || CAR_MODEL_BY_SKIN[selectedSkin] || 'roadster';
    return CAR_MODELS[key] || CAR_MODELS.roadster;
  }
  // --- Ship-named aliases for clarity (keeps backward compat) ---
  const SHIP_MODELS = CAR_MODELS;
  const SHIP_MODEL_BY_SKIN = CAR_MODEL_BY_SKIN;
  function getShipModelParams() { return getCarModelParams(); }
  // Alias object reference
  const ship = car;
  const shipImg = carImg;
  // Render aliases
  function drawPlayerShipHullVector(w, h, color) { return drawPlayerCarVector(w, h, color); }
  function drawShipProjected(x, y, s) { return drawCarProjected(x, y, s); }
  let selectedSkin = localStorage.getItem('ship_skin') || localStorage.getItem('car_skin') || 'scout';
  function applySkin(key) {
    if (!SKINS[key]) key = 'scout';
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
    try {
      localStorage.setItem('ship_skin', key);
      localStorage.removeItem('car_skin');
    } catch {}
    carImgLoaded = false;
    playerShipCanvas = null;
    carImg.src = SKINS[key].src;
    car.color = SKINS[key].color; // fallback couleur
    car.modelKey = CAR_MODEL_BY_SKIN[key] || 'roadster';
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
      bloomCtx.filter = state.ultraNeon ? 'blur(9px) saturate(1.5) brightness(1.1)' : 'blur(6px) saturate(1.1)';
      bloomCtx.globalAlpha = 1;
      bloomCtx.drawImage(canvas, 0, 0, bloomCanvas.width, bloomCanvas.height);
      bloomCtx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const baseAlpha = isNeonTheme() ? 0.42 : 0.24;
      const bloomMul = state.visualMode === 'cinematic' ? 1.10 : 0.70;
      const p = state.autoPerf ? perfScale : 1;
      ctx.globalAlpha = baseAlpha * (state.ultraNeon ? 1.6 : 1) * bloomMul * p;
      ctx.drawImage(bloomCanvas, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } catch {}
  }

  let crtEnabled = false;
  let ditherEnabled = true;
  let chromaEnabled = false;
  let grainEnabled = false;
  let crtPattern = null;
  let crtPatternCanvas = null;
  // Offscreen for FX
  const fxCanvas = document.createElement('canvas');
  const fxCtx = fxCanvas.getContext('2d');
  const grainCanvas = document.createElement('canvas');
  const grainCtx = grainCanvas.getContext('2d');

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

    // Vue 3D subjective: warp en bandes horizontales pour simuler la perspective
    if (state.threeD) {
      try {
        // Copier la frame
        tiltCtx.setTransform(1, 0, 0, 1, 0, 0);
        tiltCtx.clearRect(0, 0, tiltCanvas.width, tiltCanvas.height);
        tiltCtx.drawImage(canvas, 0, 0);

        // Effacer et re-projeter par bandes
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        const strips = Math.max(60, Math.floor(canvas.height / (2 * DPR))); // nombre de bandes
        const dy = Math.ceil(canvas.height / strips);
        const cx = canvas.width / 2;
        const minScale = 0.55; // largeur en haut de l'écran
        for (let y = 0; y < canvas.height; y += dy) {
          const t = y / canvas.height; // 0 (haut) -> 1 (bas)
          const s = minScale + (1 - minScale) * Math.pow(t, 1.1);
          const destW = Math.max(1, Math.floor(canvas.width * s));
          const dx = Math.floor(cx - destW / 2);
          ctx.drawImage(tiltCanvas, 0, y, canvas.width, dy, dx, y, destW, dy);
        }
        ctx.restore();
      } catch {}
    }
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
    // HUD voiture en FPV (tableau de bord / capot)
    drawFPVCarHUD();
  }

  function drawFPVCarHUD() {
    ctx.save();
    const w = canvas.width;
    const h = canvas.height;
    const baseY = h * 0.9;
    // dégradé du capot
    const grad = ctx.createLinearGradient(0, baseY - 80 * DPR, 0, h);
    grad.addColorStop(0, 'rgba(20,20,32,0.85)');
    grad.addColorStop(1, 'rgba(10,10,18,0.98)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.quadraticCurveTo(w * 0.5, h * 0.78, w, baseY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    // reflet simple
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, baseY - 20 * DPR, w * 0.35, 22 * DPR, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // volant basique
    ctx.strokeStyle = 'rgba(80,80,110,0.9)';
    ctx.lineWidth = 6 * DPR;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.98, 70 * DPR, Math.PI * 0.9, Math.PI * 0.1);
    ctx.stroke();
    ctx.restore();
  }

  function drawObstacleProjected(ob, x, y, s) {
    const w = (ob.w || 40) * s;
    const h = (ob.h || 70) * s;
    const left = x - w / 2;
    const top = y - h / 2;
    const style = ob.style || { type: 'barrier', neonColor: '#4ad2ff', angle: 0, glyph: '⚠' };
    const neon = style.neonColor || '#4ad2ff';
    const neonBoost = state.ultraNeon ? 1.35 : 1.0;
    const angle = style.angle || 0;
    ctx.save();
    ctx.translate(left + w / 2, top + h / 2);
    ctx.rotate(angle);
    const L = -w / 2, T = -h / 2;
    // base shape per type
    if (style.type === 'neon_barrier' || style.type === 'barrier') {
      // body
      roundRect(ctx, L, T, w, h, 6 * DPR, 'rgba(20,20,28,0.95)');
      // hazard stripes
      ctx.save();
      ctx.globalAlpha = 0.85;
      const stripeH = Math.max(6 * DPR, h * 0.18);
      for (let i = 0; i < 4; i++) {
        const yb = T + 4 * DPR + i * (stripeH + 2 * DPR);
        ctx.fillStyle = '#2b2b33';
        ctx.fillRect(L + 6 * DPR, yb, w - 12 * DPR, stripeH);
        // diagonal yellow/black
        const step = 12 * DPR;
        for (let x0 = L + 6 * DPR - h; x0 < L + w - 6 * DPR; x0 += step) {
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.moveTo(x0, yb);
          ctx.lineTo(x0 + step * 0.6, yb);
          ctx.lineTo(x0 + step * 0.2, yb + stripeH);
          ctx.lineTo(x0 - step * 0.4, yb + stripeH);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
      // neon tubes
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(0, T + 6 * DPR, 2 * DPR, 0, T + 6 * DPR, Math.max(w, 36 * DPR));
      g.addColorStop(0, `${neon}90`);
      g.addColorStop(1, `${neon}00`);
      ctx.fillStyle = g;
      ctx.fillRect(L, T, w, 10 * DPR);
      ctx.restore();
      // outline holographique
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = `${neon}80`;
      ctx.lineWidth = Math.max(1, 1.6 * DPR);
      roundRectPath(ctx, L - 1 * DPR, T - 1 * DPR, w + 2 * DPR, h + 2 * DPR, 7 * DPR);
      ctx.stroke();
      ctx.restore();
    } else if (style.type === 'crate') {
      // caisse techno
      roundRect(ctx, L, T, w, h, 6 * DPR, '#222531');
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2 * DPR;
      // panneaux
      ctx.strokeRect(L + w * 0.1, T + h * 0.12, w * 0.8, h * 0.3);
      ctx.strokeRect(L + w * 0.1, T + h * 0.58, w * 0.8, h * 0.3);
      // coins néon
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `${neon}88`;
      ctx.lineWidth = 3 * DPR;
      ctx.beginPath();
      ctx.moveTo(L + 6 * DPR, T + 6 * DPR); ctx.lineTo(L + w * 0.28, T + 6 * DPR);
      ctx.moveTo(L + w - 6 * DPR, T + 6 * DPR); ctx.lineTo(L + w * 0.72, T + 6 * DPR);
      ctx.moveTo(L + 6 * DPR, T + h - 6 * DPR); ctx.lineTo(L + w * 0.28, T + h - 6 * DPR);
      ctx.moveTo(L + w - 6 * DPR, T + h - 6 * DPR); ctx.lineTo(L + w * 0.72, T + h - 6 * DPR);
      ctx.stroke();
      ctx.restore();
    } else {
      // panneau signalétique (style panel)
      roundRect(ctx, L, T, w, h, 5 * DPR, 'rgba(14,14,24,0.95)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(0, 0, 2 * DPR, 0, 0, Math.max(w, h));
      glow.addColorStop(0, `${neon}${state.ultraNeon ? 'A0' : '70'}`);
      glow.addColorStop(1, `${neon}00`);
      ctx.fillStyle = glow;
      ctx.fillRect(L - w * 0.5, T - h * 0.5, w * 2, h * 2);
      ctx.restore();
      ctx.strokeStyle = `${neon}AA`;
      ctx.lineWidth = 2 * DPR;
      roundRectPath(ctx, L + 2 * DPR, T + 2 * DPR, w - 4 * DPR, h - 4 * DPR, 4 * DPR);
      ctx.stroke();
      // glyph
      ctx.fillStyle = '#e6e7ff';
      ctx.font = `${Math.floor(Math.min(w, h) * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(style.glyph || '⚠', 0, 0);
    }
    ctx.restore();
  }

  // 2D version stylisée
  function drawObstacle(ob) {
    const w = ob.w, h = ob.h;
    const left = ob.x, top = ob.y;
    const style = ob.style || { type: 'barrier', neonColor: '#4ad2ff', angle: 0, glyph: '⚠' };
    const neon = style.neonColor || '#4ad2ff';
    const angle = style.angle || 0;
    const neonBoost = state.ultraNeon ? 1.25 : 1.0;
    ctx.save();
    ctx.translate(left + w / 2, top + h / 2);
    ctx.rotate(angle);
    const L = -w / 2, T = -h / 2;
    if (style.type === 'neon_barrier' || style.type === 'barrier') {
      roundRect(ctx, L, T, w, h, 6 * DPR, 'rgba(20,20,28,0.95)');
      // hazard stripes
      ctx.save();
      ctx.globalAlpha = 0.85;
      const stripeH = Math.max(6 * DPR, h * 0.18);
      for (let i = 0; i < 4; i++) {
        const yb = T + 4 * DPR + i * (stripeH + 2 * DPR);
        ctx.fillStyle = '#2b2b33';
        ctx.fillRect(L + 6 * DPR, yb, w - 12 * DPR, stripeH);
        const step = 12 * DPR;
        for (let x0 = L + 6 * DPR - h; x0 < L + w - 6 * DPR; x0 += step) {
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.moveTo(x0, yb);
          ctx.lineTo(x0 + step * 0.6, yb);
          ctx.lineTo(x0 + step * 0.2, yb + stripeH);
          ctx.lineTo(x0 - step * 0.4, yb + stripeH);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
      // neon top
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(0, T + 6 * DPR, 2 * DPR, 0, T + 6 * DPR, Math.max(w, 36 * DPR) * neonBoost);
      g.addColorStop(0, `${neon}90`);
      g.addColorStop(1, `${neon}00`);
      ctx.fillStyle = g;
      ctx.fillRect(L, T, w, 10 * DPR);
      ctx.restore();
      // outline
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = `${neon}80`;
      ctx.lineWidth = Math.max(1, 1.6 * DPR);
      roundRectPath(ctx, L - 1 * DPR, T - 1 * DPR, w + 2 * DPR, h + 2 * DPR, 7 * DPR);
      ctx.stroke();
      ctx.restore();
    } else if (style.type === 'crate') {
      roundRect(ctx, L, T, w, h, 6 * DPR, '#222531');
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2 * DPR;
      ctx.strokeRect(L + w * 0.1, T + h * 0.12, w * 0.8, h * 0.3);
      ctx.strokeRect(L + w * 0.1, T + h * 0.58, w * 0.8, h * 0.3);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `${neon}88`;
      ctx.lineWidth = 3 * DPR;
      ctx.beginPath();
      ctx.moveTo(L + 6 * DPR, T + 6 * DPR); ctx.lineTo(L + w * 0.28, T + 6 * DPR);
      ctx.moveTo(L + w - 6 * DPR, T + 6 * DPR); ctx.lineTo(L + w * 0.72, T + 6 * DPR);
      ctx.moveTo(L + 6 * DPR, T + h - 6 * DPR); ctx.lineTo(L + w * 0.28, T + h - 6 * DPR);
      ctx.moveTo(L + w - 6 * DPR, T + h - 6 * DPR); ctx.lineTo(L + w * 0.72, T + h - 6 * DPR);
      ctx.stroke();
      ctx.restore();
    } else {
      roundRect(ctx, L, T, w, h, 5 * DPR, 'rgba(14,14,24,0.95)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(0, 0, 2 * DPR, 0, 0, Math.max(w, h) * neonBoost);
      glow.addColorStop(0, `${neon}${state.ultraNeon ? 'A0' : '70'}`);
      glow.addColorStop(1, `${neon}00`);
      ctx.fillStyle = glow;
      ctx.fillRect(L - w * 0.5, T - h * 0.5, w * 2, h * 2);
      ctx.restore();
      ctx.strokeStyle = `${neon}AA`;
      ctx.lineWidth = 2 * DPR;
      roundRectPath(ctx, L + 2 * DPR, T + 2 * DPR, w - 4 * DPR, h - 4 * DPR, 4 * DPR);
      ctx.stroke();
      ctx.fillStyle = '#e6e7ff';
      ctx.font = `${Math.floor(Math.min(w, h) * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(style.glyph || '⚠', 0, 0);
    }
    ctx.restore();
  }

  function drawNPCProjected(n, x, y, s) {
    const w = (n.w || 50) * s;
    const h = (n.h || 100) * s;
    const left = x - w / 2;
    const top = y - h / 2;
    const body = n.color || '#5aa7ff';
    if (state.vehicle === 'ship') {
      drawGenericShipProjected(x, y, w, h, body, s, /*isPlayer*/ false);
      return;
    }
    // underglow (subtle for NPCs)
    if (isNeonTheme()) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const ugx = x;
      const ugy = y + h * 0.45;
      const ug = ctx.createRadialGradient(ugx, ugy, 2 * DPR, ugx, ugy, Math.max(w, 44 * DPR));
      const neonBoost = state.ultraNeon ? 1.35 : 1.0;
      ug.addColorStop(0, `rgba(80,200,255,${0.22 * neonBoost})`);
      ug.addColorStop(1, 'rgba(80,200,255,0)');
      ctx.fillStyle = ug;
      ctx.beginPath(); ctx.ellipse(ugx, ugy, w * 0.65, h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // body base
    roundRect(ctx, left, top, w, h, 8 * DPR, body);
    // paint gradient
    const grad = ctx.createLinearGradient(left, top, left, top + h);
    grad.addColorStop(0, 'rgba(255,255,255,0.10)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.04)');
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');
    roundRect(ctx, left, top, w, h, 8 * DPR, grad);

    // roof
    const roofW = w * (n.model === 'suv' ? 0.78 : 0.72);
    const roofH = h * (n.model === 'sport' ? 0.38 : 0.46);
    const roofX = left + (w - roofW) / 2;
    const roofY = top + h * 0.22;
    roundRect(ctx, roofX, roofY, roofW, roofH, 5 * DPR, 'rgba(0,0,0,0.25)');
    // glass tint
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    // windshield
    ctx.fillRect(left + w * 0.18, top + h * 0.10, w * 0.64, h * 0.14);
    // rear window
    ctx.fillRect(left + w * 0.22, top + h * 0.74, w * 0.56, h * 0.10);

    // side trim
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1 * DPR;
    ctx.beginPath();
    ctx.moveTo(left + w * 0.08, top + h * 0.50);
    ctx.lineTo(left + w * 0.92, top + h * 0.50);
    ctx.stroke();

    // side stripe (stylish accent)
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, left + w * 0.10, top + h * 0.60, w * 0.80, h * 0.06, 3 * DPR, ctx.fillStyle);
    ctx.restore();

    // model-specific features
    if (n.model === 'sport') {
      // rear spoiler
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      const spY = top + h * 0.88;
      ctx.beginPath();
      ctx.moveTo(left + w * 0.22, spY);
      ctx.lineTo(left + w * 0.78, spY);
      ctx.lineTo(left + w * 0.70, spY + 4 * DPR);
      ctx.lineTo(left + w * 0.30, spY + 4 * DPR);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (n.model === 'suv') {
      // roof rails
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, left + w * 0.20, top + h * 0.24, w * 0.20, 4 * DPR, 2 * DPR, ctx.fillStyle);
      roundRect(ctx, left + w * 0.60, top + h * 0.24, w * 0.20, 4 * DPR, 2 * DPR, ctx.fillStyle);
      ctx.restore();
    } else {
      // sedan front grille
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1 * DPR;
      for (let i = 0; i < 3; i++) {
        const gy = top + h * (0.10 + i * 0.02);
        ctx.beginPath();
        ctx.moveTo(left + w * 0.22, gy);
        ctx.lineTo(left + w * 0.78, gy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // wheels
    function wheel(cx, cy, rx, ry) {
      ctx.save();
      ctx.fillStyle = '#0e0f15';
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(rx, ry) * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const wl = left + w * 0.18, wr = left + w * 0.82;
    wheel(wl, top + h * 0.26, w * 0.14, w * 0.11);
    wheel(wr, top + h * 0.26, w * 0.14, w * 0.11);
    wheel(wl, top + h * 0.78, w * 0.15, w * 0.12);
    wheel(wr, top + h * 0.78, w * 0.15, w * 0.12);
    // arches
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2 * DPR;
    function arch(cx, cy, r) { ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI*0.1, Math.PI*0.9); ctx.stroke(); }
    arch(wl, top + h * 0.28, w * 0.20);
    arch(wr, top + h * 0.28, w * 0.20);
    arch(wl, top + h * 0.79, w * 0.22);
    arch(wr, top + h * 0.79, w * 0.22);

    // mirrors
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, left - 2 * DPR, top + h * 0.18, 6 * DPR, 10 * DPR, 2 * DPR, ctx.fillStyle);
    roundRect(ctx, left + w - 4 * DPR, top + h * 0.18, 6 * DPR, 10 * DPR, 2 * DPR, ctx.fillStyle);

    // headlights + tail lights
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    // headlight glow
    const hx = x, hy = top + h * 0.06;
    const hg = ctx.createRadialGradient(hx, hy, 2 * DPR, hx, hy, h * 0.7);
    hg.addColorStop(0, 'rgba(255,255,220,0.18)');
    hg.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(hx, hy, w * 0.16, h * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    // tail lights glow
    const tly = top + h * 0.92;
    const tlx1 = left + w * 0.22, tlx2 = left + w * 0.78;
    const tg1 = ctx.createRadialGradient(tlx1, tly, 1 * DPR, tlx1, tly, 10 * DPR);
    tg1.addColorStop(0, 'rgba(255,60,60,0.7)'); tg1.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = tg1; ctx.beginPath(); ctx.arc(tlx1, tly, 10 * DPR, 0, Math.PI * 2); ctx.fill();
    const tg2 = ctx.createRadialGradient(tlx2, tly, 1 * DPR, tlx2, tly, 10 * DPR);
    tg2.addColorStop(0, 'rgba(255,60,60,0.7)'); tg2.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = tg2; ctx.beginPath(); ctx.arc(tlx2, tly, 10 * DPR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // hologram outline (very subtle)
    if (isNeonTheme()) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = 'rgba(0,245,255,0.45)';
      ctx.lineWidth = Math.max(1, 1.2 * DPR);
      roundRect(ctx, left - 1 * DPR, top - 1 * DPR, w + 2 * DPR, h + 2 * DPR, 9 * DPR, 'rgba(0,0,0,0)');
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPalmProjected(p, x, y, s) {
    if (isNeonTheme()) {
      // Holo totem (cyberpunk)
      const w = (p.w || 24 * DPR) * s;
      const h = (p.h || 120 * DPR) * s;
      const left = x - w / 2;
      const top = y - h / 2;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      // Core pillar
      const g = ctx.createLinearGradient(0, top, 0, top + h);
      g.addColorStop(0, 'rgba(163,116,255,0.0)');
      g.addColorStop(0.5, 'rgba(98,209,255,0.35)');
      g.addColorStop(1, 'rgba(255,122,200,0.0)');
      ctx.fillStyle = g;
      roundRect(ctx, left + w * 0.35, top, w * 0.30, h, 8 * DPR * s, ctx.fillStyle);
      // Scanning band
      const t = performance.now() / 1000;
      const bandY = top + ((t * 60) % h);
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = 'rgba(180,220,255,0.45)';
      ctx.fillRect(left + w * 0.32, bandY, w * 0.36, 3 * DPR * s);
      ctx.globalAlpha = 1;
      // Top halo
      const rg = ctx.createRadialGradient(x, top, 2 * DPR, x, top, 36 * DPR * s);
      rg.addColorStop(0, 'rgba(180,200,255,0.35)');
      rg.addColorStop(1, 'rgba(180,200,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(x, top, 36 * DPR * s, 0, Math.PI * 2); ctx.fill();
      // Glyph animé
      if (p.glyph) {
        ctx.fillStyle = 'rgba(220,235,255,0.85)';
        ctx.font = `${Math.max(8, Math.floor(12 * DPR * s))}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const gy = top + 14 * DPR * s + Math.sin(performance.now()/600 + (p.phase||0)) * 2 * DPR * s;
        ctx.fillText(p.glyph, x, gy);
      }
      ctx.restore();
      return;
    }
    const pal = getSectionPalette();
    const w = (p.w || 24 * DPR) * s;
    const h = (p.h || 120 * DPR) * s;
    const trunkW = (p.trunkW || 10 * DPR) * s;
    const trunkH = (p.trunkH || h) * s;
    const left = x - w / 2;
    const top = y - h / 2;
    // tronc
    ctx.save();
    ctx.fillStyle = pal.trunk;
    ctx.fillRect(left + w * 0.5 - trunkW * 0.5, top, trunkW, trunkH);
    // frondaisons simples
    ctx.translate(x, top + trunkH * 0.1);
    const leafLen = trunkH * 0.95;
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i / 6) * Math.PI * 2);
      const grad = ctx.createLinearGradient(0, 0, leafLen, 0);
      grad.addColorStop(0, pal.palmLeafStart);
      grad.addColorStop(1, pal.palmLeafEnd);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(leafLen * 0.35, -8 * DPR * s, leafLen * 0.7, 0);
      ctx.quadraticCurveTo(leafLen * 0.35, 8 * DPR * s, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawSignProjected(sg, x, y, s) {
    if (isNeonTheme()) {
      const w = (sg.w || 70 * DPR) * s;
      const h = (sg.h || 26 * DPR) * s * 1.6;
      const poleH = (sg.poleH || 16 * DPR) * s;
      const left = x - w / 2;
      const top = y - h / 2;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      // Neon billboard body
      roundRect(ctx, left, top + poleH, w, h, 6 * DPR * s, 'rgba(14,14,24,0.6)');
      // Glow edges
      const edge = ctx.createLinearGradient(left, top, left + w, top + h);
      edge.addColorStop(0, 'rgba(163,116,255,0.40)');
      edge.addColorStop(1, 'rgba(98,209,255,0.40)');
      ctx.strokeStyle = edge;
      ctx.lineWidth = Math.max(1, 2 * DPR * s);
      ctx.strokeRect(left, top + poleH, w, h);
      // Glitch scanlines
      const t = performance.now() / 250;
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = 'rgba(180,220,255,0.8)';
      for (let yy = top + poleH + (t % 4) * DPR; yy < top + poleH + h; yy += 4 * DPR) {
        ctx.fillRect(left + 3 * DPR * s, yy, w - 6 * DPR * s, 1 * DPR);
      }
      ctx.globalAlpha = 1;
      // Holo text
      ctx.fillStyle = sg.color || '#e6e7ff';
      ctx.font = `${Math.max(8, Math.floor(12 * DPR * s))}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(sg.txt || 'CYBER', left + w / 2, top + poleH + h / 2);
      ctx.restore();
      return;
    }
    const w = (sg.w || 70 * DPR) * s;
    const h = (sg.h || 26 * DPR) * s;
    const poleH = (sg.poleH || 16 * DPR) * s;
    const left = x - w / 2;
    const top = y - h / 2;
    ctx.save();
    // poteau
    ctx.fillStyle = '#4b4b56';
    const poleX = sg.side === 'left' ? left + w * 0.85 : left + w * 0.15;
    ctx.fillRect(poleX - 2 * DPR * s, top, 4 * DPR * s, poleH + h);
    // halo
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300 + (sg.pulse || 0));
    ctx.fillStyle = (sg.color || '#e6e7ff');
    ctx.globalAlpha = 0.15 + 0.2 * pulse;
    ctx.fillRect(left - 4 * DPR * s, top + poleH - 4 * DPR * s, w + 8 * DPR * s, h + 8 * DPR * s);
    ctx.globalAlpha = 1;
    // panneau
    roundRect(ctx, left, top + poleH, w, h, 4 * DPR * s, 'rgba(14,14,24,0.95)');
    ctx.fillStyle = (sg.color || '#e6e7ff');
    ctx.font = `${Math.max(8, Math.floor(10 * DPR * s))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sg.txt || 'MOTEL', left + w / 2, top + poleH + h / 2);
    ctx.restore();
  }

  function drawRockProjected(rk, x, y, s) {
    if (isNeonTheme()) {
      const w = (rk.w || 24 * DPR) * s;
      const h = (rk.h || 14 * DPR) * s;
      const r = (rk.r || 6 * DPR) * s;
      const left = x - w / 2;
      const top = y - h / 2;
      // Tech crate with neon rim
      ctx.save();
      roundRect(ctx, left, top, w, h, r, 'rgba(18,18,32,0.95)');
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = 'rgba(163,116,255,0.5)';
      ctx.lineWidth = Math.max(1, 2 * DPR * s);
      ctx.strokeRect(left + 1 * DPR * s, top + 1 * DPR * s, w - 2 * DPR * s, h - 2 * DPR * s);
      // Corner nodes
      ctx.fillStyle = 'rgba(98,209,255,0.55)';
      const r2 = Math.max(1, 1.5 * DPR * s);
      ctx.beginPath(); ctx.arc(left + r, top + r, r2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(left + w - r, top + r, r2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(left + r, top + h - r, r2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(left + w - r, top + h - r, r2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    const w = (rk.w || 24 * DPR) * s;
    const h = (rk.h || 14 * DPR) * s;
    const r = (rk.r || 6 * DPR) * s;
    const left = x - w / 2;
    const top = y - h / 2;
    // base
    roundRect(ctx, left, top, w, h, r, rk.dark || '#445');
    // face claire
    ctx.save();
    ctx.globalAlpha = 0.5;
    roundRect(ctx, left + w * 0.08, top + h * 0.12, w * 0.84, h * 0.5, r * 0.6, rk.light || '#99a');
    ctx.restore();
  }

  // ---- Fleurs décoratives ----
  function makeFlower(roadLeft, roadRight, side) {
    const baseW = rand(6, 12) * DPR;
    const baseH = rand(10, 18) * DPR;
    const y = -baseH - 6 * DPR;
    const margin = 6 * DPR;
    const x = side === 'left' ? (roadLeft - margin - baseW) : (roadRight + margin);
    const vy = world.baseSpeed * rand(0.85, 1.05);
    // palette pétales
    const colors = isNeonTheme()
      ? ['#ff7bf3', '#4ad2ff', '#ffd166', '#a374ff']
      : ['#ff7aa2', '#ffd166', '#a2ff8a', '#7ab6ff'];
    const petal = randChoice(colors);
    return { x, y, w: baseW, h: baseH, vy, side, petal, stem: '#3aa065' };
  }
  function drawFlower(fl) {
    if (isNeonTheme()) {
      const cx = fl.x + fl.w * 0.5;
      const cy = fl.y + fl.h * 0.3;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const hueA = randChoice(['163,116,255','98,209,255','255,122,200']);
      for (let i = 0; i < 8; i++) {
        const ox = rand(-fl.w * 0.6, fl.w * 0.6);
        const oy = rand(-fl.h * 0.3, fl.h * 0.2);
        const r = rand(1.0 * DPR, 2.4 * DPR);
        ctx.fillStyle = `rgba(${hueA},${rand(0.25,0.6)})`;
        ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      return;
    }
    const cx = fl.x + fl.w * 0.5;
    const cy = fl.y + fl.h * 0.6;
    // tige
    ctx.save();
    ctx.strokeStyle = fl.stem;
    ctx.lineWidth = Math.max(1, 1.2 * DPR);
    ctx.beginPath();
    ctx.moveTo(cx, fl.y + fl.h);
    ctx.quadraticCurveTo(cx + (fl.side === 'left' ? 3 * DPR : -3 * DPR), cy + 2 * DPR, cx, cy);
    ctx.stroke();
    // coeur
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.arc(cx, cy, 2 * DPR, 0, Math.PI * 2); ctx.fill();
    // pétales
    ctx.fillStyle = fl.petal;
    const rad = 3.2 * DPR;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * (rad * 0.8), 1.8 * DPR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawFlowerProjected(fl, x, y, s) {
    if (isNeonTheme()) {
      // Neon shrub cluster
      const w = (fl.w || 8 * DPR) * s;
      const h = (fl.h || 14 * DPR) * s;
      const cx = x; const cy = y - h * 0.4;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const hueA = randChoice(['163,116,255','98,209,255','255,122,200']);
      for (let i = 0; i < 10; i++) {
        const ox = rand(-w * 0.6, w * 0.6);
        const oy = rand(-h * 0.3, h * 0.2);
        const r = rand(1.0 * DPR * s, 2.2 * DPR * s);
        ctx.fillStyle = `rgba(${hueA},${rand(0.25,0.6)})`;
        ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      return;
    }
    const w = (fl.w || 8 * DPR) * s;
    const h = (fl.h || 14 * DPR) * s;
    const cx = x;
    const cy = y - h * 0.4;
    ctx.save();
    // tige
    ctx.strokeStyle = fl.stem || '#3aa065';
    ctx.lineWidth = Math.max(1, 1.2 * DPR * s);
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx + (fl.side === 'left' ? 3 * DPR * s : -3 * DPR * s), cy + 2 * DPR * s, cx, cy);
    ctx.stroke();
    // coeur
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.arc(cx, cy, 2 * DPR * s, 0, Math.PI * 2); ctx.fill();
    // pétales
    ctx.fillStyle = fl.petal || '#ff7aa2';
    const rad = 3.2 * DPR * s;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * (rad * 0.8), 1.8 * DPR * s, 0, Math.PI * 2);
      ctx.fill();
    }
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
    if (isNeonTheme()) {
      ctx.save();
      // Tech crate with neon rim (2D)
      roundRect(ctx, rk.x, rk.y, rk.w, rk.h, rk.r, 'rgba(18,18,32,0.95)');
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = 'rgba(163,116,255,0.5)';
      ctx.lineWidth = Math.max(1, 2 * DPR);
      ctx.strokeRect(rk.x + 1 * DPR, rk.y + 1 * DPR, rk.w - 2 * DPR, rk.h - 2 * DPR);
      // Corner nodes
      ctx.fillStyle = 'rgba(98,209,255,0.55)';
      const r2 = Math.max(1, 1.5 * DPR);
      ctx.beginPath(); ctx.arc(rk.x + rk.r, rk.y + rk.r, r2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rk.x + rk.w - rk.r, rk.y + rk.r, r2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rk.x + rk.r, rk.y + rk.h - rk.r, r2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rk.x + rk.w - rk.r, rk.y + rk.h - rk.r, r2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
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
    // If vehicle mode is 'ship', draw as spaceship in 2D and return
    if (state.vehicle === 'ship') {
      const x = n.x + n.w / 2;
      const y = n.y + n.h / 2;
      drawGenericShipProjected(x, y, n.w, n.h, n.color || '#5aa7ff', 1, /*isPlayer*/ false);
      return;
    }
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

    // side stripe (stylish accent)
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, n.x + n.w * 0.10, n.y + n.h * 0.60, n.w * 0.80, n.h * 0.06, 3 * DPR, ctx.fillStyle);
    ctx.restore();

    // model-specific features
    if (n.model === 'sport') {
      // rear spoiler
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      const spY = n.y + n.h * 0.88;
      ctx.beginPath();
      ctx.moveTo(n.x + n.w * 0.22, spY);
      ctx.lineTo(n.x + n.w * 0.78, spY);
      ctx.lineTo(n.x + n.w * 0.70, spY + 4 * DPR);
      ctx.lineTo(n.x + n.w * 0.30, spY + 4 * DPR);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (n.model === 'suv') {
      // roof rails
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, n.x + n.w * 0.20, n.y + n.h * 0.24, n.w * 0.20, 4 * DPR, 2 * DPR, ctx.fillStyle);
      roundRect(ctx, n.x + n.w * 0.60, n.y + n.h * 0.24, n.w * 0.20, 4 * DPR, 2 * DPR, ctx.fillStyle);
      ctx.restore();
    } else {
      // sedan front grille
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1 * DPR;
      for (let i = 0; i < 3; i++) {
        const gy = n.y + n.h * (0.10 + i * 0.02);
        ctx.beginPath();
        ctx.moveTo(n.x + n.w * 0.22, gy);
        ctx.lineTo(n.x + n.w * 0.78, gy);
        ctx.stroke();
      }
      ctx.restore();
    }

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
    const vm = visMul();
    const glow = ctx.createLinearGradient(roadLeft - 10 * DPR, 0, roadLeft, 0);
    glow.addColorStop(0, 'rgba(116,196,255,0)');
    glow.addColorStop(1, `rgba(116,196,255,${(0.50 * vm).toFixed(3)})`);
    ctx.fillStyle = glow;
    ctx.fillRect(roadLeft - 10 * DPR, roadTop, 10 * DPR, roadBottom - roadTop);

    const glow2 = ctx.createLinearGradient(roadRight, 0, roadRight + 10 * DPR, 0);
    glow2.addColorStop(0, `rgba(116,196,255,${(0.50 * vm).toFixed(3)})`);
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
    const vm = visMul();
    for (let y = roadTop + offset; y < roadBottom; y += gap) {
      const g = ctx.createLinearGradient(roadLeft, y, roadRight, y);
      g.addColorStop(0, 'rgba(163,116,255,0.0)');
      g.addColorStop(0.5, `rgba(163,116,255,${(0.24 * vm).toFixed(3)})`);
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
    initSearchlights();
    initStars();
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
    updateSearchlights(dt);
    updateStars(dt);
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
  // Reflection offscreen (for wet road ripple)
  let reflectCanvas = document.createElement('canvas');
  let reflectCtx = reflectCanvas.getContext('2d');
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

  // ---- Camera lens raindrops (post overlay) ----
  const cameraDrops = [];
  const cameraSplashes = [];
  function spawnCameraDrop() {
    const r = rand(2 * DPR, 6 * DPR);
    const yStart = rand(0, canvas.height * 0.4);
    return {
      x: rand(0, canvas.width),
      y: yStart,
      r,
      vy: rand(18, 48) * (0.7 + 0.6 * rainIntensity) * fxScale(),
      alpha: rand(0.08, 0.16),
      wobble: rand(0.2, 0.6),
      a: rand(0, Math.PI * 2),
    };
  }
  function spawnSplash(x) {
    const w = rand(20 * DPR, 60 * DPR);
    const h = rand(4 * DPR, 10 * DPR);
    cameraSplashes.push({ x, y: canvas.height - 12 * DPR, w, h, alpha: rand(0.08, 0.18), life: rand(0.24, 0.6) });
  }
  function updateCameraDrops(dt) {
    if (!isNeonTheme() || !rainEnabled) {
      cameraDrops.length = 0; cameraSplashes.length = 0; return;
    }
    const spawn = (8 * rainIntensity * fxScale()) | 0;
    for (let i = 0; i < spawn; i++) cameraDrops.push(spawnCameraDrop());
    for (let i = cameraDrops.length - 1; i >= 0; i--) {
      const d = cameraDrops[i];
      d.a += dt * 4;
      d.y += (d.vy + Math.sin(d.a) * d.wobble * 10) * dt * DPR;
      d.x += Math.cos(d.a * 0.6) * d.wobble * 8 * dt * DPR;
      d.alpha *= 0.999;
      if (d.y > canvas.height - 14 * DPR) {
        if (Math.random() < 0.2 + rainIntensity * 0.6) spawnSplash(d.x);
        cameraDrops.splice(i, 1);
      }
    }
    for (let i = cameraSplashes.length - 1; i >= 0; i--) {
      const s = cameraSplashes[i];
      s.life -= dt; s.alpha *= 0.985;
      if (s.life <= 0 || s.alpha < 0.01) cameraSplashes.splice(i, 1);
    }
  }
  function drawCameraDrops() {
    if (!isNeonTheme() || !rainEnabled) return;
    const vm = visMul();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    // Drops (soft highlights + short streak)
    for (const d of cameraDrops) {
      const a = Math.min(1, d.alpha * (0.9 + 0.6 * rainIntensity) * vm);
      const rg = ctx.createRadialGradient(d.x, d.y, d.r * 0.4, d.x, d.y, d.r * 1.4);
      rg.addColorStop(0, `rgba(220,235,255,${a})`);
      rg.addColorStop(1, 'rgba(220,235,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 1.4, 0, Math.PI * 2); ctx.fill();
      // subtle vertical smear
      const sl = d.r * 2.2;
      const lg = ctx.createLinearGradient(d.x, d.y - sl, d.x, d.y + sl);
      lg.addColorStop(0, 'rgba(220,235,255,0)');
      lg.addColorStop(0.5, `rgba(220,235,255,${a * 0.45})`);
      lg.addColorStop(1, 'rgba(220,235,255,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(d.x - 1 * DPR, d.y - sl, 2 * DPR, sl * 2);
    }
    // Splashes near bottom
    for (const s of cameraSplashes) {
      const ga = Math.min(1, s.alpha * vm);
      const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, Math.max(s.w, s.h));
      g.addColorStop(0, `rgba(220,235,255,${ga})`);
      g.addColorStop(1, 'rgba(220,235,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, s.w, s.h, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
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
    const glyphs = ['忍','龍','電','ネ','光','Ξ','ル','街','囧','幻'];
    const glyph = isNeonTheme() ? randChoice(glyphs) : undefined;
    return { x, y, w: baseW, h: baseH, trunkW, trunkH, side, vy, swaySpeed, swayAmp, phase: Math.random() * Math.PI * 2, glyph };
  }
  function drawPalm(p) {
    if (isNeonTheme()) {
      // Holo totem (2D)
      const w = p.w, h = p.h;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
      g.addColorStop(0, 'rgba(163,116,255,0.0)');
      g.addColorStop(0.5, 'rgba(98,209,255,0.35)');
      g.addColorStop(1, 'rgba(255,122,200,0.0)');
      ctx.fillStyle = g;
      roundRect(ctx, p.x + w * 0.35, p.y, w * 0.30, h, 8 * DPR, ctx.fillStyle);
      const t = performance.now() / 1000;
      const bandY = p.y + ((t * 60) % h);
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = 'rgba(180,220,255,0.45)';
      ctx.fillRect(p.x + w * 0.32, bandY, w * 0.36, 3 * DPR);
      ctx.globalAlpha = 1;
      const rg = ctx.createRadialGradient(p.x + w * 0.5, p.y, 2 * DPR, p.x + w * 0.5, p.y, 36 * DPR);
      rg.addColorStop(0, 'rgba(180,200,255,0.35)');
      rg.addColorStop(1, 'rgba(180,200,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(p.x + w * 0.5, p.y, 36 * DPR, 0, Math.PI * 2); ctx.fill();
      // Glyph animé
      if (p.glyph) {
        ctx.fillStyle = 'rgba(220,235,255,0.85)';
        ctx.font = `${Math.max(8, Math.floor(12 * DPR))}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const gy = p.y + 14 * DPR + Math.sin(performance.now()/600 + p.phase) * 2 * DPR;
        ctx.fillText(p.glyph, p.x + w * 0.5, gy);
      }
      ctx.restore();
      return;
    }
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
    const neonBoost2D = state.ultraNeon ? 1.25 : 1.0;
    const alphaHex2D = state.ultraNeon ? '90' : '60';
    const glow = ctx.createRadialGradient(cx, cy, p.w * 0.3 * pulse, cx, cy, p.w * 0.9 * pulse * neonBoost2D);
    glow.addColorStop(0, `${p.color}${alphaHex2D}`);
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
    const icons = { shield: '🛡️', slow: '🐢', magnet: '🧲', ghost: '👻', double: '✖️2', coin: '🪙', blaster: '🔫' };
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
    const texts = isNeonTheme() ? ['CYBER', 'NOIR', 'NEON', 'BLADE', 'CITY'] : ['MOTEL', 'PALMS', 'CAFE', 'CITY', 'GAS'];
    const txt = texts[(Math.random() * texts.length) | 0];
    const margin = 12 * DPR;
    const x = side === 'left' ? (roadLeft - margin - w) : (roadRight + margin);
    return { x, y, w, h, poleH, vy, side, color, txt, pulse: Math.random() * Math.PI * 2 };
  }

  function drawSign(s) {
    if (isNeonTheme()) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      roundRect(ctx, s.x, s.y + s.poleH, s.w, s.h * 1.6, 6 * DPR, 'rgba(14,14,24,0.6)');
      const edge = ctx.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
      edge.addColorStop(0, 'rgba(163,116,255,0.40)');
      edge.addColorStop(1, 'rgba(98,209,255,0.40)');
      ctx.strokeStyle = edge;
      ctx.lineWidth = Math.max(1, 2 * DPR);
      ctx.strokeRect(s.x, s.y + s.poleH, s.w, s.h * 1.6);
      // scanlines
      const t = performance.now() / 250;
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = 'rgba(180,220,255,0.8)';
      for (let yy = s.y + s.poleH + (t % 4) * DPR; yy < s.y + s.poleH + s.h * 1.6; yy += 4 * DPR) {
        ctx.fillRect(s.x + 3 * DPR, yy, s.w - 6 * DPR, 1 * DPR);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = s.color || '#e6e7ff';
      ctx.font = `${Math.floor(12 * DPR)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.txt || 'CYBER', s.x + s.w / 2, s.y + s.poleH + (s.h * 0.8));
      ctx.restore();
      return;
    }
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
  carImg.onload = () => { carImgLoaded = true; rebuildPlayerShipCanvas(); };

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
  // Auto-Perf (FPS-based scaler)
  let perfScale = 1.0; // 0.65..1.0
  let fpsAvg = 60; // EMA du FPS
  let fpsNowInstant = 60;
  let fpsTarget = Number(localStorage.getItem('fps_target') || 58);

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
    cosmetics: { unlockedSkins: {}, unlockedPaints: {}, trail: null, sticker: 'none', underglow: 'none', paint: 'none', bodyStyle: 'stock' },
    // FX
    reduceFx: localStorage.getItem('reduce_fx') === 'true',
    ultraNeon: localStorage.getItem('ultra_neon') === 'true',
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
    // Visual
    threeD: true,
    carDepth: 0.88, // 3D chase depth position (0=top, 1=bottom)
    // Visual mode: 'cinematic' | 'competitive'
    visualMode: (localStorage.getItem('visual_mode') || 'cinematic'),
    autoPerf: (localStorage.getItem('auto_perf') !== 'false'),
    fpsHud: (localStorage.getItem('fps_hud') !== 'false'),
    // Vehicle mode
    vehicle: 'ship', // 'car' | 'ship'
    blasterAmmo: 0,
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
  function fxScale() {
    const base = state.reduceFx ? 0.6 : 1;
    const p = state.autoPerf ? perfScale : 1;
    return base * p;
  }
  function setAutoPerf(on) {
    state.autoPerf = !!on;
    try { localStorage.setItem('auto_perf', String(state.autoPerf)); } catch {}
    if (autoPerfBtn) autoPerfBtn.setAttribute('aria-pressed', String(state.autoPerf));
    showToast(`Auto Perf: ${state.autoPerf ? 'ON' : 'OFF'}`);
  }
  if (autoPerfBtn) {
    autoPerfBtn.addEventListener('click', () => setAutoPerf(!state.autoPerf));
    autoPerfBtn.setAttribute('aria-pressed', String(state.autoPerf));
  }
  // Init FPS target slider
  if (fpsTargetEl) {
    fpsTargetEl.value = String(fpsTarget);
    if (fpsTargetValEl) fpsTargetValEl.textContent = String(fpsTarget);
    fpsTargetEl.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      if (!isNaN(v)) {
        fpsTarget = clamp(v, 40, 75);
        if (fpsTargetValEl) fpsTargetValEl.textContent = String(fpsTarget);
      }
    });
    fpsTargetEl.addEventListener('change', () => {
      try { localStorage.setItem('fps_target', String(fpsTarget)); } catch {}
    });
  }
  function setFpsHud(on) {
    state.fpsHud = !!on;
    try { localStorage.setItem('fps_hud', String(state.fpsHud)); } catch {}
    if (fpsHudBtn) fpsHudBtn.setAttribute('aria-pressed', String(state.fpsHud));
  }
  if (fpsHudBtn) {
    fpsHudBtn.addEventListener('click', () => setFpsHud(!state.fpsHud));
    fpsHudBtn.setAttribute('aria-pressed', String(state.fpsHud));
  }
  function updateAutoPerf(fpsNow) {
    if (!state.autoPerf) return;
    // EMA douce
    fpsAvg = fpsAvg * 0.9 + fpsNow * 0.1;
    // Adaptation par paliers
    const low2 = Math.max(40, fpsTarget - 16);
    const low1 = Math.max(42, fpsTarget - 8);
    const high2 = Math.min(75, fpsTarget - 1);
    const high1 = Math.min(75, fpsTarget - 4);
    if (fpsAvg < low2) {
      perfScale = Math.max(0.65, perfScale - 0.06);
    } else if (fpsAvg < low1) {
      perfScale = Math.max(0.70, perfScale - 0.03);
    } else if (fpsAvg > high2) {
      perfScale = Math.min(1.0, perfScale + 0.02);
    } else if (fpsAvg > high1) {
      perfScale = Math.min(1.0, perfScale + 0.01);
    }
  }
  // Visual Mode intensity multiplier (for alphas/brightness)
  function visMul() { return state.visualMode === 'cinematic' ? 1.0 : 0.7; }
  function updateVisualModeUI() {
    if (!visualModeBtn) return;
    const isCine = state.visualMode === 'cinematic';
    visualModeBtn.textContent = isCine ? '🎬 Cinématique' : '🏁 Compétitif';
    visualModeBtn.setAttribute('aria-pressed', String(isCine));
    if (visualModeMainBtn) {
      visualModeMainBtn.textContent = isCine ? 'Cinématique' : 'Compétitif';
      visualModeMainBtn.setAttribute('aria-pressed', String(isCine));
    }
    if (visualModeGarageBtn) {
      visualModeGarageBtn.textContent = isCine ? '🎬 Cinématique' : '🏁 Compétitif';
      visualModeGarageBtn.setAttribute('aria-pressed', String(isCine));
    }
  }
  function setVisualMode(mode) {
    state.visualMode = (mode === 'competitive') ? 'competitive' : 'cinematic';
    try { localStorage.setItem('visual_mode', state.visualMode); } catch {}
    updateVisualModeUI();
    showToast(`Mode visuel: ${state.visualMode === 'cinematic' ? 'Cinématique' : 'Compétitif'}`);
  }
  updateVisualModeUI();
  if (visualModeBtn) {
    visualModeBtn.addEventListener('click', () => {
      const next = state.visualMode === 'cinematic' ? 'competitive' : 'cinematic';
      setVisualMode(next);
    });
  }
  if (visualModeMainBtn) {
    visualModeMainBtn.addEventListener('click', () => {
      const next = state.visualMode === 'cinematic' ? 'competitive' : 'cinematic';
      setVisualMode(next);
    });
  }
  if (visualModeGarageBtn) {
    visualModeGarageBtn.addEventListener('click', () => {
      const next = state.visualMode === 'cinematic' ? 'competitive' : 'cinematic';
      setVisualMode(next);
    });
  }
  if (reduceFxBtn) {
    reduceFxBtn.addEventListener('click', () => setReduceFx(!state.reduceFx));
    reduceFxBtn.setAttribute('aria-pressed', String(state.reduceFx));
  }

  function toggleThreeD() {
    state.threeD = !state.threeD;
    showToast(`Mode 3D: ${state.threeD ? 'ON' : 'OFF'}`);
  }

  // Ultra Neon: stronger bloom, saturation, and neon intensities
  function setUltraNeon(on) {
    state.ultraNeon = !!on;
    try { localStorage.setItem('ultra_neon', String(state.ultraNeon)); } catch {}
    if (ultraBtn) ultraBtn.setAttribute('aria-pressed', String(state.ultraNeon));
    showToast(`Ultra Neon: ${state.ultraNeon ? 'ON' : 'OFF'}`);
  }
  if (ultraBtn) {
    ultraBtn.addEventListener('click', () => setUltraNeon(!state.ultraNeon));
    ultraBtn.setAttribute('aria-pressed', String(state.ultraNeon));
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
    // Style cyberpunk de l'obstacle
    const neonPalette = ['#4ad2ff', '#ff7bf3', '#ffd166', '#a374ff'];
    const styleTypes = isNeonTheme() ? ['neon_barrier','barrier','crate','panel'] : ['barrier','crate','panel'];
    const type = randChoice(styleTypes);
    const neonColor = randChoice(neonPalette);
    const angle = rand(-0.08, 0.08); // légère inclinaison
    const glyphs = ['⚠', '停止', '⛔', '警', '▲', '▣'];
    const glyph = randChoice(glyphs);
    const style = { type, neonColor, angle, glyph };
    // Couche de secours (fallback) si besoin
    const layers = [];
    return { x, y, w, h, vy: world.baseSpeed * speedMultiplier, isDebris: true, style, layers };
  }

  // Wrapper: smarter spawn to prevent safe middle exploit
  function makeObstacle(roadLeft, roadRight) {
    const lanes = 3;
    const roadWidth = roadRight - roadLeft;
    const laneWidth = roadWidth / lanes;
    const r = Math.random();
    let xCenter = roadLeft + roadWidth * 0.5;

    if (r < 0.45) {
      // lane center with jitter: can be off-center within lane
      const lane = (Math.random() * lanes) | 0; // 0..2
      xCenter = roadLeft + laneWidth * (lane + 0.5) + rand(-laneWidth * 0.22, laneWidth * 0.22);
      return makeObstacleAtX(roadLeft, roadRight, xCenter);
    } else if (r < 0.80) {
      // near lane boundary (between lanes), discourages riding exactly on the lines
      const boundary = 1 + ((Math.random() * (lanes - 1)) | 0); // 1..lanes-1
      xCenter = roadLeft + laneWidth * (boundary) + rand(-laneWidth * 0.15, laneWidth * 0.15);
      return makeObstacleAtX(roadLeft, roadRight, xCenter);
    } else {
      // cross-lane blocker: slightly wider, centered on a boundary
      const boundary = 1 + ((Math.random() * (lanes - 1)) | 0);
      xCenter = roadLeft + laneWidth * (boundary) + rand(-laneWidth * 0.08, laneWidth * 0.08);
      const ob = makeObstacleAtX(roadLeft, roadRight, xCenter);
      const targetW = Math.min(roadWidth * 0.9, rand(laneWidth * 0.7, laneWidth * 1.1));
      ob.w = targetW;
      ob.x = xCenter - ob.w / 2;
      return ob;
    }
  }

  const obstacles = [];
  let spawnTimer = 0;
  let spawnInterval = 0.9; // secondes, diminue avec la difficulté
  // Projectiles (bullets)
  const bullets = [];
  let fireCooldown = 0; // seconds between shots
  // Powerups
  const powerups = [];
  let puSpawnTimer = 0;
  let puSpawnInterval = 7.5; // spawn de base (s)

  // Particules d'explosion
  const particles = [];
  let explosionTimer = 0;
  let explosionDuration = 0.85;
  // Mega explosion visual FX
  const shards = []; // {x,y,vx,vy,life,maxLife,len,rot,rotSpeed,color}
  let megaFX = null; // { flash, glitch, glow }
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
  // Holo-pubs (Néon uniquement)
  const holoAds = [];
  let holoAdSpawnTimer = 0;
  let holoAdSpawnInterval = 3.2;
  let holoAdSideLeft = true;
  // Drones-lumière au sol
  const drones = [];
  let droneSpawnTimer = 0;
  let droneSpawnInterval = 1.1;
  // Arcs électriques entre totems (rare, pluie forte)
  const neonArcs = [];
  let neonArcTimer = 0;
  let shipSpawnInterval = 3.8; // base

  // Décor: Rochers (bord de route)
  const rocks = [];
  let rockSpawnTimer = 0;
  let rockSpawnInterval = 1.6; // base

  // Décor: Fleurs (bord de route)
  const flowers = [];
  let flowerSpawnTimer = 0;
  let flowerSpawnInterval = 0.28; // densité augmentée
  let flowerSideLeft = true;
  // Parterres de fleurs (clusters)
  const flowerBeds = [];
  let bedSpawnTimer = 0;
  let bedSpawnInterval = 1.35;
  let bedSideLeft = false;

  // Trafic: Voitures NPC décoratives (sans collision)
  const npcs = [];
  let npcSpawnTimer = 0;
  let npcSpawnInterval = 2.8; // base

  // Audio (WebAudio)
  let audioCtx = null, masterGain = null, musicGain = null, sfxGain = null, envGain = null;
  let musicUserVol = 0.5, sfxUserVol = 0.7;
  // Ambiance nodes
  let thruster = null; // {noise, bp, hp, gain}
  let rainAmb = null; // {noise, lp, bp, gain}
  let neonHum = null; // {osc, lfo, lfoGain, gain}
  let audioUnlocked = false; // becomes true after a user gesture
  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      musicGain = audioCtx.createGain();
      sfxGain = audioCtx.createGain();
      envGain = audioCtx.createGain();
      const hp = audioCtx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 140;
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);
      envGain.connect(sfxGain); // ambiances suivent le volume SFX
      masterGain.connect(hp);
      hp.connect(audioCtx.destination);
      masterGain.gain.value = state.muted ? 0 : 1;
      musicGain.gain.value = musicUserVol;
      sfxGain.gain.value = sfxUserVol;
      envGain.gain.value = 0.6; // base ambiances
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
          ensureAmbients();
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
    duckMusicFor(380, 0.35);
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

  // ---- Ambiances: thruster, rain, neon hum ----
  function startThrusterLoop() {
    try {
      if (!audioCtx || !envGain) return;
      if (thruster) return;
      const noise = audioCtx.createBufferSource();
      const dur = 2.0;
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
      noise.buffer = buf; noise.loop = true;
      const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.8;
      const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
      const g = audioCtx.createGain(); g.gain.value = 0.0;
      noise.connect(bp); bp.connect(hp); hp.connect(g); g.connect(envGain);
      noise.start();
      thruster = { noise, bp, hp, gain: g };
    } catch {}
  }
  function stopThrusterLoop() { try { if (thruster) { thruster.noise.stop(); thruster = null; } } catch {}
  function startRainAmb() {
    try {
      if (!audioCtx || !envGain) return; if (rainAmb) return;
      const noise = audioCtx.createBufferSource();
      const dur = 2.0; const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
      noise.buffer = buf; noise.loop = true;
      const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
      const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 0.6;
      const g = audioCtx.createGain(); g.gain.value = 0.0;
      noise.connect(lp); lp.connect(bp); bp.connect(g); g.connect(envGain);
      noise.start();
      rainAmb = { noise, lp, bp, gain: g };
    } catch {}
  }
  function stopRainAmb() { try { if (rainAmb) { rainAmb.noise.stop(); rainAmb = null; } } catch {}
  function startNeonHum() {
    try {
      if (!audioCtx || !envGain) return; if (neonHum) return;
      const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 90;
      const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 1.2;
      const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 6; // +/- 6 Hz vibrato
      const g = audioCtx.createGain(); g.gain.value = 0.0;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      osc.connect(g); g.connect(envGain);
      osc.start(); lfo.start();
      neonHum = { osc, lfo, lfoGain, gain: g };
    } catch {}
  }
  function stopNeonHum() { try { if (neonHum) { neonHum.osc.stop(); neonHum.lfo.stop(); neonHum = null; } } catch {}

  function ensureAmbients() {
    if (!audioCtx || state.muted) return;
    // Thruster when ship and running
    if (state.running && state.vehicle === 'ship') startThrusterLoop(); else stopThrusterLoop();
    // Rain ambience when raining
    if (isNeonTheme() && rainEnabled) startRainAmb(); else stopRainAmb();
    // Neon hum only in neon theme
    if (isNeonTheme()) startNeonHum(); else stopNeonHum();
  }
  function updateAudio(dt) {
    try {
      if (!audioCtx) return;
      // Update thruster based on road speed and timeScale
      if (thruster) {
        const sp = Math.max(0, lastRoadSpeed || world.baseSpeed);
        const norm = clamp(sp / (world.baseSpeed * 2.4), 0, 1);
        thruster.bp.frequency.setTargetAtTime(400 + norm * 900, audioCtx.currentTime, 0.05);
        thruster.gain.gain.setTargetAtTime(0.05 + norm * 0.12, audioCtx.currentTime, 0.05);
      }
      // Rain volume per intensity
      if (rainAmb) {
        const vol = (rainEnabled ? (0.02 + rainIntensity * 0.22) : 0);
        rainAmb.gain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.08);
      }
      // Neon hum subtle base that scales with neon visuals
      if (neonHum) {
        const base = 0.01 + (isNeonTheme() ? 0.05 * visMul() : 0);
        neonHum.gain.gain.setTargetAtTime(base, audioCtx.currentTime, 0.15);
      }
    } catch {}
  }

  const keys = new Set();
  const inputs = { left: false, right: false, up: false, down: false, shoot: false };

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
    // 3D composite buffer matches main canvas size
    tiltCanvas.width = canvas.width;
    tiltCanvas.height = canvas.height;
    // rebuild prerender with new DPR scaling for crisp details
    rebuildPlayerShipCanvas();
    // Audio: start background and ambiences if possible
    if (!state.muted && audioUnlocked) {
      if (retroEnabled) { stopMusicPad(); startChiptune(); } else { stopChiptune(); startMusicPad(); }
      ensureAmbients();
    }
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
    // If garage is open, close it before starting
    if (typeof closeGarage === 'function' && garageModal && !garageModal.classList.contains('hidden')) {
      closeGarage();
    }
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
    bullets.length = 0;
    particles.length = 0;
    shards.length = 0;
    megaFX = null;
    explosionTimer = 0;
    shakeTime = 0; shakeDuration = 0; shakeIntensity = 0;
    shockwave = null;
    trail.length = 0;
    state.shieldCount = 0;
    state.slowTime = 0;
    state.magnetTime = 0;
    state.ghostTime = 0;
    state.doubleTime = 0;
    // Shooter: starting ammo
    state.blasterAmmo = 5;
    fireCooldown = 0;
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
    // Holo ads & drones
    holoAds.length = 0; holoAdSpawnTimer = 0; holoAdSideLeft = true;
    drones.length = 0; droneSpawnTimer = 0;
    neonArcs.length = 0; neonArcTimer = 0;
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
      // seed some neon elements
      if (isNeonTheme()) {
        for (let i = 0; i < 2; i++) {
          const side = i % 2 === 0 ? 'left' : 'right';
          const ad = makeHoloAd(sLeft, sRight, side);
          ad.y = rand(sTop + 20 * DPR, sBottom - 200 * DPR);
          holoAds.push(ad);
        }
        for (let i = 0; i < 3; i++) {
          const side = Math.random() < 0.5 ? 'left' : 'right';
          const d = makeDrone(sLeft, sRight, side);
          d.y = rand(sTop + 40 * DPR, sBottom - 120 * DPR);
          drones.push(d);
        }
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

    // shooting cooldown
    fireCooldown = Math.max(0, fireCooldown - dt);
    // hold-to-fire in 2D/3D when vaisseau
    if (state.running && !state.exploding && state.vehicle === 'ship' && inputs.shoot) {
      tryFire();
    }

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
      updateCameraDrops(dt);
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
    if (blasterAmmoEl) blasterAmmoEl.textContent = String(state.blasterAmmo || 0);
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
    lastRoadSpeed = speed;
    updateCyberpunkBackground(dt * state.timeScale);
    updateRain(dt * state.timeScale);
    ensureAmbients();
    updateAudio(dt * state.timeScale);
    updateCameraDrops(dt * state.timeScale);
    // fog bands move with time and depend on road bounds
    {
      const { top: roadTop, bottom: roadBottom } = roadBounds();
      updateFogBands(dt * state.timeScale, roadTop, roadBottom);
    }

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

    // déplacement vertical (3D chase): flèches haut/bas (ou W/S)
    if (state.threeD) {
      const vdir = (inputs.up ? -1 : 0) + (inputs.down ? 1 : 0);
      if (vdir !== 0) {
        const depthSpeed = 0.7; // vitesse de déplacement en profondeur (0..1) par seconde
        state.carDepth += vdir * depthSpeed * dt;
      }
    }

    // limites de la route
    const { left: roadLeft, right: roadRight, top: roadTop, bottom: roadBottom } = roadBounds();
    car.x = clamp(car.x, roadLeft + 2, roadRight - car.w - 2);
    if (state.threeD) {
      // Clamp profondeur et convertir en position pixel sur la route
      const denom = Math.max(1, (roadBottom - roadTop));
      const minDepth = 0.76, maxDepth = 0.96; // reste dans la zone jouable
      state.carDepth = clamp(state.carDepth, minDepth, maxDepth);
      const centerY = roadTop + denom * state.carDepth;
      car.y = centerY - car.h / 2;
      // Sécurité: clamp en pixels pour rester sur la piste
      car.y = clamp(car.y, roadTop, roadBottom - car.h);
    } else {
      // 2D: si en mode vaisseau, autoriser le mouvement vertical via flèches haut/bas
      if (state.vehicle === 'ship') {
        const vdir2D = (inputs.up ? -1 : 0) + (inputs.down ? 1 : 0);
        // Inertie verticale douce
        const accel = car.speed * 2.0; // px/s^2
        car.vy += vdir2D * accel * dt; // accélération
        // friction si pas d'entrée
        if (vdir2D === 0) car.vy *= 0.90;
        // clamp vitesse max
        const maxVy = car.speed * 1.2;
        car.vy = clamp(car.vy, -maxVy, maxVy);
        // appliquer mouvement
        car.y += car.vy * dt * DPR;
        // clamp aux bornes de la route et stopper si dépassement
        const prevY = car.y;
        car.y = clamp(car.y, roadTop, roadBottom - car.h);
        if (car.y !== prevY) car.vy = 0;
      } else {
        car.y = roadBottom - car.h - 16 * DPR;
      }
    }

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

    // spawn fleurs décoratives
    flowerSpawnTimer += dt;
    const flowerIntervalNow = Math.max(0.35, flowerSpawnInterval - state.sectionIndex * 0.01);
    if (flowerSpawnTimer >= flowerIntervalNow) {
      flowers.push(makeFlower(roadLeft, roadRight, flowerSideLeft ? 'left' : 'right'));
      flowerSideLeft = !flowerSideLeft;
      flowerSpawnTimer = 0;
    }

    // spawn parterres de fleurs
    bedSpawnTimer += dt;
    const bedIntervalNow = Math.max(0.9, bedSpawnInterval - state.sectionIndex * 0.06);
    if (bedSpawnTimer >= bedIntervalNow) {
      flowerBeds.push(makeFlowerBed(roadLeft, roadRight, bedSideLeft ? 'left' : 'right'));
      bedSideLeft = !bedSideLeft;
      bedSpawnTimer = 0;
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
        playPickup(p.type);
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

    // maj fleurs
    for (let i = flowers.length - 1; i >= 0; i--) {
      const fl = flowers[i];
      fl.y += fl.vy * dt * DPR * state.timeScale;
      if (fl.y > canvas.height + 40 * DPR) flowers.splice(i, 1);
    }

    // maj parterres de fleurs
    for (let i = flowerBeds.length - 1; i >= 0; i--) {
      const bd = flowerBeds[i];
      bd.y += bd.vy * dt * DPR * state.timeScale;
      if (bd.y > canvas.height + 60 * DPR) flowerBeds.splice(i, 1);
    }

    // maj holo-ads
    if (holoAds.length) {
      for (let i = holoAds.length - 1; i >= 0; i--) {
        const ad = holoAds[i];
        ad.y += ad.vy * dt * DPR * (ad.high ? 1.0 : state.timeScale);
        if (!ad.high && ad.y > canvas.height + 60 * DPR) { holoAds.splice(i, 1); continue; }
        if (ad.high && ad.y > roadTop + 6 * DPR) { holoAds.splice(i, 1); continue; }
      }
    }

    // maj drones
    if (drones.length) {
      for (let i = drones.length - 1; i >= 0; i--) {
        const d = drones[i];
        d.y += d.vy * dt * DPR * state.timeScale;
        if (d.y > canvas.height + 60 * DPR) drones.splice(i, 1);
      }
    }

    // arcs néon: spawn/update
    if (isNeonTheme()) {
      neonArcTimer += dt;
      if (neonArcTimer >= 0.12) { maybeSpawnNeonArc(roadTop, roadBottom); neonArcTimer = 0; }
      updateNeonArcs(dt);
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

  // --- First-person 3D-like rendering path ---
  function drawFPV() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tremblement d'écran
    ctx.save();
    if (shakeTime > 0 && shakeDuration > 0) {
      const t = shakeTime / shakeDuration;
      const amp = shakeIntensity * t * t;
      const ox = (Math.random() * 2 - 1) * amp;
      const oy = (Math.random() * 2 - 1) * amp;
      ctx.translate(ox, oy);
    }

    const { left: roadLeft, right: roadRight, top: roadTop, bottom: roadBottom } = roadBounds();
    const cx = canvas.width / 2;
    const baseW = (roadRight - roadLeft);

    function widthAt(t) {
      const minScale = 0.28; // largeur en haut (28% de la base)
      return baseW * (minScale + (1 - minScale) * Math.pow(t, 1.05));
    }
    function yAt(t) { return roadTop + (roadBottom - roadTop) * t; }
    function projectX(screenX, t) {
      const u = (screenX - (roadLeft + roadRight) / 2) / baseW; // -0.5..0.5 env.
      return cx + u * widthAt(t);
    }

    // Fond
    if (isNeonTheme()) {
      const sky = ctx.createLinearGradient(0, 0, 0, roadTop);
      sky.addColorStop(0, '#180035');
      sky.addColorStop(1, '#0a0b17');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, roadTop);
      ctx.fillStyle = currentTheme.outside;
      ctx.fillRect(0, roadTop, canvas.width, canvas.height - roadTop);
    } else {
      ctx.fillStyle = currentTheme.outside;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Route en trapèze
    const wTop = widthAt(0);
    const wBot = widthAt(1);
    ctx.save();
    const roadGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
    roadGrad.addColorStop(0, currentTheme.roadTop);
    roadGrad.addColorStop(1, currentTheme.roadBottom);
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(cx - wBot / 2, roadBottom);
    ctx.lineTo(cx + wBot / 2, roadBottom);
    ctx.lineTo(cx + wTop / 2, roadTop);
    ctx.lineTo(cx - wTop / 2, roadTop);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Lignes médianes (pointillées) projetées
    ctx.save();
    ctx.fillStyle = currentTheme.median;
    const dashWorld = 38 * DPR;
    let offset = world.lineOffset % dashWorld; if (offset < 0) offset += dashWorld;
    const steps = 36;
    for (let i = -2; i < steps; i++) {
      const yWorld = i * dashWorld + offset;
      const t = Math.min(1, Math.max(0, (yWorld) / (roadBottom - roadTop)));
      const y = yAt(t);
      const w = Math.max(2 * DPR, widthAt(t) * 0.012);
      const h = Math.max(6 * DPR, 12 * DPR * (0.4 + 0.6 * t));
      ctx.fillRect(cx - w / 2, y - h / 2, w, h);
    }
    ctx.restore();

    // Rendu des décors, obstacles et NPCs en ordre de profondeur
    const renderables = [];
    const denom = (roadBottom - roadTop) || 1;
    // Décors côté route
    for (const p of palms) {
      const t = Math.min(1, Math.max(0, (p.y - roadTop) / denom));
      const x = projectX(p.x + p.w / 2, t);
      const y = yAt(t);
      const s = 0.35 + 1.15 * Math.pow(t, 1.2);
      renderables.push({ type: 'palm', t, x, y, s, ref: p });
    }
    for (const sgn of signs) {
      const t = Math.min(1, Math.max(0, (sgn.y - roadTop) / denom));
      const x = projectX(sgn.x + sgn.w / 2, t);
      const y = yAt(t);
      const s = 0.35 + 1.15 * Math.pow(t, 1.2);
      renderables.push({ type: 'sign', t, x, y, s, ref: sgn });
    }
    if (isNeonTheme() && holoAds.length) {
      for (const ad of holoAds) {
        const t = Math.min(1, Math.max(0, (ad.y - roadTop) / denom));
        const x = projectX(ad.x + ad.w / 2, t);
        const y = yAt(t);
        const s = 0.35 + 1.15 * Math.pow(t, 1.2);
        renderables.push({ type: 'holo', t, x, y, s, ref: ad });
      }
    }
    for (const rk of rocks) {
      const t = Math.min(1, Math.max(0, (rk.y - roadTop) / denom));
      const x = projectX(rk.x + rk.w / 2, t);
      const y = yAt(t);
      const s = 0.35 + 1.15 * Math.pow(t, 1.2);
      renderables.push({ type: 'rock', t, x, y, s, ref: rk });
    }
    // Buissons/fleurs: décimation par perfScale
    {
      const stepF = Math.max(1, Math.round(1 / Math.max(0.65, perfScale)));
      for (let i = 0; i < flowers.length; i += stepF) {
        const fl = flowers[i];
        const t = Math.min(1, Math.max(0, (fl.y - roadTop) / denom));
        const x = projectX(fl.x + fl.w / 2, t);
        const y = yAt(t);
        const s = 0.35 + 1.15 * Math.pow(t, 1.2);
        renderables.push({ type: 'flower', t, x, y, s, ref: fl });
      }
    }
    if (isNeonTheme() && drones.length) {
      for (const d of drones) {
        const t = Math.min(1, Math.max(0, (d.y - roadTop) / denom));
        const x = projectX(d.x + d.w / 2, t);
        const y = yAt(t);
        const s = 0.35 + 1.15 * Math.pow(t, 1.2);
        renderables.push({ type: 'drone', t, x, y, s, ref: d });
      }
    }
    for (const ob of obstacles) {
      const t = Math.min(1, Math.max(0, ((ob.y + ob.h * 0.5) - roadTop) / denom));
      const x = projectX(ob.x + ob.w / 2, t);
      const y = yAt(t);
      const s = 0.4 + 2.0 * Math.pow(t, 1.35);
      renderables.push({ type: 'ob', t, x, y, s, ref: ob });
    }
    if (npcEnabled) {
      for (const n of npcs) {
        const t = Math.min(1, Math.max(0, ((n.y + n.h * 0.5) - roadTop) / denom));
        const x = projectX(n.x + n.w / 2, t);
        const y = yAt(t);
        const s = 0.4 + 2.0 * Math.pow(t, 1.35);
        renderables.push({ type: 'npc', t, x, y, s, ref: n });
      }
    }
    // Trier du plus loin au plus proche
    renderables.sort((a, b) => a.t - b.t);

    // Ombres et entités
    for (const it of renderables) {
      const { t, x, y, s } = it;
      const w = (it.ref.w || 40) * s;
      const h = (it.ref.h || 70) * s;
      // ombre au sol
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.48, w * 0.55, h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // corps
      if (it.type === 'palm') {
        drawPalmProjected(it.ref, x, y, s);
      } else if (it.type === 'sign') {
        drawSignProjected(it.ref, x, y, s);
      } else if (it.type === 'holo') {
        drawHoloAdProjected(it.ref, x, y, s);
      } else if (it.type === 'rock') {
        drawRockProjected(it.ref, x, y, s);
      } else if (it.type === 'flower') {
        drawFlowerProjected(it.ref, x, y, s);
      } else if (it.type === 'drone') {
        drawDroneProjected(it.ref, x, y, s);
      } else if (it.type === 'npc') {
        drawNPCProjected(it.ref, x, y, s);
      } else {
        drawObstacleProjected(it.ref, x, y, s);
      }
    }

    ctx.restore();
  }

  function draw() {
    if (state.threeD) { drawChase3D(); return; }
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
      drawStars(roadTop);
      drawSearchlights(roadTop);
      // Holo-ads hautes (pylônes) dans le ciel
      if (holoAds.length) {
        for (const ad of holoAds) { if (ad.high) drawHoloAd(ad); }
      }
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
    drawNeonPillars(roadLeft, roadRight, roadTop, roadBottom);
    drawGroundNeonStrips(roadLeft, roadRight, roadTop, roadBottom);
    drawFogBands(roadLeft, roadRight, roadTop, roadBottom);
    drawWetReflections(roadLeft, roadRight, roadTop, roadBottom);

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

    // Holo-pubs et Drones (Néon)
    if (isNeonTheme()) {
      for (const ad of holoAds) drawHoloAd(ad);
      for (const d of drones) drawDrone(d);
    }

    // NPCs trafic (avant les obstacles)
    for (const n of npcs) {
      drawNPC(n);
    }

    // rochers décoratifs
    for (const rk of rocks) {
      drawRock(rk);
    }

    // fleurs décoratives (décimation Auto Perf)
    {
      const stepF = Math.max(1, Math.round(1 / Math.max(0.65, perfScale)));
      for (let i = 0; i < flowers.length; i += stepF) {
        drawFlower(flowers[i]);
      }
    }

    // obstacles (stylisés cyberpunk)
    for (const ob of obstacles) {
      drawObstacle(ob);
    }

    // powerups visuels
    for (const p of powerups) {
      drawPowerup(p);
    }

    // bullets (2D)
    for (const b of bullets) {
      drawBullet2D(b);
    }

    // particules + shards d'explosion
    drawParticles(ctx);
    drawShards(ctx);

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

    // voiture (cachée en vue 3D subjective)
    if (!state.exploding && !state.threeD) {
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

      if (state.vehicle === 'ship') drawPlayerShip2D();
      else drawCarSprite();

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

    // Arcs néon (pluie forte)
    drawNeonArcs();
    // Pluie (au-dessus de tout)
    if (isNeonTheme() && rainEnabled && raindrops.length) {
      drawRain();
    }
    // Blackout event overlay (phares renforcés)
    if (state.blackout) {
      drawBlackoutOverlay();
    }
    // Overlays méga explosion (flash/glitch/shockwave glow)
    drawExplosionOverlays();

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
    applyChromaticAberration();
    applyFilmGrain();
    // Camera lens raindrops overlay (screen-space)
    drawCameraDrops();
    // Perf HUD
    drawPerfHud();
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
    // Auto-Perf update
    const fpsNow = dt > 0 ? (1 / dt) : 60;
    updateAutoPerf(fpsNow);
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
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    } else {
      ctx.fill();
    }
  }
  // Path-only variant for stroking rounded rectangles
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
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
  // Retourne le polygone de la voiture (rectangle incliné)
  function getCarPolygon() {
    const cx = car.x + car.w / 2;
    const cy = car.y + car.h / 2;
    const hw = car.w / 2;
    const hh = car.h / 2;
    const ang = car.tilt || 0;
    const c = Math.cos(ang), s = Math.sin(ang);
    const corners = [
      { x: -hw, y: -hh },
      { x:  hw, y: -hh },
      { x:  hw, y:  hh },
      { x: -hw, y:  hh },
    ].map(p => ({ x: cx + p.x * c - p.y * s, y: cy + p.x * s + p.y * c }));
    return corners;
  }
  function carCollidesWithRect(r) {
    const carPoly = getCarPolygon();
    // pré-vérification AABB
    const aabb = polyBounds(carPoly);
    // hitbox forgiveness: dégonfle légèrement la cible
    const fudge = 2 * DPR;
    const rr = { x: r.x + fudge, y: r.y + fudge, w: Math.max(0, r.w - 2 * fudge), h: Math.max(0, r.h - 2 * fudge) };
    if (!rectsOverlap(aabb, rr)) return false;
    const rectPoly = rectToPolygon(rr);
    return polygonsOverlapSAT(carPoly, rectPoly);
  }

  function drawCarSprite() {
    const cx = car.x + car.w / 2;
    const cy = car.y + car.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(car.tilt);
    // compute structural size from model + cosmetics
    let w = car.w, h = car.h;
    const body = (state.cosmetics?.bodyStyle || 'stock');
    let wMul = 1, hMul = 1;
    if (body === 'sport') { wMul = 1.05; hMul = 0.92; }
    else if (body === 'wide') { wMul = 1.18; hMul = 1.02; }
    else if (body === 'slim') { wMul = 0.86; hMul = 1.06; }
    else if (body === 'suv') { wMul = 1.06; hMul = 1.18; }
    const model = getCarModelParams();
    w *= wMul * (model.wMul || 1);
    h *= hMul * (model.hMul || 1);
    // vector render base body
    drawPlayerCarVector(w, h, car.color);
    // per-skin decorative patterns
    const skin = selectedSkin;
    if (skin === 'mint' || skin === 'blue') {
      // double center stripes
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const stripeW = Math.max(4 * DPR, w * 0.032);
      ctx.fillRect(-stripeW * 1.5, -h / 2, stripeW, h);
      ctx.fillRect(stripeW * 0.5, -h / 2, stripeW, h);
      ctx.restore();
    } else if (skin === 'red') {
      // single wide stripe
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(-w * 0.06, -h / 2, w * 0.12, h);
      ctx.restore();
    } else if (skin === 'urban_taxi') {
      // taxi checkers band on sides
      ctx.save();
      const bandY = h * 0.1;
      ctx.fillStyle = '#111';
      ctx.fillRect(-w * 0.44, bandY, w * 0.88, h * 0.06);
      ctx.fillStyle = '#ffd166';
      const sz = Math.max(3 * DPR, w * 0.035);
      for (let i = -Math.floor(w * 0.44 / sz); i < Math.floor(w * 0.44 / sz); i++) {
        if (i % 2 === 0) ctx.fillRect(i * sz, bandY, sz, h * 0.06);
      }
      ctx.restore();
    } else if (skin === 'vaporwave') {
      // neon gradients along sides
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      grad.addColorStop(0, 'rgba(255,79,216,0.5)');
      grad.addColorStop(1, 'rgba(0,208,255,0.5)');
      ctx.fillStyle = grad;
      roundRect(ctx, -w * 0.46, -h * 0.04, w * 0.92, h * 0.08, 3 * DPR, grad);
      ctx.restore();
    } else if (skin === 'hyper') {
      // aggressive angular stripes
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(0,230,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, -h * 0.15);
      ctx.lineTo(-w * 0.12, -h * 0.35);
      ctx.lineTo(-w * 0.02, -h * 0.35);
      ctx.lineTo(-w * 0.30, -h * 0.15);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.42, -h * 0.05);
      ctx.lineTo(w * 0.10, h * 0.20);
      ctx.lineTo(w * 0.02, h * 0.20);
      ctx.lineTo(w * 0.30, -h * 0.05);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (skin === 'micro') {
      // playful dots band
      ctx.save();
      const bandY = -h * 0.05;
      const bandH = h * 0.10;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      roundRect(ctx, -w * 0.36, bandY, w * 0.72, bandH, 4 * DPR, ctx.fillStyle);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      const step = Math.max(6 * DPR, w * 0.08);
      for (let x0 = -w * 0.32; x0 <= w * 0.32; x0 += step) {
        ctx.beginPath(); ctx.arc(x0, bandY + bandH / 2, Math.max(2 * DPR, step * 0.18), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
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
    spawnShards(cx, cy);
    // tremblement
    shakeDuration = 0.75;
    shakeIntensity = 22 * DPR;
    shakeTime = shakeDuration;
    // onde de choc
    shockwave = { x: cx, y: cy, r: 10 * DPR, alpha: 0.7 };
    playExplosionSound();
    // Mega FX kickoff
    megaFX = { flash: 0.85, glitch: 0.5, glow: 1.0 };
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

    // shards update (lighter gravity, spin)
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.vx *= 0.99; s.vy = s.vy * 0.99 + gravity * 0.35 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.rotSpeed * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y > canvas.height + 80 * DPR) shards.splice(i, 1);
    }

    // mega FX decay
    if (megaFX) {
      megaFX.flash *= Math.pow(0.0001, dt / 0.6); // fast decay
      megaFX.glitch *= Math.pow(0.0001, dt / 0.9);
      if (megaFX.flash < 0.02 && megaFX.glitch < 0.02) megaFX = null;
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
    // Fire blaster if available
    if (e.code === 'Space') {
      if (state.running && !state.exploding) {
        inputs.shoot = true;
        tryFire();
        e.preventDefault();
        return;
      }
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputs.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputs.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputs.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') inputs.down = true;
    if (e.key === 'h' || e.key === 'H') playerHorn();
    if (e.key === 'i' || e.key === 'I') toggleThreeD();
    if (!state.running && !state.gameOver && (e.key === ' ' || e.key === 'Enter')) startGame();
    if (state.gameOver && (e.key === ' ' || e.key === 'Enter')) startGame();
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') { inputs.shoot = false; e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputs.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputs.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputs.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') inputs.down = false;
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
    const v = parseFloat(e.target.value);
    musicUserVol = isNaN(v) ? musicUserVol : v;
    if (musicGain) musicGain.gain.value = musicUserVol;
  });
  if (sfxVolEl) sfxVolEl.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    sfxUserVol = isNaN(v) ? sfxUserVol : v;
    if (sfxGain) sfxGain.gain.value = sfxUserVol;
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
    if (!isSkinUnlocked(selectedSkin)) selectedSkin = 'scout';
    applySkin(selectedSkin);
  } catch {}
  // Daily challenges
  ensureDaily();
  // Start at menu with Garage open (instead of ship selection)
  try {
    overlay.style.display = 'grid';
    overlay.style.pointerEvents = 'auto';
    overlay.setAttribute('aria-hidden', 'false');
    menuPanel.classList.remove('hidden');
    gameoverPanel.classList.add('hidden');
    openGarage();
  } catch {}

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
    if (e.key === 'v' || e.key === 'V') {
      const next = state.visualMode === 'cinematic' ? 'competitive' : 'cinematic';
      setVisualMode(next);
    }
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
    if (r < 0.40) type = 'coin';
    else if (r < 0.58) type = 'slow';
    else if (r < 0.72) type = 'magnet';
    else if (r < 0.82) type = 'ghost';
    else if (r < 0.92) type = 'blaster';
    else type = 'double';
    const w = 32 * DPR, h = 32 * DPR;
    const x = rand(roadLeft + w, roadRight - w);
    const y = -h - 20 * DPR;
    const vy = world.baseSpeed * 0.7;
    const colors = { shield: '#4f8cff', slow: '#ffd166', magnet: '#ff7bf3', ghost: '#41e0c9', double: '#ffae42', coin: '#ffcc33', blaster: '#ff9f40' };
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
    } else if (type === 'blaster') {
      const add = 10 + ((Math.random() < 0.25) ? 5 : 0); // 10 or 15 ammo
      state.blasterAmmo = Math.min(99, (state.blasterAmmo || 0) + add);
      showToast(`Blaster +${add} (ammo: ${state.blasterAmmo})`, 'success');
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
