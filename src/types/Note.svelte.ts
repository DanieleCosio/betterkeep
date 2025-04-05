import { createNote } from '../components/Note/ts/note.svelte';
import type { NoteNode }from './NoteNode';

export interface NoteProps {
	readonly id: string;
	title: string;
	nodes: NoteNode[];
	isFocused: boolean;
	created_at: number;
	updated_at: number;
}

const baseNote = createNote([]);
export default baseNote
