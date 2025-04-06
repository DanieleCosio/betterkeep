import { createNote } from "../components/Note/ts/note.svelte";
import { type NoteProps } from "$types/Note";
import { type Index } from "$types/Index";
import { getNotesIndex } from "../components/Note/ts/notes.svelte";

export const baseNote = createNote([]);

export const baseNotes = $state<NoteProps[]>([]);

const notesIndex = $derived(getNotesIndex(baseNotes));
export const baseNotesIndex = () => notesIndex;