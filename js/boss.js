var MR = MR || {};

// Bosses: bigger helpers that take several laser hits. Each sleeps until
// he first comes on screen, then floats between minX and maxX, bobbing up
// and down by `swoop`. At half health he gets angry and faster.
//   octopie:   { type, x, y, minX, maxX, hp, speed, swoop, throwEvery }
//              throws pies at Man Ray.
//   triterror: { type, x, y, minX, maxX, hp, speed, swoop, groundY }
//              screeches (a warning), then spins round fast, sending a
//              water tornado rolling along the seabed toward Man Ray.
//   zillagod:  { type, minX, maxX, hp, speed, groundY, x }
//              the God of the Zillas, the final boss. Stands on the seabed
//              and takes turns at: purple fire breath (glowing mouth first,
//              then 3 fireballs), a stomp (crouch, jump, land: shockwaves
//              roll along the seabed both ways), and when angry a roar that
//              calls in Zilla-fish.
//   x/y is the centre; groundY is the seabed tornadoes roll along.
MR.Boss = (function () {
  var TYPES = {
    octopie: { w: 92, h: 116, hp: 8, name: 'Octo-Pie' },
    triterror: { w: 80, h: 130, hp: 10, name: 'Tri-Terror' },
    zillagod: { w: 150, h: 230, hp: 36, name: 'God of the Zillas' }
  };
  var GOD = {
    SCALE: 1.4, STAND_ABOVE_GROUND: 247, MOUTH_X: 98, MOUTH_Y: -91,
    INHALE_TICKS: 55, BREATHE_TICKS: 45, CROUCH_TICKS: 45, ROAR_TICKS: 50,
    JUMP_SPEED: 6.5, GRAVITY: 0.25,
    ATTACK_EVERY: 130, ANGRY_ATTACK_EVERY: 95, MAX_SUMMONED: 3,
    FIREBALL: { w: 28, h: 28, speed: 3.4, life: 320 },
    WAVE: { w: 40, h: 34, speed: 3.2, life: 240 }
  };
  var PIE = { w: 30, h: 22, speed: 2.4, life: 420 };
  var TRI = {
    SCREECH_TICKS: 50, SPIN_TICKS: 40, ATTACK_EVERY: 180, ANGRY_ATTACK_EVERY: 110
  };
  var TORNADO = { w: 56, h: 105, speed: 2.0, angrySpeed: 2.6, life: 520 };
  var FLASH_TICKS = 14;

  function create(def) {
    var t = TYPES[def.type];
    var hp = def.hp || t.hp;
    if (def.type === 'zillagod') def = Object.assign({}, def, { y: (def.groundY || 480) - GOD.STAND_ABOVE_GROUND + t.h / 2 });
    return {
      type: def.type, name: t.name,
      x: def.x - t.w / 2, y: def.y - t.h / 2, w: t.w, h: t.h,
      baseY: def.y - t.h / 2,
      hp: hp, maxHp: hp, alive: true, active: false,
      flash: 0, frame: 0, dir: -1, facing: -1,
      speed: def.speed === undefined ? 0.9 : def.speed,
      swoop: def.swoop === undefined ? 50 : def.swoop,
      minX: def.minX, maxX: def.maxX,
      throwEvery: def.throwEvery || 150,
      throwTimer: 90,
      // Tri-Terror
      state: 'fly', stateTimer: 0, attackTimer: 120, spinAngle: 0,
      groundY: def.groundY || 480,
      // God of the Zillas
      vy: 0, attackIndex: 0
    };
  }

  function isAngry(b) {
    return b.hp <= b.maxHp / 2;
  }

  function update(b, world) {
    if (!b.alive) return;
    b.frame++;
    if (b.flash > 0) b.flash--;
    if (!b.active) return;
    if (b.type === 'triterror') updateTriTerror(b, world);
    else if (b.type === 'zillagod') updateZillaGod(b, world);
    else updateOctoPie(b, world);
  }

  function updateZillaGod(b, world) {
    var angry = isAngry(b);
    var p = world.player;
    var pcx = p.x + p.w / 2;
    var cx = b.x + b.w / 2;

    if (b.state === 'fly') {
      // 'fly' is his ordinary state: here, walking about on the seabed.
      patrol(b, angry ? 1.4 : 1);
      b.facing = pcx < cx ? -1 : 1;
      if (--b.attackTimer <= 0) {
        var attacks = angry ? ['breath', 'stomp', 'summon'] : ['breath', 'stomp'];
        var next = attacks[b.attackIndex++ % attacks.length];
        if (next === 'breath') { b.state = 'inhale'; b.stateTimer = GOD.INHALE_TICKS; world.events.push({ type: 'inhale' }); }
        else if (next === 'stomp') { b.state = 'crouch'; b.stateTimer = GOD.CROUCH_TICKS; world.events.push({ type: 'rumble' }); }
        else { b.state = 'roar'; b.stateTimer = GOD.ROAR_TICKS; world.events.push({ type: 'roar' }); }
      }
    } else if (b.state === 'inhale') {
      b.facing = pcx < cx ? -1 : 1;
      if (--b.stateTimer <= 0) { b.state = 'breathe'; b.stateTimer = GOD.BREATHE_TICKS; }
    } else if (b.state === 'breathe') {
      b.stateTimer--;
      if (b.stateTimer === 36 || b.stateTimer === 24 || b.stateTimer === 12) {
        breatheFireball(b, world, (36 - b.stateTimer) / 12 - 1);
      }
      if (b.stateTimer <= 0) backToWalking(b, angry);
    } else if (b.state === 'crouch') {
      if (--b.stateTimer <= 0) { b.state = 'jump'; b.vy = -GOD.JUMP_SPEED; }
    } else if (b.state === 'jump') {
      b.y += b.vy;
      b.vy += GOD.GRAVITY;
      if (b.y >= b.baseY) {
        b.y = b.baseY;
        b.vy = 0;
        [-1, 1].forEach(function (dir) {
          world.waves.push({
            x: cx - GOD.WAVE.w / 2 + dir * 60, y: b.groundY - GOD.WAVE.h,
            w: GOD.WAVE.w, h: GOD.WAVE.h, vx: dir * GOD.WAVE.speed, life: GOD.WAVE.life
          });
        });
        world.events.push({ type: 'stomp' });
        backToWalking(b, angry);
      }
    } else if (b.state === 'roar') {
      if (--b.stateTimer <= 0) {
        summonFish(b, world);
        backToWalking(b, angry);
      }
    }
  }

  function backToWalking(b, angry) {
    b.state = 'fly';
    b.attackTimer = angry ? GOD.ANGRY_ATTACK_EVERY : GOD.ATTACK_EVERY;
  }

  // spread: -1, 0 or 1 — the three fireballs fan out a little.
  function breatheFireball(b, world, spread) {
    var p = world.player;
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    var mx = cx + b.facing * GOD.MOUTH_X, my = cy + GOD.MOUTH_Y;
    var dx = Math.max(60, Math.abs(p.x + p.w / 2 - mx));
    var aim = (p.y + p.h / 2 - my) / dx * GOD.FIREBALL.speed;
    world.fireballs.push({
      x: mx - GOD.FIREBALL.w / 2, y: my - GOD.FIREBALL.h / 2,
      w: GOD.FIREBALL.w, h: GOD.FIREBALL.h,
      vx: b.facing * GOD.FIREBALL.speed,
      vy: Math.max(-2, Math.min(2.5, aim)) + spread * 0.7,
      life: GOD.FIREBALL.life
    });
    world.events.push({ type: 'whoosh' });
  }

  function summonFish(b, world) {
    var alive = world.enemies.filter(function (e) { return e.summoned && e.alive; }).length;
    for (var i = 0; i < 2 && alive < GOD.MAX_SUMMONED; i++, alive++) {
      var fish = MR.Enemies.create({
        type: 'fish', x: i ? b.maxX : b.minX, y: 200 + i * 120,
        minX: b.minX, maxX: b.maxX, speed: 1.3, dir: i ? -1 : 1
      });
      fish.summoned = true;
      world.enemies.push(fish);
    }
  }

  // God of the Zillas' fireballs and stomp shockwaves.
  function updateGodAttacks(world) {
    var i;
    for (i = world.fireballs.length - 1; i >= 0; i--) {
      var f = world.fireballs[i];
      f.x += f.vx; f.y += f.vy; f.life--;
      if (f.life <= 0 || f.y + f.h > world.height || f.y < world.waterTop - 20 ||
          f.x + f.w < 0 || f.x > world.width) world.fireballs.splice(i, 1);
    }
    for (i = world.waves.length - 1; i >= 0; i--) {
      var wv = world.waves[i];
      wv.x += wv.vx; wv.life--;
      if (wv.life <= 0 || wv.x + wv.w < 0 || wv.x > world.width ||
          MR.Physics.overlapsAny({ x: wv.x, y: wv.y, w: wv.w, h: wv.h - 4 }, world.solids)) world.waves.splice(i, 1);
    }
  }

  function patrol(b, speedScale) {
    b.x += b.dir * b.speed * speedScale;
    var cx = b.x + b.w / 2;
    if (cx >= b.maxX) { b.x = b.maxX - b.w / 2; b.dir = -1; }
    if (cx <= b.minX) { b.x = b.minX - b.w / 2; b.dir = 1; }
  }

  function updateTriTerror(b, world) {
    var angry = isAngry(b);
    var p = world.player;
    var toPlayer = p.x + p.w / 2 < b.x + b.w / 2 ? -1 : 1;

    if (b.state === 'fly') {
      patrol(b, angry ? 1.5 : 1);
      b.y = b.baseY + Math.sin(b.frame * 0.03) * b.swoop;
      b.facing = toPlayer;
      b.attackTimer--;
      if (b.attackTimer <= 0) {
        b.state = 'screech';
        b.stateTimer = TRI.SCREECH_TICKS;
        world.events.push({ type: 'screech' });
      }
    } else if (b.state === 'screech') {
      b.facing = toPlayer;
      if (--b.stateTimer <= 0) {
        b.state = 'spin';
        b.stateTimer = TRI.SPIN_TICKS;
        world.events.push({ type: 'spin' });
      }
    } else if (b.state === 'spin') {
      b.spinAngle += 0.45;
      b.stateTimer--;
      if (b.stateTimer === Math.floor(TRI.SPIN_TICKS / 2)) sendTornado(b, world, toPlayer, angry);
      if (b.stateTimer <= 0) {
        b.state = 'fly';
        b.spinAngle = 0;
        b.attackTimer = angry ? TRI.ANGRY_ATTACK_EVERY : TRI.ATTACK_EVERY;
      }
    }
  }

  function sendTornado(b, world, dir, angry) {
    world.tornadoes.push({
      x: b.x + b.w / 2 - TORNADO.w / 2 + dir * 30,
      y: b.groundY - TORNADO.h,
      w: TORNADO.w, h: TORNADO.h,
      vx: dir * (angry ? TORNADO.angrySpeed : TORNADO.speed),
      life: TORNADO.life
    });
    world.events.push({ type: 'whoosh' });
  }

  function updateOctoPie(b, world) {
    var angry = isAngry(b);
    patrol(b, angry ? 1.6 : 1);
    b.y = b.baseY + Math.sin(b.frame * 0.025) * b.swoop;

    var p = world.player;
    b.facing = p.x + p.w / 2 < b.x + b.w / 2 ? -1 : 1;

    b.throwTimer--;
    if (b.throwTimer <= 0) {
      throwPie(b, world);
      b.throwTimer = Math.round(b.throwEvery * (angry ? 0.65 : 1));
    }
  }

  function throwPie(b, world) {
    world.pies.push({
      x: b.facing > 0 ? b.x + b.w : b.x - PIE.w,
      y: b.y + b.h * 0.45,
      w: PIE.w, h: PIE.h,
      vx: b.facing * PIE.speed,
      life: PIE.life,
      spin: 0
    });
    world.events.push({ type: 'throw' });
  }

  function updateTornadoes(world) {
    for (var i = world.tornadoes.length - 1; i >= 0; i--) {
      var tw = world.tornadoes[i];
      tw.x += tw.vx;
      tw.life--;
      if (tw.life <= 0 || tw.x + tw.w < 0 || tw.x > world.width) world.tornadoes.splice(i, 1);
    }
  }

  function updatePies(world) {
    for (var i = world.pies.length - 1; i >= 0; i--) {
      var pie = world.pies[i];
      pie.x += pie.vx;
      pie.spin += 0.08;
      pie.life--;
      if (pie.life <= 0 || pie.x + pie.w < 0 || pie.x > world.width ||
          MR.Physics.overlapsAny(pie, world.solids)) {
        world.pies.splice(i, 1);
      }
    }
  }

  // Returns true when this hit defeats the boss.
  function hit(b) {
    if (!b.alive) return false;
    b.hp--;
    b.flash = FLASH_TICKS;
    if (b.hp <= 0) b.alive = false;
    return !b.alive;
  }

  return {
    TYPES: TYPES, PIE: PIE, TRI: TRI, TORNADO: TORNADO, GOD: GOD,
    create: create, update: update, updatePies: updatePies, updateTornadoes: updateTornadoes,
    updateGodAttacks: updateGodAttacks,
    hit: hit, isAngry: isAngry
  };
})();
