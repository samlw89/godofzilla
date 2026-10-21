var MR = MR || {};

// The Instructor (drawn by Ben): a queue of tips shown one at a
// time in a speech bubble while gameplay is paused. No timers.
MR.Instructor = (function () {
  function create() {
    return { queue: [], current: null, isIntro: false, frame: 0 };
  }

  // Replace whatever is showing with a new list of tips.
  function show(ins, tips, isIntro) {
    ins.queue = tips.slice();
    ins.isIntro = !!isIntro;
    next(ins);
  }

  // Add one tip after any already queued.
  function enqueue(ins, tip) {
    if (!tip) return;
    if (ins.current) ins.queue.push(tip);
    else { ins.current = tip; ins.frame = 0; }
  }

  function next(ins) {
    ins.current = ins.queue.shift() || null;
    ins.frame = 0;
    if (!ins.current) ins.isIntro = false;
    return ins.current;
  }

  function skip(ins) {
    ins.queue = [];
    ins.current = null;
    ins.isIntro = false;
  }

  function isActive(ins) { return !!ins.current; }

  function draw(ctx, ins, canSkip, t) {
    var Art = MR.Art;
    var tip = ins.current;
    if (!tip) return;

    ctx.fillStyle = 'rgba(10,40,70,0.35)';
    ctx.fillRect(0, 0, 960, 540);

    var bx = 230, by = 318, bw = 700, bh = 196;
    Art.drawSpeechBubble(ctx, bx, by, bw, bh);
    var glow = ctx.createRadialGradient(112, 380, 20, 112, 380, 150);
    glow.addColorStop(0, 'rgba(255,250,235,0.95)');
    glow.addColorStop(0.65, 'rgba(255,250,235,0.75)');
    glow.addColorStop(1, 'rgba(255,250,235,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 230, 270, 310);
    Art.drawInstructor(ctx, 112, 362, ins.frame, ins.frame < 90, 1.12);

    // One short sentence
    var size = 30;
    while (size > 20 && Art.measureText(ctx, tip.text, size) > bw - 60) size -= 2;
    Art.drawText(ctx, tip.text, bx + 30, by + 46, size, Art.OUTLINE, 'left', 0);

    // The picture: keys to press, then an icon
    var x = bx + 30;
    (tip.keys || []).forEach(function (key) {
      x += Art.drawKeyCap(ctx, x, by + 86, key) + 16;
    });
    // "× 3" after the key for "press it this many times"
    if (tip.times) {
      Art.drawText(ctx, '× ' + tip.times, x, by + 112, 36, Art.OUTLINE, 'left', 0);
      x += Art.measureText(ctx, '× ' + tip.times, 36) + 16;
    }
    if (tip.icon) Art.drawIcon(ctx, tip.icon, x + 60, by + 112, t);

    // "Next" button that pulses (Space / Enter / click)
    var pulse = 1 + Math.sin(t * 0.12) * 0.08;
    ctx.save();
    ctx.translate(bx + bw - 52, by + bh - 50);
    ctx.scale(pulse, pulse);
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#4cc36a'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = Art.OUTLINE; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7, -12); ctx.lineTo(13, 0); ctx.lineTo(-7, 12); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
    Art.drawKeyCap(ctx, bx + bw - 210, by + bh - 70, 'SPACE', 0.75);

    if (ins.isIntro && canSkip) {
      Art.drawPromptRow(ctx, ['Press', { key: 'S' }, 'to skip'], 790, 92, 24);
    }
  }

  return { create: create, show: show, enqueue: enqueue, next: next, skip: skip, isActive: isActive, draw: draw };
})();
