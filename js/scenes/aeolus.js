// Aeolus: the clouds part, the guest is welcomed and sent off with the bag; the sea, the opened bag,
// and the return to the same island at night, where the same form comes back and is refused.
import { h, img, anim, EASE, wait, preload, fadeIn, fadeOut, seeded } from '../fx.js';
import { CloudBox, Scroll, Curtain, ask, remark, stamp, curtainAssets, blackout, parchmentLabels as P } from '../parts.js';
import { aeolus1 as T, aeolus2 as T2 } from '../copy.js';
import { newAeolus1, aeolus1Next } from '../logic.js';
import { answers } from '../store.js';

const NIGHT = { night: true };

const WORLD_ASSETS = ['sky-day', 'island-day', 'island-day-soft', 'bank-day', 'sky-night', 'island-night', 'island-night-soft', 'bank-night',
  ...Array.from({ length: 9 }, (_, i) => `boulder-${i + 1}`)];

// Boulders float beside the island: x and y are percent of the screen, size in rem.
const BOULDERS = [
  { n: 1, x: 84, y: 16, w: 10 }, { n: 2, x: 11, y: 13, w: 7.5 }, { n: 3, x: 16, y: 49, w: 6 },
  { n: 4, x: 4, y: 37, w: 2.4 }, { n: 5, x: 74, y: 7, w: 2.6 }, { n: 6, x: 95, y: 44, w: 2.6 },
  { n: 7, x: 27, y: 9, w: 1.9 }, { n: 8, x: 93, y: 9, w: 1.6 }, { n: 9, x: 21, y: 31, w: 1.8 },
];

/** The sky, island, boulders and cloud bank. The return builds the same world at night. */
function buildWorld(stage, time = 'day') {
  const rand = seeded(3);
  const boulders = BOULDERS.map((b) => {
    const rock = img(`boulder-${b.n}`, { class: 'boulder-rock' });
    rock.style.animationDelay = `${-rand() * 6}s`;
    rock.style.animationDuration = `${5 + rand() * 3}s`;
    return h('div', { class: 'boulder', style: { left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}rem` } }, rock);
  });
  const world = h(
    'div',
    { class: `world world-${time}` },
    img(`sky-${time}`, { class: 'sky' }),
    h('div', { class: 'boulders' }, boulders),
    h('div', { class: 'island' }, img(`island-${time}`, { class: 'island-sharp' }), img(`island-${time}-soft`, { class: 'island-soft' })),
    img(`bank-${time}`, { class: 'bank' }),
  );
  stage.append(world);
  return world;
}

/** Fully automatic: the island and boulders move in and come into focus as the clouds part. */
function openWorld(world, curtain) {
  const island = world.querySelector('.island');
  const bank = world.querySelector('.bank');
  const rocks = world.querySelector('.boulders');
  const d = 3400;
  return Promise.all([
    curtain.part(2800),
    anim(island, [{ transform: 'scale(.46) translateY(16%)' }, { transform: 'scale(1) translateY(0)' }], { duration: d, easing: EASE.out }),
    anim(island.querySelector('.island-soft'), [{ opacity: 1 }, { opacity: 0 }], { duration: d, easing: EASE.out }),
    anim(rocks, [{ transform: 'scale(.62)' }, { transform: 'scale(1)' }], { duration: d, easing: EASE.out }),
    anim(bank, [{ transform: 'translateY(12%)' }, { transform: 'translateY(0)' }], { duration: d, easing: EASE.out }),
  ]);
}

async function feast(stage, dishNumber) {
  const dish = img(`dish-${dishNumber}`, { class: 'feast-dish' });
  const box = new CloudBox(stage, { content: dish });
  box.el.classList.add('box-feast');
  box.text.remove();
  await box.enter();
  await wait(1500);
  const black = h('div', { class: 'box-black' });
  box.el.append(black);
  await fadeIn(black, 700);
  dish.src = 'assets/dish-eaten.webp';
  dish.classList.add('is-eaten');
  dish.style.rotate = `${dishNumber * 70}deg`;
  await wait(500);
  await fadeOut(black, 700);
  black.remove();
  await wait(1300);
  await box.leave();
}

/** Who are you, and where are you from? Fills the application as the visitor answers. */
const cleanName = (raw) => raw.replace(/\*/g, '').trim();

async function askWho(stage, scroll) {
  let submitted = () => {};
  const nameInput = h('input', {
    class: 'box-input',
    type: 'text',
    maxlength: 32,
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-label': T.q5.nameLabel,
  });
  const homelandRow = h('div', { class: 'box-pills', role: 'radiogroup', 'aria-label': T.q5.homelandLabel });
  const confirm = h('button', { class: 'box-confirm', type: 'submit', disabled: true, 'aria-label': 'Continue' }, '→');
  const form = h(
    'form',
    { class: 'box-form', onsubmit: (e) => { e.preventDefault(); if (!confirm.disabled) submitted(); } },
    h('label', { class: 'box-field' }, h('span', {}, T.q5.nameLabel), nameInput),
    h('div', { class: 'box-field' }, h('span', {}, T.q5.homelandLabel), homelandRow),
    confirm,
  );
  let homeland = '';
  const refresh = () => {
    const name = cleanName(nameInput.value);
    scroll.set('name', name);
    scroll.set('homeland', homeland);
    confirm.disabled = !(name && homeland);
  };
  T.q5.homelands.forEach((place) => {
    const b = h('button', {
      class: 'box-pill',
      type: 'button',
      role: 'radio',
      'aria-checked': 'false',
      onclick: () => {
        homeland = place;
        homelandRow.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        refresh();
      },
    }, place);
    homelandRow.append(b);
  });
  nameInput.addEventListener('input', refresh);

  form.classList.add('is-held');
  const box = new CloudBox(stage, { content: form, text: T.q5.text });
  await box.enter();
  await box.say();
  form.classList.remove('is-held');
  nameInput.focus({ preventScroll: true });
  await new Promise((resolve) => (submitted = resolve));
  answers.name = cleanName(nameInput.value);
  answers.homeland = homeland;
  await box.leave();
}

async function tellStory(stage, scroll) {
  await askWho(stage, scroll);
  const troy = await ask(stage, T.q6.text, T.q6.options);
  answers.troy = T.q6.options[troy];
  scroll.append('account', answers.troy);
  const since = await ask(stage, T.q7.text, T.q7.options);
  // Saved on its own: every option names Polyphemus, and the return uses it against the visitor.
  answers.since = T.q7.options[since];
  scroll.append('account', answers.since);
}

async function giveBag(stage, scroll) {
  const inBox = img('bag', { class: 'box-bag' });
  const box = new CloudBox(stage, { content: inBox, text: T.r9 });
  await box.enter();
  await box.say();
  await box.waitContinue();
  const from = inBox.getBoundingClientRect();
  const bag = img('bag', { class: 'bag', role: 'img', alt: 'The bag of winds, tied with a silver cord' });
  stage.append(bag);
  const to = bag.getBoundingClientRect();
  inBox.style.visibility = 'hidden';
  // The bag shrinks and stays at the right side of the screen.
  const fly = anim(
    bag,
    [
      { transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width})`, transformOrigin: 'top left' },
      { transform: 'translate(0,0) scale(1)', transformOrigin: 'top left' },
    ],
    { duration: 900, easing: EASE.inout },
  );
  box.leave();
  await fly;

  // The form returns, now filled in, under the stamp it was given before any of this was asked.
  await scroll.toCenter();
  await wait(2600);
  await scroll.leave();
  return bag;
}

/** From the parting clouds to the bag in hand. */
async function arrival(stage) {
  const world = buildWorld(stage, 'day');
  const curtain = new Curtain(stage, 'day');
  await wait(600);
  await openWorld(world, curtain);

  const scroll = new Scroll(stage, { height: 27 });
  scroll.field('name', P.name);
  scroll.field('homeland', P.homeland);
  scroll.field('account', P.account);
  await scroll.unroll();

  // #1 and #2. No name yet: by standard xenia, name and origin come after the guest is fed.
  const first = await ask(stage, T.q1.text, T.q1.options);
  answers.purpose = T.q1.options[first];
  scroll.set('account', answers.purpose);
  await remark(stage, T.r2);

  // Approved at the welcome, on a form with no name or story on it yet (user's decision, 2026-11-03):
  // xenia comes first, and the application is filled in afterward, underneath the stamp.
  await scroll.toCenter();
  await wait(300);
  await stamp(scroll.body, 'approved', { y: 74 });
  await wait(1600);
  await scroll.toCorner();

  let state = newAeolus1();
  let step = 'q3';
  const go = (event) => {
    const r = aeolus1Next(state, event);
    state = r.state;
    step = r.step;
  };
  while (step !== 'gift') {
    if (step === 'q3') {
      const offered = state.feasts === 0 ? T.q3.options.slice(0, 1) : T.q3.options;
      go((await ask(stage, T.q3.text, offered)) === 0 ? 'q3:stay' : 'q3:leave');
    }
    else if (step === 'r4') {
      await remark(stage, T.r4);
      go('r4:done');
    } else if (step === 'feast') {
      await feast(stage, state.feasts + 1);
      go('feast:done');
    } else if (step === 'story') {
      await tellStory(stage, scroll);
      go('story:done');
    } else if (step === 'q8') go((await ask(stage, T.q8.text, T.q8.options)) === 0 ? 'q8:stay' : 'q8:leave');
    else if (step === 'month') {
      await remark(stage, T.month);
      go('month:done');
    }
  }

  const bag = await giveBag(stage, scroll);
  return { world, bag };
}

/** Rows of the wave symbol. One line moves right; the next, the mirrored image, moves left. */
function buildSea(stage) {
  const rows = [];
  for (let i = 0; i < 14; i++) {
    const dir = i % 2 ? 'left' : 'right';
    rows.push(h('div', { class: `sea-row sea-${dir}`, style: { backgroundImage: `url(assets/sea-${dir}.webp)` } }));
  }
  const sea = h('div', { class: 'sea' }, rows);
  stage.prepend(sea);
  return sea;
}

/**
 * Leaving the island (user's change, 2026-11-03; Full vision had it all shrink). The sky and cloud bank
 * fade to the sea, the mountain lifts off the top of the screen, and the boulders are pulled up after it:
 * each sags, is jerked upward, drops back a little, then goes. The ones nearest the mountain go first.
 */
async function leaveIsland(world) {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const clearTop = (el) => el.getBoundingClientRect().bottom + 2 * rem;
  const island = world.querySelector('.island');
  const lift = 2200;
  const moves = [
    anim(world.querySelector('.sky'), [{ opacity: 1 }, { opacity: 0 }], { duration: 2400, easing: 'ease-in-out' }),
    anim(world.querySelector('.bank'), [{ opacity: 1 }, { opacity: 0 }], { duration: 2400, easing: 'ease-in-out' }),
    anim(island, [{ transform: 'translateY(0)' }, { transform: `translateY(${-clearTop(island)}px)` }], {
      duration: lift,
      easing: 'cubic-bezier(.55,0,.75,.45)',
    }),
  ];
  world.querySelectorAll('.boulder').forEach((b) => {
    const fromMountain = Math.abs(parseFloat(b.style.left) - 50) / 46;
    moves.push(anim(
      b,
      [
        { transform: 'translateY(0)', easing: 'ease-out' },
        { transform: 'translateY(.9rem)', offset: 0.14, easing: 'ease-in-out' },
        { transform: 'translateY(-3.2rem)', offset: 0.38, easing: 'ease-in-out' },
        { transform: 'translateY(-1.2rem)', offset: 0.52, easing: 'cubic-bezier(.55,0,.8,.5)' },
        { transform: `translateY(${-clearTop(b)}px)` },
      ],
      { duration: lift, delay: 250 + fromMountain * 450, easing: 'linear' }, // each step above has its own easing
    ));
  });
  await Promise.all(moves);
  world.remove();
}

async function theVoyage(stage, world, bag) {
  const sea = buildSea(stage);
  await leaveIsland(world);
  await wait(1800);

  // The screen turns black as he falls asleep. The bag stays lit, and becomes the centerpiece.
  const black = blackout(stage);
  black.classList.add('blackout-under-bag');
  await fadeIn(black, 1600);
  sea.remove();
  const r = bag.getBoundingClientRect();
  const scale = 2.6;
  const dx = innerWidth / 2 - (r.left + r.width / 2);
  const dy = innerHeight / 2 - (r.top + r.height / 2);
  await anim(bag, [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px,${dy}px) scale(${scale})` }], {
    duration: 1600,
    easing: EASE.inout,
  });
  await wait(500);
  // It shakes, and then the dark clouds pour out of the neck.
  await anim(
    bag,
    [0, 1, -1, 1, -1, 1, 0].map((s) => ({ transform: `translate(${dx + s * 7}px,${dy}px) scale(${scale}) rotate(${s * 1.5}deg)` })),
    { duration: 620, easing: 'linear' },
  );
  const after = bag.getBoundingClientRect();
  const curtain = new Curtain(stage, 'dark', { covered: false });
  await curtain.pourFrom(after.left + after.width * 0.34, after.top + after.height * 0.08);
  bag.remove();
  black.remove();
  return curtain;
}

/** A cloud where more periods slowly appear: he is ignoring you. */
async function silentCloud(stage, opts = {}) {
  const box = new CloudBox(stage, { ...NIGHT, ...opts, text: '...' });
  await box.enter();
  await box.say({ cps: 1.6 });
  return box;
}

/** Back at the same island, at night, with the same form. Ends on the pitch-black screen, which it returns. */
async function theReturn(stage, curtain) {
  // Behind the full cover: the same island, at night, with little light.
  const world = buildWorld(stage, 'night');
  stage.append(curtain.el);
  const scroll = new Scroll(stage, { height: 35 });
  scroll.field('name', P.name, answers.name);
  scroll.field('homeland', P.homeland, answers.homeland);
  scroll.field('account', P.account, answers.purpose);
  scroll.append('account', answers.troy);
  scroll.append('account', answers.since);
  scroll.heading(P.back);
  scroll.field('cause', P.cause);
  scroll.field('help', P.help);
  scroll.wrap.classList.add('is-locked');
  await wait(500);
  await openWorld(world, curtain);
  await scroll.unroll();

  // #1. The quote is the emphasis. How to make it taunting is still open in Full vision.
  const q1 = T2.q1.text.replace('{name}', answers.name);
  const cause = await ask(stage, q1, T2.q1.options, { ...NIGHT, bolts: 2 });
  answers.cause = T2.q1.options[cause];
  scroll.set('cause', answers.cause);

  // #2. Slowly more periods. He is ignoring you. Whatever you say, it changes nothing.
  for (let i = 0; i < 2; i++) {
    const quiet = await silentCloud(stage);
    await wait(500);
    await quiet.leave();
  }
  const pleading = await silentCloud(stage, { bolts: 2, options: T2.q2.options });
  const help = await pleading.choose();
  await pleading.leave();
  answers.help = T2.q2.options[help];
  scroll.set('help', answers.help);

  // #3. A lot of lightning.
  const silence = await silentCloud(stage);
  await wait(400);
  await silence.leave();
  const box = new CloudBox(stage, { ...NIGHT, bolts: 8, text: T2.r3 });
  box.el.classList.add('box-rage');
  await box.enter();
  await box.say({ cps: 24 });
  await box.waitContinue();
  box.leave();

  // The application moves to the center, and rejection stamps are spammed onto it.
  await scroll.toCenter(1.14); // taller than the first form, so a smaller enlargement keeps both rollers on screen
  await wait(250);
  const spots = 18;
  const drops = [];
  for (let i = 0; i < spots; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    drops.push(stamp(scroll.body, 'rejected', {
      x: 34 + col * 16 + ((i * 37) % 8) - 4,
      y: 11 + row * 15.5 + ((i * 53) % 8) - 4,
      rotate: -24 + ((i * 41) % 48),
      width: 46,
      fall: 240,
      shadow: false,
    }));
    await wait(120);
  }
  await Promise.all(drops);
  await wait(1500);

  // Dark clouds cover the screen again. The white outlines fade, leaving pitch black.
  const cover = new Curtain(stage, 'dark', { covered: false });
  await cover.close(1700);
  const black = blackout(stage);
  await fadeIn(black, 1500);
  [...stage.children].forEach((c) => { if (c !== black) c.remove(); });
  return black;
}

/** ?scene=aeolus&part=2 starts at the moment the island is left, with the bag already given. For checking. */
function bagAlreadyGiven(stage) {
  const world = buildWorld(stage, 'day');
  const bag = img('bag', { class: 'bag' });
  stage.append(bag);
  return { world, bag };
}

export async function run(ctx) {
  const { stage } = ctx;
  await preload([...WORLD_ASSETS, ...curtainAssets('day'), ...curtainAssets('dark'), 'box-day', 'box-night', 'bag',
    'scroll-top', 'scroll-bottom', 'scroll-body', 'stamp-approved', 'stamp-rejected', 'dish-1', 'dish-2', 'dish-3', 'dish-eaten',
    'sea-right', 'sea-left']);
  const { world, bag } = ctx.part === '2' ? bagAlreadyGiven(stage) : await arrival(stage);
  const curtain = await theVoyage(stage, world, bag);
  ctx.black = await theReturn(stage, curtain);
}
