// Runs the scenes in order: Aeolus, Ithaca, Gold Card, I-589, closing.
import { h } from './fx.js';
import { shared } from './copy.js';
import { clear, restore, seedForDirectJump } from './store.js';
import { run as aeolus } from './scenes/aeolus.js';
import { run as ithaca } from './scenes/ithaca.js';
import { run as goldcard } from './scenes/goldcard.js';
import { run as i589 } from './scenes/i589.js';
import { run as closing } from './scenes/closing.js';

const ORDER = [
  ['aeolus', aeolus],
  ['ithaca', ithaca],
  ['goldcard', goldcard],
  ['i589', i589],
  ['closing', closing],
];

/** Desktop screens only, per the user's decision. Touch is fine when the screen is large (a smartboard). */
function tooSmall() {
  const phoneLike = navigator.userAgentData?.mobile || Math.min(screen.width, screen.height) < 600;
  return phoneLike || innerWidth < 900 || innerHeight < 500;
}

function gate() {
  const notice = document.getElementById('unsupported');
  notice.textContent = shared.unsupported;
  const update = () => {
    notice.hidden = !tooSmall();
  };
  update();
  addEventListener('resize', update);
  return new Promise((resolve) => {
    if (!tooSmall()) return resolve();
    const again = () => {
      if (!tooSmall()) {
        removeEventListener('resize', again);
        resolve();
      }
    };
    addEventListener('resize', again);
  });
}

const MENU = [
  ['aeolus', 'Aeolus'],
  ['ithaca', 'Ithaca'],
  ['goldcard', 'Gold Card'],
  ['i589', 'Asylum'],
];
let setCurrent = () => {};

/** Three bars at the top left. Each form restarts cleanly by loading the page at that form. */
function buildMenu() {
  const list = h('ul', { class: 'menu-list', hidden: true }, MENU.map(([id, label]) =>
    h('li', {}, h('button', {
      class: 'menu-item',
      type: 'button',
      'data-id': id,
      onclick: () => location.assign(`?scene=${id}`),
    }, label))));
  const close = () => {
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  };
  const button = h('button', {
    class: 'menu-button',
    type: 'button',
    'aria-label': 'Menu',
    'aria-expanded': 'false',
    onclick: () => {
      list.hidden = !list.hidden;
      button.setAttribute('aria-expanded', String(!list.hidden));
    },
  }, h('span'), h('span'), h('span'));
  const menu = h('nav', { class: 'menu' }, button, list);
  document.addEventListener('pointerdown', (e) => {
    if (!menu.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !list.hidden) {
      close();
      button.focus();
    }
  });
  document.body.append(menu);
  setCurrent = (id) => {
    list.querySelectorAll('.menu-item').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === id)));
  };
}

async function start() {
  await gate();
  await document.fonts.ready;
  const stage = document.getElementById('stage');
  const ctx = { stage };
  const params = new URLSearchParams(location.search);
  const wanted = params.get('scene');
  ctx.part = params.get('part'); // ?scene=aeolus&part=2 starts Aeolus where the island is left
  let from = ORDER.findIndex(([id]) => id === wanted);
  if (from > 0 || ctx.part) {
    seedForDirectJump();
    restore();
  } else {
    clear();
    from = 0;
  }
  buildMenu();
  for (const [id, run] of ORDER.slice(from)) {
    document.body.dataset.scene = id;
    setCurrent(id);
    await run(ctx);
  }
}

start().catch((err) => {
  console.error(err);
  document.getElementById('stage').append(h('p', { class: 'crash' }, 'Something went wrong. Reload the page to start again.'));
});
