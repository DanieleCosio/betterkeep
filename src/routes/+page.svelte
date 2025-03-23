<script lang="ts">
	import '../app.css';
	import type { NoteProps } from '$types/Note';
	import Note from '../components/Note/Note.svelte';
	import NoteStore from '../stores/NoteStore';
	import { createNote } from '../components/Note/note';

	let notes: NoteProps[] = $state($NoteStore);
	let blankNote: NoteProps = $state(createNote());

	async function handleBlurred(note: NoteProps) {
		if (!(blankNote.title || blankNote.nodes.length)) {
			return;
		}

		NoteStore.updateNote(note);
		notes = $NoteStore;
		blankNote = createNote();
	}

	function handleDelete(id: string) {
		NoteStore.deleteNote(id);
		notes = $NoteStore;
	}

	function handleBlankDelete(id: string) {
		NoteStore.deleteNote(id);
		notes = $NoteStore;
		blankNote = createNote();
	}
</script>

{#key blankNote}
	<Note note={blankNote} blurred={handleBlurred} deleted={handleBlankDelete} />
{/key}

<!-- Notes -->
<div class="flex gap-1">
	{#each notes as note (note.id)}
		<Note {note} blurred={handleBlurred} deleted={handleDelete} />
	{/each}
</div>
