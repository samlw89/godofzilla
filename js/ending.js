var MR = MR || {};

// The ending, after beating the God of the Zillas: a celebration, then
// scrolling credits with every character, then "The End".
// Space / Enter / click moves on (the credits also scroll by themselves).
//   update(ending, { next }) -> list of sound names to play
//   draw(ctx, ending, t, upgrades)
MR.Ending = (function () {
  var W = 960, H = 540;
  var CREATOR = 'Benjamin Leonard-Williams';
  var ARTISTS = 'Ben & Seb Leonard-Williams';
  var CELEBRATE_TICKS = 420;
  var SCROLL_SPEED = 1.1;
  var MIN_TICKS = 40;

  var CAST = [
    { id: 'manray', name: 'Man Ray' },
    { id: 'bunny', name: '4 Bunny' },
    { id: 'spiky', name: 'Spiky' },
    { id: 'instructor', name: 'The Instructor' },
    { id: 'gerald', name: 'Gerald' },
    { id: 'god', name: 'The God of the Zillas' },
    { id: 'octopie', name: 'Octo-Pie' },
    { id: 'triterror', name: 'Tri-Terror' },
    { id: 'booty', name: 'Booty' },
    { id: 'beebot', name: 'Bee Bot' }
  ];
  var CAST_TOP = 340, ROW = 130;
  var CAST_END = CAST_TOP + CAST.length * ROW;
  var CREDITS_HEIGHT = CAST_END + 330;

  function create() {
    return { phase: 'celebrate', time: 0, scroll: 0, done: false };
  }

  function update(e, input) {
    var sounds = [];
    if (e.done) return sounds;
    if (e.phase === 'celebrate' && e.time === 0) sounds.push('complete');
    e.time++;
    var next = input.next && e.time > MIN_TICKS;
    if (e.phase === 'celebrate') {
      if (e.time >= CELEBRATE_TICKS || next) { e.phase = 'credits'; e.time = 0; e.scroll = 0; }
    } else if (e.phase === 'credits') {
      e.scroll += SCROLL_SPEED;
      if (e.scroll >= CREDITS_HEIGHT + H / 2 || next) {
        e.phase = 'end'; e.time = 0;
        sounds.push('chime');
      }
    } else if (e.phase === 'end') {
      if (next) e.done = true;
    }
    return sounds;
  }

  // ---------- drawing ----------

  function draw(ctx, e, t, upgrades) {
    var Art = MR.Art;
    MR.Background.draw(ctx, t * 0.4, t, MR.Themes.coral);
    MR.Background.drawSurface(ctx, t, MR.Themes.coral);
    if (e.phase === 'celebrate') drawCelebrate(ctx, Art, e, t, upgrades);
    else if (e.phase === 'credits') drawCredits(ctx, Art, e, t);
    else drawEnd(ctx, Art, e, t, upgrades);
  }

  function confetti(ctx, Art, t) {
    var cols = ['#ffcf3f', '#ff7ab6', '#7be0ff', '#a0f06a', '#c59bff'];
    for (var i = 0; i < 40; i++) {
      var x = (i * 97 + Math.sin(t * 0.03 + i) * 30) % W;
      var y = ((t * (1 + (i % 5) * 0.3) + i * 53) % (H + 40)) - 20;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.05 + i);
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(-5, -3, 10, 6);
      ctx.restore();
    }
  }

  // The three friends together.
  function friends(ctx, Art, t, upgrades, cy) {
    var hop = Math.abs(Math.sin(t * 0.08)) * 14;
    Art.drawManRay(ctx, 290, cy + 10 - hop * 0.5, 1, t, {
      scale: 1.7, rocket: upgrades.rocket, hat: upgrades.dog, punch: upgrades.punch ? 0 : undefined
    });
    Art.drawFourBunny(ctx, 500, cy + 40 - hop, t, { scale: 0.95, wave: true });
    Art.drawSpiky(ctx, 690, cy + 10 - Math.abs(Math.sin(t * 0.08 + 1)) * 14, -1, t, { scale: 1.05, wave: true });
    for (var i = 0; i < 5; i++) {
      var hy = cy - 60 - ((t * 0.7 + i * 40) % 160);
      ctx.globalAlpha = Math.max(0, Math.min(1, (hy - (cy - 220)) / 60));
      Art.drawHeart(ctx, 400 + i * 45 + Math.sin(t * 0.05 + i) * 12, hy, 24, true);
      ctx.globalAlpha = 1;
    }
  }

  function drawCelebrate(ctx, Art, e, t, upgrades) {
    confetti(ctx, Art, t);
    Art.drawText(ctx, 'You rescued 4 Bunny!', W / 2, 80, 56, '#ffcf3f');
    Art.drawText(ctx, 'The God of the Zillas is beaten for good!', W / 2, 140, 28, '#ffffff');
    friends(ctx, Art, t, upgrades, 330);
    if (e.time > MIN_TICKS) {
      Art.drawPromptRow(ctx, ['Press', { key: 'SPACE' }, 'for the credits'], W / 2, 505, 24);
    }
  }

  function drawCredits(ctx, Art, e, t) {
    ctx.fillStyle = 'rgba(10,30,60,0.55)';
    ctx.fillRect(0, 0, W, H);
    var top = H + 40 - e.scroll;
    function at(y) { return top + y; }
    function visible(y) { return at(y) > -120 && at(y) < H + 120; }

    if (visible(0)) Art.drawTitle(ctx, 'MAN RAY', W / 2, at(0), t);
    if (visible(130)) Art.drawText(ctx, 'Game by', W / 2, at(130), 30, '#ffffff');
    if (visible(178)) Art.drawText(ctx, CREATOR, W / 2, at(178), 46, '#ffe66b');
    if (visible(270)) Art.drawText(ctx, 'Starring', W / 2, at(270), 34, '#ffffff');

    CAST.forEach(function (c, i) {
      var y = CAST_TOP + i * ROW;
      if (!visible(y)) return;
      drawPortrait(ctx, Art, c.id, 390, at(y), t);
      Art.drawText(ctx, c.name, 480, at(y), 36, '#ffffff', 'left');
    });

    if (visible(CAST_END + 40)) Art.drawText(ctx, 'All characters drawn by', W / 2, at(CAST_END + 40), 30, '#ffffff');
    if (visible(CAST_END + 88)) Art.drawText(ctx, ARTISTS, W / 2, at(CAST_END + 88), 40, '#ffe66b');
    if (visible(CAST_END + 210)) Art.drawText(ctx, 'Thanks for playing!', W / 2, at(CAST_END + 210), 52, '#a0f06a');

    Art.drawPromptRow(ctx, ['Press', { key: 'SPACE' }, 'to skip'], 850, 26, 18);
  }

  function drawEnd(ctx, Art, e, t, upgrades) {
    confetti(ctx, Art, t);
    Art.drawTitle(ctx, 'THE END', W / 2, 90, t);
    friends(ctx, Art, t, upgrades, 300);
    Art.drawText(ctx, 'Game by ' + CREATOR, W / 2, 440, 28, '#ffe66b');
    if (e.time > MIN_TICKS) {
      Art.drawPromptRow(ctx, ['Press', { key: 'SPACE' }, 'to play again'], W / 2, 500, 26);
    }
  }

  // A small picture of each character for the credits.
  function drawPortrait(ctx, Art, id, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    switch (id) {
      case 'manray': Art.drawManRay(ctx, 0, 0, 1, t, { scale: 0.85 }); break;
      case 'bunny': Art.drawFourBunny(ctx, 0, 10, t, { scale: 0.5, wave: true }); break;
      case 'spiky': Art.drawSpiky(ctx, 0, -4, 1, t, { scale: 0.62, wave: true }); break;
      case 'instructor': Art.drawInstructor(ctx, 0, -6, t, false, 0.42); break;
      case 'gerald': ctx.scale(0.42, 0.42); Art.drawGerald(ctx, 0, 0, t, {}); break;
      case 'god': Art.drawGodOfZillas(ctx, 0, 0, 1, t, { scale: 0.42, breath: true }); break;
      case 'octopie': ctx.scale(0.6, 0.6); Art.drawOctoPie(ctx, 0, 0, 1, t, false, false); break;
      case 'triterror': ctx.scale(0.55, 0.55); Art.drawTriTerror(ctx, 0, 10, 1, t, false, {}); break;
      case 'booty': Art.drawBooty(ctx, 0, 0, 1, t, false, 'idle', false); break;
      case 'beebot': Art.drawBeeBot(ctx, 0, 0, 1, t, false, 'hover', false); break;
    }
    ctx.restore();
  }

  return {
    CREATOR: CREATOR, ARTISTS: ARTISTS, CAST: CAST, CELEBRATE_TICKS: CELEBRATE_TICKS, CREDITS_HEIGHT: CREDITS_HEIGHT,
    create: create, update: update, draw: draw
  };
})();
