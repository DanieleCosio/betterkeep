import type NoteNode from '$types/NoteNode';

export function compareNoteNodes(this: NoteNode[], a: NoteNode, b: NoteNode): number {
	if (a.parent_id === b.parent_id) {
		return a.order - b.order;
	}

	if (!a.parent_id && b.parent_id) {
		return -1;
	}

	if (a.parent_id && !b.parent_id) {
		return 1;
	}

	const aParent = this.find((element) => element.id === a.parent_id);
	const bParent = this.find((element) => element.id === b.parent_id);

	if (aParent && bParent) {
		return aParent.order - bParent.order;
	}

	return 0;
}

export function getNodesIndex(nodes: NoteNode[]): { [key: string]: number } {
	const nodesIndex: { [key: string]: number } = {};

	for (let i = 0; i < nodes.length; i++) {
		nodesIndex[nodes[i].id] = i;
	}

	return nodesIndex;
}
