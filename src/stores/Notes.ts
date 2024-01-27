import type { NoteProps } from '$types/Note';
import { writable, type Writable } from 'svelte/store';

const notesStore: Writable<NoteProps[]> = writable([]);

export default notesStore;
