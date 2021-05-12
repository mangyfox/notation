<script>
  import { onMount } from 'svelte';
  export let Tone = null;
  export let inputs = null;

  // Screen offset for target line.
  const OFFSET = 200;

  // The audio transport.
  const transport = Tone.Transport;

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

  // Keyboard note values.
  const keyboardNotes = ['z','x','c','v','b','n','m','q','w','e','r','t','y'];

  // Add a new random note to the end of the current piece.
  const addNote = () => {
    notes.push({
      time: currentNote,
      id: Math.floor(Math.random() * (level + 3)),
      position: (currentNote - seconds) * 200
    });
    currentNote += 5 / speed;
  }

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

      if (isPlaying && notes.length < 10) {
        addNote();
      }

      // Update the note data.
      notes = notes.reduce((result, note) => {
        note.position = (note.time - seconds) * 200;
        if (note.position > -(OFFSET)) {
          result.push(note);
        }
        if (note.position > -20 && note.position < 20) {
          activeNote = note;
        }
        if (note.position < -20 && !note.attempt) {
          note.attempt = 'miss';
          handleAttempt(-1);
        }
        return result;
      }, []);
    }

    loop();

    return () => cancelAnimationFrame(frame);
  });

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

  const handleStop = () => {
    transport.stop();
    isPlaying = false;
    state = transport.state;
    notes = [];
    currentNote = 5;
    score = 0;
  }

  const handleKeydown = (e) => {
    lastKey = e.key === ' ' ? 'Space' : e.key;
    if (isPlaying) {
      let attempt = keyboardNotes.indexOf(e.key);
      handleAttempt(attempt);
    }
  }

  const handleNoteOn = (e) => {
    lastKey = e.note.number + ' : ' + e.note.name + e.note.octave;
    if (isPlaying) {
      if (activeNote && noteValues[activeNote.id] == e.note.number) {
        handleAttempt(activeNote);
      }
      else {
        handleAttempt(-1);
      }
    }
  }

  const handleAttempt = (noteAttempt = null) => {
    clearTimeout(attemptTimeout);

    // Compare with current active note.
    if (activeNote) {
      if (activeNote.id === noteAttempt) {
        // Gain points based on accuracy.
        let delta = (transport.seconds - activeNote.time) * 100;
        updateScore(Math.ceil(20 - Math.abs(delta)));
        attempt = 'hit';
        activeNote.attempt = 'hit';
        attemptedNote = {
          id: noteAttempt,
          hit: true
        }
      }
      else {
        // Wrong note!
        updateScore(-5);
        attempt = 'miss';
        activeNote.attempt = 'miss';
        if (noteAttempt > -1) {
          attemptedNote = {
            id: noteAttempt,
            hit: false
          }
        }
      }
    }
    else {
      // Miss! Lose 5 points!
      updateScore(-5);
      attempt = 'miss';
      if (noteAttempt > -1) {
        attemptedNote = {
          id: noteAttempt,
          hit: false
        }
      }
    }
    attemptTimeout = setTimeout(() => {
      attempt = '';
      attemptedNote = null;
    }, 500);
  }

  const updateScore = (delta) => {
    let newScore = score + delta;
    if (newScore < 0) {
      newScore = 0;
    }
    score = newScore;
  }

</script>

<p>Use a midi device to hit the notes as they fly by!</p>

<label for="level">Level</label>
<input type="range" name="level" min="1" max="10" bind:value={level} disabled={isPlaying}/>
<label for="speed">Speed</label>
<input type="range" name="speed" min="1" max="10" bind:value={speed} disabled={isPlaying}/>
<button on:click={ handlePlayPause }>{ isPlaying ? 'Pause' : 'Play' }</button>
<button on:click={ handleStop }>Stop</button>
<p>State: { state } | Position: { seconds.toFixed(1) }</p>

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
  {#if isPlaying && seconds % 1 < 0.5}
    <circle
      cx="50"
      cy="50"
      r="10"
      fill="#f33"
    />
  {/if}
  {#if attemptedNote !== null }
    <circle
      cx={OFFSET}
      cy={260 - (attemptedNote.id * 10)}
      r="10"
      fill={attemptedNote.hit ? '#3c3' : '#900'}
    />
  {/if}
  <image href="treble.svg" x="20" y="127" />
  <text x="20" y="360" class:attempt >{ attempt }</text>
  <text x="50%" y="50" text-anchor="middle" class="score">Score: { score }</text>
</svg>

<p>Last key: { lastKey }</p>
<p>Note in range: { activeNote ? activeNote.id : '' }</p>

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
</style>
