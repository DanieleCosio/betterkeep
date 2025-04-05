import type Node from '$types/Node';

export interface NoteNode extends Node {
	parent_id: string | null;
}