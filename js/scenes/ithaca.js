// Ithaca: one large parchment that records the whole conversation. Welcome comes before questions.
import { h, img, anim, EASE, wait, fadeIn, fadeOut, typeInto, preload, waitClick, asset } from '../fx.js';
import { blackout, drawnLine, richNodes, Scroll, stamp, parchmentLabels as P } from '../parts.js';
import { ithaca as T } from '../copy.js';
import { answers } from '../store.js';

/** The A4 sheet. A new sheet lies under it, so sliding this one away reveals the next. */
class Page {
  constructor(stage) {
    this.stage = stage;
    this.holder = h('div', { class: 'a4-holder' });
    stage.append(this.holder);
    this.sheet = this.makeSheet();
  }

  makeSheet() {
    this.lines = h('div', { class: 'a4-lines', 'aria-live': 'polite' });
    const sheet = h('div', { class: 'a4', style: { backgroundImage: `url(${asset('parchment-a4')})` } }, this.lines);
    this.holder.prepend(sheet);
    return sheet;
  }

  enter() {
    return anim(this.holder, [{ transform: 'translateX(120vw)' }, { transform: 'translateX(0)' }], {
      duration: 1100,
      easing: EASE.out,
    });
  }

  /** Moves the whole stack aside, so the application can take the center. */
  away() {
    return anim(this.holder, [{ transform: 'translateX(0)' }, { transform: 'translateX(120vw)' }], { duration: 750, easing: EASE.inout });
  }

  back() {
    return anim(this.holder, [{ transform: 'translateX(120vw)' }, { transform: 'translateX(0)' }], { duration: 900, easing: EASE.out });
  }

  /** Slides the current page off to reveal the next one underneath. */
  async turn() {
    const old = this.sheet;
    this.sheet = this.makeSheet();
    await anim(old, [{ transform: 'translateX(0) rotate(0)' }, { transform: 'translateX(-120vw) rotate(-4deg)' }], {
      duration: 850,
      easing: EASE.inout,
    });
    old.remove();
  }

  async say(text, { cps = 30, cls = '' } = {}) {
    const line = h('p', { class: `a4-line ${cls}` });
    this.lines.append(line);
    const token = { skip: false };
    const skip = () => (token.skip = true);
    this.sheet.addEventListener('click', skip);
    await typeInto(line, text, { cps, token });
    this.sheet.removeEventListener('click', skip);
  }

  async next() {
    const arrow = h('span', { class: 'a4-next', 'aria-hidden': 'true' }, '→');
    this.sheet.append(arrow);
    await waitClick(this.sheet);
    arrow.remove();
  }

  /** Multiple choice on the page. The answer stays recorded and the other option leaves. */
  choose(options) {
    return new Promise((resolve) => {
      const list = h('div', { class: 'a4-options' });
      options.forEach((opt, i) => {
        list.append(
          h('button', {
            class: 'a4-option',
            type: 'button',
            onclick: () => {
              list.remove();
              this.lines.append(h('p', { class: 'a4-answer' }, richNodes(opt)));
              resolve(i);
            },
          }, richNodes(opt)),
        );
      });
      this.lines.append(list);
    });
  }

  place(el) {
    this.lines.append(el);
    return el;
  }
}

/** The dark screen and the drawn line that open Ithaca. */
async function opening(stage, black) {
  await drawnLine(stage, T.line, 11, { rich: false });
  await fadeOut(black, 2000);
  black.remove();
}

function buildScene(stage) {
  const sun = h('div', { class: 'sun', 'aria-hidden': 'true' });
  sun.innerHTML = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#ffd27a"/><circle cx="50" cy="50" r="38" fill="#ffe7a8"/></svg>';
  const scene = h('div', { class: 'ithaca-scene' }, sun, img('ithaca-land', { class: 'ithaca-land' }));
  stage.prepend(scene);
  return scene;
}

export async function run(ctx) {
  const { stage } = ctx;
  await preload(['ithaca-land', 'parchment-a4', 'dish-1', 'dish-2', 'dish-3', 'gift-cup', 'gift-bowl', 'scroll-top', 'scroll-bottom', 'scroll-body', 'stamp-approved']);
  const black = ctx.black || blackout(stage);
  if (!ctx.black) black.style.opacity = 1;
  buildScene(stage);
  await opening(stage, black);

  const page = new Page(stage);
  const scroll = new Scroll(stage, { height: 27 });
  scroll.field('name', P.name);
  scroll.field('homeland', P.homeland);
  scroll.field('account', P.account);
  let firstAnswer = true;
  const record = async (text) => {
    const append = !firstAnswer;
    firstAnswer = false;
    await scroll.write('account', text, { append });
  };
  await Promise.all([page.enter(), scroll.unroll()]);

  // #1 and #2. Supper is offered before a single question.
  await page.say(T.r1, { cls: 'a4-aside' });
  await page.next();
  await page.say(T.r2);
  const dishes = page.place(h('div', { class: 'a4-dishes' }, img('dish-1'), img('dish-2'), img('dish-3')));
  await anim(dishes, [{ opacity: 0, transform: 'translateY(1rem)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 700 });
  await page.next();

  // Approved at the welcome, before he has asked the stranger anything (user's decision, 2026-11-03).
  await page.away();
  await scroll.toCenter();
  await wait(300);
  await stamp(scroll.body, 'approved', { y: 82 }); // low enough to clear the longest set of answers
  await wait(1600);
  await scroll.toCorner();
  await page.back();

  // #3. His inner thoughts, foreshadowing what he wants from his guest.
  await page.say(T.r3, { cls: 'a4-aside' });
  await page.next();
  await page.turn();

  // #4. The list flows out on the parchment.
  for (const l of T.q4.lines) await page.say(l, { cps: 40, cls: 'a4-verse' });
  const who = await page.choose(T.q4.options);
  answers.ithacaWho = T.q4.options[who];
  await scroll.write('name', T.q4.identity[who].name);
  await scroll.write('homeland', T.q4.identity[who].homeland);
  await record(answers.ithacaWho);

  // #5. Slightly quicker than #4, for his urgency, but slow enough to read.
  for (const l of T.q5.lines) await page.say(l, { cps: 48, cls: 'a4-verse' });
  answers.ithacaFriend = T.q5.options[await page.choose(T.q5.options)];
  await record(answers.ithacaFriend);
  await page.turn();

  // #6. The last line draws in slowest.
  const last = T.q6.lines.length - 1;
  for (let i = 0; i <= last; i++) {
    await page.say(T.q6.lines[i], { cps: i === last ? 15 : 26, cls: 'a4-verse' });
  }
  answers.ithacaFate = T.q6.options[await page.choose(T.q6.options)];
  await record(answers.ithacaFate);

  // #7.
  for (const l of T.q7.lines) await page.say(l, { cls: 'a4-verse' });
  answers.ithacaAdvice = T.q7.options[await page.choose(T.q7.options)];
  await record(answers.ithacaAdvice);
  await page.turn();

  // #8. The gifts. As the visitor declines, they slide offscreen with the parchment.
  for (const l of T.q8.lines) await page.say(l, { cls: 'a4-verse' });
  const gifts = page.place(h('div', { class: 'a4-gifts' },
    img('gift-cup', { alt: 'A golden cup', role: 'img' }),
    img('gift-bowl', { alt: 'A golden mixing bowl', role: 'img' })));
  await anim(gifts, [{ opacity: 0 }, { opacity: 1 }], { duration: 1500, easing: EASE.inout });
  await wait(300);
  answers.ithacaGift = T.q8.options[await page.choose(T.q8.options)];
  await record(answers.ithacaGift);
  await wait(900);
  await anim(page.holder, [{ transform: 'translateX(0)' }, { transform: 'translateX(-120vw)' }], { duration: 1100, easing: EASE.inout });

  // As in Aeolus's first half, the form returns filled in, under the stamp it already had.
  await scroll.toCenter();
  await wait(2600);
  await scroll.leave();

  // Ends on black. The homepage opens from here.
  await wait(600);
  const end = blackout(stage);
  await fadeIn(end, 1600);
  [...stage.children].forEach((c) => { if (c !== end) c.remove(); });
  ctx.black = end;
}
