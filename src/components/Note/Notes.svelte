<script lang="ts">
	import type { NoteProps } from '$types/Note';
	import Note from './Note.svelte';
	import {
		baseNote as blankNote,
		baseNotes as notes,
		baseNotesIndex
	} from '../../stores/NoteStore.svelte';
	import { createNote } from './ts/note.svelte';
	import { onMount } from 'svelte';

	const notesIndex = baseNotesIndex();

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
		const noteIdx = notesIndex[id];
		if (noteIdx === -1) {
			return;
		}

		notes.splice(noteIdx, 1);
	}

	function handleBlankDelete(id: string) {
		const noteIdx = notesIndex[id];
		if (noteIdx === -1) {
			return;
		}

		notes.splice(noteIdx, 1);
		notes.push(createNote());
	}
</script>

<!-- Notes -->
<div class="flex gap-1">
	{#each notes as note (note.id)}
		<Note {note} blurred={handleBlurred} deleted={handleDelete} />
	{/each}
</div>
