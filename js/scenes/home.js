// The homepage, per the user's "homepage vision": crude on purpose, with nothing extra.
import { h, asset, preload, fadeOut } from '../fx.js';
import { blackout } from '../parts.js';
import { home as T } from '../copy.js';

/** Two rows of waves going opposite ways, as in the Aeolus sea, in the image's own colors. */
function waves() {
  const row = (dir) => h('div', {
    class: `sea-row sea-${dir}`,
    style: { backgroundImage: `url(${asset(`home-wave-${dir}`)})` },
  });
  return h('div', { class: 'home-waves' }, row('right'), row('left'));
}

/** The image's middle line. It does not move, and marks where the waves stop and the blank space begins. */
const key = () => h('div', { class: 'home-key', style: { backgroundImage: `url(${asset('home-key')})` } });

export async function run({ stage }, formUrl) {
  // Loaded first, so nothing changes font or pops in as the page appears.
  await Promise.all([
    preload(['home-wave-right', 'home-wave-left', 'home-key']),
    document.fonts.load("3rem 'Pinyon Script'"),
    document.fonts.load("2.4rem 'Faculty Glyphic'"),
    document.fonts.load("2.4rem 'Fondamento'"),
    document.fonts.load("2.4rem 'Commissioner'"),
  ].map((p) => p.catch(() => {})));

  const black = blackout(stage);
  stage.prepend(h('div', { class: 'home' },
    waves(),
    key(),
    h('div', { class: 'home-middle' },
      h('h1', { class: 'home-title' }, T.title),
      h('ul', { class: 'home-links' }, T.forms.map((form) => h('li', {},
        h('a', { class: `home-link home-${form.id}`, href: formUrl(form.id) }, form.label))))),
    key(),
    waves()));
  await fadeOut(black, 500);
  black.remove();
}
