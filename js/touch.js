var MR = MR || {};

// On-screen buttons for touch screens (iPad, phones). Each button holds
// down the same key the keyboard would, through MR.Input.setSource('touch').
// Buttons are drawn with MR.Art.drawTouchButton, so the Instructor's tips can
// show exactly the same pictures.
//
// layout(area) places them:
//   area.overlay false: in a controller strip below the game picture
//   area.overlay true:  see-through, over the bottom corners of the game
MR.Touch = (function () {
  var BUTTONS = [
    { id: 'left', code: 'ArrowLeft' },
    { id: 'right', code: 'ArrowRight' },
    { id: 'flap', code: 'ArrowUp' },
    { id: 'zap', code: 'Space' },
    { id: 'rocket', code: 'KeyR' },
    { id: 'pause', code: 'KeyP' },
    { id: 'mute', code: 'KeyM' }
  ];
  var HIT_MARGIN = 12;   // fingers can land a little outside a button

  var layer = null;
  var enabled = false;
  var hidden = {};       // id -> true when a button is switched off (rocket not bought)
  var muted = false;
  var byId = {};

  function init(onAnyInput) {
    layer = document.createElement('div');
    layer.id = 'touch-controls';
    document.body.appendChild(layer);
    BUTTONS.forEach(function (b) {
      var el = document.createElement('canvas');
      el.className = 'touch-button';
      el.setAttribute('aria-label', b.id);
      layer.appendChild(el);
      byId[b.id] = { def: b, el: el, held: false, size: 0, x: 0, y: 0, visible: true };
    });

    // Work out which buttons every finger on the screen is pressing, so a
    // thumb can slide from ◀ to ▶ and several buttons can be held at once.
    function track(e) {
      if (!enabled) return;
      var held = {};
      for (var i = 0; i < e.touches.length; i++) {
        var id = hit(e.touches[i].clientX, e.touches[i].clientY);
        if (id) held[id] = true;
      }
      var onButton = false;
      for (var c = 0; c < e.changedTouches.length; c++) {
        if (hit(e.changedTouches[c].clientX, e.changedTouches[c].clientY)) onButton = true;
      }
      Object.keys(byId).forEach(function (id) { setHeld(id, !!held[id]); });
      if (onButton || e.type === 'touchmove') e.preventDefault();
      if (onButton && onAnyInput) onAnyInput();
    }
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(function (type) {
      document.addEventListener(type, track, { passive: false });
    });
  }

  function hit(x, y) {
    var found = null;
    Object.keys(byId).forEach(function (id) {
      var b = byId[id];
      if (!b.visible || !b.size) return;
      var r = b.size / 2 + HIT_MARGIN;
      if ((x - b.x) * (x - b.x) + (y - b.y) * (y - b.y) <= r * r) found = id;
    });
    return found;
  }

  function setHeld(id, held) {
    var b = byId[id];
    if (b.held === held) return;
    b.held = held;
    MR.Input.setSource('touch', b.def.code, held);
    draw(id);
  }

  function draw(id) {
    var b = byId[id];
    if (!b.size) return;
    var dpr = window.devicePixelRatio || 1;
    var px = Math.round(b.size * dpr);
    if (b.el.width !== px) { b.el.width = px; b.el.height = px; }
    var ctx = b.el.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, px, px);
    ctx.scale(px / 100, px / 100);
    MR.Art.drawTouchButton(ctx, 50, 50, 92, id, { pressed: b.held, muted: muted });
  }

  // area: { x, y, w, h, overlay } in page pixels.
  function layout(area) {
    if (!layer) return;
    layer.style.display = enabled && area ? 'block' : 'none';
    if (!enabled || !area) return;
    var vw = window.innerWidth;
    var d, cy, pad, left0, right0;
    if (area.overlay) {
      d = Math.max(56, Math.min(84, area.h * 0.2));
      cy = area.y + area.h - d / 2 - 12;
      left0 = area.x; right0 = area.x + area.w;
    } else {
      d = Math.min(area.h * 0.78, 124, vw * 0.13);
      cy = area.y + Math.min(area.h / 2, d * 0.65 + 24);
      left0 = 0; right0 = vw;
    }
    pad = Math.max(18, d * 0.28);
    layer.className = area.overlay ? 'overlay' : 'strip';
    place('left', left0 + pad + d / 2, cy, d);
    place('right', left0 + pad + d * 1.68, cy, d);
    place('zap', right0 - pad - d / 2, cy, d);
    place('flap', right0 - pad - d * 1.68, cy, d);
    place('rocket', right0 - pad - d * 2.78, cy, d * 0.85);
    // Pause and sound sit in the middle of the row, or on a row of their
    // own underneath when the screen is too narrow (an iPad held upright).
    var mid = (left0 + right0) / 2;
    var rowFull = (right0 - left0) < d * 7.6 + pad * 2;
    var midY = cy;
    if (rowFull && !area.overlay && area.h >= d * 2.1) midY = cy + d * 0.95;
    else if (rowFull) { midY = area.y + d * 0.45; }
    place('pause', mid - d * 0.42, midY, d * 0.6);
    place('mute', mid + d * 0.42, midY, d * 0.6);
  }

  function place(id, x, y, size) {
    var b = byId[id];
    b.x = x; b.y = y; b.size = size;
    b.el.style.width = size + 'px';
    b.el.style.height = size + 'px';
    b.el.style.left = (x - size / 2) + 'px';
    b.el.style.top = (y - size / 2) + 'px';
    applyVisibility(id);
    draw(id);
  }

  function applyVisibility(id) {
    var b = byId[id];
    b.visible = !hidden[id];
    b.el.style.display = b.visible ? 'block' : 'none';
    if (!b.visible) setHeld(id, false);
  }

  // Show or hide one button (e.g. the rocket button once it's bought).
  function setVisible(id, visible) {
    if (!byId[id] || !hidden[id] === !!visible) return;
    hidden[id] = !visible;
    applyVisibility(id);
  }

  function setEnabled(on) {
    enabled = !!on;
    if (!enabled) Object.keys(byId).forEach(function (id) { setHeld(id, false); });
    if (layer) layer.style.display = enabled ? 'block' : 'none';
  }

  function setMuted(m) {
    if (muted === m) return;
    muted = m;
    if (byId.mute) draw('mute');
  }

  return {
    BUTTONS: BUTTONS,
    init: init, layout: layout, setEnabled: setEnabled, setVisible: setVisible, setMuted: setMuted,
    isEnabled: function () { return enabled; }
  };
})();
