var MR = MR || {};

// ALL character and object drawing lives here.
// To swap in a hand-drawn picture, replace the body of one function with
// ctx.drawImage(...) — callers always pass the same arguments.
MR.Art = (function () {
  var OUTLINE = '#1d2b4a';
  var FONT = '"Arial Rounded MT Bold", "Trebuchet MS", "Comic Sans MS", sans-serif';
  var ROUNDED = '"Arial Rounded MT Bold"';
  var hasRounded = null;

  // The canvas font for text of this size. "Arial Rounded MT Bold" is
  // already bold, so it's used as-is (asking for bold on top makes the
  // browser fake-bold it and smear the letters). Computers without it get
  // bold Trebuchet MS instead.
  function font(size) {
    if (hasRounded === null) hasRounded = fontInstalled(ROUNDED);
    return hasRounded ? size + 'px ' + FONT : 'bold ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  }

  // True if the named font is on this computer (it measures differently
  // from the monospace fallback).
  function fontInstalled(name) {
    try {
      var c = document.createElement('canvas').getContext('2d');
      var sample = 'mmmmwwwwlliiAB';
      c.font = '30px monospace';
      var plain = c.measureText(sample).width;
      c.font = '30px ' + name + ', monospace';
      return c.measureText(sample).width !== plain;
    } catch (e) {
      return false;
    }
  }
  var TAU = Math.PI * 2;

  // ---------- small helpers ----------

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
  }

  function ellipse(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  }

  function outline(ctx, fill, width) {
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = width || 3;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }

  function hash(n) {
    var x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function sparkle(ctx, x, y, size, color) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x, y, x + size, y);
    ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y);
    ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.fillStyle = color || '#ffffff';
    ctx.fill();
  }

  // ---------- Man Ray ----------
  // Based on Ben's drawing (art/ben-man-ray.png): blue body with a red
  // six-pack, flat red head with two horns, big red finned arms with fists,
  // blue legs with L-shaped feet, and a red lightning bolt.

  var MR_RED = '#ec4a2a', MR_RED_LINE = '#5a1f14';
  var MR_BLUE = '#2b86e0', MR_BLUE_DARK = '#123a7a', MR_BLUE_LIGHT = '#79bdf7';

  // Red parts get Ben's blue marker halo and a dark inner line.
  function redShape(ctx) {
    ctx.lineWidth = 7; ctx.strokeStyle = MR_BLUE; ctx.stroke();
    ctx.fillStyle = MR_RED; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = MR_RED_LINE; ctx.stroke();
  }

  function blueShape(ctx) {
    ctx.fillStyle = MR_BLUE; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = MR_BLUE_DARK; ctx.stroke();
  }

  // One fin-arm, pointing along +x from the shoulder, ending in a fist.
  function drawFinArm(ctx) {
    ctx.save();
    ctx.scale(1.15, 1.25);
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, -8); ctx.lineTo(9, -17); ctx.lineTo(13, -8);
    ctx.lineTo(17, -18); ctx.lineTo(21, -8);
    ctx.lineTo(25, -16); ctx.lineTo(29, -7);
    ctx.lineTo(34, -7); ctx.lineTo(34, 7);
    ctx.quadraticCurveTo(16, 11, 0, 8);
    ctx.closePath();
    redShape(ctx);
    circle(ctx, 40, 0, 9.5);
    redShape(ctx);
    ctx.strokeStyle = MR_RED_LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(5, 1); ctx.quadraticCurveTo(16, -4, 28, 1); ctx.stroke();
    ctx.beginPath(); ctx.arc(44, -3, 3, -0.5 * Math.PI, 0.5 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(44, 3.5, 3, -0.5 * Math.PI, 0.5 * Math.PI); ctx.stroke();
    ctx.restore();
  }

  // One leg from the hip, foot pointing outward (side = 1 or -1).
  function drawLeg(ctx, hipX, side, kick) {
    ctx.save();
    ctx.translate(hipX, 0);
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(-5, 8); ctx.lineTo(5, 8);
    ctx.lineTo(5 + kick, 26); ctx.lineTo(17 + kick, 26);
    ctx.quadraticCurveTo(19 + kick, 29, 17 + kick, 32);
    ctx.lineTo(-5 + kick, 32);
    ctx.closePath();
    blueShape(ctx);
    ctx.strokeStyle = MR_BLUE_LIGHT; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-1, 11); ctx.lineTo(-1 + kick * 0.8, 24); ctx.stroke();
    ctx.restore();
  }

  // Man Ray's laser blaster, pointing +x, with its muzzle at (mx, my).
  // Drawn in front of his fist, which grips the back end. firing: flash.
  function drawBlaster(ctx, mx, my, frame, firing) {
    // Tail fins
    ctx.beginPath();
    ctx.moveTo(mx - 40, my - 5); ctx.lineTo(mx - 47, my - 15); ctx.lineTo(mx - 32, my - 7); ctx.closePath();
    outline(ctx, '#3cc0e8', 2);
    ctx.beginPath();
    ctx.moveTo(mx - 40, my + 5); ctx.lineTo(mx - 47, my + 14); ctx.lineTo(mx - 32, my + 7); ctx.closePath();
    outline(ctx, '#3cc0e8', 2);
    // Body with a yellow stripe and a glowing power orb
    roundRect(ctx, mx - 42, my - 8, 34, 16, 8);
    outline(ctx, '#d6deea', 3);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(mx - 26, my - 7, 5, 14);
    circle(ctx, mx - 34, my, 3.6);
    ctx.fillStyle = Math.floor(frame / 10) % 2 ? '#ff6fd0' : '#ffb3ea'; ctx.fill();
    // Barrel and muzzle ring
    roundRect(ctx, mx - 11, my - 4.5, 11, 9, 2);
    outline(ctx, '#6c7a94', 2.5);
    circle(ctx, mx, my, 4.5);
    outline(ctx, '#ff6fd0', 2.5);
    if (firing) {
      ctx.fillStyle = 'rgba(255,111,208,0.45)';
      circle(ctx, mx + 5, my, 12); ctx.fill();
      sparkle(ctx, mx + 7, my, 10, '#ffffff');
    }
  }

  // x, y = centre of his body. facing = 1 (right) or -1 (left).
  // opts: { flapAnim, onGround, scale, firing,
  //         rocket (holds the launcher), rocketFiring, hat (wears the
  //         cowboy hat), punch (0..1: how far the boxing glove is out) }
  function drawManRay(ctx, x, y, facing, frame, opts) {
    opts = opts || {};
    var s = opts.scale || 1;
    // His arms are his stingray fins: they sweep down on each flap.
    var wing = opts.flapAnim ? Math.sin((opts.flapAnim / 14) * Math.PI) * 0.6 : Math.sin(frame * 0.08) * 0.1;
    var kick = opts.onGround ? 0 : Math.sin(frame * 0.15) * 3;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing * s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Lightning bolt, flickering
    if (Math.floor(frame / 8) % 5 !== 0) {
      ctx.beginPath();
      ctx.moveTo(-34, -50); ctx.lineTo(-24, -58); ctx.lineTo(-26, -49); ctx.lineTo(-15, -56);
      ctx.lineWidth = 6; ctx.strokeStyle = MR_RED_LINE; ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = MR_RED; ctx.stroke();
    }

    var rc = MR.Player ? MR.Player.C : { ROCKET_X: 34, ROCKET_Y: 20 };
    ctx.save();
    ctx.translate(-17, -12);
    if (opts.rocket) {
      // Other arm lowered behind him (his fist holds the launcher in front)
      ctx.scale(-1, 1);
      ctx.rotate(0.6 + wing * 0.2);
    } else {
      // Back arm, flexed up a little
      ctx.scale(-1, 1);
      ctx.rotate(-0.3 + wing);
    }
    drawFinArm(ctx);
    ctx.restore();

    drawLeg(ctx, -9, -1, -kick);
    drawLeg(ctx, 9, 1, kick);

    // Body
    ctx.beginPath();
    ctx.moveTo(-21, -24); ctx.lineTo(21, -24);
    ctx.quadraticCurveTo(20, -6, 16, 10);
    ctx.lineTo(-16, 10);
    ctx.quadraticCurveTo(-20, -6, -21, -24);
    ctx.closePath();
    blueShape(ctx);
    ctx.strokeStyle = MR_BLUE_LIGHT; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-15, -20); ctx.lineTo(12, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-14, 4); ctx.lineTo(-11, -14); ctx.stroke();
    ctx.strokeStyle = MR_BLUE_DARK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-16, 8); ctx.lineTo(16, 8); ctx.stroke();

    // Six-pack
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 2; col++) {
        roundRect(ctx, col ? 1 : -9.5, -17 + row * 8, 8.5, 7, 2);
        ctx.fillStyle = MR_RED; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = MR_RED_LINE; ctx.stroke();
      }
    }

    // Head: two horns on a flat red head
    roundRect(ctx, -12, -46, 7, 16, 3);
    redShape(ctx);
    roundRect(ctx, 5, -48, 8, 18, 3);
    redShape(ctx);
    roundRect(ctx, -22, -34, 44, 11, 5);
    redShape(ctx);
    ctx.fillStyle = MR_RED_LINE;
    ellipse(ctx, 3, -28.5, 3.2, 2.6); ctx.fill();
    ellipse(ctx, 13, -28.5, 3.2, 2.6); ctx.fill();
    ctx.fillStyle = '#ffffff';
    circle(ctx, 4, -29.5, 1); ctx.fill();
    circle(ctx, 14, -29.5, 1); ctx.fill();
    if (opts.hat) drawCowboyHat(ctx);


    // Laser blaster, muzzle at the same spot the game fires bolts from,
    // held in his front fist (which only flaps a little, to keep aim).
    var gun = MR.Player ? MR.Player.C : { GUN_X: 92, GUN_Y: 6 };
    var mx = gun.GUN_X, my = gun.GUN_Y + wing * 4;
    var fistX = mx - 34, fistY = my + 4;
    ctx.save();
    ctx.translate(17, -12);
    ctx.rotate(Math.atan2(fistY + 12, fistX - 17));
    drawFinArm(ctx);
    ctx.restore();
    drawBlaster(ctx, mx, my, frame, opts.firing);

    // Rocket Launcher, held across his chest like a bazooka, with his other
    // fist gripping the back end
    if (opts.rocket) {
      var rs = rc.ROCKET_SCALE || 0.8;
      ctx.save();
      ctx.translate(rc.ROCKET_X - 32 * rs, rc.ROCKET_Y);
      ctx.scale(rs, rs);
      drawRocketLauncher(ctx, opts.rocketFiring, 86);
      ctx.restore();
      var gx = rc.ROCKET_X - 32 * rs - 72 * rs, gy = rc.ROCKET_Y + 7;
      circle(ctx, gx, gy, 7.5);
      redShape(ctx);
      ctx.beginPath(); ctx.arc(gx + 3, gy - 1, 3, -0.5 * Math.PI, 0.5 * Math.PI);
      ctx.lineWidth = 1.5; ctx.strokeStyle = MR_RED_LINE; ctx.stroke();
    }
    if (opts.punch !== undefined) drawPunchGlove(ctx, opts.punch);

    ctx.restore();
  }

  // ---------- Enemies ----------

  function drawZillaFish(ctx, x, y, facing, frame, flash) {
    var c = function (col) { return flash ? '#ffffff' : col; };
    var wag = Math.sin(frame * 0.2) * 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    // Tail fin
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-38, -14 + wag);
    ctx.quadraticCurveTo(-31, 0, -38, 14 + wag);
    ctx.closePath();
    outline(ctx, c('#3e9e2c'));

    // Dragon spikes
    for (var i = 0; i < 4; i++) {
      var sx = -13 + i * 8;
      ctx.beginPath();
      ctx.moveTo(sx - 5, -10);
      ctx.lineTo(sx, -25 + (i % 2) * 4);
      ctx.lineTo(sx + 5, -10);
      ctx.closePath();
      outline(ctx, c('#ff8a2a'), 2.5);
    }

    // Body
    ellipse(ctx, 0, 0, 25, 15);
    outline(ctx, c('#5cc83c'));
    ctx.beginPath();
    ctx.ellipse(2, 4, 19, 8, 0, 0, Math.PI);
    ctx.fillStyle = c('#c9f27a'); ctx.fill();
    ctx.strokeStyle = c('#3e9e2c'); ctx.lineWidth = 1.5;
    for (var j = 0; j < 3; j++) {
      ctx.beginPath(); ctx.arc(-10 + j * 7, -2, 4, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    }

    // Side fin
    ctx.beginPath();
    ctx.moveTo(-2, 2);
    ctx.quadraticCurveTo(-12, 10 + wag * 0.5, -3, 13);
    ctx.closePath();
    outline(ctx, c('#3e9e2c'), 2);

    // Horn
    ctx.beginPath();
    ctx.moveTo(11, -11); ctx.lineTo(18, -23); ctx.lineTo(19, -9); ctx.closePath();
    outline(ctx, c('#fff3c4'), 2);

    // Angry eye
    circle(ctx, 12, -3, 5.5);
    outline(ctx, '#ffffff', 2);
    circle(ctx, 13.5, -2.5, 2.6);
    ctx.fillStyle = OUTLINE; ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, -11); ctx.lineTo(18, -6);
    ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.stroke();

    // Toothy grin
    ctx.beginPath(); ctx.moveTo(15, 7); ctx.lineTo(25, 3);
    ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(17, 6.3); ctx.lineTo(19, 10); ctx.lineTo(20.5, 5.2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(21.5, 4.8); ctx.lineTo(23, 8); ctx.lineTo(24.5, 3.6); ctx.closePath(); ctx.fill();

    ctx.restore();
  }

  function drawZillaCrab(ctx, x, y, facing, frame, flash, damaged) {
    var c = function (col) { return flash ? '#ffffff' : col; };
    var step = Math.sin(frame * 0.3);
    var snap = (Math.sin(frame * 0.1) + 1) * 0.15;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.lineCap = 'round';

    // Legs
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.5;
    for (var i = 0; i < 3; i++) {
      var off = (i % 2 ? 1 : -1) * step * 3;
      ctx.beginPath(); ctx.moveTo(-8 - i * 5, 8); ctx.lineTo(-16 - i * 5 + off, 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8 + i * 5, 8); ctx.lineTo(16 + i * 5 - off, 16); ctx.stroke();
    }

    // Claws
    drawClaw(ctx, 30, -6, snap, c);
    ctx.save(); ctx.scale(-1, 1); drawClaw(ctx, 30, -6, snap, c); ctx.restore();

    // Back spikes
    for (var k = 0; k < 5; k++) {
      var a = Math.PI + (k + 0.5) * (Math.PI / 5);
      var bx = Math.cos(a) * 22, by = 4 + Math.sin(a) * 14;
      ctx.beginPath();
      ctx.moveTo(bx - 4, by + 2);
      ctx.lineTo(Math.cos(a) * 30, 4 + Math.sin(a) * 23);
      ctx.lineTo(bx + 4, by + 2);
      ctx.closePath();
      outline(ctx, c('#9b59d0'), 2);
    }

    // Shell
    ctx.beginPath();
    ctx.ellipse(0, 6, 24, 16, 0, Math.PI, 0);
    ctx.quadraticCurveTo(0, 16, -24, 6);
    ctx.closePath();
    outline(ctx, c('#e8483b'));
    ctx.fillStyle = c('#ff8a7a');
    circle(ctx, -9, -2, 3); ctx.fill();
    circle(ctx, 4, -5, 2.5); ctx.fill();

    // Eye stalks
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(4, -17); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(14, -15); ctx.stroke();
    circle(ctx, 4, -19, 4.5); outline(ctx, '#ffffff', 2);
    circle(ctx, 14, -17, 4.5); outline(ctx, '#ffffff', 2);
    ctx.fillStyle = OUTLINE;
    circle(ctx, 5.5, -18.5, 2); ctx.fill();
    circle(ctx, 15.5, -16.5, 2); ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-1, -26); ctx.lineTo(8, -22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -23); ctx.lineTo(19, -22); ctx.stroke();

    // Grumpy mouth
    ctx.beginPath(); ctx.arc(12, 6, 4, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.lineWidth = 2; ctx.stroke();

    // Bandage after the first zap
    if (damaged) {
      ctx.save();
      ctx.translate(-8, -4);
      ctx.rotate(-0.5);
      roundRect(ctx, -9, -3.5, 18, 7, 2);
      outline(ctx, '#fff1d6', 1.5);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawClaw(ctx, x, y, open, c) {
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(18, 2); ctx.lineTo(x - 6, y + 4); ctx.stroke();
    ctx.save();
    ctx.translate(x, y);
    ctx.save(); ctx.rotate(-open);
    ctx.beginPath(); ctx.ellipse(2, -4, 9, 5, 0, 0, TAU);
    outline(ctx, c('#e8483b'), 2.5);
    ctx.restore();
    ctx.save(); ctx.rotate(open);
    ctx.beginPath(); ctx.ellipse(2, 4, 9, 4.5, 0, 0, TAU);
    outline(ctx, c('#e8483b'), 2.5);
    ctx.restore();
    ctx.restore();
  }

  // ---------- 4 Bunny ----------
  // Based on Ben's drawing (art/ben-4-bunny.png): Man Ray's best friend.
  // Round orange head under a little brown top hat, purple-rimmed ears,
  // big eyes, curly whiskers, orange shirt with a pocket and tie, light
  // blue trousers, stick arms and legs with round dark feet.

  var FB_ORANGE = '#f07a1e', FB_LINE = '#4a2a1a', FB_EAR = '#6a4cff', FB_BLUE = '#8fc1e3';

  function fbLine(ctx, x1, y1, x2, y2, w) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = w || 3; ctx.strokeStyle = FB_LINE; ctx.stroke();
  }

  // A stick arm ending in a three-finger hand.
  function fbArm(ctx, sx, sy, hx, hy) {
    fbLine(ctx, sx, sy, hx, hy);
    var a = Math.atan2(hy - sy, hx - sx);
    [-0.6, 0, 0.6].forEach(function (spread) {
      fbLine(ctx, hx, hy, hx + Math.cos(a + spread) * 9, hy + Math.sin(a + spread) * 9, 2.5);
    });
  }

  // A curly spiral whisker ending at (x, y), curling outward (dir = ±1).
  function fbWhisker(ctx, fromX, fromY, x, y, dir) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(x, y);
    for (var i = 0; i <= 24; i++) {
      var a = i * 0.45, r = 9 - i * 0.33;
      ctx.lineTo(x + dir * (Math.cos(a + Math.PI) * r + r), y - Math.sin(a) * r);
    }
    ctx.lineWidth = 2.2; ctx.strokeStyle = FB_LINE; ctx.stroke();
  }

  // x, y = centre of his body. opts: { scale, wave (arm up waving),
  // scared (open mouth), dangle (held up: arms flailing, legs kicking),
  // carrot (holding a carrot) }.
  function drawFourBunny(ctx, x, y, frame, opts) {
    opts = opts || {};
    var s = opts.scale || 1;
    var kick = opts.dangle ? Math.sin(frame * 0.4) * 8 : 0;
    var flail = opts.dangle ? Math.sin(frame * 0.5) * 10 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Legs and round dark feet
    fbLine(ctx, -10, 52, -14 - kick, 82);
    fbLine(ctx, 10, 52, 14 + kick, 82);
    ellipse(ctx, -16 - kick, 87, 9, 7); outline(ctx, '#3b2416', 2);
    ellipse(ctx, 16 + kick, 87, 9, 7); outline(ctx, '#3b2416', 2);

    // Arms
    if (opts.dangle) {
      fbArm(ctx, -22, -4, -46, -30 + flail);
      fbArm(ctx, 22, -4, 46, -30 - flail);
    } else {
      fbArm(ctx, -22, 0, -46, 24);
      if (opts.wave) fbArm(ctx, 22, 0, 46 + Math.sin(frame * 0.2) * 6, -30);
      else fbArm(ctx, 22, 0, 46, 26);
    }
    if (opts.carrot) {
      ctx.save();
      ctx.translate(-50, 22);
      ctx.rotate(-0.5);
      ctx.beginPath(); ctx.moveTo(-5, -10); ctx.quadraticCurveTo(0, 10, 0, 14); ctx.quadraticCurveTo(4, 2, 5, -10); ctx.closePath();
      outline(ctx, '#ff8c1a', 2);
      ellipse(ctx, -2, -14, 2.5, 6, -0.4); outline(ctx, '#4caf50', 1.5);
      ellipse(ctx, 2, -14, 2.5, 6, 0.4); outline(ctx, '#4caf50', 1.5);
      ctx.restore();
    }

    // Body: orange shirt over light blue trousers
    roundRect(ctx, -22, -20, 44, 74, 10);
    ctx.fillStyle = FB_ORANGE; ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = FB_BLUE;
    ctx.fillRect(-24, 20, 48, 36);
    ctx.restore();
    roundRect(ctx, -22, -20, 44, 74, 10);
    ctx.lineWidth = 3; ctx.strokeStyle = FB_LINE; ctx.stroke();
    fbLine(ctx, -22, 20, 22, 20, 2.5);
    ctx.beginPath(); ctx.rect(-15, -8, 9, 12);
    ctx.fillStyle = '#ffe2c4'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = FB_LINE; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -18); ctx.lineTo(7, 10); ctx.lineTo(12, -18);
    ctx.lineWidth = 2; ctx.stroke();

    // Ears (behind the head)
    [[-32, -84, -0.55, 13, 30], [36, -70, 1.05, 10, 21]].forEach(function (e) {
      ellipse(ctx, e[0], e[1], e[3], e[4], e[2]);
      ctx.fillStyle = '#2a2340'; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = FB_EAR; ctx.stroke();
      ctx.save();
      ctx.translate(e[0], e[1]); ctx.rotate(e[2]);
      ctx.strokeStyle = '#120e1e'; ctx.lineWidth = 1.5;
      for (var k = -2; k <= 2; k++) {
        ctx.beginPath(); ctx.moveTo(-e[3] * 0.5, k * e[4] * 0.25); ctx.lineTo(e[3] * 0.5, k * e[4] * 0.25 - 4); ctx.stroke();
      }
      ctx.restore();
    });

    // Head
    circle(ctx, 0, -50, 34);
    ctx.fillStyle = FB_ORANGE; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = FB_LINE; ctx.stroke();

    // Top hat, tilted a little
    ctx.save();
    ctx.translate(2, -82);
    ctx.rotate(0.08);
    ellipse(ctx, 0, 0, 30, 7);
    outline(ctx, '#3b2416', 2);
    roundRect(ctx, -13, -24, 26, 24, 4);
    outline(ctx, '#3b2416', 2);
    ctx.fillStyle = '#6a4cff';
    ctx.fillRect(-13, -6, 26, 4);
    ctx.restore();

    // Face
    [-13, 14].forEach(function (ex) {
      circle(ctx, ex, -56, 9);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = FB_LINE; ctx.stroke();
      circle(ctx, ex + 1, opts.dangle ? -59 : -55, 3.6);
      ctx.fillStyle = FB_LINE; ctx.fill();
    });
    circle(ctx, 0, -42, 4.5);
    ctx.fillStyle = '#3b2416'; ctx.fill();
    if (opts.scared || opts.dangle) {
      ellipse(ctx, 0, -27, 7, 8 + Math.abs(Math.sin(frame * 0.3)) * 2);
      ctx.fillStyle = '#7a2a1a'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = FB_LINE; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, -38, 13, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.lineWidth = 2.5; ctx.strokeStyle = FB_LINE; ctx.stroke();
    }

    // Curly whiskers
    fbWhisker(ctx, -24, -42, -52, -44, -1);
    fbWhisker(ctx, 24, -42, 52, -44, 1);

    ctx.restore();
  }

  // ---------- Gerald (shopkeeper) ----------
  // Based on Ben's drawing (art/ben-gerald.png): a grumpy-looking cowboy
  // with a brown hat, small round white head, big round body in a black coat
  // with a gold star, white shirt with three buttons, belt, blue trousers,
  // stick arms and legs with round black feet. (He holds a pearl pouch.)

  // x, y = centre of his round body. talking: mouth moves.
  function drawGerald(ctx, x, y, frame, opts) {
    opts = opts || {};
    var bob = Math.sin(frame * 0.05) * 2;
    var chat = opts.talking ? Math.abs(Math.sin(frame * 0.3)) * 3 : 0;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    function stick(x1, y1, x2, y2, w) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.lineWidth = w || 5; ctx.strokeStyle = '#111111'; ctx.stroke();
    }

    // Legs and round feet
    stick(-16, 60, -18, 96); stick(16, 60, 18, 96);
    circle(ctx, -22, 100, 9); ctx.fillStyle = '#111111'; ctx.fill();
    circle(ctx, 22, 100, 9); ctx.fill();

    // Arms: one out to the side, one holding his pearl pouch
    stick(-50, 0, -84, 40);
    stick(-84, 40, -98, 34, 4); stick(-84, 40, -96, 46, 4); stick(-84, 40, -88, 52, 4);
    stick(50, -4, 80, 56);
    ctx.beginPath();
    ctx.moveTo(70, 58); ctx.quadraticCurveTo(64, 92, 82, 94); ctx.quadraticCurveTo(102, 92, 96, 58);
    ctx.closePath();
    outline(ctx, '#7a4a24', 3);
    stick(70, 60, 96, 60, 3);
    circle(ctx, 83, 54, 5); ctx.fillStyle = '#fff6ff'; ctx.fill();

    // Big round body: black coat over blue trousers
    ellipse(ctx, 0, 8, 58, 66);
    ctx.fillStyle = '#17171d'; ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#2f5fd0';
    ctx.fillRect(-70, 22, 140, 60);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-16, -58); ctx.lineTo(16, -58); ctx.lineTo(0, -8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b2b33';
    ctx.fillRect(-70, 10, 140, 14);
    ctx.restore();
    ellipse(ctx, 0, 8, 58, 66);
    ctx.lineWidth = 4; ctx.strokeStyle = '#111111'; ctx.stroke();
    ctx.fillStyle = '#111111';
    [-46, -34, -22].forEach(function (by) { circle(ctx, 0, by, 3.5); ctx.fill(); });
    // Belt buckle and holster-pouch on the belt
    roundRect(ctx, -8, 11, 16, 12, 2);
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#d4a017'; ctx.stroke();
    roundRect(ctx, 26, 12, 14, 22, 3);
    outline(ctx, '#7a4a24', 2);
    // Gold sheriff star
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? 4 : 10, a = i * Math.PI / 5 - Math.PI / 2;
      ctx.lineTo(-28 + Math.cos(a) * r, -26 + Math.sin(a) * r);
    }
    ctx.closePath();
    outline(ctx, '#ffd23f', 2);

    // Head
    circle(ctx, 0, -76, 22);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#111111'; ctx.stroke();
    ctx.fillStyle = '#111111';
    circle(ctx, -8, -78, 2.8); ctx.fill();
    circle(ctx, 8, -78, 2.8); ctx.fill();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-15, -88); ctx.lineTo(-3, -84); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, -88); ctx.lineTo(3, -84); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -60 + chat, 8, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();

    // Cowboy hat
    ctx.beginPath();
    ctx.moveTo(-46, -92); ctx.quadraticCurveTo(0, -84, 46, -92);
    ctx.quadraticCurveTo(52, -100, 40, -100); ctx.quadraticCurveTo(0, -94, -40, -100);
    ctx.quadraticCurveTo(-52, -100, -46, -92);
    ctx.closePath();
    outline(ctx, '#6b3a22', 3);
    ctx.beginPath();
    ctx.moveTo(-22, -97); ctx.lineTo(-18, -120); ctx.quadraticCurveTo(0, -112, 18, -120); ctx.lineTo(22, -97);
    ctx.closePath();
    outline(ctx, '#6b3a22', 3);
    ctx.restore();
  }

  // ---------- Upgrades ----------

  // Rocket Launcher, worn on Man Ray's back (his own coordinates).
  // Rocket Launcher, pointing +x with its mouth at (32, 0). firing: flash
  // at the mouth (otherwise the next rocket's red tip peeks out).
  // tail: how far back the tube reaches (longer when Man Ray carries it).
  function drawRocketLauncher(ctx, firing, tail) {
    var back = -(tail || 34);
    // Back end
    ctx.beginPath(); ctx.moveTo(back, -7); ctx.lineTo(back - 9, -13); ctx.lineTo(back - 9, 13); ctx.lineTo(back, 7); ctx.closePath();
    outline(ctx, '#3e5a26', 2);
    // Tube with yellow stripes and a sight on top
    roundRect(ctx, -6, -16, 12, 7, 2);
    outline(ctx, '#2e3a26', 2);
    roundRect(ctx, back, -9, 26 - back, 18, 7);
    outline(ctx, '#5f7f3a', 2.5);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(back + 10, -8, 5, 16);
    ctx.fillRect(-14, -8, 5, 16);
    ctx.fillRect(4, -8, 5, 16);
    // Mouth
    if (!firing) {
      ctx.beginPath(); ctx.moveTo(30, -5); ctx.lineTo(39, 0); ctx.lineTo(30, 5); ctx.closePath();
      outline(ctx, '#e8202a', 1.5);
    }
    roundRect(ctx, 22, -11, 10, 22, 3);
    outline(ctx, '#3e5a26', 2.5);
    if (firing) {
      ctx.fillStyle = 'rgba(255,170,60,0.55)';
      circle(ctx, 40, 0, 14); ctx.fill();
      sparkle(ctx, 42, 0, 11, '#fff3c0');
    }
  }

  // A rocket in flight. r: its box (pointing the way vx goes).
  function drawRocket(ctx, r, t) {
    var dir = r.vx < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.scale(dir, 1);
    if (r.targetY !== undefined) ctx.rotate(Math.max(-0.5, Math.min(0.5, (r.targetY - r.y) * 0.02)));
    // Flame
    ctx.beginPath();
    ctx.moveTo(-10, -4); ctx.lineTo(-22 - Math.abs(Math.sin(t * 0.8)) * 8, 0); ctx.lineTo(-10, 4); ctx.closePath();
    ctx.fillStyle = '#ffb347'; ctx.fill();
    roundRect(ctx, -12, -5, 20, 10, 4);
    outline(ctx, '#e6eaf2', 2);
    ctx.beginPath(); ctx.moveTo(8, -5); ctx.lineTo(15, 0); ctx.lineTo(8, 5); ctx.closePath();
    outline(ctx, '#e8202a', 2);
    ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(-16, -9); ctx.lineTo(-8, -5); ctx.closePath();
    outline(ctx, '#e8202a', 1.5);
    ctx.restore();
  }

  // Mega Punch: a red boxing glove on a spring from his chest.
  // ext: 0 (tucked away: a small glove resting on his chest) to 1 (fully
  // punched out). The glove grows as it springs out.
  function drawPunchGlove(ctx, ext) {
    var gy = 0;
    var k = 0.5 + 0.5 * ext;
    var reach = 18 + ext * 96;
    if (ext > 0.05) {
      ctx.beginPath();
      ctx.moveTo(12, gy);
      var coils = 9;
      for (var i = 1; i <= coils; i++) ctx.lineTo(12 + (reach - 12) * i / coils, gy + (i % 2 ? -5 : 5) * k);
      ctx.lineWidth = 3.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = '#c9d2e0'; ctx.stroke();
    }
    ctx.save();
    ctx.translate(reach, gy);
    ctx.scale(k, k);
    roundRect(ctx, -6, -9, 12, 18, 3);
    outline(ctx, '#ffffff', 2.5);
    ellipse(ctx, 18, 0, 19, 17);
    outline(ctx, '#e8202a', 3);
    ellipse(ctx, 11, -12, 9, 7, -0.4);
    outline(ctx, '#e8202a', 2.5);
    ctx.strokeStyle = '#a8141c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(28, -8); ctx.quadraticCurveTo(32, 0, 28, 8); ctx.stroke();
    ellipse(ctx, 23, -6, 7, 4, -0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    ctx.restore();
    if (ext > 0.6) {
      // Speed lines behind a full punch
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
      [-12, 0, 12].forEach(function (dy) {
        ctx.beginPath(); ctx.moveTo(reach - 26, gy + dy); ctx.lineTo(reach - 10, gy + dy); ctx.stroke();
      });
    }
  }

  // Sausage Cowboy Hat, worn on Man Ray's head (his own coordinates). The
  // hat band is a sausage.
  function drawCowboyHat(ctx) {
    ctx.beginPath();
    ctx.moveTo(-32, -42); ctx.quadraticCurveTo(0, -34, 32, -42);
    ctx.quadraticCurveTo(38, -48, 28, -49); ctx.quadraticCurveTo(0, -43, -28, -49);
    ctx.quadraticCurveTo(-38, -48, -32, -42);
    ctx.closePath();
    outline(ctx, '#a0642d', 2.5);
    ctx.beginPath();
    ctx.moveTo(-17, -46); ctx.lineTo(-14, -66); ctx.quadraticCurveTo(0, -59, 14, -66); ctx.lineTo(17, -46);
    ctx.closePath();
    outline(ctx, '#a0642d', 2.5);
    roundRect(ctx, -18, -52, 36, 7, 3.5);
    outline(ctx, '#c8664a', 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(-12, -51, 22, 1.6);
  }

  // The brown dapple sausage dog friend. x, y = centre of his long body.
  function drawSausageDog(ctx, x, y, facing, frame, chasing) {
    var paddle = Math.sin(frame * (chasing ? 0.5 : 0.25));
    var wag = Math.sin(frame * 0.4) * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Legs
    [[-20, 1], [-10, -1], [12, 1], [22, -1]].forEach(function (lg) {
      ctx.beginPath(); ctx.moveTo(lg[0], 6); ctx.lineTo(lg[0] + paddle * 4 * lg[1], 16);
      ctx.lineWidth = 5; ctx.strokeStyle = '#6a3a1a'; ctx.stroke();
    });
    // Tail
    ctx.save();
    ctx.translate(-30, -3);
    ctx.rotate(-0.6 + wag);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -4);
    ctx.lineWidth = 4; ctx.strokeStyle = '#8a4a24'; ctx.stroke();
    ctx.restore();
    // Long sausage body with dapples
    ellipse(ctx, 0, 0, 32, 11);
    outline(ctx, '#8a4a24', 2.5);
    ctx.fillStyle = '#c08a5a';
    [[-16, -3, 4], [-4, 3, 3], [8, -4, 3.5], [18, 2, 2.5]].forEach(function (d) { circle(ctx, d[0], d[1], d[2]); ctx.fill(); });
    ctx.fillStyle = '#5a2e16';
    [[-9, -5, 2], [13, 4, 2]].forEach(function (d) { circle(ctx, d[0], d[1], d[2]); ctx.fill(); });
    // Red neckerchief
    ctx.beginPath(); ctx.moveTo(22, -6); ctx.lineTo(28, 8); ctx.lineTo(18, 6); ctx.closePath();
    outline(ctx, '#e8202a', 1.5);
    // Head and snout
    ellipse(ctx, 34, -8, 12, 10);
    outline(ctx, '#8a4a24', 2.5);
    ellipse(ctx, 46, -4, 9, 6);
    outline(ctx, '#a0602e', 2);
    circle(ctx, 54, -6, 2.8); ctx.fillStyle = OUTLINE; ctx.fill();
    if (chasing) {
      ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(52, 2); ctx.lineTo(44, 4); ctx.closePath();
      ctx.fillStyle = '#e86a7a'; ctx.fill();
    }
    circle(ctx, 37, -12, 2.5); ctx.fillStyle = OUTLINE; ctx.fill();
    // Long floppy ear (flies back when chasing)
    ctx.save();
    ctx.translate(30, -12);
    ctx.rotate(chasing ? -1.1 : 0.5 + Math.sin(frame * 0.1) * 0.1);
    ellipse(ctx, 0, 9, 5, 11);
    outline(ctx, '#5a2e16', 2);
    ctx.restore();
    ctx.restore();
  }

  // Pictures on the shop's item cards.
  function drawUpgradePicture(ctx, id, x, y, t) {
    if (id === 'rocket') {
      drawKeyCap(ctx, x - 82, y - 50, 'R', 0.6);
      ctx.save(); ctx.translate(x - 28, y + 8); ctx.scale(1.4, 1.4);
      drawRocketLauncher(ctx, t % 40 < 6);
      ctx.restore();
      drawRocket(ctx, { x: x + 22 + (t % 40) * 1.5, y: y + 2, w: 26, h: 12, vx: 1 }, t);
    } else if (id === 'punch') {
      ctx.save(); ctx.translate(x - 62, y + 10); ctx.scale(1.3, 1.3);
      drawPunchGlove(ctx, 0.5 + Math.sin(t * 0.15) * 0.5);
      ctx.restore();
    } else if (id === 'dog') {
      drawSausageDog(ctx, x - 14, y + 18, 1, t, false);
      // The dog wears the hat in the picture
      ctx.save(); ctx.translate(x + 20, y + 26); ctx.scale(0.75, 0.75);
      drawCowboyHat(ctx);
      ctx.restore();
    }
  }

  // Centred text wrapped onto as many lines as it needs.
  function drawWrapped(ctx, text, cx, y, maxW, size, color, lineH) {
    var words = text.split(' '), line = '', lines = [];
    words.forEach(function (wd) {
      var test = line ? line + ' ' + wd : wd;
      if (line && measureText(ctx, test, size) > maxW) { lines.push(line); line = wd; } else line = test;
    });
    if (line) lines.push(line);
    lines.forEach(function (l, i) { drawText(ctx, l, cx, y + i * lineH, size, color, 'center', 0); });
  }

  // ---------- Spiky (Man Ray's friend) ----------
  // Based on Ben's drawing (art/ben-spiky.png): a tall spiky bird drawn in
  // yellow, with a crown of yellow spikes, a pink face, black spiky feathers
  // all round, black spiky wing tufts and very long yellow legs.

  var SP_LINE = '#e0b400', SP_FILL = '#fff6c8', SP_PINK = '#ff8fd0', SP_BLACK = '#1d1d26';

  // A fan of black spiky feathers pointing outward from (cx, cy).
  function spikeFan(ctx, cx, cy, from, to, n, len, base, ruffle) {
    for (var i = 0; i < n; i++) {
      var a = from + (to - from) * (n === 1 ? 0.5 : i / (n - 1));
      var l = len + (i % 2 ? -6 : 4) + ruffle;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a - 0.22) * base, cy + Math.sin(a - 0.22) * base);
      ctx.lineTo(cx + Math.cos(a) * (base + l), cy + Math.sin(a) * (base + l));
      ctx.lineTo(cx + Math.cos(a + 0.22) * base, cy + Math.sin(a + 0.22) * base);
      ctx.closePath();
      ctx.fillStyle = SP_BLACK; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = SP_LINE; ctx.stroke();
    }
  }

  // x, y = centre of his body box. opts: { wave (waiting to meet Man Ray),
  // flying (legs dangle), shooting (spikes stand up), scale }.
  function drawSpiky(ctx, x, y, facing, frame, opts) {
    opts = opts || {};
    var s = opts.scale || 1;
    var ruffle = opts.shooting ? 8 : Math.sin(frame * 0.1) * 2;
    var flap = Math.sin(frame * (opts.flying ? 0.35 : 0.08)) * (opts.flying ? 10 : 3);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing * s, s);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Very long yellow legs, feet pointing forward
    var dangle = opts.flying ? Math.sin(frame * 0.12) * 6 : 0;
    [[-6, 1], [6, -1]].forEach(function (lg) {
      ctx.beginPath();
      ctx.moveTo(lg[0], 26);
      ctx.lineTo(lg[0] - 4 + dangle * lg[1], 58);
      ctx.lineTo(lg[0] + dangle * lg[1] * 0.5, 84);
      ctx.lineTo(lg[0] + 16 + dangle * lg[1] * 0.5, 84);
      ctx.lineWidth = 4; ctx.strokeStyle = SP_LINE; ctx.stroke();
    });

    // Body with black spiky wing tufts
    spikeFan(ctx, -12, 14, Math.PI * 0.75 - flap * 0.02, Math.PI * 1.25 - flap * 0.02, 3, 16, 10, ruffle * 0.5);
    spikeFan(ctx, 12, 14, -Math.PI * 0.25 + flap * 0.02, Math.PI * 0.25 + flap * 0.02, 3, 16, 10, ruffle * 0.5);
    ellipse(ctx, 0, 14, 18, 16);
    ctx.fillStyle = SP_FILL; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = SP_LINE; ctx.stroke();

    // Head: black spiky feathers round the sides, yellow spike crown on top
    spikeFan(ctx, 0, -34, Math.PI * 0.62, Math.PI * 1.3, 5, 18, 26, ruffle);
    spikeFan(ctx, 0, -34, -Math.PI * 0.3, Math.PI * 0.38, 5, 18, 26, ruffle);
    for (var c = 0; c < 5; c++) {
      var a = -Math.PI * 0.5 + (c - 2) * 0.32;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.16) * 28, -34 + Math.sin(a - 0.16) * 28);
      ctx.lineTo(Math.cos(a) * (46 + ruffle + (c % 2) * 6), -34 + Math.sin(a) * (46 + ruffle + (c % 2) * 6));
      ctx.lineTo(Math.cos(a + 0.16) * 28, -34 + Math.sin(a + 0.16) * 28);
      ctx.closePath();
      ctx.fillStyle = '#ffd23f'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = SP_LINE; ctx.stroke();
    }
    circle(ctx, 0, -34, 29);
    ctx.fillStyle = SP_FILL; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = SP_LINE; ctx.stroke();
    ellipse(ctx, 5, -30, 19, 17);
    ctx.fillStyle = SP_PINK; ctx.fill();

    // Face
    [[0, -36], [13, -36]].forEach(function (e) {
      circle(ctx, e[0], e[1], 5.5);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 1.8; ctx.strokeStyle = OUTLINE; ctx.stroke();
      circle(ctx, e[0] + 1.5, e[1], 2.5);
      ctx.fillStyle = OUTLINE; ctx.fill();
    });
    ctx.beginPath(); ctx.moveTo(18, -28); ctx.lineTo(32, -24); ctx.lineTo(18, -20); ctx.closePath();
    outline(ctx, '#ff9a2a', 2);
    if (opts.wave) {
      // Waving a wing
      ctx.save();
      ctx.translate(14, 6);
      ctx.rotate(-1 + Math.sin(frame * 0.2) * 0.4);
      spikeFan(ctx, 0, 0, -0.3, 0.3, 3, 18, 4, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // One of Spiky's spikes in flight.
  function drawSpike(ctx, sp) {
    var cx = sp.x + sp.w / 2, cy = sp.y + sp.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.atan2(sp.vy, sp.vx));
    ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(12, 0); ctx.lineTo(-10, 4); ctx.closePath();
    ctx.fillStyle = SP_BLACK; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
    ctx.restore();
  }

  // God of the Zillas' purple fireball.
  function drawFireball(ctx, f, t) {
    var cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    var flick = Math.sin(t * 0.6 + cx) * 2;
    ctx.globalAlpha = 0.35;
    circle(ctx, cx - f.vx * 3, cy - f.vy * 3, f.w * 0.45);
    ctx.fillStyle = '#b07aff'; ctx.fill();
    circle(ctx, cx, cy, f.w * 0.75 + flick);
    ctx.fillStyle = '#c69cff'; ctx.fill();
    ctx.globalAlpha = 1;
    circle(ctx, cx, cy, f.w / 2 + flick * 0.5);
    ctx.fillStyle = '#8a3ce0'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = GZ_EDGE; ctx.stroke();
    circle(ctx, cx - 3, cy - 3, f.w * 0.2);
    ctx.fillStyle = '#f0dcff'; ctx.fill();
  }

  // A shockwave from the God of the Zillas' stomp, rolling along the seabed.
  function drawShockwave(ctx, wv, t) {
    var dir = wv.vx < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(wv.x + wv.w / 2, wv.y + wv.h);
    ctx.scale(dir, 1);
    ctx.beginPath();
    ctx.moveTo(-wv.w * 0.9, 0);
    ctx.quadraticCurveTo(-wv.w * 0.3, -wv.h * 1.1, wv.w * 0.25, -wv.h);
    ctx.quadraticCurveTo(wv.w * 0.55, -wv.h * 0.9, wv.w * 0.45, -wv.h * 0.55);
    ctx.quadraticCurveTo(wv.w * 0.65, -wv.h * 0.2, wv.w * 0.6, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(230,245,255,0.75)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.fillStyle = 'rgba(160,120,100,0.55)';
    for (var i = 0; i < 4; i++) {
      circle(ctx, -wv.w * 0.7 + i * 12, -4 - Math.abs(Math.sin(t * 0.3 + i)) * 8, 3.5);
      ctx.fill();
    }
    ctx.restore();
  }

  // 4 Bunny's cage (x = centre, groundY = seabed). Once unlocked the door
  // swings open and he waves.
  function drawBunnyCage(ctx, x, groundY, t, locked) {
    var top = groundY - 120, w = 80;
    if (!locked) {
      var g = ctx.createRadialGradient(x, groundY - 60, 10, x, groundY - 60, 110);
      g.addColorStop(0, 'rgba(255,240,150,0.7)'); g.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 110, groundY - 170, 220, 220);
    }
    drawFourBunny(ctx, x, groundY - 62, t, { scale: 0.6, scared: locked, wave: !locked });
    // Base and dome
    roundRect(ctx, x - w / 2 - 6, groundY - 10, w + 12, 12, 4);
    outline(ctx, '#5a5f73', 2.5);
    ctx.beginPath(); ctx.ellipse(x, top + 10, w / 2, 22, 0, Math.PI, 0);
    ctx.lineWidth = 5; ctx.strokeStyle = '#5a5f73'; ctx.stroke();
    // Bars (the front ones swing away when unlocked)
    for (var i = 0; i <= 6; i++) {
      var bx = x - w / 2 + i * (w / 6);
      if (!locked && i >= 2 && i <= 4) continue;
      ctx.beginPath(); ctx.moveTo(bx, top + 10); ctx.lineTo(bx, groundY - 10);
      ctx.lineWidth = 4; ctx.strokeStyle = '#7a8099'; ctx.stroke();
    }
    if (locked) {
      roundRect(ctx, x - 9, groundY - 66, 18, 15, 3);
      outline(ctx, '#ffd23f', 2);
      ctx.beginPath(); ctx.arc(x, groundY - 66, 6, Math.PI, 0);
      ctx.lineWidth = 3; ctx.strokeStyle = '#d4a017'; ctx.stroke();
    } else {
      // Open door
      ctx.save();
      ctx.translate(x + w / 2, top + 10);
      ctx.scale(0.35, 1);
      for (var d = 0; d < 3; d++) {
        ctx.beginPath(); ctx.moveTo(20 + d * 13, 0); ctx.lineTo(20 + d * 13, groundY - 20 - top);
        ctx.lineWidth = 4; ctx.strokeStyle = '#7a8099'; ctx.stroke();
      }
      ctx.restore();
      sparkle(ctx, x - 30, top + Math.sin(t * 0.1) * 6, 6);
      sparkle(ctx, x + 34, top + 30 + Math.cos(t * 0.1) * 6, 5);
    }
  }

  // ---------- Booty ----------
  // Based on Ben's sketch (art/ben-booty.png): an old boot thrown into the
  // sea that came alive. Tall shaft with a grumpy face, a big round toe.

  var BT_LEATHER = '#8b5a2b', BT_DARK = '#5e3a1a', BT_SOLE = '#3b2a1e';

  // x, y = centre of his body; toe points toward `facing`.
  // state: 'idle' | 'windup' (crouch and shake) | 'jump' (stretch).
  function drawBooty(ctx, x, y, facing, frame, flash, state, damaged) {
    var c = function (col) { return flash ? '#ffffff' : col; };
    var sx = 1, sy = 1, shake = 0;
    if (state === 'windup') { sx = 1.12; sy = 0.84; shake = Math.sin(frame * 1.6) * 2; }
    if (state === 'jump') { sx = 0.92; sy = 1.1; }
    ctx.save();
    ctx.translate(x + shake, y + 32);
    ctx.scale(facing * sx, sy);
    ctx.translate(0, -32);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Seaweed stuck to the top
    ctx.beginPath();
    ctx.moveTo(-14, -32);
    ctx.quadraticCurveTo(-22 + Math.sin(frame * 0.1) * 4, -44, -14, -52);
    ctx.lineWidth = 4; ctx.strokeStyle = '#3fae6a'; ctx.stroke();

    // Boot
    ctx.beginPath();
    ctx.moveTo(-28, -36);
    ctx.lineTo(8, -30);
    ctx.lineTo(10, -4);
    ctx.quadraticCurveTo(34, -6, 40, 14);
    ctx.quadraticCurveTo(44, 32, 22, 32);
    ctx.lineTo(-28, 32);
    ctx.quadraticCurveTo(-34, 28, -32, 16);
    ctx.closePath();
    ctx.fillStyle = c(BT_LEATHER); ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = BT_DARK; ctx.stroke();

    // Opening at the top, sole and heel
    ctx.beginPath(); ctx.ellipse(-10, -33, 18, 4, 0.16, 0, TAU);
    ctx.fillStyle = c('#3a2410'); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-31, 26); ctx.lineTo(28, 26); ctx.quadraticCurveTo(40, 26, 38, 22);
    ctx.lineWidth = 6; ctx.strokeStyle = c(BT_SOLE); ctx.stroke();

    // Laces across the top of the foot
    ctx.strokeStyle = c('#e8d8b0'); ctx.lineWidth = 2;
    for (var i = 0; i < 3; i++) {
      var lx = 12 + i * 7;
      ctx.beginPath(); ctx.moveTo(lx - 3, -4 + i * 2); ctx.lineTo(lx + 3, 4 + i * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx + 3, -4 + i * 2); ctx.lineTo(lx - 3, 4 + i * 2); ctx.stroke();
    }

    // Worn creases on the toe
    ctx.strokeStyle = BT_DARK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(28, 18, 8, -0.4 * Math.PI, 0.1 * Math.PI); ctx.stroke();

    // Grumpy face on the shaft
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, -18, -16, 6, 7, -0.2); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = BT_DARK; ctx.stroke();
    ellipse(ctx, -2, -17, 6, 7, 0.2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.2; ctx.strokeStyle = OUTLINE;
    ctx.beginPath(); ctx.moveTo(-16, -19); ctx.lineTo(-16, -13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -14); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = BT_DARK;
    ctx.beginPath(); ctx.moveTo(-26, -29); ctx.lineTo(-12, -23); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -30); ctx.lineTo(-6, -24); ctx.stroke();
    // Big nose
    ctx.beginPath();
    ctx.moveTo(-12, -8); ctx.quadraticCurveTo(-8, -14, -2, -8);
    ctx.quadraticCurveTo(2, -2, -7, -1);
    ctx.quadraticCurveTo(-14, -2, -12, -8);
    ctx.fillStyle = c('#a8703c'); ctx.fill();
    ctx.lineWidth = 2; ctx.stroke();
    // Pouty mouth
    circle(ctx, -12, 6, 4.5); ctx.fillStyle = c('#b5804a'); ctx.fill(); ctx.stroke();
    circle(ctx, -3, 5, 4.5); ctx.fill(); ctx.stroke();

    // Patch after he's been zapped
    if (damaged) {
      ctx.save();
      ctx.translate(-22, 18);
      ctx.rotate(-0.2);
      ctx.beginPath(); ctx.rect(-7, -6, 14, 12);
      ctx.fillStyle = '#c9a36b'; ctx.fill();
      ctx.setLineDash([2, 2]); ctx.lineWidth = 1.5; ctx.strokeStyle = BT_DARK; ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // Shadow on the ground showing where a jumping Booty will land.
  function drawLandingShadow(ctx, x, groundY, height) {
    var s = Math.max(0.6, 1 - height / 300);
    ctx.beginPath();
    ctx.ellipse(x, groundY - 1, 38 * s, 8 * s, 0, 0, TAU);
    ctx.fillStyle = 'rgba(30,40,60,0.45)';
    ctx.fill();
  }

  // ---------- Bee Bot ----------
  // Based on Ben's drawing (art/ben-bee-bot.png): an evil robotic bee with
  // an oval body, a round face at the front, two triangle wings on top and
  // two stick legs with round feet — plus a pointy metal stinger on his bum.

  var BB_METAL = '#3a3f4f', BB_YELLOW = '#f5c518', BB_GREY = '#a9b3c6';

  // x, y = centre of his body; face points toward `facing`.
  // state: 'hover' | 'aim' (stinger glows, shakes) | 'sting' | 'recover'.
  function drawBeeBot(ctx, x, y, facing, frame, flash, state, damaged) {
    var c = function (col) { return flash ? '#ffffff' : col; };
    var aiming = state === 'aim';
    var shake = aiming ? Math.sin(frame * 2.2) * 1.5 : 0;
    var flutter = 0.55 + Math.abs(Math.sin(frame * 0.9)) * 0.45;
    ctx.save();
    ctx.translate(x + shake, y + (state === 'hover' ? Math.sin(frame * 0.1) * 2 : 0));
    ctx.scale(facing, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Legs with round feet
    [[-12, 6], [12, -4]].forEach(function (leg) {
      var swing = Math.sin(frame * 0.12 + leg[1]) * 3;
      ctx.beginPath(); ctx.moveTo(leg[0], 14); ctx.lineTo(leg[0] + swing, 30);
      ctx.lineWidth = 3.5; ctx.strokeStyle = c(BB_METAL); ctx.stroke();
      circle(ctx, leg[0] + swing, 34, 6);
      ctx.fillStyle = c(BB_GREY); ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = BB_METAL; ctx.stroke();
    });

    // Pointy stinger on his bum
    var glow = aiming ? 0.5 + Math.abs(Math.sin(frame * 0.4)) * 0.5 : 0;
    if (glow) {
      circle(ctx, -46, 2, 14 * glow + 6);
      ctx.fillStyle = 'rgba(255,60,60,' + 0.35 * glow + ')'; ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-28, -7); ctx.lineTo(-54 - (aiming ? 4 : 0), 2); ctx.lineTo(-28, 9); ctx.closePath();
    ctx.fillStyle = c(glow ? '#ff5a4a' : BB_GREY); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = BB_METAL; ctx.stroke();

    // Back wing then front wing (glass panes in metal frames)
    function wing(baseX, tipX, tipY) {
      ctx.save();
      ctx.translate(baseX, -12);
      ctx.scale(1, flutter);
      ctx.beginPath();
      ctx.moveTo(-14, 0); ctx.lineTo(tipX, tipY); ctx.lineTo(tipX, 0); ctx.closePath();
      ctx.fillStyle = 'rgba(205,238,255,0.75)'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = c(BB_METAL); ctx.stroke();
      ctx.restore();
    }
    wing(-6, -16, -26);
    wing(10, 4, -34);

    // Striped metal body
    ellipse(ctx, -2, 0, 30, 18);
    ctx.fillStyle = c(BB_YELLOW); ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = c('#1d1d26');
    [-20, -6].forEach(function (sx) { ctx.fillRect(sx, -20, 8, 40); });
    ctx.restore();
    ellipse(ctx, -2, 0, 30, 18);
    ctx.lineWidth = 3; ctx.strokeStyle = BB_METAL; ctx.stroke();
    ctx.fillStyle = BB_METAL;
    [[-24, -6], [-24, 6], [4, -14], [4, 14]].forEach(function (r) { circle(ctx, r[0], r[1], 1.6); ctx.fill(); });

    // Round robot face
    circle(ctx, 20, 2, 13);
    ctx.fillStyle = c(BB_GREY); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = BB_METAL; ctx.stroke();
    roundRect(ctx, 18, -4, 14, 8, 3);
    ctx.fillStyle = '#1d1d26'; ctx.fill();
    circle(ctx, 27, 0, 2.6);
    ctx.fillStyle = aiming ? '#ff3b3b' : '#ff6a3b'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(15, -8); ctx.lineTo(29, -6);
    ctx.lineWidth = 2.5; ctx.strokeStyle = BB_METAL; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, 9); ctx.lineTo(30, 7);
    ctx.lineWidth = 2; ctx.stroke();

    // Antenna with a blinking light
    ctx.beginPath(); ctx.moveTo(18, -10); ctx.lineTo(24, -24);
    ctx.lineWidth = 2; ctx.strokeStyle = BB_METAL; ctx.stroke();
    circle(ctx, 24, -25, 3);
    ctx.fillStyle = Math.floor(frame / 15) % 2 ? '#ff3b3b' : '#ffd23f'; ctx.fill();

    // Dent after the first zap
    if (damaged) {
      ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(-9, 3); ctx.lineTo(-5, 9); ctx.lineTo(-1, 4);
      ctx.lineWidth = 2; ctx.strokeStyle = '#1d1d26'; ctx.stroke();
    }

    ctx.restore();
  }

  // ---------- Octo-Pie (mini-boss) ----------
  // Based on Ben's drawing (art/ben-octo-pie.png): a big indigo head that
  // narrows into a long stem, a lid line with a little "6" flag on top,
  // big white eyes, a toothy frown and four wiggly purple tentacles.

  var OP_BODY = '#2b2fb8', OP_SHADE = '#20228f', OP_EDGE = '#9b5be8';
  var OP_TENTACLE = '#8a48d6', OP_TENTACLE_EDGE = '#c49cf5';

  function drawTentacle(ctx, baseY, phase, frame, c) {
    ctx.beginPath();
    for (var x = 6; x <= 122; x += 4) {
      var y = baseY + Math.sin(x * 0.11 + frame * 0.15 + phase) * 8 * Math.min(1, x / 30);
      if (x === 6) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = 18; ctx.strokeStyle = c(OP_TENTACLE_EDGE); ctx.stroke();
    ctx.lineWidth = 12; ctx.strokeStyle = c(OP_TENTACLE); ctx.stroke();
  }

  function octoPieHead(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.bezierCurveTo(40, -60, 60, -40, 50, -10);
    ctx.bezierCurveTo(44, 10, 16, 22, 10, 40);
    ctx.lineTo(7, 60);
    ctx.quadraticCurveTo(0, 67, -7, 60);
    ctx.lineTo(-10, 40);
    ctx.bezierCurveTo(-16, 22, -44, 10, -50, -10);
    ctx.bezierCurveTo(-60, -40, -40, -60, 0, -58);
    ctx.closePath();
  }

  // x, y = centre of his head-and-stem. facing = 1 (right) or -1 (left).
  function drawOctoPie(ctx, x, y, facing, frame, flash, angry) {
    var c = function (col) { return flash ? '#ffffff' : col; };
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    // Tentacles, two each side, behind the stem
    drawTentacle(ctx, 22, 0, frame, c);
    drawTentacle(ctx, 44, 2, frame, c);
    ctx.save();
    ctx.scale(-1, 1);
    drawTentacle(ctx, 22, 1, frame, c);
    drawTentacle(ctx, 44, 3, frame, c);
    ctx.restore();

    // "6" flag on top
    ctx.strokeStyle = OP_BODY; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(0, -66); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, -82); ctx.lineTo(11, -82); ctx.lineTo(0, -64); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = OP_BODY; ctx.stroke();
    ctx.save();
    ctx.scale(facing, 1);
    ctx.font = font(11);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = OP_BODY;
    ctx.fillText('6', 0, -76);
    ctx.restore();

    // Head narrowing into a long stem, shaded down one side
    octoPieHead(ctx);
    ctx.fillStyle = c(OP_BODY); ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = c(OP_SHADE);
    ctx.beginPath(); ctx.ellipse(-34, -6, 20, 46, 0.35, 0, TAU); ctx.fill();
    ctx.restore();
    octoPieHead(ctx);
    ctx.lineWidth = 4; ctx.strokeStyle = c(OP_EDGE); ctx.stroke();

    // Lid line across the top
    ctx.beginPath(); ctx.moveTo(-36, -50); ctx.quadraticCurveTo(4, -56, 50, -50);
    ctx.lineWidth = 3; ctx.strokeStyle = c(OP_EDGE); ctx.stroke();

    // Big eyes
    [-20, 20].forEach(function (ex) {
      ellipse(ctx, ex, -28, 12, 10);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = c(OP_EDGE); ctx.stroke();
      circle(ctx, ex + 3, -27, 3);
      ctx.fillStyle = OUTLINE; ctx.fill();
    });
    if (angry) {
      ctx.strokeStyle = c(OP_EDGE); ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-32, -46); ctx.lineTo(-10, -38); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(32, -46); ctx.lineTo(10, -38); ctx.stroke();
    }

    // Toothy frown
    ctx.beginPath();
    ctx.moveTo(-15, 14); ctx.quadraticCurveTo(0, -18, 15, 14);
    ctx.closePath();
    ctx.fillStyle = '#140c3a'; ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = c(OP_EDGE); ctx.stroke();
    ctx.fillStyle = c(OP_TENTACLE_EDGE);
    [[-9, 4], [-4, -1], [2, -1], [7, 4]].forEach(function (t) {
      ctx.beginPath();
      ctx.moveTo(t[0] - 2.5, t[1] - 1); ctx.lineTo(t[0], t[1] + 5); ctx.lineTo(t[0] + 2.5, t[1] - 1);
      ctx.closePath(); ctx.fill();
    });

    ctx.restore();
  }

  // A thrown purple-berry pie. x, y = centre.
  function drawPie(ctx, x, y, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(spin) * 0.4);
    ctx.beginPath();
    ctx.moveTo(-15, -2); ctx.lineTo(15, -2); ctx.lineTo(11, 10); ctx.lineTo(-11, 10); ctx.closePath();
    outline(ctx, '#e0a85a', 2.5);
    ctx.beginPath();
    ctx.ellipse(0, -2, 15, 6, 0, Math.PI, 0);
    ctx.closePath();
    outline(ctx, '#8a48d6', 2.5);
    ctx.strokeStyle = '#f3cf8a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-4, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(4, -3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, -6); ctx.lineTo(10, -2); ctx.stroke();
    ctx.restore();
  }

  // Boss name and a segmented health bar, centred at (cx, cy).
  function drawBossBar(ctx, name, hp, maxHp, cx, cy) {
    // Segments shrink to fit so a big boss's bar stays on screen.
    var gap = maxHp > 20 ? 2 : 4;
    var seg = Math.min(26, (520 - (maxHp - 1) * gap) / maxHp);
    var total = maxHp * seg + (maxHp - 1) * gap;
    var x = cx - total / 2;
    drawText(ctx, name, cx, cy - 2, 22, '#e0c8ff');
    for (var i = 0; i < maxHp; i++) {
      roundRect(ctx, x + i * (seg + gap), cy + 14, seg, 12, 4);
      outline(ctx, i < hp ? '#9b5be8' : 'rgba(40,70,110,0.45)', 2.5);
    }
  }

  // ---------- Tri-Terror (boss) ----------
  // Based on Ben's drawing (art/ben-tri-terror.png): a screeching
  // pterodactyl. Tall body split purple and orange, black lower half, small
  // orange head with a curly antenna, big blue wings (two claw fingers on
  // the big one), purple stick legs with bird feet — and zigzag screeches.

  var TT_PURPLE = '#5b3fd6', TT_ORANGE = '#f26a1e', TT_BLACK = '#17171d';
  var TT_WING = '#2236c9', TT_EDGE = '#9b5be8';

  function ttLine(ctx, x1, y1, x2, y2, w, col) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = w || 3; ctx.strokeStyle = col || TT_EDGE; ctx.stroke();
  }

  // Zigzag "screech" lines like Ben drew above his head.
  function zigzag(ctx, x, y, size, jitter) {
    ctx.beginPath();
    for (var i = 0; i <= 4; i++) {
      ctx.lineTo(x + (i % 2 ? size * 0.5 : -size * 0.5) + jitter, y - i * size * 0.45);
    }
    ctx.lineWidth = 3; ctx.strokeStyle = '#2236c9'; ctx.lineCap = 'round'; ctx.stroke();
  }

  // x, y = centre of his body. opts: { state: 'fly' | 'screech' | 'spin',
  // spin (angle while spinning), angry }.
  function drawTriTerror(ctx, x, y, facing, frame, flash, opts) {
    opts = opts || {};
    var c = function (col) { return flash ? '#ffffff' : col; };
    var flap = Math.sin(frame * 0.15) * 14;
    var spinning = opts.state === 'spin';
    var screeching = opts.state === 'screech';
    ctx.save();
    ctx.translate(x, y);
    // Spinning round: squash side to side like turning on the spot.
    var turn = spinning ? Math.cos(opts.spin || 0) : 1;
    ctx.scale(facing * (Math.abs(turn) < 0.15 ? 0.15 * Math.sign(turn || 1) : turn), 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Legs with three-toed feet
    [[-14, -1], [14, 1]].forEach(function (leg) {
      var fx = leg[0] + leg[1] * 4, fy = 66;
      ttLine(ctx, leg[0], 40, fx, fy, 3.5);
      ttLine(ctx, fx, fy, fx - 9, fy + 6, 3);
      ttLine(ctx, fx, fy, fx + 1, fy + 8, 3);
      ttLine(ctx, fx, fy, fx + 10, fy + 5, 3);
    });

    // Big wing (back) with two claw fingers
    ctx.beginPath();
    ctx.moveTo(-28, -40);
    ctx.lineTo(-112, -34 - flap);
    ctx.lineTo(-36, 2);
    ctx.closePath();
    ctx.fillStyle = c(TT_WING); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = TT_EDGE; ctx.stroke();
    [[-98, -38], [-84, -38]].forEach(function (f) {
      ctx.beginPath();
      ctx.moveTo(f[0] - 4, f[1] - flap * 0.9); ctx.lineTo(f[0] - 2, f[1] - 14 - flap); ctx.lineTo(f[0] + 4, f[1] - flap * 0.9);
      ctx.closePath();
      ctx.fillStyle = c(TT_WING); ctx.fill(); ctx.stroke();
    });

    // Body: purple and orange halves on top, black below
    roundRect(ctx, -34, -52, 68, 94, 24);
    ctx.fillStyle = c(TT_ORANGE); ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(-40, -60); ctx.lineTo(-2, -60); ctx.lineTo(14, 0); ctx.lineTo(-40, 0); ctx.closePath();
    ctx.fillStyle = c(TT_PURPLE); ctx.fill();
    ctx.fillStyle = c(TT_BLACK);
    ctx.fillRect(-40, -2, 80, 50);
    ctx.strokeStyle = '#34343f'; ctx.lineWidth = 2;
    for (var k = 0; k < 3; k++) {
      ctx.beginPath(); ctx.moveTo(-28, 10 + k * 10); ctx.lineTo(28, 8 + k * 10); ctx.stroke();
    }
    ctx.restore();
    roundRect(ctx, -34, -52, 68, 94, 24);
    ctx.lineWidth = 3; ctx.strokeStyle = TT_EDGE; ctx.stroke();
    ttLine(ctx, -34, -2, 38, -4, 3, '#34343f');

    // Small wing (front)
    ctx.beginPath();
    ctx.moveTo(28, -36);
    ctx.lineTo(96, -30 + flap * 0.7);
    ctx.lineTo(32, -8);
    ctx.closePath();
    ctx.fillStyle = c(TT_WING); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = TT_EDGE; ctx.stroke();

    // Head: crest at the back, long beak at the front
    ctx.beginPath();
    ctx.moveTo(-6, -64); ctx.lineTo(-30, -78); ctx.lineTo(-4, -56); ctx.closePath();
    ctx.fillStyle = c(TT_PURPLE); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = TT_EDGE; ctx.stroke();
    var open = screeching ? 6 + Math.abs(Math.sin(frame * 0.6)) * 4 : 1;
    ctx.beginPath();
    ctx.moveTo(8, -66); ctx.lineTo(40, -62); ctx.lineTo(8, -60); ctx.closePath();
    ctx.fillStyle = c('#ffb347'); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -58); ctx.lineTo(34, -58 + open); ctx.lineTo(8, -54); ctx.closePath();
    ctx.fillStyle = c('#ff9a2a'); ctx.fill(); ctx.stroke();
    circle(ctx, 0, -62, 14);
    ctx.fillStyle = c(TT_ORANGE); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = TT_EDGE; ctx.stroke();
    circle(ctx, 5, -65, 4.5);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
    circle(ctx, 6.5, -64.5, 2.2);
    ctx.fillStyle = opts.angry ? '#e8202a' : OUTLINE; ctx.fill();
    ttLine(ctx, -2, -73, 12, -69, 2.5, OUTLINE);

    // Curly antenna
    ctx.beginPath();
    ctx.moveTo(0, -76);
    ctx.lineTo(0, -84);
    for (var a = 0; a <= 14; a++) {
      var r = 6 - a * 0.35;
      ctx.lineTo(Math.cos(a * 0.6) * r, -90 + Math.sin(a * 0.6) * r);
    }
    ctx.lineWidth = 1.8; ctx.strokeStyle = '#7a3a8a'; ctx.stroke();

    ctx.restore();

    // Screech zigzags (bigger and wobbling while he screeches), not flipped
    var zs = screeching ? 22 : 12;
    var jit = screeching ? Math.sin(frame * 1.3) * 3 : 0;
    ctx.save();
    ctx.globalAlpha = screeching ? 1 : 0.55;
    [-46, -22, 22, 46].forEach(function (zx, i) {
      zigzag(ctx, x + zx * (screeching ? 1.3 : 1), y - 96 - (i % 2) * 6, zs, i % 2 ? jit : -jit);
    });
    ctx.restore();

    if (spinning) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
      for (var m = 0; m < 3; m++) {
        ctx.beginPath();
        ctx.ellipse(x, y - 10 + m * 22, 70 - m * 8, 10, 0, (opts.spin || 0) + m, (opts.spin || 0) + m + 2.2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // A spinning water tornado. x, y, w, h = its box (bottom on the seabed).
  function drawTornado(ctx, tw, t) {
    var cx = tw.x + tw.w / 2;
    ctx.save();
    for (var i = 0; i <= 8; i++) {
      var k = i / 8;
      var yy = tw.y + tw.h - k * tw.h;
      var rx = tw.w * (0.18 + k * 0.5);
      var wob = Math.sin(t * 0.25 + i * 0.8) * 6 * k;
      ctx.beginPath();
      ctx.ellipse(cx + wob, yy, rx, 6 + k * 5, 0, 0, TAU);
      ctx.fillStyle = 'rgba(205,240,255,0.22)'; ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + wob, yy, rx, 6 + k * 5, 0, t * 0.4 + i, t * 0.4 + i + 3.6);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
    }
    // Sand kicked up at the bottom, bubbles whirling round
    ctx.fillStyle = 'rgba(120,90,80,0.5)';
    ctx.beginPath(); ctx.ellipse(cx, tw.y + tw.h - 2, tw.w * 0.5, 6, 0, 0, TAU); ctx.fill();
    for (var b = 0; b < 4; b++) {
      var a = t * 0.3 + b * 1.6;
      drawBubble(ctx, cx + Math.cos(a) * tw.w * 0.45, tw.y + tw.h * (0.25 + b * 0.17), 3 + b % 2, 0.8);
    }
    ctx.restore();
  }

  // ---------- Volcanoes and lava ----------

  // hz: a volcano from MR.Hazards; lavaH: how tall its lava column is now.
  function drawVolcano(ctx, hz, t, lavaH) {
    var cx = hz.cx, gy = hz.groundY, top = hz.craterY;
    var warn = hz.phase === 'warn';
    var shake = warn ? Math.sin(t * 1.9) * 1.5 : 0;

    // Lava column behind the crater lip
    if (lavaH > 0) {
      var ly = top - lavaH;
      var g = ctx.createLinearGradient(cx - 20, 0, cx + 20, 0);
      g.addColorStop(0, '#d8361a'); g.addColorStop(0.5, '#ffe066'); g.addColorStop(1, '#d8361a');
      ctx.beginPath();
      ctx.moveTo(cx - 14, top + 6);
      for (var yy = top; yy >= ly; yy -= 12) ctx.lineTo(cx - 16 + Math.sin(yy * 0.1 + t * 0.4) * 4, yy);
      for (yy = ly; yy <= top; yy += 12) ctx.lineTo(cx + 16 + Math.sin(yy * 0.1 + t * 0.4 + 2) * 4, yy);
      ctx.lineTo(cx + 14, top + 6);
      ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#a0200f'; ctx.stroke();
      for (var s = 0; s < 3; s++) {
        circle(ctx, cx + (s - 1) * 14 + Math.sin(t * 0.3 + s) * 3, ly + 4 - (s % 2) * 6, 10 - s * 2);
        ctx.fillStyle = s === 1 ? '#ffe066' : '#ff8a2a'; ctx.fill();
      }
      // Glow
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#ff8a2a';
      ctx.fillRect(cx - 34, ly - 10, 68, lavaH + 10);
      ctx.globalAlpha = 1;
    }

    // Cone
    ctx.save();
    ctx.translate(shake, 0);
    ctx.beginPath();
    ctx.moveTo(cx - 95, gy + 4);
    ctx.quadraticCurveTo(cx - 60, gy - 30, cx - 32, top);
    ctx.lineTo(cx + 32, top);
    ctx.quadraticCurveTo(cx + 60, gy - 30, cx + 95, gy + 4);
    ctx.closePath();
    outline(ctx, '#6a4a44');
    ctx.strokeStyle = '#8a6460'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 50, gy - 6); ctx.quadraticCurveTo(cx - 30, gy - 40, cx - 20, top + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 46, gy - 4); ctx.quadraticCurveTo(cx + 30, gy - 34, cx + 22, top + 8); ctx.stroke();
    // Lava trickles down the sides
    ctx.strokeStyle = '#d8361a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - 14, top + 2); ctx.quadraticCurveTo(cx - 24, top + 30, cx - 18, top + 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 12, top + 2); ctx.quadraticCurveTo(cx + 20, top + 22, cx + 26, top + 34); ctx.stroke();
    // Crater: glows brighter as it gets ready to erupt
    var heat = hz.phase === 'erupt' ? 1 : warn ? 0.5 + Math.abs(Math.sin(t * 0.3)) * 0.5 : 0.25;
    ellipse(ctx, cx, top, 32, 8);
    ctx.fillStyle = heat > 0.4 ? '#ffb347' : '#7a2a1a'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.stroke();
    if (heat > 0.3) {
      ctx.globalAlpha = heat * 0.6;
      circle(ctx, cx, top - 6, 34 + heat * 10);
      ctx.fillStyle = '#ff8a2a'; ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Warning smoke puffs rising out of the crater
    if (warn) {
      for (var p = 0; p < 4; p++) {
        var k = ((t * 0.02 + p * 0.25) % 1);
        circle(ctx, cx + Math.sin(p * 2 + t * 0.05) * 10, top - 10 - k * 90, 7 + k * 10);
        ctx.fillStyle = 'rgba(70,60,70,' + (0.55 * (1 - k)) + ')'; ctx.fill();
      }
    }
  }

  function drawLavaBlob(ctx, b, t) {
    var x = b.x + b.w / 2, y = b.y + b.h / 2;
    ctx.globalAlpha = 0.35;
    circle(ctx, x - b.vx * 2, y - b.vy * 2, b.w * 0.45);
    ctx.fillStyle = '#ff8a2a'; ctx.fill();
    ctx.globalAlpha = 1;
    circle(ctx, x, y, b.w / 2 + 1);
    ctx.fillStyle = '#e8401a'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#8a1a0a'; ctx.stroke();
    circle(ctx, x - 2, y - 2, b.w * 0.25);
    ctx.fillStyle = '#ffe066'; ctx.fill();
  }

  // ---------- The God of the Zillas ----------
  // Based on Ben's drawing (art/ben-god-of-the-zillas.png): huge round black
  // body outlined in red-orange, small head breathing purple fire, blue back
  // spikes, big black arms, clawed feet and a dark blue tail.

  var GZ_BLACK = '#17171d', GZ_EDGE = '#f26430', GZ_SPIKE = '#2f4fe0';
  var GZ_TAIL = '#2a2a8a', GZ_FIRE = '#8a3ce0', GZ_STREAK = '#26262f';

  // A thick marker-style limb: red-orange edge with a black core.
  function gzLimb(ctx, points, width) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = width + 6; ctx.strokeStyle = GZ_EDGE; ctx.stroke();
    ctx.lineWidth = width; ctx.strokeStyle = GZ_BLACK; ctx.stroke();
  }

  function gzShape(ctx, fill) {
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = GZ_EDGE; ctx.stroke();
  }

  function gzClaws(ctx, x, y, dir) {
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y - 6 + i * 6);
      ctx.lineTo(x + dir * 12, y - 9 + i * 8);
      ctx.lineWidth = 3; ctx.strokeStyle = GZ_EDGE; ctx.stroke();
    }
  }

  // x, y = centre of his round body. facing = 1 (right) or -1 (left).
  // opts: { scale, breath (true to breathe purple fire) }
  // opts: { scale, breath (breathing purple fire), inhale (glowing mouth,
  // about to breathe), squash (crouching to stomp), flash (just hit),
  // roar (mouth wide, calling helpers) }
  function drawGodOfZillas(ctx, x, y, facing, frame, opts) {
    opts = opts || {};
    var s = opts.scale || 1;
    var stomp = Math.sin(frame * 0.05);
    var swish = Math.sin(frame * 0.07);
    ctx.save();
    if (opts.flash) ctx.globalAlpha = 0.45;
    ctx.translate(x, y);
    if (opts.squash) {
      ctx.translate(0, 100 * s);
      ctx.scale(1.08, 0.88 + Math.sin(frame * 0.8) * 0.02);
      ctx.translate(0, -100 * s);
    }
    if (opts.roar) ctx.translate(Math.sin(frame * 1.7) * 3, 0);
    ctx.scale(facing * s, s);
    ctx.lineJoin = 'round';

    // Tail
    ctx.beginPath();
    ctx.moveTo(-36, 22);
    ctx.quadraticCurveTo(-70, 48, -104, 22 + swish * 8);
    ctx.lineTo(-100, 38 + swish * 8);
    ctx.quadraticCurveTo(-66, 66, -30, 42);
    ctx.closePath();
    gzShape(ctx, GZ_TAIL);

    // Back leg with spread claws
    gzLimb(ctx, [[-14, 40], [-18, 90 - stomp * 2]], 28);
    gzLimb(ctx, [[-18, 92 - stomp * 2], [-34, 94 - stomp * 2]], 16);
    gzClaws(ctx, -40, 94 - stomp * 2, -1);

    // Blue back spikes
    for (var i = 0; i < 5; i++) {
      var a = -1.8 - i * 0.43;
      var b = 0.25;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - b) * 44, Math.sin(a - b) * 44);
      ctx.lineTo(Math.cos(a) * (88 + (i % 2) * 8), Math.sin(a) * (88 + (i % 2) * 8));
      ctx.lineTo(Math.cos(a + b) * 44, Math.sin(a + b) * 44);
      ctx.closePath();
      gzShape(ctx, GZ_SPIKE);
    }

    // Round body
    circle(ctx, 0, 0, 52);
    ctx.fillStyle = GZ_BLACK; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = GZ_EDGE; ctx.stroke();
    ctx.strokeStyle = GZ_STREAK; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (var k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(k * 18 - 4, -24);
      ctx.lineTo(k * 18 + 2, 20);
      ctx.stroke();
    }

    // Front leg
    gzLimb(ctx, [[22, 42], [30, 90 + stomp * 2]], 30);
    gzLimb(ctx, [[30, 92 + stomp * 2], [52, 94 + stomp * 2]], 16);
    gzClaws(ctx, 58, 94 + stomp * 2, 1);

    // Big arms reaching forward
    gzLimb(ctx, [[34, -18], [64, -26], [90, -24 + swish * 3]], 28);
    gzClaws(ctx, 100, -24 + swish * 3, 1);
    gzLimb(ctx, [[30, 14], [62, 20], [92, 30 - swish * 3]], 34);
    gzClaws(ctx, 104, 30 - swish * 3, 1);

    // Neck and head
    gzLimb(ctx, [[18, -46], [36, -66]], 20);
    [[34, -92], [45, -97], [56, -93]].forEach(function (c) {
      ctx.beginPath();
      ctx.moveTo(c[0] - 6, c[1] + 14); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0] + 6, c[1] + 14);
      ctx.closePath();
      gzShape(ctx, GZ_FIRE);
    });
    ctx.beginPath();
    ctx.ellipse(46, -70, 22, 15, -0.1, 0, TAU);
    gzShape(ctx, GZ_BLACK);
    // Open jaw
    ctx.beginPath();
    ctx.moveTo(56, -66); ctx.lineTo(70, -70); ctx.lineTo(68, -60); ctx.closePath();
    ctx.fillStyle = '#7a1020'; ctx.fill();
    // Glowing evil eye
    circle(ctx, 50, -75, 5);
    ctx.fillStyle = '#ffd23f'; ctx.fill();
    circle(ctx, 51.5, -75, 2.2);
    ctx.fillStyle = '#e8202a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(42, -83); ctx.lineTo(58, -79);
    ctx.lineWidth = 3; ctx.strokeStyle = GZ_EDGE; ctx.stroke();

    // About to breathe fire: mouth glows
    if (opts.inhale || opts.roar) {
      var glowR = opts.roar ? 26 : 14 + Math.abs(Math.sin(frame * 0.3)) * 10;
      ctx.globalAlpha = (opts.flash ? 0.45 : 1) * 0.6;
      circle(ctx, 68, -66, glowR);
      ctx.fillStyle = opts.roar ? '#ff5a3a' : GZ_FIRE; ctx.fill();
      ctx.globalAlpha = opts.flash ? 0.45 : 1;
    }

    // Purple fire breath
    if (opts.breath) {
      var puff = (frame * 0.6) % 24;
      for (var p = 0; p < 4; p++) {
        var d = p * 22 + puff;
        var r = 9 + d * 0.22;
        circle(ctx, 76 + d, -72 + Math.sin(frame * 0.2 + p) * 4 - d * 0.12, r);
        ctx.globalAlpha = Math.max(0.15, 1 - d / 110);
        gzShape(ctx, GZ_FIRE);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }

  // ---------- The Instructor ----------
  // Based on Ben's drawing (art/ben-instructor.png), in orange crayon: a tall
  // bean-shaped fellow with spiky hair, round eyes, a long loopy nose, a
  // toothy grin, a belt with a badge and tie, stick arms with three-finger
  // hands and big round feet.

  var IN_LINE = '#d06a1c', IN_LINE_LIGHT = '#f2a865', IN_FILL = '#fff1dc';

  // Draws the current path twice, slightly offset, like a crayon line.
  function crayon(ctx, width) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = (width || 4) * 1.25; ctx.strokeStyle = IN_LINE; ctx.stroke();
    ctx.save();
    ctx.translate(1.2, 1);
    ctx.lineWidth = (width || 4) * 0.4; ctx.strokeStyle = IN_LINE_LIGHT; ctx.stroke();
    ctx.restore();
  }

  function line(ctx, x1, y1, x2, y2, width) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    crayon(ctx, width);
  }

  // A stick arm from the shoulder to a three-finger hand.
  function stickArm(ctx, sx, sy, hx, hy) {
    line(ctx, sx, sy, hx, hy);
    var a = Math.atan2(hy - sy, hx - sx);
    [-0.6, 0, 0.6].forEach(function (spread) {
      line(ctx, hx, hy, hx + Math.cos(a + spread) * 14, hy + Math.sin(a + spread) * 14, 3);
    });
  }

  // x, y = centre of his bean-shaped body. talking: mouth moves.
  function drawInstructor(ctx, x, y, frame, talking, scale) {
    var bob = Math.sin(frame * 0.06) * 3;
    var wave = Math.sin(frame * 0.12);
    var chat = talking ? Math.abs(Math.sin(frame * 0.25)) : 0;
    var blink = frame % 180 > 172;
    ctx.save();
    ctx.translate(x, y + bob);
    if (scale) ctx.scale(scale, scale);

    // Legs and big round feet
    line(ctx, -14, 74, -20, 100);
    line(ctx, 16, 74, 20, 100);
    ellipse(ctx, -32, 116, 16, 20, 0.2);
    ctx.fillStyle = IN_FILL; ctx.fill(); crayon(ctx);
    ellipse(ctx, 30, 116, 16, 20, -0.2);
    ctx.fillStyle = IN_FILL; ctx.fill(); crayon(ctx);

    // Arms: the right one waves hello
    stickArm(ctx, -40, -4, -88, 40);
    stickArm(ctx, 40, -14, 84 + wave * 4, 42 - wave * 30);

    // Bean-shaped body
    roundRect(ctx, -42, -80, 84, 158, 40);
    ctx.fillStyle = IN_FILL; ctx.fill();
    crayon(ctx, 4.5);

    // Spiky hair sweeping to one side
    ctx.beginPath();
    ctx.moveTo(-36, -70); ctx.quadraticCurveTo(-4, -96, 52, -64);
    crayon(ctx);
    ctx.beginPath();
    ctx.moveTo(-30, -78); ctx.quadraticCurveTo(4, -92, 46, -72);
    crayon(ctx, 3);
    line(ctx, -40, -82, -42, -60, 3);
    line(ctx, -8, -84, 14, -82, 3);

    // Eyebrows and eyes
    line(ctx, -30, -60, -12, -62, 3);
    line(ctx, 8, -62, 26, -60, 3);
    if (blink) {
      line(ctx, -26, -46, -14, -46, 3);
      line(ctx, 12, -46, 24, -46, 3);
    } else {
      circle(ctx, -20, -46, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); crayon(ctx, 3);
      circle(ctx, 18, -46, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); crayon(ctx, 3);
      ctx.fillStyle = IN_LINE;
      circle(ctx, -18, -45, 2.4); ctx.fill();
      circle(ctx, 20, -45, 2.4); ctx.fill();
    }

    // Long loopy nose
    ctx.beginPath();
    ctx.moveTo(2, -58);
    ctx.quadraticCurveTo(-14, -30, -8, -20);
    ctx.quadraticCurveTo(0, -12, 8, -20);
    ctx.quadraticCurveTo(10, -30, 2, -58);
    ctx.fillStyle = '#ffe2c4'; ctx.fill();
    crayon(ctx, 3.5);

    // Toothy grin
    var low = 16 + chat * 6;
    ctx.beginPath();
    ctx.moveTo(-24, -8);
    ctx.lineTo(24, -10);
    ctx.quadraticCurveTo(2, low + 10, -24, -8);
    ctx.closePath();
    ctx.fillStyle = '#b8462a'; ctx.fill();
    crayon(ctx, 3.5);
    ctx.fillStyle = '#ffffff';
    [[-16, -8.5], [-3, -9], [10, -9.5]].forEach(function (t) {
      ctx.beginPath();
      ctx.moveTo(t[0] - 6, t[1]); ctx.lineTo(t[0], t[1] + 10); ctx.lineTo(t[0] + 6, t[1]);
      ctx.closePath(); ctx.fill();
      crayon(ctx, 2);
    });

    // Belt, badge and tie
    line(ctx, -40, 18, 56, 16, 3);
    ctx.beginPath(); ctx.rect(-26, 24, 18, 18);
    ctx.fillStyle = '#ffd36b'; ctx.fill(); crayon(ctx, 3);
    ctx.font = font(10);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = IN_LINE;
    ctx.fillText('OR', -17, 33.5);
    ctx.beginPath();
    ctx.moveTo(4, 19); ctx.lineTo(18, 19); ctx.lineTo(12, 52); ctx.closePath();
    ctx.fillStyle = '#ffb36b'; ctx.fill(); crayon(ctx, 3);

    ctx.restore();
  }

  // ---------- Pickups ----------

  function drawPearl(ctx, x, y, t) {
    var g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 10);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#f0d2ff');
    circle(ctx, x, y, 9);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#b58ad8'; ctx.stroke();
    var tw = (Math.sin(t * 0.1 + x * 0.05) + 1) / 2;
    if (tw > 0.6) sparkle(ctx, x + 7, y - 7, 2 + (tw - 0.6) * 10);
  }

  // The golden pearl from inside a clam: worth a bonus.
  function drawGoldenPearl(ctx, x, y, t) {
    var pulse = 0.7 + Math.sin(t * 0.12) * 0.3;
    var glow = ctx.createRadialGradient(x, y, 4, x, y, 34);
    glow.addColorStop(0, 'rgba(255,230,120,' + 0.7 * pulse + ')');
    glow.addColorStop(1, 'rgba(255,210,60,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 34, y - 34, 68, 68);
    var g = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, 13);
    g.addColorStop(0, '#fffbe0');
    g.addColorStop(0.5, '#ffd84a');
    g.addColorStop(1, '#e8a400');
    circle(ctx, x, y, 12);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#a87400'; ctx.stroke();
    circle(ctx, x - 4, y - 4, 3);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    for (var i = 0; i < 3; i++) {
      var a = t * 0.05 + i * (TAU / 3);
      sparkle(ctx, x + Math.cos(a) * 20, y + Math.sin(a) * 20, 3 + pulse * 2, '#fff6c0');
    }
  }

  function drawHeartBubble(ctx, x, y, t) {
    var by = y + Math.sin(t * 0.05 + x) * 4;
    circle(ctx, x, by, 19);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
    drawHeart(ctx, x, by + 1, 22, true);
    ctx.beginPath(); ctx.arc(x, by, 14, 1.15 * Math.PI, 1.45 * Math.PI);
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  }

  function drawHeart(ctx, x, y, size, filled) {
    var s = size / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.25, y + s * 0.1, x - s * 0.9, y - s * 0.95, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.9, y - s * 0.95, x + s * 1.25, y + s * 0.1, x, y + s * 0.9);
    ctx.closePath();
    outline(ctx, filled ? '#ff3b5c' : 'rgba(40,70,110,0.45)', 2.5);
    if (filled) {
      ellipse(ctx, x - s * 0.45, y - s * 0.35, s * 0.2, s * 0.13, -0.6);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    }
  }

  // x = centre, groundY = sand it sits on.
  function drawClam(ctx, x, groundY, open, t) {
    var hingeX = x - 30, rimY = groundY - 12;
    if (open) {
      var pulse = 0.75 + Math.sin(t * 0.08) * 0.25;
      var g = ctx.createRadialGradient(x, rimY - 10, 4, x, rimY - 10, 70);
      g.addColorStop(0, 'rgba(255,250,170,' + 0.8 * pulse + ')');
      g.addColorStop(1, 'rgba(255,250,170,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 70, rimY - 80, 140, 140);
    }
    // Bottom shell (a bowl)
    ctx.beginPath();
    ctx.moveTo(hingeX, rimY);
    ctx.quadraticCurveTo(x, groundY + 10, x + 30, rimY);
    ctx.closePath();
    outline(ctx, '#ff8fbf');

    if (open) {
      // Its golden pearl has floated out; the empty shell still glows.
      ctx.beginPath();
      ctx.ellipse(x, rimY - 3, 18, 5, 0, 0, TAU);
      ctx.fillStyle = '#ffd1e6'; ctx.fill();
      ctx.save();
      ctx.translate(hingeX, rimY);
      ctx.rotate(-1.0);
      drawShellLid(ctx, 0, 0);
      ctx.restore();
      sparkle(ctx, x + 22, rimY - 30 + Math.sin(t * 0.1) * 3, 4);
      sparkle(ctx, x - 6, rimY - 42 + Math.cos(t * 0.1) * 3, 3);
    } else {
      drawShellLid(ctx, hingeX, rimY);
    }
  }

  function drawShellLid(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 30, y - 30, x + 60, y);
    ctx.closePath();
    outline(ctx, '#ffb3d4');
    ctx.strokeStyle = '#ff7aa8'; ctx.lineWidth = 2;
    for (var i = 1; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(x + 30, y - 1);
      ctx.lineTo(x + i * 12, y - 12 + Math.abs(i - 2.5) * 3); ctx.stroke();
    }
  }

  // x = centre, groundY = sand. Glows and floats gently.
  function drawCarrot(ctx, x, groundY, t, scale) {
    var s = scale || 1;
    var cy = groundY - 40 * s + Math.sin(t * 0.06) * 4 * s;
    var pulse = 0.7 + Math.sin(t * 0.1) * 0.3;
    var g = ctx.createRadialGradient(x, cy, 4, x, cy, 60 * s);
    g.addColorStop(0, 'rgba(255,240,140,' + 0.85 * pulse + ')');
    g.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 60 * s, cy - 60 * s, 120 * s, 120 * s);

    ctx.save();
    ctx.translate(x, cy);
    ctx.scale(s, s);
    for (var i = 0; i < 4; i++) {
      var a = t * 0.03 + i * (TAU / 4);
      sparkle(ctx, Math.cos(a) * 34, Math.sin(a) * 34, 3.5, '#fffbe0');
    }
    ctx.rotate(0.25);
    // Leaves
    [[-6, -26, -0.5], [0, -30, 0], [6, -26, 0.5]].forEach(function (l) {
      ellipse(ctx, l[0], l[1], 4.5, 11, l[2]);
      outline(ctx, '#4caf50', 2.5);
    });
    // Root
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.quadraticCurveTo(-10, 8, 0, 30);
    ctx.quadraticCurveTo(10, 8, 12, -18);
    ctx.quadraticCurveTo(0, -23, -12, -18);
    ctx.closePath();
    outline(ctx, '#ff8c1a');
    ctx.strokeStyle = '#d96a00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-2, -5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, 4); ctx.lineTo(8, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 14); ctx.lineTo(0, 15); ctx.stroke();
    ctx.restore();
  }

  function drawLaser(ctx, l) {
    ctx.globalAlpha = 0.35;
    roundRect(ctx, l.x - 5, l.y - 5, l.w + 10, l.h + 10, 9);
    ctx.fillStyle = '#ff3fb4'; ctx.fill();
    ctx.globalAlpha = 1;
    roundRect(ctx, l.x, l.y, l.w, l.h, 4);
    ctx.fillStyle = '#ff7bd0'; ctx.fill();
    roundRect(ctx, l.x + 3, l.y + l.h / 2 - 1.5, l.w - 6, 3, 1.5);
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }

  function drawBubble(ctx, x, y, r, alpha) {
    ctx.globalAlpha = alpha;
    circle(ctx, x, y, r);
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
    circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.25);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---------- Scenery solids ----------

  // theme: one of MR.Themes (colours for sand, rocks and ledges).
  function drawSolid(ctx, s, t, viewX, theme) {
    theme = theme || MR.Themes.coral;
    switch (s.kind) {
      case 'sand': drawSand(ctx, s, viewX, theme); break;
      case 'hull': drawHull(ctx, s); break;
      case 'deck': drawDeck(ctx, s); break;
      case 'raft': drawRaft(ctx, s, t); break;
      case 'volcano': break; // drawn with its eruptions by drawVolcano
      case 'hang': drawRock(ctx, s, false, theme, t, true); break;
      case 'ledge': drawRock(ctx, s, true, theme, t); break;
      default: drawRock(ctx, s, false, theme, t);
    }
  }

  function drawSand(ctx, s, viewX, theme) {
    var x0 = Math.max(s.x, viewX - 40), x1 = Math.min(s.x + s.w, viewX + 1000);
    if (x1 <= x0) return;
    ctx.beginPath();
    ctx.moveTo(x0, s.y + s.h);
    for (var x = x0; x <= x1; x += 20) ctx.lineTo(x, s.y + Math.sin(x * 0.03) * 3);
    ctx.lineTo(x1, s.y + s.h);
    ctx.closePath();
    ctx.fillStyle = theme.sand; ctx.fill();
    ctx.beginPath();
    for (x = x0; x <= x1; x += 20) ctx.lineTo(x, s.y + Math.sin(x * 0.03) * 3);
    ctx.lineWidth = 4; ctx.strokeStyle = theme.sandEdge; ctx.stroke();

    var gx;
    ctx.fillStyle = theme.sandSpeck;
    for (gx = Math.floor(x0 / 37) * 37; gx < x1; gx += 37) {
      var h = hash(gx);
      circle(ctx, gx + h * 30, s.y + 12 + h * 40, 1.5 + h * 1.5); ctx.fill();
    }
    for (gx = Math.floor(x0 / 110) * 110; gx < x1; gx += 110) {
      var d = hash(gx + 7);
      var dx = gx + d * 60, dy = s.y + 18 + hash(gx + 3) * 26;
      if (d < 0.22) drawShell(ctx, dx, dy);
      else if (d < 0.38) drawStarfish(ctx, dx, dy, d * 10);
      else if (d < 0.55) { ellipse(ctx, dx, dy, 7, 4.5); outline(ctx, '#c9b6a0', 2); }
    }
  }

  function drawShell(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 4);
    ctx.quadraticCurveTo(x, y - 14, x + 10, y + 4);
    ctx.closePath();
    outline(ctx, '#ffd1e0', 2);
    ctx.strokeStyle = '#f29bb8'; ctx.lineWidth = 1.5;
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + i * 6, y - 4); ctx.stroke();
    }
  }

  function drawStarfish(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? 4.5 : 11;
      var a = i * Math.PI / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    outline(ctx, '#ff8a5c', 2);
    ctx.fillStyle = '#ffd0b8';
    circle(ctx, 0, 0, 1.5); ctx.fill();
    ctx.restore();
  }

  // coral: tufts on top. hanging: a rock hanging from the surface, with
  // drips underneath.
  function drawRock(ctx, s, coral, theme, t, hanging) {
    theme = theme || MR.Themes.coral;
    if (hanging) {
      ctx.fillStyle = theme.rock;
      for (var d = 0; s.x + 18 + d * 32 < s.x + s.w - 10; d++) {
        var dx = s.x + 22 + d * 32, len = 10 + hash(dx) * 14;
        ctx.beginPath();
        ctx.moveTo(dx - 9, s.y + s.h - 4); ctx.lineTo(dx, s.y + s.h + len); ctx.lineTo(dx + 9, s.y + s.h - 4);
        ctx.closePath();
        outline(ctx, theme.rock, 2.5);
      }
    }
    roundRect(ctx, s.x, s.y, s.w, s.h, 16);
    outline(ctx, theme.rock);
    roundRect(ctx, s.x + 10, s.y + 6, s.w - 20, 7, 3.5);
    ctx.fillStyle = theme.rockLight; ctx.fill();
    ctx.fillStyle = theme.rockSpot;
    for (var i = 0; i < Math.floor(s.w / 40); i++) {
      var h = hash(s.x + i * 13);
      ellipse(ctx, s.x + 16 + i * 40 + h * 10, s.y + 20 + h * Math.max(0, s.h - 34), 6 + h * 4, 3.5 + h * 2);
      ctx.fill();
    }
    if (coral) {
      var cols = theme.tufts;
      for (var j = 0; s.x + 14 + j * 34 < s.x + s.w - 10; j++) {
        var cx = s.x + 18 + j * 34;
        if (theme.glowTufts) {
          ctx.globalAlpha = 0.25 + Math.sin((t || 0) * 0.05 + j) * 0.1;
          circle(ctx, cx + 4, s.y - 3, 16); ctx.fillStyle = cols[j % 3]; ctx.fill();
          ctx.globalAlpha = 1;
        }
        circle(ctx, cx, s.y - 2, 6); outline(ctx, cols[j % 3], 2);
        circle(ctx, cx + 8, s.y - 4, 4); outline(ctx, cols[j % 3], 2);
      }
    }
  }

  // A floating raft of kelp-wrapped logs (Kelp Forest).
  function drawRaft(ctx, s, t) {
    roundRect(ctx, s.x, s.y, s.w, s.h, s.h / 2);
    outline(ctx, '#9a6b3f');
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x + 10, s.y + s.h / 2); ctx.lineTo(s.x + s.w - 10, s.y + s.h / 2); ctx.stroke();
    // Kelp bands tying the logs together, with leaves trailing below
    for (var x = s.x + 24; x < s.x + s.w - 12; x += 56) {
      ctx.fillStyle = '#3fae6a';
      ctx.fillRect(x, s.y - 1, 9, s.h + 2);
      ctx.beginPath();
      ctx.moveTo(x + 4, s.y + s.h);
      ctx.quadraticCurveTo(x + 4 + Math.sin((t || 0) * 0.05 + x) * 6, s.y + s.h + 12, x + 2, s.y + s.h + 22);
      ctx.lineWidth = 4; ctx.strokeStyle = '#3fae6a'; ctx.stroke();
    }
  }

  function drawHull(ctx, s) {
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    outline(ctx, '#8a5a3c');
    ctx.strokeStyle = '#6e4329'; ctx.lineWidth = 2;
    for (var y = s.y + 22; y < s.y + s.h; y += 18) {
      ctx.beginPath(); ctx.moveTo(s.x + 6, y); ctx.lineTo(s.x + s.w - 6, y); ctx.stroke();
    }
    for (var px = s.x + 90; px < s.x + s.w - 40; px += 180) {
      circle(ctx, px, s.y + 40, 12);
      ctx.fillStyle = '#7ad7f0'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#d4a017'; ctx.stroke();
      circle(ctx, px - 4, s.y + 36, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    }
    roundRect(ctx, s.x - 6, s.y - 6, s.w + 12, 13, 5);
    outline(ctx, '#5e3a22', 2.5);
    // Seaweed draped on the rail
    ctx.strokeStyle = '#3fae6a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (var wx = s.x + 50; wx < s.x + s.w; wx += 230) {
      ctx.beginPath(); ctx.moveTo(wx, s.y + 2);
      ctx.quadraticCurveTo(wx + 8, s.y + 18, wx + 2, s.y + 32); ctx.stroke();
    }
  }

  function drawDeck(ctx, s) {
    roundRect(ctx, s.x, s.y, s.w, s.h, 6);
    outline(ctx, '#b07a4f');
    ctx.strokeStyle = '#8a5a3c'; ctx.lineWidth = 2;
    for (var x = s.x + 40; x < s.x + s.w - 10; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, s.y + 3); ctx.lineTo(x, s.y + s.h - 3); ctx.stroke();
    }
    ctx.fillStyle = '#5e3a22';
    for (x = s.x + 10; x < s.x + s.w; x += 40) {
      circle(ctx, x, s.y + 7, 1.8); ctx.fill();
    }
  }

  // ---------- UI pieces ----------

  // strokeWidth: outline thickness; 0 for plain text with no outline.
  function drawText(ctx, text, x, y, size, fill, align, strokeWidth) {
    var outlineWidth = strokeWidth === undefined ? Math.max(4, size * 0.18) : strokeWidth;
    ctx.font = font(size);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    if ('letterSpacing' in ctx) ctx.letterSpacing = size < 30 ? '0.6px' : '0.3px';
    // (Canvas ignores a line width of 0, so check our own value: setting
    // ctx.lineWidth = 0 would keep the last width and fatten the letters.)
    if (outlineWidth > 0) {
      ctx.lineWidth = outlineWidth;
      ctx.strokeStyle = OUTLINE;
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = fill || '#ffffff';
    ctx.fillText(text, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  function measureText(ctx, text, size) {
    ctx.font = font(size);
    if ('letterSpacing' in ctx) ctx.letterSpacing = size < 30 ? '0.6px' : '0.3px';
    var width = ctx.measureText(text).width;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    return width;
  }

  function drawTitle(ctx, text, cx, cy, t) {
    var size = 112, gap = 6, spaceW = 44;
    var colors = ['#ffcf3f', '#ff7ab6', '#7be0ff', '#a0f06a', '#ffcf3f', '#ff9a4a', '#c59bff'];
    ctx.font = font(size);
    var widths = text.split('').map(function (ch) {
      return ch === ' ' ? spaceW : ctx.measureText(ch).width;
    });
    var total = widths.reduce(function (a, b) { return a + b + gap; }, -gap);
    var x = cx - total / 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch !== ' ') {
        var y = cy + Math.sin(t * 0.06 + i * 0.7) * 7;
        ctx.lineWidth = 16; ctx.strokeStyle = OUTLINE;
        ctx.strokeText(ch, x, y);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillText(ch, x, y);
        ellipse(ctx, x + widths[i] * 0.32, y - size * 0.26, widths[i] * 0.12, size * 0.06, -0.5);
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
      }
      x += widths[i] + gap;
    }
  }

  var ARROWS = { LEFT: Math.PI, RIGHT: 0, UP: -Math.PI / 2, DOWN: Math.PI / 2 };

  function keyCapWidth(label) {
    if (label === 'SPACE') return 130;
    if (label === 'ENTER') return 100;
    return 54;
  }

  // ---------- Touch-screen mode ----------
  // On a touch screen, prompts and tips show the on-screen buttons instead
  // of keyboard keys ("Tap" instead of "Press SPACE").

  var touchMode = false;
  // Which on-screen button stands in for each keyboard key picture.
  var TOUCH_FOR_KEY = { LEFT: 'left', RIGHT: 'right', UP: 'flap', SPACE: 'zap', R: 'rocket', P: 'pause' };

  function setTouchMode(on) { touchMode = !!on; }
  function isTouch() { return touchMode; }

  // A tip's words for a touch screen ("Press SPACE" -> "Tap ⚡").
  function touchText(text) {
    if (!touchMode) return text;
    return text
      .replace(/Press SPACE/g, 'Tap ⚡').replace(/SPACE/g, '⚡')
      .replace(/Press R\b/g, 'Tap 🚀')
      .replace(/Press /g, 'Tap ');
  }

  // One of the on-screen buttons, d across, centred on (x, y). Also used in
  // prompts and tips. id: left, right, flap, zap, rocket, pause, mute.
  function drawTouchButton(ctx, x, y, d, id, opts) {
    opts = opts || {};
    var colors = { left: '#7be0ff', right: '#7be0ff', flap: '#2b86e0', zap: '#ff5fb8',
      rocket: '#6f9a45', pause: '#9aa8c0', mute: '#9aa8c0' };
    var r = d / 2, lift = opts.pressed ? 0 : d * 0.05;
    ctx.save();
    ctx.translate(x, y - lift);
    if (!opts.pressed) {
      circle(ctx, 0, lift * 2, r - 2);
      ctx.fillStyle = 'rgba(10,26,48,0.55)'; ctx.fill();
    }
    circle(ctx, 0, 0, r - 2);
    ctx.fillStyle = colors[id] || '#ffffff'; ctx.fill();
    ctx.lineWidth = Math.max(2, d * 0.05); ctx.strokeStyle = OUTLINE; ctx.stroke();
    ellipse(ctx, -r * 0.3, -r * 0.42, r * 0.38, r * 0.18, -0.4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    var k = d / 100;
    ctx.scale(k, k);
    if (id === 'left' || id === 'right' || id === 'flap') {
      var a = id === 'left' ? Math.PI : id === 'right' ? 0 : -Math.PI / 2;
      drawArrow(ctx, 0, 0, a, 2.6, OUTLINE);
      drawArrow(ctx, 0, 0, a, 2.15, '#ffffff');
    } else if (id === 'zap') {
      ctx.beginPath();
      ctx.moveTo(6, -32); ctx.lineTo(-18, 4); ctx.lineTo(-2, 4); ctx.lineTo(-8, 32);
      ctx.lineTo(18, -6); ctx.lineTo(2, -6); ctx.closePath();
      outline(ctx, '#ffe066', 4);
    } else if (id === 'rocket') {
      ctx.scale(2.2, 2.2);
      drawRocket(ctx, { x: -14, y: -6, w: 26, h: 12, vx: 1 }, 0);
    } else if (id === 'pause') {
      roundRect(ctx, -18, -22, 13, 44, 4); outline(ctx, '#ffffff', 4);
      roundRect(ctx, 5, -22, 13, 44, 4); outline(ctx, '#ffffff', 4);
    } else if (id === 'mute') {
      ctx.scale(2, 2);
      drawSpeaker(ctx, -4, 0, opts.muted);
    }
    ctx.restore();
  }

  // The tappable "Skip" button that replaces "Press S to skip" on touch
  // screens. skipRect gives where to tap.
  function skipRect(cx, cy) { return { x: cx - 74, y: cy - 24, w: 148, h: 48 }; }
  function drawSkipButton(ctx, cx, cy) {
    var r = skipRect(cx, cy);
    roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.stroke();
    drawText(ctx, 'Skip', cx - 14, cy + 1, 24, OUTLINE, 'center', 0);
    drawArrow(ctx, cx + 30, cy, 0, 0.75, OUTLINE);
    drawArrow(ctx, cx + 44, cy, 0, 0.75, OUTLINE);
  }

  // Draws a keyboard key picture with its top-left at (x, y).
  // Returns the width used. On a touch screen it draws the matching
  // on-screen button instead (where there is one).
  function drawKeyCap(ctx, x, y, label, scale) {
    var k = scale || 1;
    if (touchMode && TOUCH_FOR_KEY[label]) {
      drawTouchButton(ctx, x + 28 * k, y + 28 * k, 56 * k, TOUCH_FOR_KEY[label]);
      return 56 * k;
    }
    var w = keyCapWidth(label), h = 52;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    roundRect(ctx, 0, 6, w, h, 11);
    ctx.fillStyle = '#8c9bb5'; ctx.fill();
    roundRect(ctx, 0, 0, w, h, 11);
    outline(ctx, '#ffffff', 3);
    if (ARROWS[label] !== undefined) {
      drawArrow(ctx, w / 2, h / 2, ARROWS[label], 1, OUTLINE);
    } else {
      ctx.font = font(label.length > 1 ? 22 : 30);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = OUTLINE;
      ctx.fillText(label, w / 2, h / 2 + 1);
    }
    ctx.restore();
    return w * k;
  }

  function drawArrow(ctx, x, y, angle, scale, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(-13, -5); ctx.lineTo(2, -5); ctx.lineTo(2, -12);
    ctx.lineTo(15, 0);
    ctx.lineTo(2, 12); ctx.lineTo(2, 5); ctx.lineTo(-13, 5);
    ctx.closePath();
    ctx.fillStyle = color || OUTLINE;
    ctx.fill();
    ctx.restore();
  }

  // Lays out a centred row of words and key pictures, e.g.
  //   ['Press', { key: 'SPACE' }, 'to start']
  // On a touch screen: "Press SPACE / P" becomes "Tap", "Press S to skip"
  // becomes a tappable Skip button, and keys with no on-screen button are
  // left out.
  function drawPromptRow(ctx, parts, cx, cy, size, color) {
    if (touchMode) {
      var out = [];
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], nx = parts[i + 1];
        if (typeof p === 'string' && /^press$/i.test(p) && nx && nx.key) {
          if (nx.key === 'S') { drawSkipButton(ctx, cx, cy); return; }
          if (nx.key === 'SPACE' || nx.key === 'P' || nx.key === 'ENTER') { out.push('Tap'); i++; continue; }
        }
        if (typeof p !== 'string' && !TOUCH_FOR_KEY[p.key]) continue;
        out.push(p);
      }
      parts = out;
    }
    var k = size / 34, gap = 12;
    var widths = parts.map(function (p) {
      if (typeof p === 'string') return measureText(ctx, p, size);
      return (touchMode ? 56 : keyCapWidth(p.key)) * k;
    });
    var total = widths.reduce(function (a, b) { return a + b + gap; }, -gap);
    var x = cx - total / 2;
    parts.forEach(function (p, i) {
      if (typeof p === 'string') drawText(ctx, p, x, cy, size, color, 'left');
      else drawKeyCap(ctx, x, cy - 28 * k, p.key, k);
      x += widths[i] + gap;
    });
  }

  // The title screen's "Tips ON/OFF" switch inside rectangle r.
  function drawTipsSwitch(ctx, r, on) {
    roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.stroke();
    if (!touchMode) drawKeyCap(ctx, r.x + 12, r.y + 8, 'T', 0.56);
    drawText(ctx, 'Tips', r.x + (touchMode ? 30 : 52), r.y + r.h / 2 + 1, 22, OUTLINE, 'left', 0);
    var tx = r.x + r.w - 76, ty = r.y + 10, tw = 64, th = 28;
    roundRect(ctx, tx, ty, tw, th, th / 2);
    ctx.fillStyle = on ? '#4cc36a' : '#9aa8c0'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.stroke();
    circle(ctx, on ? tx + tw - th / 2 : tx + th / 2, ty + th / 2, th / 2 - 4);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    drawText(ctx, on ? 'ON' : 'OFF', on ? tx + 20 : tx + tw - 22, ty + th / 2 + 1, 12, '#ffffff', 'center', 0);
  }

  // The title screen's "Story" button (replays the intro), with a little
  // 4 Bunny peeking out of it.
  function drawStoryButton(ctx, r, t) {
    roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.stroke();
    // 4 Bunny's head and ears peeking over the left end
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x - 10, r.y - 60, 80, r.h + 56); ctx.clip();
    drawFourBunny(ctx, r.x + 34, r.y + 66 + Math.sin(t * 0.08) * 2, t, { scale: 0.48 });
    ctx.restore();
    if (!touchMode) drawKeyCap(ctx, r.x + 76, r.y + 8, 'B', 0.56);
    drawText(ctx, 'Story', r.x + (touchMode ? 86 : 114), r.y + r.h / 2 + 1, 22, OUTLINE, 'left', 0);
  }

  // The title screen's level picker: "Level (1) (2) (3)". Locked levels
  // show a padlock. button(i) gives each circle's { x, y, r }.
  function drawLevelPicker(ctx, r, count, unlocked, selected, button, t) {
    roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.stroke();
    drawText(ctx, 'Level', r.x + 18, r.y + r.h / 2 + 1, 22, OUTLINE, 'left', 0);
    for (var i = 0; i < count; i++) {
      var b = button(i);
      var open = i < unlocked, sel = i === selected;
      var grow = sel ? 1 + Math.sin(t * 0.12) * 0.06 : 1;
      circle(ctx, b.x, b.y, b.r * grow);
      ctx.fillStyle = sel ? '#ffcf3f' : open ? '#7be0ff' : '#c9d2e0'; ctx.fill();
      ctx.lineWidth = sel ? 3.5 : 2.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
      if (open) {
        drawText(ctx, String(i + 1), b.x, b.y + 1, 22, OUTLINE, 'center', 0);
      } else {
        // Padlock
        roundRect(ctx, b.x - 7, b.y - 2, 14, 11, 2);
        ctx.fillStyle = '#6c7a94'; ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y - 2, 5, Math.PI, 0);
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#6c7a94'; ctx.stroke();
      }
    }
  }

  function drawSpeaker(ctx, x, y, muted) {
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 6); ctx.lineTo(x - 5, y - 6); ctx.lineTo(x + 4, y - 14);
    ctx.lineTo(x + 4, y + 14); ctx.lineTo(x - 5, y + 6); ctx.lineTo(x - 12, y + 6);
    ctx.closePath();
    outline(ctx, '#ffffff', 2.5);
    if (muted) {
      ctx.strokeStyle = '#ff3b5c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 9, y - 7); ctx.lineTo(x + 21, y + 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 21, y - 7); ctx.lineTo(x + 9, y + 7); ctx.stroke();
    }
  }

  function drawSpeechBubble(ctx, x, y, w, h) {
    var tail = [[x + 4, y + 30], [x - 36, y + 54], [x + 4, y + 66]];
    ctx.beginPath();
    ctx.moveTo(tail[0][0], tail[0][1]); ctx.lineTo(tail[1][0], tail[1][1]); ctx.lineTo(tail[2][0], tail[2][1]);
    outline(ctx, '#ffffff', 4);
    roundRect(ctx, x, y, w, h, 26);
    outline(ctx, '#ffffff', 4);
    ctx.beginPath();
    ctx.moveTo(tail[0][0] + 4, tail[0][1] + 4); ctx.lineTo(tail[1][0] + 6, tail[1][1] - 2); ctx.lineTo(tail[2][0] + 4, tail[2][1] - 3);
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }

  // Small pictures used in Instructor tips.
  function drawIcon(ctx, name, x, y, t) {
    switch (name) {
      case 'carrot': drawCarrot(ctx, x, y + 30, t, 0.8); break;
      case 'fish': drawZillaFish(ctx, x, y, -1, t, false); break;
      case 'crab': drawZillaCrab(ctx, x, y, -1, t, false, false); break;
      case 'octopie':
        ctx.save(); ctx.translate(x + 20, y); ctx.scale(0.55, 0.55);
        drawOctoPie(ctx, 0, 0, -1, t, false, false);
        ctx.restore();
        break;
      case 'pie': drawPie(ctx, x, y, t * 0.08); break;
      case 'triterror':
        ctx.save(); ctx.translate(x + 20, y + 22); ctx.scale(0.42, 0.42);
        drawTriTerror(ctx, 0, 0, -1, t, false, { state: 'fly' });
        ctx.restore();
        break;
      case 'rocket': case 'punch': case 'dog':
        ctx.save(); ctx.translate(x + 10, y); ctx.scale(0.75, 0.75);
        drawUpgradePicture(ctx, name, 0, 0, t);
        ctx.restore();
        break;
      case 'spiky': drawSpiky(ctx, x + 10, y - 6, -1, t, { scale: 0.55, wave: true }); break;
      case 'god': drawGodOfZillas(ctx, x + 20, y + 4, -1, t, { scale: 0.32, inhale: true }); break;
      case 'bunny': drawBunnyCage(ctx, x + 10, y + 40, t, Math.floor(t / 60) % 2 === 0); break;
      case 'fireball': drawFireball(ctx, { x: x - 4 + (t % 40), y: y - 14, w: 28, h: 28, vx: 1, vy: 0 }, t); break;
      case 'wave': drawShockwave(ctx, { x: x - 10 + (t % 40), y: y, w: 40, h: 34, vx: 1 }, t); break;
      case 'tornado': drawTornado(ctx, { x: x - 20, y: y - 40, w: 40, h: 80 }, t); break;
      case 'volcano': {
        var fake = { cx: x + 10, groundY: y + 34, craterY: y + 4, phase: Math.floor(t / 60) % 2 ? 'erupt' : 'warn' };
        ctx.save(); ctx.translate(x + 10, y + 34); ctx.scale(0.5, 0.5); ctx.translate(-(x + 10), -(y + 34));
        drawVolcano(ctx, fake, t, fake.phase === 'erupt' ? 60 + Math.sin(t * 0.2) * 20 : 0);
        ctx.restore();
        break;
      }
      case 'beebot': drawBeeBot(ctx, x + 8, y, -1, t, false, Math.floor(t / 60) % 2 ? 'aim' : 'hover', false); break;
      case 'booty': drawBooty(ctx, x, y - 4, -1, t, false, Math.floor(t / 60) % 2 ? 'windup' : 'idle', false); break;
      case 'laser':
        drawManRay(ctx, x - 50, y, 1, t, { scale: 0.7, firing: t % 40 < 6 });
        drawLaser(ctx, { x: x - 50 + 92 * 0.7 + (t % 40) * 1.5, y: y + 6 * 0.7 - 4, w: 26, h: 8 });
        break;
    }
  }

  return {
    OUTLINE: OUTLINE,
    FONT: FONT,
    roundRect: roundRect,
    drawManRay: drawManRay,
    drawZillaFish: drawZillaFish,
    drawZillaCrab: drawZillaCrab,
    drawGodOfZillas: drawGodOfZillas,
    drawTriTerror: drawTriTerror,
    drawTornado: drawTornado,
    drawVolcano: drawVolcano,
    drawLavaBlob: drawLavaBlob,
    drawOctoPie: drawOctoPie,
    drawBooty: drawBooty,
    drawSpiky: drawSpiky,
    drawSpike: drawSpike,
    drawFireball: drawFireball,
    drawShockwave: drawShockwave,
    drawBunnyCage: drawBunnyCage,
    drawGerald: drawGerald,
    drawRocket: drawRocket,
    drawSausageDog: drawSausageDog,
    drawUpgradePicture: drawUpgradePicture,
    drawWrapped: drawWrapped,
    drawFourBunny: drawFourBunny,
    drawBeeBot: drawBeeBot,
    drawLandingShadow: drawLandingShadow,
    drawPie: drawPie,
    drawBossBar: drawBossBar,
    drawInstructor: drawInstructor,
    drawPearl: drawPearl,
    drawHeartBubble: drawHeartBubble,
    drawGoldenPearl: drawGoldenPearl,
    drawHeart: drawHeart,
    drawClam: drawClam,
    drawCarrot: drawCarrot,
    drawLaser: drawLaser,
    drawBubble: drawBubble,
    drawSolid: drawSolid,
    drawText: drawText,
    measureText: measureText,
    drawTitle: drawTitle,
    drawKeyCap: drawKeyCap,
    setTouchMode: setTouchMode,
    isTouch: isTouch,
    touchText: touchText,
    drawTouchButton: drawTouchButton,
    drawSkipButton: drawSkipButton,
    skipRect: skipRect,
    drawArrow: drawArrow,
    drawPromptRow: drawPromptRow,
    drawSpeaker: drawSpeaker,
    drawTipsSwitch: drawTipsSwitch,
    drawLevelPicker: drawLevelPicker,
    drawStoryButton: drawStoryButton,
    drawSpeechBubble: drawSpeechBubble,
    drawIcon: drawIcon
  };
})();
