// Small shared helpers: element building, timing, animation, typed text.
import { parseRich } from './logic.js';

const params = new URLSearchParams(location.search);
// ?speed=20 runs everything faster, for checking the flow. Not linked from the site.
export const SPEED = Number(params.get('speed')) || 1;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const wait = (ms) => new Promise((r) => setTimeout(r, ms / SPEED));

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'style') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined) el.append(kid);
  return el;
}

const ASSET_VERSION = 3; // raise after replacing an image, so browsers fetch the new one
export const asset = (name) => `assets/${name}.webp?v=${ASSET_VERSION}`;
export const img = (name, props = {}) => h('img', { src: asset(name), alt: '', draggable: 'false', ...props });

/** Loads images before a scene starts. A missing file is logged and never blocks the piece. */
export function preload(names) {
  return Promise.all(
    names.map(
      (n) =>
        new Promise((res) => {
          const i = new Image();
          i.onload = i.onerror = () => {
            if (!i.naturalWidth) console.warn('Missing asset:', n);
            res();
          };
          i.src = asset(n);
        }),
    ),
  );
}

export function anim(el, keyframes, opts) {
  const duration = (reduced ? Math.min(opts.duration, 150) : opts.duration) / SPEED;
  const delay = (opts.delay || 0) / SPEED;
  const a = el.animate(keyframes, { fill: 'both', easing: 'cubic-bezier(.3,.7,.2,1)', ...opts, duration, delay });
  return a.finished.catch(() => {});
}

export const EASE = {
  overshoot: 'cubic-bezier(.2,1.45,.42,1)', // the cloud coming in overshoots and settles back
  fall: 'cubic-bezier(.55,0,.9,.45)', // a heavy object accelerating down
  inout: 'cubic-bezier(.65,0,.35,1)',
  out: 'cubic-bezier(.2,.7,.2,1)',
};

export const fadeIn = (el, duration = 800) => anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration });
export const fadeOut = (el, duration = 800) => anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration });

/**
 * Types rich text one letter at a time. Shown and hidden text sit side by side in the same line,
 * so nothing re-wraps as letters appear and the script face's joins stay intact.
 */
export function prepareType(el, text) {
  const parts = parseRich(text).map((run) => {
    const shown = document.createTextNode('');
    const hidden = h('span', { class: 'unshown' }, run.text);
    let wrap = h('span', {}, shown, hidden);
    if (run.em) wrap = h('em', {}, wrap);
    if (run.bold) wrap = h('strong', {}, wrap);
    el.append(wrap);
    return { full: run.text, shown, hidden };
  });
  const total = parts.reduce((n, p) => n + p.full.length, 0);
  const paint = (count) => {
    let left = count;
    for (const p of parts) {
      const n = Math.min(left, p.full.length);
      p.shown.data = p.full.slice(0, n);
      p.hidden.textContent = p.full.slice(n);
      left -= n;
    }
  };
  return ({ cps = 34, token = {} } = {}) => {
    if (reduced || cps === Infinity) {
      paint(total);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
    const start = performance.now();
    const rate = (cps * SPEED) / 1000;
    let painted = -1;
    const step = (now) => {
      const count = Math.min(token.skip ? total : Math.floor((now - start) * rate), total);
      if (count !== painted) {
        paint(count);
        painted = count;
      }
      if (count >= total) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    });
  };
}

export const typeInto = (el, text, opts) => prepareType(el, text)(opts);

/** Resolves on a click on `target`, or Enter or Space anywhere. */
export function waitClick(target) {
  return new Promise((resolve) => {
    const done = () => {
      target.removeEventListener('click', done);
      document.removeEventListener('keydown', onKey);
      resolve();
    };
    const onKey = (e) => {
      if (e.target.closest?.('.menu')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        done();
      }
    };
    target.addEventListener('click', done);
    document.addEventListener('keydown', onKey);
  });
}

/** A seeded random stream, so cloud layouts are the same on every visit. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
