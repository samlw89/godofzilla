var MR = MR || {};

// Keyboard, mouse/tap, on-screen touch buttons and game controllers, all
// turned into the same "keys" with "just pressed" detection.
// Codes are KeyboardEvent.code values, plus 'Click' for a mouse click or a
// tap on the game picture. Touch buttons (js/touch.js) and controllers press
// the same codes as the keyboard, through named "sources".
MR.Input = (function () {
  var down = {};
  var pressed = {};
  var sources = {};      // name -> { code: true } held by touch buttons / pads
  var clickPos = null;
  var mode = null;       // what the player last used: 'keys' | 'touch' | 'pad'
  var modeListener = null;
  var GAME_KEYS = {
    ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Space: 1,
    Enter: 1, KeyP: 1, Escape: 1, KeyM: 1, KeyS: 1, KeyT: 1, KeyB: 1, KeyR: 1,
    Digit1: 1, Digit2: 1, Digit3: 1, Digit4: 1, Digit5: 1
  };

  function init(clickTarget, onAnyInput) {
    window.addEventListener('keydown', function (e) {
      if (GAME_KEYS[e.code]) e.preventDefault();
      if (!isDown(e.code)) pressed[e.code] = true;
      down[e.code] = true;
      setMode('keys');
      if (onAnyInput) onAnyInput();
    });
    window.addEventListener('keyup', function (e) {
      down[e.code] = false;
    });
    window.addEventListener('blur', function () {
      down = {};
    });
    function click(clientX, clientY) {
      var r = clickTarget.getBoundingClientRect();
      clickPos = { fx: (clientX - r.left) / r.width, fy: (clientY - r.top) / r.height };
      pressed.Click = true;
      if (onAnyInput) onAnyInput();
    }
    clickTarget.addEventListener('mousedown', function (e) {
      click(e.clientX, e.clientY);
    });
    clickTarget.addEventListener('touchstart', function (e) {
      e.preventDefault();
      // The finger that just landed (another may already be on a button).
      var t = e.changedTouches[0];
      click(t.clientX, t.clientY);
    }, { passive: false });
    // Any touch anywhere means the player is using a touch screen.
    window.addEventListener('touchstart', function () {
      setMode('touch');
      if (onAnyInput) onAnyInput();
    }, { passive: true, capture: true });
    // iPad Safari only lets sound start inside a touch, so try on lift too.
    window.addEventListener('touchend', function () {
      if (onAnyInput) onAnyInput();
    }, { passive: true, capture: true });
  }

  function isDown(code) {
    if (down[code]) return true;
    for (var name in sources) if (sources[name][code]) return true;
    return false;
  }

  // A touch button or controller holding (on) or letting go of a key.
  function setSource(name, code, on) {
    var was = isDown(code);
    (sources[name] = sources[name] || {})[code] = !!on;
    if (!was && isDown(code)) pressed[code] = true;
  }

  // ---------- game controllers (Xbox / PlayStation / MFi, standard layout) ----------

  var padHeld = {};

  function pollGamepads() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    var pads = navigator.getGamepads();
    var now = {};
    for (var i = 0; i < pads.length; i++) {
      var pad = pads[i];
      if (pad && pad.connected) readPad(pad, now);
    }
    var any = false, code;
    for (code in now) if (now[code]) any = true;
    for (code in now) if (!padHeld[code]) setSource('pad', code, true);
    for (code in padHeld) if (padHeld[code] && !now[code]) setSource('pad', code, false);
    padHeld = now;
    if (any) setMode('pad');
  }

  function readPad(pad, now) {
    function b(i) { return pad.buttons[i] && pad.buttons[i].pressed; }
    var ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    if (b(14) || ax < -0.5) now.ArrowLeft = true;            // d-pad / stick left
    if (b(15) || ax > 0.5) now.ArrowRight = true;            // d-pad / stick right
    if (b(12) || b(0) || ay < -0.6) now.ArrowUp = true;      // d-pad up / A: flap
    if (b(0)) now.Enter = true;                              // A: also "OK" on menus
    if (b(2) || b(1) || b(7)) now.Space = true;              // X / B / right trigger: zap
    if (b(3) || b(6)) now.KeyR = true;                       // Y / left trigger: rocket
    if (b(9)) now.KeyP = true;                               // Start: pause
    if (b(8)) now.KeyS = true;                               // Select: skip
  }

  // ---------- which kind of controls the player is using ----------

  function setMode(m) {
    if (mode === m) return;
    mode = m;
    if (modeListener) modeListener(m);
  }

  function onModeChange(fn) { modeListener = fn; }
  function getMode() { return mode; }

  // Where the last click landed, as fractions (0..1) of the click target's
  // width and height. Only meaningful in a step where 'Click' was pressed.
  function lastClick() { return clickPos; }
  function wasPressed(code) { return !!pressed[code]; }

  // Called after each fixed update so a press is seen exactly once.
  function endStep() { pressed = {}; }

  return {
    init: init, isDown: isDown, wasPressed: wasPressed, lastClick: lastClick, endStep: endStep,
    setSource: setSource, pollGamepads: pollGamepads, readPad: readPad,
    setMode: setMode, getMode: getMode, onModeChange: onModeChange
  };
})();
