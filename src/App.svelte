<script>
	import * as Tone from 'tone';
	import WebMidi from 'webmidi';
	import { onMount } from 'svelte';
	import Game from './Game.svelte';

	let init = false;
	let midiInputs = false;

	const handleStart = async () => {
		await Tone.start();
		init = true;
	}

	onMount(() => {
		WebMidi.enable(err => {
			if (err) {
				console.log("WebMidi could not be enabled.", err);
			} else {
				console.log("WebMidi enabled!");
				midiInputs = WebMidi.inputs;
			}
		});
	});
</script>

<header>
	{#if midiInputs}
		WebMidi is enabled
	{:else}
		WebMidi is not enabled
	{/if}
</header>

<main>
	<h1>Notation Trainer</h1>

	{#if init}
		<Game Tone={ Tone } inputs={ midiInputs }/>
	{:else}
		<button on:click={ handleStart }>
			Start training!
		</button>
	{/if}
</main>


<style>
	header {
		text-align: right;
		padding: 1em;
	}
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: 1000px;
		}
	}
</style>
