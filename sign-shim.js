// Global shim for sign factories/renderers so strict IIFEs can access identifiers
// Define with 'var' to create real global bindings (not only window properties)
var makeSign = window.makeSign || function(roadLeft, roadRight, side) {
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var w = 70 * DPR;
  var h = 26 * DPR;
  var poleH = 16 * DPR;
  var y = -poleH - h - 10 * DPR;
  // Reasonable speed independent of internal world/baseSpeed
  var vy = 160; // px/s nominal, script multiplies by dt * DPR
  var palette = ['#a374ff', '#4ad2ff', '#ffd166', '#ff7bf3', '#e6e7ff'];
  var color = palette[(Math.random() * palette.length) | 0];
  var texts = ['MOTEL', 'PALMS', 'CAFE', 'CITY', 'GAS'];
  var txt = texts[(Math.random() * texts.length) | 0];
  var margin = 12 * DPR;
  var x = side === 'left' ? (roadLeft - margin - w) : (roadRight + margin);
  return { x: x, y: y, w: w, h: h, poleH: poleH, vy: vy, side: side, color: color, txt: txt, pulse: Math.random() * Math.PI * 2 };
};
// export
window.makeSign = makeSign;
// ensure export on window
window.makeSign = makeSign;

var drawSign = window.drawSign || function(s) {
  var canvas = document.getElementById('game');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
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
  ctx.save();
  // pole
  ctx.fillStyle = '#4b4b56';
  var poleX = s.side === 'left' ? s.x + s.w * 0.85 : s.x + s.w * 0.15;
  ctx.fillRect(poleX - 2 * DPR, s.y, 4 * DPR, s.poleH + s.h);
  // panel glow
  var pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300 + (s.pulse || 0));
  ctx.fillStyle = s.color || '#e6e7ff';
  ctx.globalAlpha = 0.15 + 0.2 * pulse;
  ctx.fillRect(s.x - 4 * DPR, s.y + s.poleH - 4 * DPR, s.w + 8 * DPR, s.h + 8 * DPR);
  ctx.globalAlpha = 1;
  // panel body
  roundRect(ctx, s.x, s.y + s.poleH, s.w, s.h, 4 * DPR, 'rgba(14,14,24,0.95)');
  // text
  ctx.fillStyle = s.color || '#e6e7ff';
  ctx.font = Math.floor(10 * DPR) + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((s.txt || 'MOTEL'), s.x + s.w / 2, s.y + s.poleH + s.h / 2);
  ctx.restore();
};
// export
window.drawSign = drawSign;
