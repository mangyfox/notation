class AudioHandler {
  constructor(Tone) {
    this.piano = new Tone.Synth().toDestination();
    this.piano.oscillator.type = 'sine2';
    this.piano.volume.value = -10;
    this.buzzer = new Tone.Synth().toDestination();
    this.ticker = new Tone.PluckSynth().toDestination();
    this.ticker.volume.value = -10;
  }

  // Convert the midi note number into the note name.
  getNoteName(noteNumber) {
    if (noteNumber < 21 || noteNumber > 108) {
      return null;
    }
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(noteNumber / 12) - 1;
    const note = notes[noteNumber % 12];

    return note + octave;
  }

  // Trigger a piano note for a given note number.
  playPiano(note) {
    const noteName = this.getNoteName(note);

    if (noteName) {
      this.piano.triggerAttackRelease(noteName, "8n");
    }
  }

  // Trigger the buzzer sound.
  playBuzzer() {
    this.buzzer.triggerAttackRelease("C2", "16n");
  }

  // Trigger the tick sound.
  playTicker() {
    this.ticker.triggerAttackRelease("C4", "16n");
  }
}

export default AudioHandler;
