import { useEffect } from 'react';

/**
 * Listens to the microphone and detects a *blow* gesture (breath/wind), not just
 * any loud sound.
 *
 * Why frequency analysis: blowing across a mic is turbulent air → lots of energy
 * in the LOW band (~20-300Hz) and very little in the highs. Speech, music, claps
 * and taps spread energy into the mid/high bands, so we reject those by requiring
 * low-band energy to dominate. An adaptive noise floor (EMA) also cancels steady
 * background like the page's synth drone or room hum.
 *
 * - onFrame(level) : 0..1 low-band loudness each frame (level === -1 => denied).
 * - onBlow(peak)   : fires once when a sustained blow ends; peak = strongest
 *                    "excess over the noise floor" during that blow (0..1).
 */
export function useMicBlow(active, { onFrame, onBlow }) {
  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let ctx = null;
    let stream = null;

    let floor = 0; // adaptive noise floor (EMA of low-band level)
    let blowing = false;
    let peak = 0;
    let aboveFrames = 0;

    const DELTA = 0.1; // how far above the floor counts as a blow
    const LOW_MIN = 0.16; // absolute floor so silence never triggers
    const DOMINANCE = 1.4; // low band must beat high band by this ratio
    const MIN_FRAMES = 3; // sustained -> real blow, not a transient click

    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      .then((s) => {
        stream = s;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaStreamSource(s);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.6;
        src.connect(analyser);

        const bins = analyser.frequencyBinCount; // 1024
        const data = new Uint8Array(bins);
        const binHz = ctx.sampleRate / analyser.fftSize; // ~21-23 Hz/bin

        // Band edges in bins.
        const lowStart = Math.max(1, Math.floor(40 / binHz)); // skip DC/rumble
        const lowEnd = Math.ceil(300 / binHz);
        const highStart = Math.ceil(900 / binHz);
        const highEnd = Math.ceil(5000 / binHz);

        const avg = (from, to) => {
          let sum = 0;
          for (let i = from; i < to; i++) sum += data[i];
          return sum / (to - from) / 255; // 0..1
        };

        const loop = () => {
          analyser.getByteFrequencyData(data);
          const low = avg(lowStart, lowEnd);
          const high = avg(highStart, highEnd);

          onFrame?.(low);

          // Slowly track ambient when NOT clearly blowing.
          const excess = low - floor;
          const looksLikeBlow = low > LOW_MIN && low > high * DOMINANCE && excess > DELTA;
          if (!looksLikeBlow) floor = floor * 0.99 + low * 0.01;

          if (looksLikeBlow) {
            blowing = true;
            aboveFrames++;
            if (excess > peak) peak = excess;
          } else if (blowing) {
            blowing = false;
            if (aboveFrames >= MIN_FRAMES) onBlow?.(peak);
            aboveFrames = 0;
            peak = 0;
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      })
      .catch(() => onFrame?.(-1));

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}
