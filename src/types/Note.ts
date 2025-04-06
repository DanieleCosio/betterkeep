import type { NoteNode }from './NoteNode';

export interface NoteProps {
	readonly id: string;
	title: string;
	nodes: NoteNode[];
	isFocused: boolean;
	created_at: number;
	updated_at: number;
}
