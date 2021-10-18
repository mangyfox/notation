# Notation trainer

This is a simple game designed to train hand/eye coordination for music notation.

Musical notes will move along the stave, and the player must hit the right note
at the right time to score points. A 'Level' setting controls the range of notes
that will be included, and a 'Speed' setting controls the speed they travel.

Computer keyboard controls are as shown in the diagram below the game. In midi
enabled browsers a midi device can be used to trigger the notes.

Frontend built using [Svelte](https://svelte.dev/)
Audio transport and sounds manged with [Tone.js](https://tonejs.github.io/)
WebMidi integration using [WebMidi.js](https://www.npmjs.com/package/webmidi)


## Get started

Checkout the repository from https://github.com/mangyfox/notation

Install the dependencies...

```bash
cd notation
npm install
```

Then fire up the app...

```bash
npm run build
npm start
```

Navigate to [localhost:5000](http://localhost:5000). You should see the app running.
