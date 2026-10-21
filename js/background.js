var MR = MR || {};

// Parallax underwater scenery, back to front:
//   water + drifting "sky" patterns -> distant scenery -> swaying kelp and
//   rising bubbles. Colours and styles come from a theme in MR.Themes.
//   (The seabed is a solid and is drawn by MR.Art.drawSolid.)
MR.Background = (function () {
  var W = 960, H = 540;
  var FLOWER_SPAN = 1500, FAR_SPAN = 3400, KELP_SPAN = 5400;

  function rng(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }
  function pick(r, list) { return list[Math.floor(r() * list.length)]; }
  function mod(a, n) { return ((a % n) + n) % n; }

  var r = rng(20261015);
  var i, x;

  var flowers = [];
  for (i = 0; i < 12; i++) {
    flowers.push({
      x: r() * FLOWER_SPAN, y: 70 + r() * 220, size: 16 + r() * 22,
      petals: 5 + Math.floor(r() * 2), spin: (r() - 0.5) * 0.01,
      color: pick(r, ['#ffffff', '#fff6a8', '#ffd1f0', '#d4fff6'])
    });
  }

  var far = [];
  for (x = 0; x < FAR_SPAN; x += 140 + r() * 170) {
    var tubes = [];
    var n = 2 + Math.floor(r() * 3);
    for (i = 0; i < n; i++) tubes.push(50 + r() * 110);
    far.push({
      x: x, kind: r() < 0.55 ? 'rock' : 'tube',
      w: 120 + r() * 170, h: 60 + r() * 120, tubes: tubes,
      color: pick(r, ['#78bcc9', '#86c7c0', '#8bb5d4']),
      tubeColor: pick(r, ['#f3a9c8', '#f8c58c', '#c9b0f0', '#9fe0b4'])
    });
  }

  var kelp = [];
  for (x = 0; x < KELP_SPAN; x += 90 + r() * 190) {
    kelp.push({ x: x, h: 140 + r() * 210, phase: r() * 6, color: pick(r, ['#3fae6a', '#2f9a5c', '#57c27a']) });
  }

  var kelp2 = [];
  for (x = 40; x < KELP_SPAN; x += 70 + r() * 120) {
    kelp2.push({ x: x, h: 200 + r() * 220, phase: r() * 6, color: 0 });
  }

  var specks = [];
  for (i = 0; i < 60; i++) {
    specks.push({ x: r() * 1400, y: 50 + r() * 420, r: 1 + r() * 2.2, phase: r() * 6, drift: 0.05 + r() * 0.15 });
  }

  var bubbles = [];
  for (i = 0; i < 26; i++) {
    bubbles.push({ x: r() * W, speed: 0.4 + r() * 0.8, r: 2 + r() * 5, phase: r() * 600 });
  }

  function draw(ctx, camX, t, theme) {
    theme = theme || MR.Themes.coral;
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.water[0]);
    g.addColorStop(0.5, theme.water[1]);
    g.addColorStop(1, theme.water[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Light rays from the surface
    ctx.fillStyle = 'rgba(255,255,255,' + theme.rays + ')';
    for (i = 0; i < 5; i++) {
      var rx = mod(i * 260 - camX * 0.05, 1300) - 170;
      var swing = Math.sin(t * 0.01 + i) * 30;
      ctx.beginPath();
      ctx.moveTo(rx, 0); ctx.lineTo(rx + 70, 0);
      ctx.lineTo(rx + 220 + swing, H); ctx.lineTo(rx + 110 + swing, H);
      ctx.closePath(); ctx.fill();
    }

    // "Sky" patterns
    if (theme.sky === 'flowers') {
      flowers.forEach(function (f) {
        var fx = mod(f.x - camX * 0.1 + t * 0.12, FLOWER_SPAN) - 200;
        if (fx < -60 || fx > W + 60) return;
        drawFlower(ctx, fx, f.y + Math.sin(t * 0.01 + f.x) * 6, f.size, f.petals, f.color, t * f.spin);
      });
    } else if (theme.sky === 'dapples') {
      flowers.forEach(function (f) {
        var fx = mod(f.x - camX * 0.1 + t * 0.08, FLOWER_SPAN) - 200;
        if (fx < -80 || fx > W + 80) return;
        ctx.beginPath();
        ctx.ellipse(fx, f.y + Math.sin(t * 0.012 + f.x) * 8, f.size * 1.6, f.size * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,250,190,' + (0.12 + Math.sin(t * 0.03 + f.x) * 0.05) + ')';
        ctx.fill();
      });
    } else if (theme.sky === 'embers') {
      specks.forEach(function (p) {
        var px = mod(p.x - camX * 0.15 + Math.sin(t * 0.02 + p.phase) * 20, 1400) - 200;
        var py = 480 - mod(p.y + t * (0.3 + p.drift * 2), 440);
        if (px < -10 || px > W + 10) return;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        var rgb = theme.emberColor || ('255,' + (140 + Math.floor(p.phase * 15)) + ',60');
        ctx.fillStyle = 'rgba(' + rgb + ',' + (0.4 + Math.abs(Math.sin(t * 0.05 + p.phase)) * 0.5) + ')';
        ctx.fill();
      });
    } else if (theme.sky === 'plankton') {
      specks.forEach(function (p) {
        var px = mod(p.x - camX * 0.15 + t * p.drift, 1400) - 200;
        if (px < -10 || px > W + 10) return;
        var tw = 0.35 + Math.abs(Math.sin(t * 0.03 + p.phase)) * 0.65;
        ctx.beginPath();
        ctx.arc(px, p.y + Math.sin(t * 0.02 + p.phase) * 6, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(160,255,250,' + tw * 0.8 + ')';
        ctx.fill();
      });
    }

    // Distant scenery
    far.forEach(function (o, idx) {
      var ox = o.x - camX * 0.3;
      if (ox < -320 || ox > W + 40) return;
      var col = theme.farColors[idx % theme.farColors.length];
      if (theme.far === 'castle') {
        // Spiky castle towers with glowing windows
        var th = o.h * 1.8, tw = o.w * 0.35;
        ctx.fillStyle = col;
        ctx.fillRect(ox, 505 - th * 0.55, o.w, th * 0.55);
        [0, o.w - tw].forEach(function (dx, k) {
          var hh = th * (k ? 0.9 : 1);
          ctx.fillRect(ox + dx, 505 - hh, tw, hh);
          ctx.beginPath();
          ctx.moveTo(ox + dx - 6, 505 - hh); ctx.lineTo(ox + dx + tw / 2, 505 - hh - 40); ctx.lineTo(ox + dx + tw + 6, 505 - hh);
          ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 0.5 + Math.sin(t * 0.05 + idx + k) * 0.25;
          ctx.fillStyle = '#ffb347';
          ctx.fillRect(ox + dx + tw / 2 - 5, 505 - hh + 24, 10, 16);
          ctx.globalAlpha = 1;
          ctx.fillStyle = col;
        });
        for (var bt = 0; bt < o.w; bt += 18) ctx.fillRect(ox + bt, 505 - th * 0.55 - 10, 10, 10);
        return;
      }
      if (theme.far === 'volcanoes') {
        // Far-off volcanoes with glowing tops and drifting smoke
        var top = 505 - o.h * 1.4;
        ctx.beginPath();
        ctx.moveTo(ox, 505); ctx.lineTo(ox + o.w * 0.4, top); ctx.lineTo(ox + o.w * 0.6, top); ctx.lineTo(ox + o.w, 505);
        ctx.closePath();
        ctx.fillStyle = col; ctx.fill();
        ctx.globalAlpha = 0.35 + Math.sin(t * 0.03 + idx) * 0.15;
        ctx.beginPath(); ctx.ellipse(ox + o.w / 2, top, o.w * 0.14, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8a3a'; ctx.fill();
        for (var sm = 0; sm < 3; sm++) {
          var k = (t * 0.004 + sm / 3 + idx * 0.1) % 1;
          ctx.globalAlpha = 0.25 * (1 - k);
          ctx.beginPath(); ctx.arc(ox + o.w / 2 + k * 30, top - k * 120, 10 + k * 26, 0, Math.PI * 2);
          ctx.fillStyle = '#6a5a6a'; ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (theme.far === 'kelpwall') {
        o.tubes.forEach(function (th, j) {
          drawKelp(ctx, ox + j * 40, th * 2.4, o.x + j, col, t * 0.7, 10);
        });
        return;
      }
      if (o.kind === 'rock' || theme.far === 'glowcoral') {
        ctx.beginPath();
        ctx.ellipse(ox + o.w / 2, 505, o.w / 2, o.h, 0, Math.PI, 0);
        ctx.fillStyle = col; ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ox + o.w * 0.4, 505 - o.h * 0.65, o.w * 0.18, o.h * 0.12, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
      }
      if (theme.far === 'glowcoral') {
        o.tubes.forEach(function (th, j) {
          drawGlowCoral(ctx, ox + o.w * 0.3 + j * 30, 505 - o.h * 0.4, th * 0.6,
            theme.tubeColors[(idx + j) % theme.tubeColors.length], t + j * 30);
        });
      } else if (o.kind !== 'rock') {
        o.tubes.forEach(function (th, j) {
          drawTube(ctx, ox + j * 26, 505, th, theme.tubeColors[(idx + j) % theme.tubeColors.length], t + j * 20);
        });
      }
    });

    // Kelp (the Kelp Forest has an extra, denser layer)
    if (theme.kelpLayers > 1) {
      kelp2.forEach(function (k, idx) {
        var kx = k.x - camX * 0.45;
        if (kx < -60 || kx > W + 60) return;
        drawKelp(ctx, kx, k.h * theme.kelpHeight, k.phase, theme.farColors[idx % theme.farColors.length], t, 9);
      });
    }
    kelp.forEach(function (k, idx) {
      var kx = k.x - camX * 0.6;
      if (kx < -60 || kx > W + 60) return;
      drawKelp(ctx, kx, k.h * theme.kelpHeight, k.phase, theme.kelpColors[idx % theme.kelpColors.length], t);
    });

    // Rising bubbles
    bubbles.forEach(function (b) {
      var by = 560 - mod(b.phase + t * b.speed, 600);
      var bx = mod(b.x - camX * 0.6, W) + Math.sin(t * 0.05 + b.phase) * 4;
      MR.Art.drawBubble(ctx, bx, by, b.r, 0.55);
    });
  }

  // The bright band at the very top: Man Ray can't swim above it.
  function drawSurface(ctx, t, theme) {
    var alpha = theme ? theme.surface : 0.35;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    for (var sx = W; sx >= 0; sx -= 20) ctx.lineTo(sx, 34 + Math.sin(sx * 0.03 + t * 0.05) * 4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
    ctx.fill();
  }

  // Branching coral that glows in the dark.
  function drawGlowCoral(ctx, x, baseY, h, color, t) {
    var pulse = 0.6 + Math.sin(t * 0.04) * 0.25;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - h);
    ctx.moveTo(x, baseY - h * 0.45); ctx.lineTo(x - h * 0.3, baseY - h * 0.8);
    ctx.moveTo(x, baseY - h * 0.6); ctx.lineTo(x + h * 0.3, baseY - h * 0.95);
    ctx.stroke();
    ctx.fillStyle = color;
    [[x, baseY - h], [x - h * 0.3, baseY - h * 0.8], [x + h * 0.3, baseY - h * 0.95]].forEach(function (p) {
      ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = pulse * 0.25;
    ctx.beginPath(); ctx.arc(x, baseY - h * 0.6, h * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawFlower(ctx, x, y, size, petals, color, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = color;
    for (var p = 0; p < petals; p++) {
      var a = p * (Math.PI * 2 / petals);
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * size * 0.55, Math.sin(a) * size * 0.55, size * 0.45, size * 0.28, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawTube(ctx, x, baseY, h, color, t) {
    var w = 20;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    for (var y = 0; y <= h; y += 10) ctx.lineTo(x + Math.sin(y * 0.06 + t * 0.02) * 3, baseY - y);
    for (y = h; y >= 0; y -= 10) ctx.lineTo(x + w + Math.sin(y * 0.06 + t * 0.02) * 3, baseY - y);
    ctx.closePath();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = color; ctx.fill();
    var topX = x + w / 2 + Math.sin(h * 0.06 + t * 0.02) * 3;
    ctx.beginPath();
    ctx.ellipse(topX, baseY - h, w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40,60,90,0.35)'; ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawKelp(ctx, x, h, phase, color, t, width) {
    var segs = Math.floor(h / 22);
    var pts = [];
    for (var j = 0; j <= segs; j++) {
      pts.push([x + Math.sin(t * 0.03 + phase + j * 0.5) * j * 1.6, 520 - j * 22]);
    }
    ctx.strokeStyle = color; ctx.lineWidth = width || 7; ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach(function (p, k) { if (k === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
    ctx.stroke();
    ctx.fillStyle = color;
    for (j = 2; j < pts.length; j += 2) {
      var side = j % 4 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(pts[j][0] + side * 10, pts[j][1], 12, 5, side * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return { draw: draw, drawSurface: drawSurface };
})();
