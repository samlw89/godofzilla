var MR = MR || {};

// Keyboard (and mouse click) state with "just pressed" detection.
// Codes are KeyboardEvent.code values, plus 'Click' for the mouse.
MR.Input = (function () {
  var down = {};
  var pressed = {};
  var clickPos = null;
  var GAME_KEYS = {
    ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Space: 1,
    Enter: 1, KeyP: 1, Escape: 1, KeyM: 1, KeyS: 1, KeyT: 1, KeyB: 1, KeyR: 1,
    Digit1: 1, Digit2: 1, Digit3: 1, Digit4: 1, Digit5: 1
  };

  function init(clickTarget, onAnyInput) {
    window.addEventListener('keydown', function (e) {
      if (GAME_KEYS[e.code]) e.preventDefault();
      if (!down[e.code]) pressed[e.code] = true;
      down[e.code] = true;
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
      click(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
  }

  function isDown(code) { return !!down[code]; }

  // Where the last click landed, as fractions (0..1) of the click target's
  // width and height. Only meaningful in a step where 'Click' was pressed.
  function lastClick() { return clickPos; }
  function wasPressed(code) { return !!pressed[code]; }

  // Called after each fixed update so a press is seen exactly once.
  function endStep() { pressed = {}; }

  return { init: init, isDown: isDown, wasPressed: wasPressed, lastClick: lastClick, endStep: endStep };
})();
