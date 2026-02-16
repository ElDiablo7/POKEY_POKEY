/**
 * Procedural sound effects via Web Audio API
 */
(function () {
  var ctx = null;
  var enabled = true;

  function getCtx() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function playTone(freq, duration, type, volume) {
    var c = getCtx();
    if (!c || !enabled) return;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, c.currentTime + duration);
    osc.type = type || "sine";
    gain.gain.setValueAtTime(volume || 0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  function playNoise(duration, volume) {
    var c = getCtx();
    if (!c || !enabled) return;
    var bufferSize = c.sampleRate * duration;
    var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (volume || 0.1);
    var source = c.createBufferSource();
    source.buffer = buffer;
    var gain = c.createGain();
    gain.gain.setValueAtTime(volume || 0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(gain);
    gain.connect(c.destination);
    source.start();
    source.stop(c.currentTime + duration);
  }

  window.sounds = {
    enabled: function () { return enabled; },
    setEnabled: function (v) { enabled = !!v; },
    toggle: function () { enabled = !enabled; return enabled; },
    card: function () {
      playTone(880, 0.06, "sine", 0.12);
      setTimeout(function () { playTone(1100, 0.05, "sine", 0.1); }, 30);
    },
    chip: function () {
      playTone(660, 0.04, "triangle", 0.1);
      setTimeout(function () { playTone(880, 0.03, "triangle", 0.08); }, 20);
    },
    dice: function () {
      playNoise(0.15, 0.06);
      playTone(400, 0.12, "sine", 0.08);
      setTimeout(function () { playTone(600, 0.08, "sine", 0.06); }, 80);
    },
    win: function () {
      playTone(523, 0.12, "sine", 0.15);
      setTimeout(function () { playTone(659, 0.12, "sine", 0.14); }, 80);
      setTimeout(function () { playTone(784, 0.12, "sine", 0.13); }, 160);
      setTimeout(function () { playTone(1047, 0.2, "sine", 0.14); }, 240);
    },
    lose: function () {
      playTone(200, 0.15, "sawtooth", 0.08);
      setTimeout(function () { playTone(150, 0.2, "sawtooth", 0.06); }, 80);
    },
    click: function () { playTone(1200, 0.03, "sine", 0.06); },
    toast: function () {
      playTone(800, 0.05, "sine", 0.08);
      setTimeout(function () { playTone(1000, 0.04, "sine", 0.06); }, 40);
    },
    fold: function () {
      playTone(300, 0.1, "sine", 0.06);
      setTimeout(function () { playTone(250, 0.08, "sine", 0.05); }, 60);
    },
    slots: function () {
      playNoise(0.4, 0.04);
      for (var i = 0; i < 6; i++) {
        (function (j) {
          setTimeout(function () { playTone(400 + j * 80, 0.05, "square", 0.04); }, j * 70);
        })(i);
      }
    },
    deal: function () {
      playTone(523, 0.08, "sine", 0.12);
      setTimeout(function () { playTone(659, 0.06, "sine", 0.1); }, 60);
      setTimeout(function () { playTone(784, 0.08, "sine", 0.11); }, 120);
    },
  };
})();
