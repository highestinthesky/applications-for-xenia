// Opens the homepage, or the one form named in the address. Each form returns to the homepage when it ends.
import { h, SPEED } from './fx.js';
import { shared } from './copy.js';
import { clear, seedForDirectJump } from './store.js';
import { run as homepage } from './scenes/home.js';
import { run as aeolus } from './scenes/aeolus.js';
import { run as ithaca } from './scenes/ithaca.js';
import { run as goldcard } from './scenes/goldcard.js';
import { run as i589 } from './scenes/i589.js';

const FORMS = { aeolus, ithaca, goldcard, i589 };

// ?speed= is for checking only. Keeping it here lets a sped-up run go all the way round.
const SPEED_PARAM = SPEED === 1 ? '' : `speed=${SPEED}`;
const homeUrl = () => location.pathname + (SPEED_PARAM && `?${SPEED_PARAM}`);
const formUrl = (id) => `?scene=${id}${SPEED_PARAM && `&${SPEED_PARAM}`}`;

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

async function start() {
  await gate();
  await document.fonts.ready;
  const stage = document.getElementById('stage');
  const ctx = { stage };
  const params = new URLSearchParams(location.search);
  const id = params.get('scene');
  ctx.part = params.get('part'); // ?scene=aeolus&part=2 starts Aeolus where the island is left, for checking

  clear(); // the forms are independent: every page starts with no answers
  if (!Object.hasOwn(FORMS, id ?? '')) {
    document.body.dataset.scene = 'home';
    await homepage(ctx, formUrl);
    return;
  }
  if (ctx.part) seedForDirectJump();
  document.body.dataset.scene = id;
  await FORMS[id](ctx);
  location.assign(homeUrl()); // every form ends on black, and the homepage opens from black
}

start().catch((err) => {
  console.error(err);
  document.getElementById('stage').append(h('p', { class: 'crash' }, 'Something went wrong. Reload the page to start again.'));
});
