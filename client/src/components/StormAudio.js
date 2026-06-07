// Synthesized storm soundscape using the Web Audio API — no audio files needed.
// Exposes a tiny controller: start(), stop(), thunder().
// Wind = filtered noise; drone = low detuned oscillators; thunder = noise burst
// shaped by a lowpass + sharp decay envelope (fired in sync with lightning).

function makeNoiseBuffer(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Deterministic-ish pseudo noise (avoids Math.random ban concerns; quality fine for noise).
  let seed = 22222;
  for (let i = 0; i < len; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  return buffer;
}

export function createStormAudio() {
  let ctx = null;
  let master = null;
  let windSrc = null;
  let drone = [];
  let running = false;

  function ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
  }

  function start() {
    ensure();
    if (running) return;
    running = true;
    if (ctx.state === 'suspended') ctx.resume();

    // Wind: looping noise through a slowly sweeping bandpass.
    const noise = ctx.createBufferSource();
    noise.buffer = makeNoiseBuffer(ctx, 3);
    noise.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 500;
    windFilter.Q.value = 0.7;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.10;
    // LFO sweeping the wind filter for a howling feel.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 350;
    lfo.connect(lfoGain).connect(windFilter.frequency);
    noise.connect(windFilter).connect(windGain).connect(master);
    noise.start();
    lfo.start();
    windSrc = { noise, lfo };

    // Low drone: two detuned oscillators for an ominous bed.
    [55, 55.4].forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 200;
      osc.connect(lp).connect(g).connect(master);
      osc.start();
      drone.push(osc);
    });

    // Fade master in.
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.8, ctx.currentTime, 0.6);
  }

  function stop() {
    if (!ctx || !running) return;
    running = false;
    master.gain.setTargetAtTime(0.0, ctx.currentTime, 0.4);
    setTimeout(() => {
      try {
        windSrc?.noise.stop();
        windSrc?.lfo.stop();
        drone.forEach((o) => o.stop());
      } catch {
        /* already stopped */
      }
      drone = [];
      windSrc = null;
    }, 700);
  }

  // A single thunder clap: short noise burst, lowpass swept down, fast attack + long tail.
  function thunder(intensity = 1) {
    if (!ctx || !running) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(ctx, 1.8);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900 * intensity, t);
    lp.frequency.exponentialRampToValueAtTime(80, t + 1.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * intensity, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    src.connect(lp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 1.8);
  }

  return { start, stop, thunder, isRunning: () => running };
}
