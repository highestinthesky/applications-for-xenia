// The visitor's answers: a plain object, mirrored to localStorage when the browser allows it.
const KEY = 'xenia-answers';

export const answers = {};

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    // Private windows and locked-down school browsers can refuse storage. The piece still runs.
  }
}

export function clear() {
  for (const k of Object.keys(answers)) delete answers[k];
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* see save() */
  }
}

/** Brings back answers saved earlier in this browser. */
export function restore() {
  try {
    Object.assign(answers, JSON.parse(localStorage.getItem(KEY)) || {});
  } catch {
    /* see save() */
  }
}

/** Sample answers, used only when a scene is opened directly with ?scene=. */
export function seedForDirectJump() {
  Object.assign(answers, {
    name: 'Odysseus',
    homeland: 'Ithaca',
    purpose: 'We are Achaeans sailing home from Troy, completing our *nostos*.',
    troy: 'We hid inside a wooden horse, and they thought it was a gift',
    since: 'The Cyclops Polyphemus ate my men, so I blinded him and shouted my name as we sailed away.',
    first: 'Sample',
    last: 'Applicant',
    citizenship: 'Greece',
    residence: 'Greece',
    contribution: 3000000,
  });
}
