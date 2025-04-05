<script lang="ts">
	import '../app.css';
	import type { NoteProps } from '$types/Note.svelte';
	import blankNote from '$types/Note.svelte';
	import type { NoteNode } from '$types/NoteNode';
	import Note from '../components/Note/Note.svelte';
	import NoteStore from '../stores/NoteStore';
	import { createNote } from '../components/Note/ts/note.svelte';
	import { onMount } from 'svelte';

	let notes: NoteProps[] = $state($NoteStore);
	
	onMount(() => {
		notes.push(blankNote);
	});

	async function handleBlurred(note: NoteProps) {
		if (!(blankNote.title || blankNote.nodes.length)) {
			return;
		}

		notes.push(createNote());
	}

	function handleDelete(id: string) {
		const noteIdx = notes.findIndex((note) => note.id === id);
		if (noteIdx === -1) {
			return;
		}

		notes.splice(noteIdx, 1);
	}

	function handleBlankDelete(id: string) {
		const noteIdx = notes.findIndex((note) => note.id === id);
		if (noteIdx === -1) {
			return;
		}

		notes.splice(noteIdx, 1);
		notes.push(createNote());
	}

	function updateNodes(id: string, nodes: NoteNode[]) {
		const noteIdx = notes.findIndex((note) => note.id === id);
		if (noteIdx === -1) {
			return;
		}

		notes[noteIdx].nodes = nodes;
	}
</script>

<!-- Notes -->
<div class="flex gap-1">
	{#each notes as note (note.id)}
		<Note {note} blurred={handleBlurred} deleted={handleDelete} updateNodes={updateNodes} />
	{/each}
</div>
