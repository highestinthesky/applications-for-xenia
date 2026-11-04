// Pieces shared between scenes: cloud text box, scroll application, stamps, cloud curtain, dropdown.
import { h, img, anim, EASE, wait, prepareType, typeInto, waitClick, seeded, asset, fadeIn, fadeOut } from './fx.js';
import { parseRich } from './logic.js';
import { parchment as P, shared } from './copy.js';

export function richNodes(text) {
  return parseRich(text).map((r) => {
    let node = r.text;
    if (r.bold) node = h('strong', {}, node);
    if (r.em) node = h('em', {}, node);
    return node;
  });
}

// ------------------------------------------------------------------ Cloud text box

/** One cloud per question or remark. It comes in from the top and leaves downward. */
export class CloudBox {
  constructor(stage, { night = false, bolts = 0, content = null, dense = false, text = '', options = null } = {}) {
    this.text = h('p', { class: 'box-text' });
    this.body = h('div', { class: 'box-body' }, this.text);
    // The line and its answers take their final places before the cloud arrives, unseen,
    // so nothing moves when the letters type in or the answers appear.
    this.type = prepareType(this.text, text);
    this.text.classList.toggle('box-text-dots', text === '...');
    if (content) this.body.append(content);
    if (options) {
      this.answers = h('div', { class: 'box-options is-held' });
      this.picked = new Promise((resolve) => {
        options.forEach((opt, i) => {
          this.answers.append(h('button', { class: 'box-option', type: 'button', onclick: () => resolve(i) }, richNodes(opt)));
        });
      });
      this.body.append(this.answers);
    }
    this.el = h('div', { class: `box ${night ? 'box-night' : 'box-day'} ${dense ? 'box-dense' : ''}` }, this.body);
    for (let i = 0; i < bolts; i++) this.el.append(boltAt(i, bolts));
    stage.append(this.el);
  }

  enter() {
    return anim(this.el, [{ transform: 'translateY(-130vh)' }, { transform: 'translateY(0)' }], {
      duration: 780,
      easing: EASE.overshoot,
    });
  }

  async leave() {
    await anim(this.el, [{ transform: 'translateY(0)' }, { transform: 'translateY(130vh)' }], {
      duration: 520,
      easing: 'cubic-bezier(.5,0,.8,.4)',
    });
    this.el.remove();
  }

  /** Types the line. A click while typing finishes it. */
  async say(opts = {}) {
    const token = { skip: false };
    const skip = () => (token.skip = true);
    this.el.addEventListener('click', skip);
    await this.type({ token, ...opts });
    this.el.removeEventListener('click', skip);
  }

  async waitContinue() {
    const arrow = h('span', { class: 'box-next', 'aria-hidden': 'true' }, '→');
    this.el.append(arrow);
    this.el.classList.add('is-waiting');
    await waitClick(this.el);
    arrow.remove();
    this.el.classList.remove('is-waiting');
  }

  /** Reveals the answer buttons and resolves with the index picked. */
  choose() {
    this.answers.classList.remove('is-held');
    return this.picked;
  }
}

function boltAt(i, count) {
  const spots = [
    [-3, -5, -12], [93, -6, 14], [-5, 62, 8], [95, 60, -10],
    [24, -27, 6], [70, -27, -8], [22, 84, -6], [72, 84, 10],
  ];
  const [l, t, r] = spots[i % spots.length];
  return img(`bolt-${(i % 4) + 1}`, {
    class: 'box-bolt',
    style: { left: `${l}%`, top: `${t}%`, transform: `rotate(${r}deg)`, animationDelay: `${(i * 137) % 900}ms` },
  });
}

export async function ask(stage, text, options, boxOpts) {
  const box = new CloudBox(stage, { ...boxOpts, text, options });
  await box.enter();
  await box.say();
  const pick = await box.choose();
  await box.leave();
  return pick;
}

export async function remark(stage, text, boxOpts) {
  const box = new CloudBox(stage, { ...boxOpts, text });
  await box.enter();
  await box.say();
  await box.waitContinue();
  await box.leave();
}

// ------------------------------------------------------------------ Application scroll

/** The small application in the corner. Its two rollers start together and move apart. */
export class Scroll {
  constructor(stage, { height = 30 } = {}) {
    this.fields = {};
    this.height = height + 1.6; // room for the title
    this.sheet = h('div', { class: 'scroll-sheet' }, h('div', { class: 'scroll-title' }, P.title));
    this.body = h('div', { class: 'scroll-body', style: { backgroundImage: `url(${asset('scroll-body')})` } }, this.sheet);
    this.inner = h('div', { class: 'scroll' }, img('scroll-top', { class: 'roller' }), this.body, img('scroll-bottom', { class: 'roller' }));
    this.wrap = h('div', { class: 'scroll-wrap' }, this.inner);
    stage.append(this.wrap);
  }

  field(key, label, value = '') {
    const val = h('span', { class: 'scroll-value' }, richNodes(value));
    const row = h('div', { class: 'scroll-row' }, h('span', { class: 'scroll-label' }, label), val);
    this.sheet.append(row);
    this.fields[key] = val;
    return val;
  }

  heading(text) {
    this.sheet.append(h('div', { class: 'scroll-heading' }, text));
  }

  set(key, text) {
    this.fields[key].replaceChildren(...richNodes(text));
  }

  append(key, text) {
    const v = this.fields[key];
    v.append(document.createElement('br'), ...richNodes(text));
  }

  /** Writes an answer into a field one letter at a time. */
  async write(key, text, { append = false, cps = 45 } = {}) {
    const v = this.fields[key];
    if (append) v.append(document.createElement('br'));
    else v.replaceChildren();
    const line = h('span');
    v.append(line);
    await typeInto(line, text, { cps });
  }

  async unroll(instant = false) {
    const full = `${this.height}rem`;
    this.body.style.height = full;
    if (instant) return;
    await anim(this.body, [{ height: '0rem' }, { height: full }], { duration: 1500, easing: EASE.inout, fill: 'none' });
  }

  /** Enlarges and moves to the center of the screen, not too big. */
  async toCenter(scale = 1.32) {
    const r = this.wrap.getBoundingClientRect();
    const dx = innerWidth / 2 - (r.left + r.width / 2);
    this.wrap.classList.add('is-centered');
    this.centered = `translateX(${dx}px) scale(${scale})`;
    await anim(this.wrap, [{ transform: 'translateX(0) scale(1)' }, { transform: this.centered }], {
      duration: 900,
      easing: EASE.inout,
    });
  }

  /** Returns from the center to its corner. */
  async toCorner() {
    await anim(this.wrap, [{ transform: this.centered }, { transform: 'translateX(0) scale(1)' }], {
      duration: 800,
      easing: EASE.inout,
    });
    this.wrap.classList.remove('is-centered');
  }

  async leave() {
    await anim(this.wrap, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, composite: 'add' });
    this.wrap.remove();
  }
}

// ------------------------------------------------------------------ Stamps

/** The stamp starts large and above the paper, then falls into place like a heavy object. */
export async function stamp(paper, kind, { x = 50, y = 50, rotate = -15, width = 50, fall = 420, shadow = true } = {}) {
  const el = img(`stamp-${kind}`, {
    class: 'stamp',
    role: 'img',
    alt: kind.toUpperCase(),
    style: { left: `${x}%`, top: `${y}%`, width: `${width}%` },
  });
  paper.append(el);
  const at = (scale) => `translate(-50%,-50%) rotate(${rotate}deg) scale(${scale})`;
  await anim(
    el,
    [
      { transform: at(3.1), opacity: 0, ...(shadow && { filter: 'drop-shadow(1.4rem 2.4rem .9rem rgba(0,0,0,.45))' }) },
      { transform: at(2.5), opacity: 1, offset: 0.25, ...(shadow && { filter: 'drop-shadow(1.1rem 1.8rem .7rem rgba(0,0,0,.4))' }) },
      { transform: at(1), opacity: 1, ...(shadow && { filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))' }) },
    ],
    { duration: fall, easing: EASE.fall },
  );
  anim(
    paper,
    [
      { translate: '0 0' },
      { translate: '0 .35rem', offset: 0.3 },
      { translate: '0 -.1rem', offset: 0.65 },
      { translate: '0 0' },
    ],
    { duration: 220, easing: 'linear', fill: 'none' },
  );
}

// ------------------------------------------------------------------ Cloud curtain

const CLOUDS = {
  day: {
    base: '#1c7d9a',
    names: [
      'cloud-day-1', 'cloud-mist-2', 'cloud-color-1', 'cloud-mist-3', 'cloud-day-4', 'cloud-color-3',
      'cloud-mist-5', 'cloud-day-6', 'cloud-color-2', 'cloud-mist-7', 'cloud-day-2', 'cloud-color-4',
    ],
  },
  dark: {
    base: '#07060d',
    names: Array.from({ length: 14 }, (_, i) => `cloud-dark-${i + 1}`),
  },
};

export const curtainAssets = (palette) => CLOUDS[palette].names;

/** Full-screen cloud cover made of two wings, so it can part down the middle. */
export class Curtain {
  constructor(stage, palette, { covered = true } = {}) {
    const def = CLOUDS[palette];
    const rand = seeded(palette === 'day' ? 11 : 29);
    // Plates sit in their own layer under every cloud, so no plate edge can cut across a cloud.
    this.baseLeft = h('div', { class: 'wing wing-left' }, h('div', { class: 'wing-base', style: { background: def.base } }));
    this.baseRight = h('div', { class: 'wing wing-right' }, h('div', { class: 'wing-base', style: { background: def.base } }));
    this.left = h('div', { class: 'wing wing-left' });
    this.right = h('div', { class: 'wing wing-right' });
    this.clouds = [];
    // Day clouds get a second, larger layer underneath, offset to sit in the first layer's gaps.
    // Dark clouds pour out one by one, so they stay a single layer on their black plate.
    const layers = palette === 'day'
      ? [{ rows: 6, cols: 8, min: 30, spread: 10, shift: 0.5 }, { rows: 7, cols: 9, min: 20, spread: 12, shift: 0 }]
      : [{ rows: 7, cols: 9, min: 20, spread: 12, shift: 0 }];
    for (const { rows, cols, min, spread, shift } of layers) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
        const name = def.names[Math.floor(rand() * def.names.length)];
        const x = ((c + (r % 2 ? 0.5 : 0) + shift) / (cols - 1)) * 100 + (rand() - 0.5) * 5;
        const y = ((r + shift) / (rows - 1)) * 100 + (rand() - 0.5) * 6;
        const isLeft = x < 50;
        const wing = isLeft ? this.left : this.right;
        // Positions are stored as screen percentages, then converted to the wing's own space.
        const wingLeft = isLeft ? 0 : 42;
        const el = img(name, {
          class: 'curtain-cloud',
          style: {
            left: `${((x - wingLeft) / 58) * 100}%`,
            top: `${y}%`,
            width: `${min + rand() * spread}rem`,
            transform: `translate(-50%,-50%) ${rand() > 0.5 ? 'scaleX(-1)' : ''}`,
          },
        });
        wing.append(el);
        this.clouds.push(el);
        }
      }
    }
    this.el = h('div', { class: 'curtain' }, this.baseLeft, this.baseRight, this.left, this.right);
    if (!covered) this.el.style.visibility = 'hidden';
    stage.append(this.el);
  }

  slide(from, to, duration) {
    const move = (el, sign, a, b) =>
      anim(el, [{ transform: `translateX(${sign * a}%)` }, { transform: `translateX(${sign * b}%)` }], { duration, easing: EASE.inout });
    return Promise.all([
      move(this.baseLeft, -1, from, to), move(this.left, -1, from, to),
      move(this.baseRight, 1, from, to), move(this.right, 1, from, to),
    ]);
  }

  async part(duration = 2600) {
    await this.slide(0, 120, duration);
    this.el.remove();
  }

  async close(duration = 1800) {
    this.el.style.visibility = 'visible';
    await this.slide(120, 0, duration);
  }

  /** The clouds pour out from one point, one after another, until the screen is full. */
  async pourFrom(x, y) {
    this.el.style.visibility = 'visible';
    const bases = this.el.querySelectorAll('.wing-base');
    bases.forEach((b) => (b.style.opacity = 0));
    const rand = seeded(5);
    const order = [...this.clouds].sort(() => rand() - 0.5);
    const rects = new Map(order.map((c) => [c, c.getBoundingClientRect()]));
    const runs = order.map((c, i) => {
      const r = rects.get(c);
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height / 2);
      const rest = c.style.transform;
      return anim(
        c,
        [
          { transform: `translate(${dx}px,${dy}px) translate(-50%,-50%) scale(.04)`, opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { transform: rest, opacity: 1 },
        ],
        { duration: 1000, delay: i * 42, easing: EASE.out },
      );
    });
    await wait(order.length * 42 + 200);
    bases.forEach((b) => fadeIn(b, 400));
    await Promise.all(runs);
  }
}

// ------------------------------------------------------------------ Dropdown

/** A dropdown built into the page: full keyboard support and type-ahead. */
export class Dropdown {
  constructor({ label, placeholder, options, value = '', onchange = () => {} }) {
    this.options = options;
    this.value = value;
    this.onchange = onchange;
    this.placeholder = placeholder;
    this.active = Math.max(options.indexOf(value), 0);
    this.typed = '';
    const id = `dd-${Math.random().toString(36).slice(2, 8)}`;
    this.buttonText = h('span', {}, value || placeholder);
    this.button = h(
      'button',
      {
        class: 'dd-button',
        type: 'button',
        'aria-haspopup': 'listbox',
        'aria-expanded': 'false',
        'aria-label': label,
        'aria-controls': id,
        onclick: () => this.toggle(),
        onkeydown: (e) => this.key(e),
      },
      this.buttonText,
      h('span', { class: 'dd-caret', 'aria-hidden': 'true' }, '▾'),
    );
    this.items = options.map((o, i) =>
      h('li', { role: 'option', id: `${id}-${i}`, class: 'dd-item', onclick: () => this.pick(i) }, o),
    );
    this.list = h('ul', { class: 'dd-list', id, role: 'listbox', 'aria-label': label, hidden: true }, this.items);
    this.el = h('div', { class: 'dd' }, this.button, this.list);
    this.outside = (e) => {
      if (!this.el.contains(e.target)) this.close();
    };
  }

  toggle() {
    if (this.list.hidden) this.open();
    else this.close();
  }

  open() {
    this.list.hidden = false;
    this.button.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', this.outside);
    this.highlight(this.active);
  }

  close() {
    this.list.hidden = true;
    this.button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', this.outside);
  }

  highlight(i) {
    this.active = Math.min(Math.max(i, 0), this.items.length - 1);
    this.items.forEach((el, n) => el.classList.toggle('is-active', n === this.active));
    this.button.setAttribute('aria-activedescendant', this.items[this.active].id);
    this.items[this.active].scrollIntoView({ block: 'nearest' });
  }

  pick(i) {
    this.value = this.options[i];
    this.buttonText.textContent = this.value;
    this.button.classList.add('has-value');
    this.close();
    this.button.focus({ preventScroll: true });
    this.onchange(this.value);
  }

  key(e) {
    const open = !this.list.hidden;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) this.open();
      else this.highlight(this.active + (e.key === 'ArrowDown' ? 1 : -1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (open) {
        e.preventDefault();
        this.pick(this.active);
      }
    } else if (e.key === 'Escape') {
      this.close();
    } else if (e.key.length === 1) {
      clearTimeout(this.typedTimer);
      this.typed += e.key.toLowerCase();
      this.typedTimer = setTimeout(() => (this.typed = ''), 700);
      const hit = this.options.findIndex((o) => o.toLowerCase().startsWith(this.typed));
      if (hit >= 0) {
        if (!open) this.open();
        this.highlight(hit);
      }
    }
  }
}

// ------------------------------------------------------------------ Black screens and slots

/** Opens a modern form: a line drawn in on the black screen, gone at once. The black stays. */
export async function drawnLine(stage, text, cps = 16) {
  await document.fonts.load("2.9rem 'Faculty Glyphic'").catch(() => {});
  const line = h('p', { class: 'drawn-line drawn-line-rich' });
  stage.append(line);
  await typeInto(line, text, { cps });
  await wait(1200);
  await fadeOut(line, 500);
  line.remove();
  await wait(500);
}

/** Pitch black overlay. */
export function blackout(stage) {
  const el = h('div', { class: 'blackout' });
  stage.append(el);
  return el;
}

/** Held place for text the user has not written yet. Visible on purpose. */
export function slot(stage, text = shared.slot) {
  const el = h('div', { class: 'slot' }, `[ ${text} ]`);
  stage.append(el);
  return el;
}

export const parchmentLabels = P;
