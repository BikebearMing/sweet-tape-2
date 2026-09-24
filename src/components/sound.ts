/* Sweet Tape — sound.
 *
 * OFF on every visit until the reader asks for it (the button beside the menu
 * tab). Plain Web Audio: one context, one master gain, and the two shapes a
 * sound takes here — a one-shot, and a loop something drives by level every
 * frame (the hero's tape paying out).
 *
 * NOT REMEMBERED, on purpose. A browser will not start audio without a click, a
 * tap or a key — a SCROLL IS NOT ONE — so a remembered "on" showed the sound-on
 * icon over a silent page until the reader happened to click something. Off
 * until pressed means the press is itself the gesture, and the icon never lies.
 * Nothing is fetched until sound is on, and a file that is not there is silence
 * rather than an error: the site runs with or without its audio, the same way
 * the hero runs with or without its GLB.
 */

/** Served from /public/assets/sounds. Swap the files, keep the names. */
export const SOUNDS = {
  TAPE_STRETCH: "/assets/sounds/tape-stretch.wav", // a LOOP — cut it seamless
  TAPE_CUT: "/assets/sounds/tape-cut.mp3",
  SLIDE_CHANGE: "/assets/sounds/slide-change.mp3", // the slider landing on a new roll
  TAPE_PRESS: "/assets/sounds/tape-press.wav", // a hero letter pressed back down
  BALL_HIT: "/assets/sounds/ball-thock.wav", // a footer ball landing or knocking another
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = false;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const listeners = new Set<(on: boolean) => void>();

function load(url: string) {
  let b = buffers.get(url);
  if (!b) {
    b = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((data) => ctx!.decodeAudioData(data))
      .catch(() => null);
    buffers.set(url, b);
  }
  return b;
}

/* resume() outside a gesture is refused quietly and the context stays
   suspended, so this is safe to call from anywhere and is retried on the first
   real gesture below. */
function wake() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  void ctx.resume();
}

export const isSoundOn = () => on;

export function setSoundOn(next: boolean) {
  on = next;
  if (on) wake();
  // Suspended rather than muted: a silent context still costs a render thread.
  else void ctx?.suspend();
  listeners.forEach((fn) => fn(on));
}

/** Returns the unsubscribe. */
export function onSoundChange(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

export function playOnce(url: string, volume = 1) {
  if (!on) return;
  wake();
  void load(url).then((buffer) => {
    if (!buffer || !on || !ctx || !master) return;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    gain.gain.value = volume;
    src.connect(gain).connect(master);
    src.start();
  });
}

/** A loop driven by level: set(0..1, playbackRate) every frame, stop() at
 *  teardown. The source is only started by the first non-zero level with sound
 *  on, so a reader who never asks for sound never fetches the file. */
export function createLoop(url: string) {
  let gain: GainNode | null = null;
  let src: AudioBufferSourceNode | null = null;
  let starting = false;
  let stopped = false;

  return {
    set(level: number, rate = 1) {
      if (gain && src && ctx) {
        // Eased, not set: a per-frame level is a staircase, and a staircase on
        // a gain is a buzz.
        gain.gain.setTargetAtTime(on ? level : 0, ctx.currentTime, 0.06);
        src.playbackRate.setTargetAtTime(rate, ctx.currentTime, 0.06);
        return;
      }
      if (!on || level <= 0 || starting) return;
      starting = true;
      wake();
      void load(url).then((buffer) => {
        if (!buffer || stopped || !ctx || !master) return;
        src = ctx.createBufferSource();
        gain = ctx.createGain();
        src.buffer = buffer;
        src.loop = true;
        gain.gain.value = 0;
        src.connect(gain).connect(master);
        src.start();
      });
    },
    stop() {
      stopped = true;
      src?.stop();
      src?.disconnect();
      gain?.disconnect();
      src = gain = null;
    },
  };
}
