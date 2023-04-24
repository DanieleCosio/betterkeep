import type Node from '$types/Node';

interface NoteNodes extends Node {
	parent_id: string | null;
	order: number;
}

export default NoteNodes;
