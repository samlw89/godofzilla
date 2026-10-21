var MR = MR || {};

// The story intro: the God of the Zillas steals 4 Bunny. Five short scenes,
// each with one big caption. Scenes move on by themselves (Space / Enter /
// click moves on sooner); the last one waits for Space. S or Esc skips it.
//   update(intro, { next, skip }) -> list of sound names to play
//   draw(ctx, intro, t)
MR.Intro = (function () {
  var W = 960, H = 540;
  var MIN_TICKS = 20;          // ignore a "next" press in a scene's first moments
  var BUNNY = { x: 600, scale: 0.85 };
  BUNNY.standY = 480 - 93 * BUNNY.scale;
  var GOD_SCALE = 1.6;
  var GRAB = { x: 766, y: 292 };   // where the God hovers to grab 4 Bunny
  var LIFT_Y = 210;

  var SCENES = [
    { id: 'friends', caption: "This is 4 Bunny, Man Ray's best friend.", ticks: 300,
      cues: [{ at: 30, sound: 'pling' }] },
    { id: 'dark', caption: 'One day, the sea went dark…', ticks: 220,
      cues: [{ at: 0, sound: 'rumble' }, { at: 110, sound: 'rumble' }] },
    { id: 'grab', caption: 'The God of the Zillas grabbed 4 Bunny!', ticks: 260,
      cues: [{ at: 60, sound: 'whoosh' }, { at: 95, sound: 'hurt' }] },
    { id: 'away', caption: '…and carried him far away!', ticks: 220,
      cues: [{ at: 10, sound: 'throw' }, { at: 60, sound: 'pling' }] },
    { id: 'follow', caption: "Follow 4 Bunny's carrots to find him!", ticks: 0,
      cues: [{ at: 20, sound: 'chime' }] }
  ];

  function create() {
    return { scene: 0, time: 0, done: false, carrotX: BUNNY.x };
  }

  function update(intro, input) {
    var sounds = [];
    if (intro.done) return sounds;
    if (input.skip) {
      intro.done = true;
      return sounds;
    }
    var sc = SCENES[intro.scene];
    (sc.cues || []).forEach(function (c) { if (c.at === intro.time) sounds.push(c.sound); });
    intro.time++;
    var last = intro.scene === SCENES.length - 1;
    var timeUp = !last && intro.time >= sc.ticks;
    if (timeUp || (input.next && intro.time > MIN_TICKS)) {
      if (sc.id === 'away') intro.carrotX = dropX();
      if (last) intro.done = true;
      else { intro.scene++; intro.time = 0; }
    }
    return sounds;
  }

  // ---------- positions over time ----------

  function ease(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  // Where the God of the Zillas' front claw is (he faces left).
  function claw(gx, gy) { return { x: gx - 104 * GOD_SCALE, y: gy + 30 * GOD_SCALE }; }
  // 4 Bunny dangling from that claw by his hat.
  function hanging(c) { return { x: c.x, y: c.y + 93 * BUNNY.scale - 2 }; }

  function godAt(sceneId, tt) {
    if (sceneId === 'dark') return { x: lerp(1260, 1060, ease(tt / 200)), y: 200 };
    if (sceneId === 'grab') {
      if (tt < 90) {
        var k = ease(tt / 90);
        return { x: lerp(1060, GRAB.x, k), y: lerp(200, GRAB.y, k) };
      }
      return { x: GRAB.x, y: lerp(GRAB.y, LIFT_Y, ease((tt - 110) / 90)) };
    }
    if (sceneId === 'away') {
      return { x: GRAB.x + tt * 2 + tt * tt * 0.04, y: LIFT_Y - tt * 0.4 };
    }
    return null;
  }

  // Where the carrot was dropped (x), and where it is now while falling.
  function dropX() { return hanging(claw(godAt('away', 10).x, 0)).x; }
  function carrotFall(tt) {
    var g = godAt('away', 10);
    var start = hanging(claw(g.x, g.y));
    var y = Math.min(480, start.y + Math.max(0, tt - 10) * Math.max(0, tt - 10) * 0.05);
    return { x: start.x, groundY: y + 40 };
  }

  // ---------- drawing ----------

  function draw(ctx, intro, t) {
    var Art = MR.Art;
    var sc = SCENES[intro.scene];
    var tt = intro.time;
    var sand = { kind: 'sand', x: 0, y: 480, w: W, h: 60 };

    // How dark the sea is in this scene
    var dark = 0;
    if (sc.id === 'dark') dark = 0.5 * ease(tt / 120);
    else if (sc.id === 'grab' || sc.id === 'away') dark = 0.5;
    else if (sc.id === 'follow') dark = 0.5 * (1 - ease(tt / 90));

    var shake = sc.id === 'dark' || (sc.id === 'grab' && tt > 60 && tt < 110)
      ? Math.sin(t * 1.7) * 4 : 0;

    ctx.save();
    ctx.translate(shake, Math.cos(t * 1.3) * shake * 0.5);
    MR.Background.draw(ctx, t * 0.2, t, MR.Themes.coral);
    Art.drawSolid(ctx, sand, t, 0, MR.Themes.coral);
    // The sea darkens behind the characters, so they stay easy to see.
    if (dark > 0) {
      ctx.fillStyle = 'rgba(25,10,55,' + dark + ')';
      ctx.fillRect(-10, -10, W + 20, H + 20);
    }

    var manX = 300, manY = 330 + Math.sin(t * 0.05) * 8;
    if (sc.id === 'follow') manX = lerp(300, intro.carrotX - 150, ease(tt / 120));
    var manScared = sc.id === 'grab' || sc.id === 'away';
    Art.drawManRay(ctx, manX + (manScared ? Math.sin(t * 0.9) * 2 : 0), manY, 1, t, { scale: 1.3 });

    // 4 Bunny
    if (sc.id === 'friends') {
      Art.drawFourBunny(ctx, BUNNY.x, BUNNY.standY, t, { scale: BUNNY.scale, wave: true, carrot: true });
      for (var i = 0; i < 3; i++) {
        var hy = 300 - ((t * 0.6 + i * 50) % 150);
        ctx.globalAlpha = Math.min(1, (hy - 150) / 60);
        Art.drawHeart(ctx, 455 + Math.sin(t * 0.05 + i * 2) * 20, hy, 22, true);
        ctx.globalAlpha = 1;
      }
    } else if (sc.id === 'dark' || (sc.id === 'grab' && tt < 95)) {
      Art.drawFourBunny(ctx, BUNNY.x + Math.sin(t * 0.8) * 2, BUNNY.standY, t,
        { scale: BUNNY.scale, scared: true, carrot: true });
    }

    // The God of the Zillas, carrying 4 Bunny once he's grabbed him
    var god = godAt(sc.id, tt);
    if (god) {
      Art.drawGodOfZillas(ctx, god.x, god.y, -1, t, { scale: GOD_SCALE, breath: sc.id === 'dark' });
      if ((sc.id === 'grab' && tt >= 95) || sc.id === 'away') {
        var b = hanging(claw(god.x, god.y));
        Art.drawFourBunny(ctx, b.x, b.y, t, { scale: BUNNY.scale, dangle: true, carrot: sc.id === 'grab' });
        if (sc.id === 'grab') speech(ctx, Art, 'Help!', b.x - 90, b.y - 110, t);
      }
      if (sc.id === 'away' && god.x < W + 200) speech(ctx, Art, 'Ha ha ha!', Math.min(god.x - 40, 860), 120, t);
    }

    // The carrot 4 Bunny drops
    if (sc.id === 'away' && tt >= 10) {
      var c = carrotFall(tt);
      Art.drawCarrot(ctx, c.x, c.groundY, t);
    } else if (sc.id === 'follow') {
      Art.drawCarrot(ctx, intro.carrotX, 455, t);
      var ax = 880 + Math.sin(t * 0.15) * 10;
      Art.drawArrow(ctx, ax, 300, 0, 2.6, Art.OUTLINE);
      Art.drawArrow(ctx, ax - 2, 297, 0, 2.2, '#ffe66b');
    }

    ctx.restore();

    MR.Background.drawSurface(ctx, t, MR.Themes.coral);

    // Caption band
    ctx.fillStyle = 'rgba(10,30,60,0.6)';
    ctx.fillRect(0, 452, W, 88);
    var alpha = Math.min(1, tt / 15);
    ctx.globalAlpha = alpha;
    Art.drawText(ctx, sc.caption, W / 2, sc.id === 'follow' ? 478 : 496, 34, '#ffffff');
    ctx.globalAlpha = 1;
    if (sc.id === 'follow' && tt > MIN_TICKS) {
      Art.drawPromptRow(ctx, ['Press', { key: 'SPACE' }, 'to go!'], W / 2, 518 + Math.sin(t * 0.1) * 2, 22);
    }

    // Scene dots and skip hint
    for (var d = 0; d < SCENES.length; d++) {
      ctx.beginPath();
      ctx.arc(W / 2 - (SCENES.length - 1) * 11 + d * 22, 22, d === intro.scene ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = d <= intro.scene ? '#ffe66b' : 'rgba(255,255,255,0.5)';
      ctx.fill();
    }
    Art.drawPromptRow(ctx, ['Press', { key: 'S' }, 'to skip'], 838, 24, 20);
  }

  function speech(ctx, Art, text, x, y, t) {
    var w = Art.measureText(ctx, text, 26) + 30, h = 42;
    var bob = Math.sin(t * 0.2) * 2;
    Art.roundRect(ctx, x - w / 2, y - h / 2 + bob, w, h, 14);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = Art.OUTLINE; ctx.stroke();
    Art.drawText(ctx, text, x, y + bob + 1, 26, Art.OUTLINE, 'center', 0);
  }

  return { SCENES: SCENES, create: create, update: update, draw: draw };
})();
