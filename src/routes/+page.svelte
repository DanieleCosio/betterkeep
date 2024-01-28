<script lang="ts">
	import '../app.css';
	import type { NoteProps } from '$types/Note';
	import Note from '../components/Note/Note.svelte';
	import NoteStore from '../stores/NoteStore';
	import { createNote } from '../components/Note/note';

	let notes: NoteProps[] = $NoteStore;
	let blankNote: NoteProps = createNote();

	async function handleBlurred(event: CustomEvent<{ note: NoteProps }>) {
		if (!(blankNote.title || blankNote.nodes.length)) {
			return;
		}

		NoteStore.updateNote(event.detail.note);
		notes = $NoteStore;
		blankNote = createNote();
	}

	function handleDelete(event: CustomEvent<{ id: string }>) {
		NoteStore.deleteNote(event.detail.id);
		notes = $NoteStore;
	}

	function handleBlankDelete(event: CustomEvent<{ id: string }>) {
		NoteStore.deleteNote(event.detail.id);
		notes = $NoteStore;
		blankNote = createNote();
	}
</script>

{#key blankNote}
	<Note note={blankNote} on:blurred={handleBlurred} on:delete={handleBlankDelete} />
{/key}

<!-- Notes -->
<div class="flex gap-1">
	{#each notes as note (note.id)}
		<Note {note} on:blurred={handleBlurred} on:delete={handleDelete} />
	{/each}
</div>
