<script>
  import { onMount } from 'svelte';
  import AudioHandler from './AudioHandler.js';
  export let Tone = null;
  export let inputs = null;

  // Screen offset for target line.
  const OFFSET = 200;

  // The audio transport.
  const transport = Tone.Transport;

  // The audio handler.
  const audio = new AudioHandler(Tone);

  // Set up game state.
  let level = 1;
  let speed = 5;
  let isPlaying = false;
  let seconds = 0;
  let state = transport.state;
  let notes = [];
  let currentNote = 5;
  let activeNote = null;
  let attempt = '';
  let attemptedNote = null;
  let attemptTimeout = null;
  let score = 0;
  let lastKey = '';

  // Ref for Cmaj midi notes.
  const noteValues = [60,62,64,65,67,69,71,72,74,76,77,79,81];
  const bottomNote = noteValues[0];
  const topNote = noteValues[noteValues.length - 1];

  // Keyboard note values.
  const keyboardNotes = ['z','x','c','v','b','n','m','q','w','e','r','t','y'];

  // Add a new random note to the end of the current piece.
  const addNote = () => {
    let noteId = Math.floor(Math.random() * (level + 3));

    notes.push({
      time: currentNote,
      id: noteId,
      number: noteValues[noteId],
      position: (currentNote - seconds) * 200
    });
    currentNote += 5 / speed;
  }

  // Set up the game on load.
  onMount(() => {
    // Listen for midi input.
    inputs.forEach(input => {
      input.addListener('noteon', 'all', event => {
        handleNoteOn(event);
      });
    });

    let frame;

    // Set up the game loop.
    const loop = () => {
      frame = requestAnimationFrame(loop);
      seconds = transport.seconds;
      activeNote = null;

      // Fill out the incoming notes.
      if (isPlaying && notes.length < 10) {
        addNote();
      }

      // Update the note data.
      notes = notes.reduce((result, note) => {
        // Move this note.
        note.position = (note.time - seconds) * 200;
        if (note.position > -(OFFSET)) {
          result.push(note);
        }
        // Check if this note is in the active zone.
        if (note.position > -30 && note.position < 30) {
          activeNote = note;
        }
        // Check if the note has been missed.
        if (note.position < -30 && !note.attempt) {
          note.attempt = 'miss';
          handleAttempt(null);
        }
        return result;
      }, []);
    }

    loop();

    return () => cancelAnimationFrame(frame);
  });

  // Handle the play/pause action.
  const handlePlayPause = () => {
    if (isPlaying) {
      transport.pause();
    }
    else {
      transport.start();
    }
    isPlaying = !isPlaying;
    state = transport.state;
  }

  // Handle the stop action.
  const handleStop = () => {
    transport.stop();
    isPlaying = false;
    state = transport.state;
    notes = [];
    currentNote = 5;
    score = 0;
  }

  // Handle keyboard input.
  const handleKeydown = (e) => {
    lastKey = e.key === ' ' ? 'Space' : e.key;
    let attempt = keyboardNotes.indexOf(e.key);
    if (attempt > -1) {
      handleAttempt(noteValues[attempt]);
    }
  }

  // Handle midi input.
  const handleNoteOn = (e) => {
    lastKey = e.note.number + ' : ' + e.note.name + e.note.octave;
    handleAttempt(e.note.number);
  }

  // Handle when a note is triggered.
  const handleAttempt = (noteAttempt = null) => {
    clearTimeout(attemptTimeout);

    if (isPlaying) {
      // Compare with current active note.
      if (activeNote) {
        if (activeNote.number === noteAttempt) {
          audio.playPiano(noteAttempt);
          // Gain points based on accuracy.
          let delta = (transport.seconds - activeNote.time) * 100;
          updateScore(Math.ceil(20 - Math.abs(delta)));

          // Set the successful note.
          attempt = 'hit';
          activeNote.attempt = 'hit';
          attemptedNote = {
            pos: activeNote.id,
            hit: true
          }
        }
        else {
          // Wrong note!
          audio.playBuzzer();
          updateScore(-5);
          attempt = 'miss';
          activeNote.attempt = 'miss';
          let position = getNotePosition(noteAttempt);

          if (position !== null) {
            attemptedNote = {
              pos: position,
              hit: false
            }
          }
        }
      }
      else {
        // Miss! Lose 5 points!
        if (noteAttempt !== null) {
          audio.playBuzzer();
        }
        updateScore(-5);
        attempt = 'miss';
        let position = getNotePosition(noteAttempt);

        if (position !== null) {
          attemptedNote = {
            pos: position,
            hit: false
          }
        }
      }
    }
    else {
      // Practice notes!
      audio.playPiano(noteAttempt);
      let position = getNotePosition(noteAttempt);

      if (position !== null) {
        attemptedNote = {
          pos: position,
          hit: position >= 0 && position < noteValues.length
        }
      }
    }

    attemptTimeout = setTimeout(() => {
      attempt = '';
      attemptedNote = null;
    }, 500);
  }

  // Get the position on the stave for the given note number.
  const getNotePosition = (note = null) => {
    let position = null;

    if (note && noteValues.includes(note)) {
      position = noteValues.indexOf(note);
    }
    if (note && note < bottomNote) {
      position = -2;
    }
    if (note && note > topNote) {
      position = noteValues.length + 1;
    }

    return position;
  }

  // Update the score state given a score change.
  const updateScore = (delta) => {
    let newScore = score + delta;
    if (newScore < 0) {
      newScore = 0;
    }
    score = newScore;
  }

</script>

<p>Use a midi device or computer keyboard to hit the notes as they fly by!</p>
<p>
  <button on:click={ handlePlayPause }>{ isPlaying ? 'Pause' : 'Play' }</button>
  <button on:click={ handleStop }>Stop</button>
</p>
<p>
  <label for="level">Level</label>
  <input type="range" name="level" min="1" max="10" bind:value={level} disabled={isPlaying}/>
  <label for="speed">Speed</label>
  <input type="range" name="speed" min="1" max="10" bind:value={speed} disabled={isPlaying}/>
</p>

<!-- The game screen is actually one big animated SVG -->
<svg>
  <g class="stave" transform="translate(0,160)" stroke="#aaa">
    {#each [0,1,2,3,4] as line}
      <line
        x1="0"
        x2="100%"
        y1={(line * 20)}
        y2={(line * 20)}
      />
    {/each}
  </g>

  <line
    x1={OFFSET}
    x2={OFFSET}
    y1="100"
    y2="300"
    stroke="#f99"
    stroke-width="3"
  />

  {#each notes as note}
    <g
      class="note"
      stroke-opacity="{(note.position < 0) ? (100 + note.position) : 100}%"
      fill-opacity="{(note.position < 0) ? (100 + note.position) : 100}%"
      transform="translate({note.position + OFFSET}, {260 - (note.id * 10)})"
    >
      {#if note.id === 0 || note.id === 12}
        <line
          x1="-20"
          x2="20"
          y1="0"
          y2="0"
          stroke="#aaa"
        />
      {/if}
      {#if note.id < 6 }
        <line
          x1="10"
          x2="10"
          y1="-5"
          y2="-70"
          stroke={note.attempt ? (note.attempt === 'hit' ? '#3c3' : '#f00') : '#333'}
        />
      {:else}
        <line
          x1="-10"
          x2="-10"
          y1="5"
          y2="70"
          stroke={note.attempt ? (note.attempt === 'hit' ? '#3c3' : '#f00') : '#333'}
        />
      {/if}
      <circle
        cx="0"
        cy="0"
        r="10"
        fill={note.attempt ? (note.attempt === 'hit' ? '#3c3' : '#f00') : '#333'}
        transform="skewX(-20)"
      />
    </g>
  {/each}

  {#if attemptedNote !== null }
    <circle
      cx={OFFSET}
      cy={260 - (attemptedNote.pos * 10)}
      r="10"
      fill={attemptedNote.hit ? '#3c3' : '#900'}
    />
  {/if}

  <image href="treble.svg" x="20" y="127" />
  <text x="20" y="360" class:attempt >{ attempt }</text>
  <text x="50%" y="50" text-anchor="middle" class="score">Score: { score }</text>
</svg>

<img src="keymap.svg" alt="Key layout">

<div class="debug">
  <p>State: { state } | Position: { seconds.toFixed(1) }</p>
  <p>Last key: { lastKey }</p>
  <p>Note in range: { activeNote ? activeNote.number : '' }</p>
</div>

<svelte:body on:keydown={ handleKeydown }/>

<style>
  svg {
    width: 100%;
    height: 400px;
    background: #fafaff;
    border: 1px solid #d0d0dd;
    border-radius: 3px;
  }

  circle {
    z-index: 10;
  }

  text {
    font-size: 2rem;
    font-weight: bold;
    text-transform: uppercase;
  }

  input {
    margin: 5px;
    transform: translateY(10px);
  }

  .score {
    font-size: 20px;
    font-weight: normal;
  }

  .debug {
    font-size: 12px;
    color: grey;
  }
</style>
