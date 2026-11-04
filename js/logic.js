// Rules from Full vision, kept free of the page so they can be tested on their own.

export const MILLION = 1_000_000;

/** Gold Card plate. Over $5M gold, $3-5M silver, $1-3M bronze, under $1M rusted. */
export function tierFor(amount) {
  if (amount > 5 * MILLION) return 'gold';
  if (amount >= 3 * MILLION) return 'silver';
  if (amount >= MILLION) return 'bronze';
  return 'rusted';
}

/** Under $1M the Gold Card asks only for a name after the contribution, then rejects. */
export const endsAtContribution = (amount) => amount < MILLION;

/** I-589: the fee answer alone decides. Grounds, harm and fear answers are not even passed in. */
export const asylumOutcome = (canPayFees) => (canPayFees ? 'approved' : 'pending');

export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export function formatDollars(n) {
  return '$' + n.toLocaleString('en-US');
}

/**
 * Aeolus 1 branching. Steps are the numbers in Full vision's script, with one user change
 * (2026-11-03): the first #3 offers only "stay", so the story always comes before any farewell.
 */
export const newAeolus1 = () => ({ storyTold: false, feasts: 0 });

export function aeolus1Next(state, event) {
  switch (event) {
    case 'q3:stay':
      return { state, step: 'r4' };
    case 'q3:leave':
      return { state, step: 'q8' };
    case 'r4:done':
      return { state, step: 'feast' };
    case 'feast:done': {
      const next = { ...state, feasts: state.feasts + 1 };
      if (next.feasts >= 3) return { state: next, step: 'month' };
      return { state: next, step: next.storyTold ? 'q3' : 'story' };
    }
    case 'story:done':
      return { state: { ...state, storyTold: true }, step: 'q3' };
    case 'q8:stay':
      return { state, step: 'q3' };
    case 'q8:leave':
      return { state, step: 'gift' };
    case 'month:done':
      return { state, step: 'gift' };
    default:
      throw new Error(`Unknown Aeolus 1 event: ${event}`);
  }
}

/** Splits "*quoted* and **bold**" into runs for the typewriter. */
export function parseRich(text) {
  const runs = [];
  const re = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('***')) runs.push({ text: tok.slice(3, -3), em: true, bold: true });
    else if (tok.startsWith('**')) runs.push({ text: tok.slice(2, -2), bold: true });
    else runs.push({ text: tok.slice(1, -1), em: true });
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs;
}
