<script lang="ts">
	import '../app.css';
	import type { NoteProps } from '$types/Note';
	import Note from '../components/Note/Note.svelte';
	import notesStore from '../stores/Notes';
	import { createNote } from '../components/Note/note';
	import { tick } from 'svelte';
	import { updateStore } from '../components/Note/note';

	let notes: NoteProps[] = $notesStore;
	let blankNote: NoteProps = createNote();

	$: console.log(notes);

	async function handleBlurred(
		event: CustomEvent<{
			note: NoteProps;
		}>
	) {
		console.log('Blurred');
		notesStore.update((currentData: NoteProps[]) => {
			return updateStore(currentData, event.detail.note);
		});

		notes = $notesStore;
	}
</script>

<Note note={blankNote} on:blurred={handleBlurred} />
<!-- Notes -->
<div class="flex gap-1">
	{#each notes as note (note.id)}
		<Note {note} on:blurred={handleBlurred} />
	{/each}
</div>
