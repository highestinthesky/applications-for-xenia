// Gold Card: metal plates, a white sheet, and fields that pop out of the paper.
import { h, anim, EASE, wait, preload, fadeIn, fadeOut, asset } from '../fx.js';
import { Dropdown, stamp, blackout, drawnLine } from '../parts.js';
import { COUNTRIES } from '../countries.js';
import { goldCard as T } from '../copy.js';
import { tierFor, endsAtContribution, daysInMonth, formatDollars, MILLION } from '../logic.js';
import { answers } from '../store.js';

/** The backdrop: one full-screen plate that slides out as the plate of the new tier slides in. */
class Plates {
  constructor(stage, tier) {
    this.tier = tier;
    this.el = h('div', { class: 'plates', 'data-tier': tier }, this.plate(tier));
    stage.prepend(this.el);
  }

  plate(tier) {
    return h('div', { class: 'plate', style: { backgroundImage: `url(${asset(`plate-${tier}`)})` } });
  }

  /** One slide at a time: a slider dragged across several tiers ends on the latest one, with no jumps. */
  async set(tier) {
    this.wanted = tier;
    if (this.moving) return;
    this.moving = true;
    while (this.wanted !== this.tier) await this.slide(this.wanted);
    this.moving = false;
  }

  /** The whole background moves as one: the new plate rises from below and pushes the old one out the top. */
  slide(tier) {
    this.tier = tier;
    document.body.dataset.tier = tier;
    this.el.dataset.tier = tier;
    const options = { duration: 620, easing: EASE.inout };
    const old = this.el.firstElementChild;
    const next = this.plate(tier);
    this.el.append(next);
    return Promise.all([
      anim(next, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], options),
      anim(old, [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], options).then(() => old.remove()),
    ]);
  }
}

/** The sheet at the left. Each page lists its fields; the next page lies underneath. */
class Sheet {
  constructor(stage) {
    this.wrap = h('div', { class: 'sheet-wrap' });
    stage.append(this.wrap);
    this.rows = {};
    this.page = this.newPage();
  }

  newPage() {
    const p = h('div', { class: 'sheet-page' }, h('h1', { class: 'sheet-title' }, T.title));
    this.wrap.prepend(p);
    return p;
  }

  addRow(key, label) {
    const value = h('span', { class: 'sheet-value' });
    const name = h('span', { class: 'sheet-label' }, label);
    const row = h('div', { class: 'sheet-row' }, name, value);
    this.page.append(row);
    this.rows[key] = { row, value, name };
  }

  /** The blank part of the page where the stamp will land. */
  addDecision(label) {
    this.decision = h('div', { class: 'sheet-decision' }, h('span', { class: 'sheet-label' }, label));
    this.page.append(this.decision);
  }

  /** Under $1M: the questions still unasked leave the page, and the decision takes their place. */
  async skipToDecision(keys, label) {
    await Promise.all(keys.map((k) => fadeOut(this.rows[k].row, 450)));
    keys.forEach((k) => this.rows[k].row.remove());
    this.addDecision(label);
    await fadeIn(this.decision, 450);
  }

  /** Stamps on the page itself, so the whole sheet takes the blow, centered on the blank part. */
  stampDecision(kind) {
    const { offsetTop, offsetHeight } = this.decision;
    const y = ((offsetTop + offsetHeight * 0.55) / this.page.offsetHeight) * 100;
    return stamp(this.page, kind, { y });
  }

  fill(key, text) {
    this.rows[key].value.textContent = text;
  }

  /** The page moves away, revealing the next one underneath. */
  async turn() {
    const old = this.page;
    this.page = this.newPage();
    await anim(old, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-34rem,4rem) rotate(-9deg)' }], { duration: 760, easing: EASE.inout });
    old.remove();
  }

  /** Expands to the center of the screen for the decision. */
  async toCenter() {
    const r = this.wrap.getBoundingClientRect();
    const dx = innerWidth / 2 - (r.left + r.width / 2);
    const dy = innerHeight / 2 - (r.top + r.height / 2);
    await anim(this.wrap, [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px,${dy}px) scale(1.28)` }], { duration: 1300, easing: EASE.inout });
  }
}

/**
 * Pop-out: the small text on the form grows while moving to the center, where it becomes
 * interactive. Submitting plays the same motion in reverse, back into the form.
 */
async function popOut(stage, sheet, key, build) {
  const from = sheet.rows[key].row.getBoundingClientRect();
  const pop = h('div', { class: 'pop' });
  const controls = build(pop);
  stage.append(pop);
  const to = pop.getBoundingClientRect();
  const flip = `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px,${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${from.width / to.width})`;
  await anim(pop, [{ transform: flip, opacity: 0.4 }, { transform: 'translate(0,0) scale(1)', opacity: 1 }], { duration: 1200, easing: EASE.inout });
  controls.focus?.({ preventScroll: true });
  const value = await controls.result;
  await anim(pop, [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: flip, opacity: 0 }], { duration: 850, easing: EASE.inout });
  pop.remove();
  return value;
}

const heading = (text, extra) => h('h2', { class: 'pop-title' }, text, extra);

function submitButton(onclick, disabled = false) {
  return h('button', { class: 'metal-btn', type: 'button', disabled, onclick }, T.submit);
}

function askName(pop) {
  let done;
  const first = h('input', { class: 'metal-input', maxlength: 32, autocomplete: 'off', spellcheck: 'false', 'aria-label': T.fields.first });
  const last = h('input', { class: 'metal-input', maxlength: 32, autocomplete: 'off', spellcheck: 'false', 'aria-label': T.fields.last });
  const submit = submitButton(() => done({ first: first.value.trim(), last: last.value.trim() }), true);
  const check = () => (submit.disabled = !(first.value.trim() && last.value.trim()));
  first.addEventListener('input', check);
  last.addEventListener('input', check);
  pop.append(
    h('div', { class: 'pop-grid2' },
      h('label', { class: 'metal-field' }, h('span', {}, T.fields.first), first),
      h('label', { class: 'metal-field' }, h('span', {}, T.fields.last), last)),
    submit,
  );
  return { focus: () => first.focus(), result: new Promise((r) => (done = r)) };
}

function askDob(pop) {
  let done;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const state = { month: 6, day: 15, year: 1980 };
  const makeSlider = (label, key, min, max, fmt) => {
    const out = h('output', { class: 'vs-value' }, fmt(state[key]));
    const input = h('input', {
      class: 'vs-input', type: 'range', min, max, value: state[key], 'aria-label': label,
      oninput: () => {
        state[key] = Number(input.value);
        if (key !== 'day') {
          const maxDay = daysInMonth(state.month, state.year);
          dayInput.max = maxDay;
          if (state.day > maxDay) state.day = maxDay;
          dayInput.value = state.day;
          dayOut.textContent = state.day;
        }
        out.textContent = fmt(state[key]);
        input.setAttribute('aria-valuetext', fmt(state[key]));
      },
    });
    return { el: h('div', { class: 'vs' }, h('span', { class: 'vs-label' }, label), out, input), input, out };
  };
  const m = makeSlider(T.fields.month, 'month', 1, 12, (v) => MONTHS[v - 1]);
  const d = makeSlider(T.fields.day, 'day', 1, 30, (v) => v);
  const y = makeSlider(T.fields.year, 'year', 1930, 2008, (v) => v);
  const dayInput = d.input;
  const dayOut = d.out;
  pop.append(
    heading(T.fields.dob),
    h('div', { class: 'vs-row' }, m.el, d.el, y.el),
    submitButton(() => done(`${MONTHS[state.month - 1]} ${state.day}, ${state.year}`)),
  );
  return { result: new Promise((r) => (done = r)) };
}

function askCountries(pop) {
  let done;
  const submit = submitButton(() => done({ residence: live.value, citizenship: citizen.value }), true);
  const check = () => {
    submit.disabled = !(live.value && citizen.value);
  };
  const live = new Dropdown({ label: T.fields.residence, placeholder: T.chooseCountry, options: COUNTRIES, onchange: check });
  const citizen = new Dropdown({ label: T.fields.citizenship, placeholder: T.chooseCountry, options: COUNTRIES, onchange: check });
  pop.append(
    h('div', { class: 'pop-grid2' },
      h('div', { class: 'metal-field' }, h('span', {}, T.fields.residence), live.el),
      h('div', { class: 'metal-field' }, h('span', {}, T.fields.citizenship), citizen.el)),
    submit,
  );
  return { result: new Promise((r) => (done = r)) };
}

function askContribution(pop, plates) {
  let done;
  const amountEl = h('output', { class: 'money' }, formatDollars(3 * MILLION));
  const input = h('input', {
    class: 'money-input', type: 'range', min: 0, max: 10 * MILLION, step: 100000, value: 3 * MILLION,
    'aria-label': T.fields.contribution,
    oninput: () => {
      const v = Number(input.value);
      amountEl.textContent = formatDollars(v);
      input.setAttribute('aria-valuetext', formatDollars(v));
      plates.set(tierFor(v));
    },
  });
  pop.append(
    heading(T.fields.contribution),
    amountEl,
    input,
    submitButton(() => done(Number(input.value))),
  );
  return { result: new Promise((r) => (done = r)) };
}

function askChoice(pop, title, options) {
  let done;
  const list = h('div', { class: 'metal-options' }, options.map((o) =>
    h('button', { class: 'metal-btn metal-option', type: 'button', onclick: () => done(o) }, o)));
  pop.append(title, list);
  return { result: new Promise((r) => (done = r)) };
}

/** The decision lands as soon as the page reaches the center. The I-589 is where time passes. */
async function decide(sheet, kind) {
  await sheet.toCenter();
  await wait(300);
  await sheet.stampDecision(kind);
  await wait(2800);
}

export async function run(ctx) {
  const { stage } = ctx;
  await preload(['plate-gold', 'plate-silver', 'plate-bronze', 'plate-rusted', 'stamp-approved', 'stamp-rejected']);
  const black = ctx.black || blackout(stage);
  ctx.black = null;
  await drawnLine(stage, T.line);

  document.body.dataset.tier = 'silver';
  const plates = new Plates(stage, 'silver');
  const sheet = new Sheet(stage);

  // Page one arrives already printed, with the money at the top. The entry starts here, so the
  // paper is offscreen until it slides in.
  sheet.addRow('contribution', T.fields.contribution);
  sheet.addRow('name', T.fields.name);
  sheet.addRow('dob', T.fields.dob);
  sheet.addRow('residence', T.fields.residence);
  sheet.addRow('citizenship', T.fields.citizenship);
  await Promise.all([
    fadeOut(black, 1200),
    anim(sheet.wrap, [{ transform: 'translateX(-40rem)' }, { transform: 'translateX(0)' }], { duration: 800, delay: 900, easing: EASE.out }),
  ]);
  black.remove();

  // The guest's value is asked before anything else, even their name (user's decision, 2026-11-03).
  const amount = await popOut(stage, sheet, 'contribution', (pop) => askContribution(pop, plates));
  answers.contribution = amount;
  sheet.fill('contribution', formatDollars(amount));

  const name = await popOut(stage, sheet, 'name', askName);
  Object.assign(answers, { first: name.first, last: name.last });
  sheet.fill('name', `${name.first} ${name.last}`);

  if (endsAtContribution(amount)) {
    // Only the name is asked, as an afterthought before the rejection.
    answers.goldCard = 'rejected';
    await wait(400);
    await sheet.skipToDecision(['dob', 'residence', 'citizenship'], T.decision);
    await decide(sheet, 'rejected');
  } else {
    answers.dob = await popOut(stage, sheet, 'dob', askDob);
    sheet.fill('dob', answers.dob);

    const where = await popOut(stage, sheet, 'residence', askCountries);
    sheet.fill('residence', where.residence);
    sheet.fill('citizenship', where.citizenship);
    await wait(500);
    await sheet.turn();

    // Page two. The stamp lands in the blank part at the bottom.
    sheet.addRow('why', `${T.fields.why} (${T.fields.optional})`);
    sheet.addRow('terrorism', T.fields.terrorism);
    sheet.addDecision(T.decision);

    // Optional, and emphasized as optional: the host does not need the reason.
    const whyTitle = heading(T.fields.why, h('strong', { class: 'pop-optional' }, ` (${T.fields.optional})`));
    const why = await popOut(stage, sheet, 'why', (pop) => askChoice(pop, whyTitle, T.whyOptions));
    sheet.fill('why', why);

    // Decided 2026-11-03: this answer changes nothing. Money alone decides.
    const terror = await popOut(stage, sheet, 'terrorism', (pop) => askChoice(pop, heading(T.fields.terrorism), T.terrorismOptions));
    answers.terrorism = terror;
    sheet.fill('terrorism', terror);
    answers.goldCard = 'approved';
    await wait(400);
    await decide(sheet, 'approved');
  }

  // Ends on black. The homepage opens from here.
  const end = blackout(stage);
  await anim(end, [{ opacity: 0 }, { opacity: 1 }], { duration: 900 });
  [...stage.children].forEach((c) => { if (c !== end) c.remove(); });
  delete document.body.dataset.tier;
  ctx.black = end;
}
