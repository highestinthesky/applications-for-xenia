// I-589: flat, standardized, monotonic. No host, so the form's own text appears at once.
import { h, img, anim, EASE, wait, preload, fadeOut, SPEED } from '../fx.js';
import { Dropdown, stamp, blackout, drawnLine } from '../parts.js';
import { COUNTRIES } from '../countries.js';
import { i589 as T, goldCard as G, shared } from '../copy.js';
import { asylumOutcome } from '../logic.js';
import { answers, save } from '../store.js';

/** A clock whose hands are separate pieces: set them directly, or spin them. */
class Clock {
  constructor() {
    this.hour = h('div', { class: 'hand hand-hour' });
    this.minute = h('div', { class: 'hand hand-minute' });
    this.el = h('div', { class: 'clock', role: 'img', 'aria-label': 'A wall clock' }, img('clock-face'), this.hour, this.minute, h('div', { class: 'hub' }));
    this.set(9, 0);
  }

  set(hours, minutes) {
    this.hour.style.rotate = `${(hours % 12) * 30 + minutes / 2}deg`;
    this.minute.style.rotate = `${minutes * 6}deg`;
  }

  spin() {
    const opts = { iterations: Infinity, easing: 'linear', composite: 'add' };
    this.spins = [
      this.minute.animate({ rotate: ['0deg', '360deg'] }, { ...opts, duration: 130 / SPEED }),
      this.hour.animate({ rotate: ['0deg', '360deg'] }, { ...opts, duration: 1560 / SPEED }),
    ];
  }

  stop() {
    this.spins?.forEach((a) => a.pause());
  }
}

/** A tear-off calendar. The page falls off and the date moves on, 1 to 31 and back. */
class Calendar {
  constructor() {
    this.day = 1;
    this.number = h('div', { class: 'cal-number' }, '1');
    this.el = h('div', { class: 'calendar', role: 'img', 'aria-label': 'A tear-off calendar' }, img('calendar-base', { class: 'cal-base' }), this.number);
  }

  flip() {
    const fall = h('div', { class: 'cal-fall' }, img('calendar-page'), h('div', { class: 'cal-number' }, String(this.day)));
    this.el.append(fall);
    this.day = (this.day % 31) + 1;
    this.number.textContent = String(this.day);
    anim(fall, [{ transform: 'translateY(0) rotate(0)', opacity: 1 }, { transform: 'translateY(9rem) rotate(14deg)', opacity: 0 }], { duration: 240, easing: EASE.fall }).then(() => fall.remove());
  }

  run() {
    this.timer = setInterval(() => this.flip(), 45 / SPEED);
  }

  stop() {
    clearInterval(this.timer);
  }
}

/** The flower: the sprite is stepped by hand so its speed can be set here. */
class Flower {
  constructor() {
    this.frame = 0;
    this.el = h('div', { class: 'flower', role: 'img', 'aria-label': 'A potted flower' });
    this.show();
  }

  show() {
    this.el.style.backgroundPosition = `${(this.frame / 60) * 100}% 0`;
  }

  run() {
    this.timer = setInterval(() => {
      this.frame = (this.frame + 1) % 61;
      this.show();
    }, 35 / SPEED);
  }

  stop() {
    clearInterval(this.timer);
  }
}

function choiceGroup(key, question, onchange) {
  const group = h('fieldset', { class: 'f-group' }, h('legend', {}, question.text));
  question.options.forEach((opt, i) => {
    const input = h('input', { type: 'radio', name: key, value: i, onchange: () => onchange(key, i) });
    group.append(h('label', { class: 'f-choice' }, input, h('span', {}, opt)));
  });
  return group;
}

export async function run(ctx) {
  const { stage } = ctx;
  await preload(['clock-face', 'calendar-base', 'calendar-page', 'flower-sprite', 'stamp-approved', 'stamp-pending']);

  // Opens as the Gold Card does. This line is longer, so it draws faster to take about as long.
  const black = ctx.black || blackout(stage);
  ctx.black = null;
  await drawnLine(stage, T.line, 26);

  const clock = new Clock();
  const calendar = new Calendar();
  const flower = new Flower();

  const picks = {};
  const onPick = (key, i) => {
    picks[key] = i;
    error.hidden = true;
  };

  // The name and the two countries are the Gold Card's answers, carried over greyed out,
  // so they cannot be changed here. A visitor rejected under $1M was never asked for the
  // countries, so for them this form asks.
  const locked = (label, value) => h('div', { class: 'f-field' }, h('span', {}, label), h('div', { class: 'f-locked-value' }, value));
  const pickers = {};
  const country = (key, label) => {
    if (answers[key]) return locked(label, answers[key]);
    pickers[key] = new Dropdown({ label, placeholder: G.chooseCountry, options: COUNTRIES, onchange: () => { error.hidden = true; } });
    return h('div', { class: 'f-field' }, h('span', {}, label), pickers[key].el);
  };

  const error = h('p', { class: 'f-error', role: 'alert', hidden: true }, T.incomplete);
  const submit = h('button', { class: 'f-button f-submit', type: 'submit' }, T.submit);

  const front = h('form', { class: 'f-front', novalidate: true },
    h('h1', { class: 'f-title' }, T.title.before, h('s', {}, T.title.struck), T.title.after),
    h('p', { class: 'f-notice' }, T.start),
    h('section', { class: 'f-part' },
      h('h2', {}, T.infoTitle),
      locked(T.name, `${answers.first} ${answers.last}`),
      country('residence', G.fields.residence),
      country('citizenship', G.fields.citizenship)),
    h('section', { class: 'f-part' }, choiceGroup('grounds', T.grounds, onPick)),
    h('section', { class: 'f-part' }, choiceGroup('harm', T.harm, onPick)),
    h('section', { class: 'f-part' }, choiceGroup('fear', T.fear, onPick)),
    h('p', { class: 'f-notice f-notice-strong' }, T.burden),
    h('section', { class: 'f-part' }, choiceGroup('fees', T.fees, onPick)),
    error,
    submit,
  );
  const back = h('div', { class: 'f-back' }, h('p', { class: 'f-pending' }, T.pending));
  const paper = h('div', { class: 'f-paper' }, front, back);

  const room = h('div', { class: 'room' },
    h('div', { class: 'room-top' }, clock.el, calendar.el),
    h('div', { class: 'f-frame' }, paper),
    flower.el);
  stage.prepend(room);

  await fadeOut(black, 1200);
  black.remove();

  await new Promise((resolve) => {
    front.addEventListener('submit', (e) => {
      e.preventDefault();
      const complete = ['grounds', 'harm', 'fear', 'fees'].every((k) => picks[k] !== undefined) && Object.values(pickers).every((p) => p.value);
      if (complete) resolve();
      else {
        error.hidden = false;
        error.scrollIntoView({ block: 'nearest' });
      }
    });
  });

  for (const [key, picker] of Object.entries(pickers)) answers[key] = picker.value;
  answers.grounds = T.grounds.options[picks.grounds];
  answers.harm = T.harm.options[picks.harm];
  answers.fear = T.fear.options[picks.fear];
  answers.canPay = picks.fees === 0;
  save();

  // The paper flips to Pending Review. Years pass on the clock, calendar and flower.
  paper.parentElement.scrollTop = 0;
  await anim(paper, [{ transform: 'rotateY(0)' }, { transform: 'rotateY(180deg)' }], { duration: 900, easing: EASE.inout });
  paper.classList.add('is-flipped');
  clock.spin();
  calendar.run();
  flower.run();

  const outcome = asylumOutcome(answers.canPay);
  answers.asylum = outcome;
  save();
  const go = h('button', { class: 'f-button f-continue', type: 'button' }, shared.continueLabel);
  await wait(9000);
  if (outcome === 'approved') {
    clock.stop();
    calendar.stop();
    flower.stop();
    await stamp(back, 'approved', { y: 52 });
    await wait(1200);
  } else {
    // PENDING lands and time keeps passing around it. Continue comes later and only moves the
    // presentation on; the case itself stays pending.
    await stamp(back, 'pending', { y: 52 });
    await wait(5000);
  }
  back.append(go);
  await new Promise((r) => go.addEventListener('click', r, { once: true }));
  clock.stop();
  calendar.stop();
  flower.stop();
  stage.replaceChildren();
}
