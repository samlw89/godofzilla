var MR = MR || {};

// Game loop and screen switching: title -> (story intro, first time) ->
// playing -> level complete -> Gerald's Shop -> next level. After the final
// level (beating the God of the Zillas): the ending and credits, then back
// to the title.
(function () {
  var W = 960, H = 540;
  var STEP_MS = 1000 / 60;
  var BANNER_TICKS = 180;
  var COMPLETE_DELAY = 100;

  var Art = MR.Art, Input = MR.Input, Sound = MR.Sound, World = MR.World,
    Instructor = MR.Instructor, Background = MR.Background;
  var LEVELS = MR.LevelOrder;

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var pixelScale = 1;

  // Remembers settings between visits: which levels have been finished
  // (for "Press S to skip"), how far the player has got (for the level
  // picker), and whether the Instructor's tips are switched off. Falls back
  // silently if storage is unavailable.
  var Storage = {
    TIPS_OFF: 'manray.tipsOff',
    INTRO_SEEN: 'manray.introSeen',
    WALLET: 'manray.wallet',
    UPGRADES: 'manray.upgrades',
    getUpgrades: function () {
      try { return JSON.parse(window.localStorage.getItem(this.UPGRADES)) || {}; } catch (e) { return {}; }
    },
    setUpgrades: function (u) {
      try { window.localStorage.setItem(this.UPGRADES, JSON.stringify(u)); } catch (e) { /* ignore */ }
    },
    UNLOCKED: 'manray.unlocked',
    completedKey: function (n) { return 'manray.level' + n + '.completed'; },
    get: function (key) {
      try { return window.localStorage.getItem(key) === 'yes'; } catch (e) { return false; }
    },
    set: function (key, on) {
      try { window.localStorage.setItem(key, on ? 'yes' : 'no'); } catch (e) { /* ignore */ }
    },
    getNumber: function (key, fallback) {
      try {
        var n = parseInt(window.localStorage.getItem(key), 10);
        return isNaN(n) ? fallback : n;
      } catch (e) { return fallback; }
    },
    setNumber: function (key, n) {
      try { window.localStorage.setItem(key, String(n)); } catch (e) { /* ignore */ }
    }
  };

  // Title-screen controls (game coordinates).
  var TIPS_SWITCH = { x: 752, y: 14, w: 194, h: 48 };
  var STORY_BUTTON = { x: 766, y: 468, w: 180, h: 48 };
  var LEVEL_PICKER = { x: 14, y: 14, w: 350, h: 48 };
  function levelButton(i) {
    return { x: LEVEL_PICKER.x + 104 + i * 48, y: LEVEL_PICKER.y + LEVEL_PICKER.h / 2, r: 19 };
  }

  var unlocked = Math.max(1, Math.min(LEVELS.length, Storage.getNumber(Storage.UNLOCKED, 1)));

  var G = {
    state: 'title',
    stateTime: 0,
    t: 0,
    paused: false,
    levelIndex: 0,
    selected: unlocked - 1,
    unlocked: unlocked,
    level: LEVELS[0],
    world: null,
    instructor: Instructor.create(),
    banner: 0,
    seenEnemyTypes: {},
    // Pearls to spend at Gerald's Shop, and what's been bought there.
    wallet: Storage.getNumber(Storage.WALLET, 0),
    upgrades: Storage.getUpgrades(),
    earned: 0,
    shop: null,
    ending: null,
    intro: null,
    afterIntro: 'level',
    tipsOn: !Storage.get(Storage.TIPS_OFF)
  };

  // ---------- setup ----------

  function resize() {
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
    canvas.width = Math.round(W * s * dpr);
    canvas.height = Math.round(H * s * dpr);
    pixelScale = canvas.width / W;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    if (G.state === 'playing' && !Instructor.isActive(G.instructor)) G.paused = true;
  });
  Input.init(canvas, Sound.unlock);
  resize();
  canvas.focus();

  function setState(s) {
    G.state = s;
    G.stateTime = 0;
  }

  function theme() {
    return MR.Themes[G.level.theme] || MR.Themes.coral;
  }

  function completedThisLevel() {
    return Storage.get(Storage.completedKey(G.level.number));
  }

  function startLevel(index) {
    G.levelIndex = index;
    G.level = LEVELS[index];
    // Enemy tips are shared across levels, so each helper is explained once.
    G.world = World.create(G.level, { seenEnemyTypes: G.seenEnemyTypes, upgrades: G.upgrades });
    G.instructor = Instructor.create();
    G.paused = false;
    G.banner = 0;
    if (G.tipsOn) Instructor.show(G.instructor, G.level.tips.intro.concat(newUpgradeTips()), true);
    else G.banner = BANNER_TICKS;
    setState('playing');
  }

  // Tips for upgrades bought since they were last explained (each once).
  function newUpgradeTips() {
    var tips = [];
    Object.keys(MR.UpgradeTips).forEach(function (id) {
      var key = 'manray.tip.' + id;
      if (G.upgrades[id] && !Storage.get(key)) {
        tips.push(MR.UpgradeTips[id]);
        Storage.set(key, true);
      }
    });
    return tips;
  }

  function advancePressed() {
    return Input.wasPressed('Space') || Input.wasPressed('Enter') || Input.wasPressed('Click');
  }

  function pausePressed() {
    return Input.wasPressed('KeyP') || Input.wasPressed('Escape');
  }

  function clickedIn(r) {
    var c = Input.lastClick();
    if (!Input.wasPressed('Click') || !c) return false;
    var x = c.fx * W, y = c.fy * H;
    if (r.r) return (x - r.x) * (x - r.x) + (y - r.y) * (y - r.y) <= r.r * r.r;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  // ---------- update ----------

  function update() {
    G.t++;
    G.stateTime++;
    if (Input.wasPressed('KeyM')) Sound.toggleMute();

    if (G.state === 'title') updateTitle();
    else if (G.state === 'intro') updateIntro();
    else if (G.state === 'shop') updateShop();
    else if (G.state === 'ending') updateEnding();
    else if (G.state === 'playing') updatePlaying();
    else if (G.state === 'complete') updateComplete();
    Input.endStep();
  }

  function updateTitle() {
    if (Input.wasPressed('KeyT') || clickedIn(TIPS_SWITCH)) {
      toggleTips();
      return;
    }
    for (var i = 0; i < LEVELS.length; i++) {
      if (Input.wasPressed('Digit' + (i + 1)) || clickedIn(levelButton(i))) {
        if (i < G.unlocked) {
          G.selected = i;
          Sound.play('tick');
        }
        return;
      }
    }
    if (clickedIn(LEVEL_PICKER)) return;
    if (Input.wasPressed('KeyB') || clickedIn(STORY_BUTTON)) {
      startIntro('title');
      return;
    }
    if (advancePressed()) {
      // The story plays before Level 1 the first time.
      if (G.selected === 0 && !Storage.get(Storage.INTRO_SEEN)) startIntro('level');
      else startLevel(G.selected);
    }
  }

  // then: 'level' to go on to Level 1 afterwards, 'title' to go back.
  function startIntro(then) {
    G.intro = MR.Intro.create();
    G.afterIntro = then;
    setState('intro');
  }

  function updateIntro() {
    var sounds = MR.Intro.update(G.intro, {
      next: advancePressed(),
      skip: Input.wasPressed('KeyS') || Input.wasPressed('Escape')
    });
    sounds.forEach(Sound.play);
    if (!G.intro.done) return;
    Storage.set(Storage.INTRO_SEEN, true);
    if (G.afterIntro === 'level') startLevel(0);
    else setState('title');
  }

  function updateComplete() {
    if (G.stateTime <= 45 || !advancePressed()) return;
    G.shop = MR.Shop.create(G.wallet, G.upgrades, G.levelIndex + 1 >= LEVELS.length);
    setState('shop');
  }

  function updateEnding() {
    MR.Ending.update(G.ending, { next: advancePressed() }).forEach(Sound.play);
    if (G.ending.done) {
      G.selected = 0;
      setState('title');
    }
  }

  function updateShop() {
    var c = Input.wasPressed('Click') && Input.lastClick();
    var result = MR.Shop.update(G.shop, {
      left: Input.wasPressed('ArrowLeft'),
      right: Input.wasPressed('ArrowRight'),
      choose: G.stateTime > 20 && (Input.wasPressed('Space') || Input.wasPressed('Enter')),
      clickIndex: c ? MR.Shop.hitTest(c.fx * W, c.fy * H) : null
    });
    if (Input.wasPressed('ArrowLeft') || Input.wasPressed('ArrowRight')) Sound.play('tick');
    if (result === 'bought') {
      G.wallet = G.shop.wallet;
      G.upgrades = G.shop.owned;
      Storage.setNumber(Storage.WALLET, G.wallet);
      Storage.setUpgrades(G.upgrades);
      Sound.play('buy');
    } else if (result === 'poor' || result === 'owned') {
      Sound.play('nope');
    } else if (result === 'done') {
      if (G.levelIndex + 1 < LEVELS.length) {
        startLevel(G.levelIndex + 1);
      } else {
        G.selected = 0;
        setState('title');
      }
    }
  }

  function toggleTips() {
    G.tipsOn = !G.tipsOn;
    Storage.set(Storage.TIPS_OFF, !G.tipsOn);
    Sound.play('tick');
  }

  function levelFinished() {
    // Everything collected this level goes into the wallet for the shop.
    G.earned = G.world.pearls;
    G.wallet += G.earned;
    Storage.setNumber(Storage.WALLET, G.wallet);
    Storage.set(Storage.completedKey(G.level.number), true);
    var next = Math.min(LEVELS.length, G.levelIndex + 2);
    if (next > G.unlocked) {
      G.unlocked = next;
      Storage.setNumber(Storage.UNLOCKED, next);
    }
    G.selected = Math.min(G.levelIndex + 1, LEVELS.length - 1);
  }

  function updatePlaying() {
    var ins = G.instructor;

    if (G.paused) {
      if (pausePressed()) G.paused = false;
      return;
    }

    if (Instructor.isActive(ins)) {
      ins.frame++;
      if (ins.isIntro && completedThisLevel() && Input.wasPressed('KeyS')) {
        Instructor.skip(ins);
        G.banner = BANNER_TICKS;
      } else if (advancePressed()) {
        var wasIntro = ins.isIntro;
        Instructor.next(ins);
        Sound.play('tick');
        if (wasIntro && !Instructor.isActive(ins)) G.banner = BANNER_TICKS;
      }
      return;
    }

    if (pausePressed()) {
      G.paused = true;
      return;
    }

    if (G.banner > 0) G.banner--;

    var events = World.step(G.world, {
      left: Input.isDown('ArrowLeft'),
      right: Input.isDown('ArrowRight'),
      flapPressed: Input.wasPressed('ArrowUp'),
      flapHeld: Input.isDown('ArrowUp'),
      firePressed: Input.wasPressed('Space'),
      fireHeld: Input.isDown('Space'),
      rocketPressed: Input.wasPressed('KeyR'),
      rocketHeld: Input.isDown('KeyR')
    });

    events.forEach(function (e) {
      if (e.type === 'encounter') {
        if (!G.tipsOn) return;
        [].concat(MR.EncounterTips[e.enemy] || []).forEach(function (tip) {
          Instructor.enqueue(ins, tip);
        });
      } else if (e.type === 'complete') {
        Sound.play('complete');
        levelFinished();
      } else {
        Sound.play(e.type);
      }
    });

    if (G.world.complete && G.world.completeTimer > COMPLETE_DELAY) {
      if (G.level.final) {
        G.ending = MR.Ending.create();
        setState('ending');
      } else {
        setState('complete');
      }
    }
  }

  // ---------- draw ----------

  function draw() {
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    if (G.state === 'title') drawTitle();
    else if (G.state === 'intro') MR.Intro.draw(ctx, G.intro, G.t);
    else if (G.state === 'shop') MR.Shop.draw(ctx, G.shop, G.t);
    else if (G.state === 'ending') MR.Ending.draw(ctx, G.ending, G.t, G.upgrades);
    else if (G.state === 'playing') drawPlaying();
    else drawComplete();
  }

  function drawTitle() {
    var t = G.t;
    Background.draw(ctx, t * 0.8, t, MR.Themes.coral);
    Background.drawSurface(ctx, t, MR.Themes.coral);

    // A Zilla-fish wandering past in the distance
    var fx = ((t * 1.2) % 1300) - 150;
    Art.drawZillaFish(ctx, fx, 300 + Math.sin(t * 0.04) * 20, 1, t, false);

    Art.drawTitle(ctx, 'MAN RAY', W / 2, 112, t);
    Art.drawManRay(ctx, 250, 282 + Math.sin(t * 0.05) * 10, 1, t, { scale: 1.8 });
    Art.drawGodOfZillas(ctx, 715, 262, -1, t, { scale: 1.05, breath: true });
    Art.drawText(ctx, 'The God of the Zillas has kidnapped 4 Bunny!', W / 2, 382, 28, '#ffffff');
    Art.drawText(ctx, 'Swim to the rescue!', W / 2, 416, 28, '#ffe66b');
    Art.drawText(ctx, 'Game by ' + MR.Ending.CREATOR, W / 2, 452, 21, '#c9f2ff');
    Art.drawPromptRow(ctx, ['Press', { key: 'SPACE' }, 'to start'], W / 2, 496 + Math.sin(t * 0.1) * 3, 30);
    Art.drawTipsSwitch(ctx, TIPS_SWITCH, G.tipsOn);
    Art.drawLevelPicker(ctx, LEVEL_PICKER, LEVELS.length, G.unlocked, G.selected, levelButton, t);
    Art.drawStoryButton(ctx, STORY_BUTTON, t);
  }

  function drawPlaying() {
    var w = G.world, p = w.player, t = G.t, th = theme();
    var camX = w.camera.x;

    Background.draw(ctx, camX, t, th);

    ctx.save();
    ctx.translate(-Math.round(camX), 0);

    w.solids.forEach(function (s) {
      if (s.x < camX + W + 60 && s.x + s.w > camX - 60) Art.drawSolid(ctx, s, t, camX, th);
    });

    w.hazards.forEach(function (hz) {
      if (hz.x < camX + W + 100 && hz.x + hz.w > camX - 100) {
        Art.drawVolcano(ctx, hz, t, MR.Hazards.lavaHeight(hz));
      }
    });

    w.pickups.forEach(function (pk) {
      if (pk.collected || pk.hidden || pk.x > camX + W + 80 || pk.x + pk.w < camX - 80) return;
      switch (pk.type) {
        case 'pearl': Art.drawPearl(ctx, pk.cx, pk.cy, t); break;
        case 'heart': Art.drawHeartBubble(ctx, pk.cx, pk.cy, t); break;
        case 'golden': Art.drawGoldenPearl(ctx, pk.cx, MR.Pickups.goldenDrawY(pk), t); break;
        case 'clam': Art.drawClam(ctx, pk.cx, pk.groundY, pk.open, t); break;
        case 'carrot': Art.drawCarrot(ctx, pk.cx, pk.groundY, t); break;
        case 'bunny': Art.drawBunnyCage(ctx, pk.cx, pk.groundY, t, pk.locked); break;
      }
    });

    w.enemies.forEach(function (e) {
      if (!e.alive || e.x > camX + W + 80 || e.x + e.w < camX - 80) return;
      var cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      var flash = e.flash > 0 && Math.floor(e.flash / 3) % 2 === 0;
      if (e.type === 'fish') {
        Art.drawZillaFish(ctx, cx, cy, e.dir, e.frame, flash);
      } else if (e.type === 'beebot') {
        Art.drawBeeBot(ctx, cx, cy, e.dir, e.frame, flash, e.state, e.hp < e.maxHp);
      } else if (e.type === 'booty') {
        if (e.state === 'jump') Art.drawLandingShadow(ctx, cx, e.groundY, e.groundY - (e.y + e.h));
        Art.drawBooty(ctx, cx, cy, e.dir, e.frame, flash, e.state, e.hp < e.maxHp);
      } else {
        Art.drawZillaCrab(ctx, cx, cy, e.dir, e.frame, flash, e.hp < e.maxHp);
      }
    });

    var b = w.boss;
    if (b && b.alive) {
      var bossFlash = b.flash > 0 && Math.floor(b.flash / 3) % 2 === 0;
      if (b.type === 'zillagod') {
        Art.drawGodOfZillas(ctx, b.x + b.w / 2, b.y + b.h / 2, b.facing, b.frame, {
          scale: MR.Boss.GOD.SCALE, breath: b.state === 'breathe', inhale: b.state === 'inhale',
          squash: b.state === 'crouch', roar: b.state === 'roar', flash: bossFlash
        });
      } else if (b.type === 'triterror') {
        Art.drawTriTerror(ctx, b.x + b.w / 2, b.y + b.h / 2, b.facing, b.frame, bossFlash,
          { state: b.state, spin: b.spinAngle, angry: MR.Boss.isAngry(b) });
      } else {
        Art.drawOctoPie(ctx, b.x + b.w / 2, b.y + b.h / 2, b.facing, b.frame, bossFlash, MR.Boss.isAngry(b));
      }
    }
    w.pies.forEach(function (pie) { Art.drawPie(ctx, pie.x + pie.w / 2, pie.y + pie.h / 2, pie.spin); });
    w.tornadoes.forEach(function (tw) { Art.drawTornado(ctx, tw, t); });
    w.fireballs.forEach(function (f) { Art.drawFireball(ctx, f, t); });
    w.waves.forEach(function (wv) { Art.drawShockwave(ctx, wv, t); });
    w.spikes.forEach(function (sp) { Art.drawSpike(ctx, sp); });
    if (w.ally) {
      var a = w.ally;
      Art.drawSpiky(ctx, a.x + a.w / 2, a.y + a.h / 2, a.facing, a.frame, {
        scale: 0.8, wave: a.state === 'wait', flying: a.state !== 'wait', shooting: a.shootAnim > 0
      });
    }
    w.lavaBlobs.forEach(function (lb) { Art.drawLavaBlob(ctx, lb, t); });

    w.lasers.forEach(function (l) {
      if (l.kind === 'rocket') Art.drawRocket(ctx, l, t);
      else Art.drawLaser(ctx, l);
    });

    if (w.dog) {
      Art.drawSausageDog(ctx, w.dog.x + w.dog.w / 2, w.dog.y + w.dog.h / 2, w.dog.facing, w.dog.frame, w.dog.state === 'chase');
    }

    var blink = p.invuln > 0 && Math.floor(p.invuln / 5) % 2 === 1;
    if (!blink) {
      Art.drawManRay(ctx, p.x + p.w / 2, p.y + p.h / 2, p.facing, p.frame, {
        flapAnim: p.flapAnim, onGround: p.onGround,
        firing: p.fireCooldown > MR.Player.C.FIRE_COOLDOWN - 6,
        rocket: G.upgrades.rocket, hat: G.upgrades.dog,
        rocketFiring: p.rocketCooldown > MR.Player.C.ROCKET_COOLDOWN - 6,
        punch: G.upgrades.punch ? Math.sin(Math.PI * p.punchAnim / MR.Player.C.PUNCH_ANIM_TICKS) : undefined
      });
    }

    w.particles.forEach(function (pt) {
      Art.drawBubble(ctx, pt.x, pt.y, pt.r, Math.min(1, pt.life / pt.max * 1.5));
    });

    w.popups.forEach(function (pop) {
      ctx.globalAlpha = Math.min(1, pop.life / 25);
      Art.drawText(ctx, pop.text, pop.x, pop.y, 36, '#ffd84a');
      ctx.globalAlpha = 1;
    });

    ctx.restore();

    Background.drawSurface(ctx, t, th);
    drawHud(w);

    if (G.banner > 0) {
      ctx.globalAlpha = Math.min(1, G.banner / 30);
      Art.drawText(ctx, 'Level ' + G.level.number + ': ' + G.level.name, W / 2, 110, 50, '#ffe66b');
      ctx.globalAlpha = 1;
    }

    if (Instructor.isActive(G.instructor)) {
      Instructor.draw(ctx, G.instructor, completedThisLevel(), t);
    }

    if (G.paused) {
      ctx.fillStyle = 'rgba(10,40,70,0.55)';
      ctx.fillRect(0, 0, W, H);
      Art.drawText(ctx, 'Paused', W / 2, 220, 72, '#ffffff');
      Art.drawPromptRow(ctx, ['press', { key: 'P' }, 'to continue'], W / 2, 320, 32);
    }
  }

  function drawHud(w) {
    for (var i = 0; i < MR.Player.C.MAX_HEARTS; i++) {
      Art.drawHeart(ctx, 34 + i * 46, 32, 36, i < w.player.hearts);
    }
    Art.drawPearl(ctx, W - 118, 32, G.t);
    Art.drawText(ctx, '× ' + w.pearls, W - 100, 33, 30, '#ffffff', 'left');
    if (Sound.isMuted()) Art.drawSpeaker(ctx, W - 175, 32, true);
    if (w.boss && w.boss.active && w.boss.alive) {
      Art.drawBossBar(ctx, w.boss.name, w.boss.hp, w.boss.maxHp, W / 2, 34);
    }
  }

  function drawComplete() {
    var w = G.world, t = G.t, th = theme();
    Background.draw(ctx, w.camera.x + t * 0.3, t, th);
    Background.drawSurface(ctx, t, th);

    // Celebration bubbles
    for (var i = 0; i < 18; i++) {
      var bx = (i * 157) % W + Math.sin(t * 0.05 + i) * 10;
      var by = H + 20 - ((t * (1 + (i % 4) * 0.4) + i * 90) % (H + 60));
      Art.drawBubble(ctx, bx, by, 4 + (i % 5) * 2, 0.7);
    }

    Art.drawManRay(ctx, 250, 300 + Math.sin(t * 0.06) * 10, 1, t,
      { scale: 2.4, rocket: G.upgrades.rocket, hat: G.upgrades.dog, punch: G.upgrades.punch ? 0 : undefined });
    Art.drawCarrot(ctx, 345, 245 + Math.sin(t * 0.06) * 10, t, 1.3);

    var clue = G.level.clue || { title: "4 Bunny's carrot!", line: 'He went this way…' };
    Art.drawText(ctx, clue.title, 650, 150, 54, '#ffcf3f');
    Art.drawText(ctx, clue.line, 630, 225, 34, '#ffffff');
    var ax = 630 + Art.measureText(ctx, clue.line, 34) / 2 + 40 + Math.sin(t * 0.15) * 10;
    Art.drawArrow(ctx, ax, 225, 0, 2.2, Art.OUTLINE);
    Art.drawArrow(ctx, ax - 2, 222, 0, 1.8, '#ffe66b');

    Art.drawPearl(ctx, 560, 290, t);
    Art.drawText(ctx, w.pearls + ' / ' + w.totalPearls, 584, 292, 40, '#ffffff', 'left');
    Art.drawText(ctx, 'You have ' + G.wallet + ' pearls to spend!', 650, 420, 24, '#ffe66b');
    // One golden pearl per clam: bright if found, faded if missed.
    for (var g = 0; g < w.totalGolden; g++) {
      ctx.globalAlpha = g < w.golden ? 1 : 0.3;
      Art.drawGoldenPearl(ctx, 572 + g * 56, 356, t);
      ctx.globalAlpha = 1;
    }

    Art.drawPromptRow(ctx, ['Press', { key: 'SPACE' }, "to visit Gerald's Shop"], W / 2, 478, 30);
  }

  // ---------- loop: fixed 60 updates/sec, render every animation frame ----------

  var lastTime = performance.now();
  var acc = 0;
  function frame(now) {
    acc += Math.min(now - lastTime, 250);
    lastTime = now;
    while (acc >= STEP_MS) {
      update();
      acc -= STEP_MS;
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Handy for debugging in the browser console.
  MR.game = G;
  MR.startLevel = startLevel;
})();
