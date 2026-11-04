// The closing screen is not designed yet. This holds its place, and looks unfinished on purpose.
import { slot } from '../parts.js';
import { shared } from '../copy.js';

export async function run({ stage }) {
  document.body.dataset.scene = 'closing';
  slot(stage, shared.closing);
  await new Promise(() => {}); // the end of the piece
}
