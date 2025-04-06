import { createNote } from '../components/Note/ts/note.svelte';
import { type NoteProps } from '$types/Note';
import { getNotesIndex } from '../components/Note/ts/notes.svelte';


let notes = $state<NoteProps[]>([createNote([])]);
export const baseNotes = () => notes;

const notesIndex = $derived(getNotesIndex(notes));
export const baseNotesIndex = () => notesIndex;

export const addNote = () => {
	const note = createNote([]);

	notes = [...notes, note];
};
export const removeNote = (index: number) => {
	if (notes.length === 0) {
		return;
	}

	notes.splice(index, 1);
};
