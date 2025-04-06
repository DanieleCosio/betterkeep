<script lang="ts">
	import type { NoteProps } from '$types/Note';
	import Note from './Note.svelte';
	import {
		baseNotes as notes,
		baseNotesIndex,
		addNote,
		removeNote
	} from '../../stores/NoteStore.svelte';

	const notesIndex = baseNotesIndex();
	
	async function handleBlurred(note: NoteProps) {
		const blankNotePresent = notes().find((note) => !note.title && !note.nodes.length);
		if (blankNotePresent) {
			return;
		}

		addNote();
	}

	function handleDelete(id: string) {
		const noteIdx = notesIndex[id];
		if (noteIdx === -1) {
			return;
		}

		removeNote(noteIdx);
	}
</script>

<!-- notes() -->
<div class="flex flex-col gap-3">
	{#key notes()}
		<Note note={notes()[notes().length - 1]} blurred={handleBlurred} deleted={handleDelete} />
	{/key}

	<div class="flex gap-1">
		{#each notes() as note (note.id)}
			{#if note.id !== notes()[notes().length - 1].id}
				<Note {note} blurred={handleBlurred} deleted={handleDelete} />
			{/if}
		{/each}
	</div>
</div>
