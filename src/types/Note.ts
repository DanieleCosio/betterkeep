import type NoteNodes from './NoteNode';

export interface NoteProps {
	readonly id: string;
	nodes: NoteNodes[];
	isFocused: boolean;
	created_at: number;
	updated_at: number;
}
