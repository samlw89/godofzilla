var MR = MR || {};

// Synthesized sound effects with the Web Audio API — no audio files.
// Browsers only allow audio after a user gesture, so unlock() is called
// on the first key press or click.
MR.Sound = (function () {
  var ac = null, master = null, muted = false;
  var VOLUME = 0.6;

  function note(f, at, dur, vol) {
    return { f: f, at: at, dur: dur || 0.14, type: 'triangle', vol: vol || 0.18 };
  }

  var SFX = {
    tick: [{ f: 880, dur: 0.05, type: 'triangle', vol: 0.08 }],
    flap: [{ f: 220, f2: 340, dur: 0.08, vol: 0.05 }],
    zap: [{ f: 1400, f2: 180, dur: 0.16, type: 'square', vol: 0.07 }],
    hit: [{ f: 320, f2: 200, dur: 0.12, type: 'triangle', vol: 0.25 }],
    pop: [{ f: 300, f2: 1200, dur: 0.09, vol: 0.25 }, { f: 600, f2: 1800, dur: 0.08, vol: 0.18, at: 0.06 }],
    pling: [note(1568, 0, 0.12), note(2349, 0.06, 0.18, 0.14)],
    heart: [note(523, 0, 0.12, 0.2), note(784, 0.1, 0.22, 0.2)],
    hurt: [{ f: 420, f2: 110, dur: 0.35, type: 'sawtooth', vol: 0.1 }],
    respawn: [{ f: 262, f2: 523, dur: 0.45, type: 'triangle', vol: 0.15 }],
    buzz: [{ f: 160, f2: 220, dur: 0.5, type: 'sawtooth', vol: 0.06 }, { f: 165, f2: 230, dur: 0.5, type: 'square', vol: 0.03 }],
    whoosh: [{ f: 900, f2: 200, dur: 0.25, type: 'triangle', vol: 0.12 }],
    boing: [{ f: 180, f2: 520, dur: 0.2, type: 'triangle', vol: 0.15 }],
    stomp: [{ f: 140, f2: 45, dur: 0.28, vol: 0.4 }, { f: 90, f2: 40, dur: 0.2, type: 'triangle', vol: 0.25, at: 0.02 }],
    throw: [{ f: 500, f2: 250, dur: 0.18, type: 'triangle', vol: 0.12 }],
    bossDefeated: [note(392, 0.15, 0.12), note(523, 0.27, 0.12), note(659, 0.39, 0.12),
      note(784, 0.51, 0.4, 0.22), note(1047, 0.51, 0.4, 0.14)],
    golden: [note(1047, 0, 0.12, 0.2), note(1319, 0.08, 0.12, 0.2), note(1568, 0.16, 0.12, 0.2),
      note(2093, 0.24, 0.35, 0.22)],
    erupt: [{ f: 90, f2: 30, dur: 0.6, type: 'sawtooth', vol: 0.18 }, { f: 300, f2: 80, dur: 0.4, type: 'square', vol: 0.05, at: 0.05 }],
    screech: [{ f: 1200, f2: 1800, dur: 0.18, type: 'sawtooth', vol: 0.06 }, { f: 1700, f2: 1100, dur: 0.22, type: 'sawtooth', vol: 0.06, at: 0.16 },
      { f: 1300, f2: 1900, dur: 0.18, type: 'sawtooth', vol: 0.05, at: 0.36 }],
    spin: [{ f: 200, f2: 900, dur: 0.6, type: 'triangle', vol: 0.12 }],
    inhale: [{ f: 120, f2: 260, dur: 0.8, type: 'sawtooth', vol: 0.07 }],
    roar: [{ f: 110, f2: 70, dur: 0.9, type: 'sawtooth', vol: 0.18 }, { f: 160, f2: 90, dur: 0.8, type: 'square', vol: 0.06, at: 0.05 }],
    spikes: [{ f: 1400, f2: 900, dur: 0.08, type: 'triangle', vol: 0.08 }, { f: 1500, f2: 1000, dur: 0.08, type: 'triangle', vol: 0.08, at: 0.06 },
      { f: 1600, f2: 1100, dur: 0.08, type: 'triangle', vol: 0.08, at: 0.12 }],
    rocket: [{ f: 180, f2: 90, dur: 0.25, type: 'sawtooth', vol: 0.12 }, { f: 500, f2: 1400, dur: 0.3, type: 'triangle', vol: 0.08, at: 0.03 }],
    punch: [{ f: 160, f2: 60, dur: 0.15, type: 'square', vol: 0.18 }, { f: 900, f2: 300, dur: 0.06, type: 'triangle', vol: 0.12 }],
    woof: [{ f: 260, f2: 180, dur: 0.12, type: 'sawtooth', vol: 0.12 }, { f: 280, f2: 190, dur: 0.14, type: 'sawtooth', vol: 0.12, at: 0.18 }],
    buy: [note(1319, 0, 0.1, 0.2), note(1760, 0.08, 0.3, 0.22), { f: 2637, dur: 0.25, type: 'sine', vol: 0.08, at: 0.12 }],
    nope: [{ f: 220, f2: 180, dur: 0.18, type: 'triangle', vol: 0.15 }],
    rumble: [{ f: 70, f2: 40, dur: 0.9, type: 'sawtooth', vol: 0.14 }, { f: 55, f2: 35, dur: 0.9, vol: 0.3 }],
    chime: [note(660, 0, 0.2), note(880, 0.1, 0.2), note(1320, 0.2, 0.4)],
    complete: [note(523, 0), note(659, 0.13), note(784, 0.26), note(1047, 0.39, 0.3),
      note(784, 0.6, 0.12), note(1047, 0.72, 0.6, 0.2), note(1319, 0.72, 0.6, 0.12)]
  };

  function unlock() {
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        ac = new AC();
        master = ac.createGain();
        master.gain.value = muted ? 0 : VOLUME;
        master.connect(ac.destination);
      } catch (e) {
        ac = null;
        return;
      }
    }
    if (ac.state === 'suspended') ac.resume();
  }

  function tone(o) {
    var t0 = ac.currentTime + (o.at || 0);
    var osc = ac.createOscillator();
    var g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.02);
  }

  function play(name) {
    if (!ac || muted || !SFX[name]) return;
    SFX[name].forEach(tone);
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : VOLUME;
    return muted;
  }

  function isMuted() { return muted; }

  return { unlock: unlock, play: play, toggleMute: toggleMute, isMuted: isMuted };
})();
