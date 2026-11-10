// Synthesised paper-flip sound (filtered noise burst) — no audio asset needed.

let ctx;

export function playFlip() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    const dur = 0.32;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    const t = ctx.currentTime;
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.exponentialRampToValueAtTime(700, t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
  } catch {
    /* audio is optional */
  }
}
