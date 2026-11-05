// Every word the visitor reads, in one file so it is easy to edit.
// Script text is copied from Full vision. *asterisks* mark direct quotes from Fagles (italic on the
// site, with no quotation marks, per the user 2026-11-03); **double asterisks** mark bold; ***three*** both. An empty string means the user has not written that text yet.

export const aeolus1 = {
  q1: {
    text: 'Greetings, stranger. What has brought you to our lands?',
    options: [
      'We are Achaeans sailing home from Troy, completing our *nostos*.',
      'My squadron and I have just earned *kleos* in the land of the Cyclops.',
    ],
  },
  r2: 'Welcome to Aeolia! I, Aeolus, king of this island, offer a lavish *feast* of *roasted meats* to you and your crew!',
  q3: {
    text: 'Please, stay for as long as you like! Will you join us for our feast?',
    options: ['I would be honored to, great Aeolus!', 'Sorry, but I need to be on my way, please send me off.'],
  },
  r4: 'Help yourself, brave warriors!',
  q5: {
    text: 'Who are you, and where are you from?',
    nameLabel: 'Name',
    homelandLabel: 'Homeland',
    homelands: ['Ithaca', 'Pylos', 'Sparta'],
  },
  q6: {
    text: 'Tell me of Troy. How did the city fall?',
    options: [
      'We hid inside a wooden horse, and they thought it was a gift',
      'We opened the gates from the inside and massacred everyone.',
    ],
  },
  q7: {
    text: 'And what has befallen you since you left Troy?',
    options: [
      'We raided the Cicones, escaped the Lotus-eaters, and blinded the Cyclops Polyphemus to escape his cave.',
      'The Cyclops Polyphemus ate my men, so I blinded him and shouted my name as we sailed away.',
    ],
  },
  q8: {
    text: 'Are you sure you want to go? Please stay for as long as you’d like!',
    options: ['Sure, I will stay.', 'I am sorry, but I must beg you to send us home.'],
  },
  month: 'A month has passed, and you ask Aeolus to send you home.',
  r9: 'I will *deny you nothing*. Please, take my gifts with you.',
};

export const parchment = {
  title: 'Application for Xenia',
  name: 'Name',
  homeland: 'Homeland',
  account: 'Account of voyage',
  back: 'Why are you back here?',
  cause: 'Cause',
  help: 'Request for help',
};

export const aeolus2 = {
  q1: {
    text: '*Back again {name}? Surely we launched you well, sped you on your way?*',
    options: [
      'My *mutinous crew undid me*! They thought you secretly handed me *treasure*!',
      'I was betrayed while in a *cruel sleep* - I could not have stopped it!!',
    ],
  },
  q2: {
    options: [
      '*Set this right, my friends*! *You have the* ***power***!',
      'I plead with you, with my most *humble, gentle appeals!*',
    ],
  },
  r3: '*Away from my island — fast — most cursed man alive!* **You’re hated by the immortals!**',
};

export const ithaca = {
  line: 'Now, imagine you’re a stranger visiting Ithaca',
  r1: 'If only my father *might drop from the clouds* and drive these damned suitors out…',
  r2: '*Greetings, stranger! Here in our house you’ll find a royal welcome. Have supper first, then tell me what you need.*',
  r3: 'Look at those filthy suitors, *feed[ing] on another’s goods and go[ing] scot-free!* If only my father was back, *they’d all pray to be faster on their feet than richer in bars of gold and heavy robes!*',
  q4: {
    lines: [
      '*Tell me about yourself now, clearly, point by point.*',
      '*Who are you?*',
      '*Where are you from? Your city?*',
      '*Your parents?*',
      '*What sort of vessel brought you? Why did the sailors land you here in Ithaca?*',
      '*Who did they say they are?*',
      '*I hardly think you came this way on foot!*',
      '*And tell me this for a fact — I need to know — is this your first time here?*',
    ],
    options: [
      '*My name is Mentes, lord of the Taphian men, and I’ve sailed here.*',
      '*I’ve come to trade out iron for bronze, we’ve moored our ship far from town*',
    ],
    // What each answer writes on the application. The second answer gives no name, so those stay blank.
    identity: [{ name: 'Mentes', homeland: 'Taphos' }, { name: '', homeland: '' }],
  },
  q5: {
    lines: [
      '*Are you a friend of father’s,*',
      '*a guest from the old days?*',
      '*Once, crowds of other men*',
      '*would come to our house on visits — visitor that he was,*',
      '*when he walked among the living.*',
    ],
    options: ['*I’ve been friends with your father since forever.*', '*Old lord Laertes knows me very well.*'],
  },
  q6: {
    lines: [
      'Yet father has died a wretched death,',
      'his white bones lie strewn in the rain somewhere,',
      'rotting away in the ocean.',
      'Odysseus will never return home.',
    ],
    options: [
      'Odysseus is not dead, he is simply held captive somewhere',
      'The gods have prophesied his return — he is plotting his way back.',
    ],
  },
  q7: {
    lines: ['But how must I find him?', 'Or is this just another', '*misery that the gods have invented to plague me?*'],
    options: [
      'You must sail to Pylos and Sparta to look for rumors of your father.',
      'You must leave Ithaca and await news of your father',
    ],
  },
  q8: {
    lines: [
      'Thank you for your kind advice,',
      'I will not forget a single word.',
      'Please take this prize of honor,',
      'a rare and fine keepsake from me,',
      'the kind that hosts give to strangers,',
      'friend to friend.',
    ],
    options: ['Thank you, but save the gifts for the next time I visit', 'Not now, thank you, but I must be gone.'],
  },
};

export const goldCard = {
  line: 'Imagine you’re a wealthy resident of another country looking to migrate',
  title: 'Application for Xenia',
  fields: {
    name: 'First Name, Last Name',
    first: 'First Name',
    last: 'Last Name',
    dob: 'Date of Birth',
    month: 'Month',
    day: 'Day',
    year: 'Year',
    residence: 'Where do you live?',
    citizenship: 'Country of citizenship',
    contribution: 'How much can you contribute to the government?',
    why: 'Why do you want residency?',
    optional: 'optional',
    terrorism: 'Have you participated in terrorism?',
  },
  whyOptions: ['To grow my business here', 'My family already lives here', 'I want a second home', 'Skip'],
  terrorismOptions: ['Yes', 'No'],
  submit: 'Submit',
  chooseCountry: 'Select a country',
  decision: 'Our decision below',
};

export const i589 = {
  line: 'Now imagine you’re no longer wealthy and have fled your country due to conflict.',
  // The real form's title, with "Asylum" struck through and "Xenia" written beside it.
  title: { before: 'Form I-589, Application for ', struck: 'Asylum', after: ' Xenia' },
  start: 'START HERE',
  infoTitle: 'Your information',
  name: 'Name',
  grounds: {
    text: 'I am seeking asylum or withholding of removal based on:',
    options: ['My religion.', 'What I said publicly.', 'My family or group.', 'Fighting reached my town and I fled.'],
  },
  harm: {
    text: 'Have you, your family, or close friends or colleagues ever experienced harm or mistreatment or threats in the past by anyone?',
    options: ['My home was destroyed.', 'I was threatened more than once.', 'Someone close to me was hurt.'],
  },
  fear: {
    text: 'Do you fear harm or mistreatment if you return to your home country?',
    options: ['Yes, I fear for my life.', 'There is nothing to return to.'],
  },
  burden: 'This application may be your only opportunity to meet your burden of proof.',
  fees: {
    text: 'Are you currently able to pay the filing fee AND the Annual Asylum Fee?',
    options: ['Yes', 'No'],
  },
  submit: 'Submit',
  incomplete: 'Answer every question before you submit.',
  pending: 'Pending Review…',
};

export const home = {
  title: 'Where will you be seeking Xenia?',
  forms: [
    { id: 'aeolus', label: 'Aeolus' },
    { id: 'ithaca', label: 'Ithaca' },
    { id: 'goldcard', label: 'Gold Card' },
    { id: 'i589', label: 'Asylum' },
  ],
};

export const shared = {
  continueLabel: 'Continue',
  unsupported: 'Applications for Xenia is made for a laptop or a larger screen. Please open it on one.',
};
