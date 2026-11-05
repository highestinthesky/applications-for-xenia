// The visitor's answers within one form. Nothing is kept between forms or between visitors.
export const answers = {};

export function clear() {
  for (const k of Object.keys(answers)) delete answers[k];
  try {
    localStorage.removeItem('xenia-answers'); // answers an earlier version of the site saved here
  } catch {
    // Private windows and locked-down school browsers can refuse storage. The piece still runs.
  }
}

/** Sample answers, used only by ?scene=aeolus&part=2, which starts after they would have been given. */
export function seedForDirectJump() {
  Object.assign(answers, {
    name: 'Odysseus',
    homeland: 'Ithaca',
    purpose: 'We are Achaeans sailing home from Troy, completing our *nostos*.',
    troy: 'We hid inside a wooden horse, and they thought it was a gift',
    since: 'The Cyclops Polyphemus ate my men, so I blinded him and shouted my name as we sailed away.',
  });
}
