import type NoteNode from '$types/NoteNode';
import type Rect from '$types/Rect';

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

export function getChildrenNodes(nodes: NoteNode[], id: string | undefined): NoteNode[] {
	return nodes.filter((element) => element.parent_id === id);
}

export function getNodesIndex(nodes: NoteNode[]): { [key: string]: number } {
	const nodesIndex: { [key: string]: number } = {};

	for (let i = 0; i < nodes.length; i++) {
		nodesIndex[nodes[i].id] = i;
	}

	return nodesIndex;
}

export function isDraggableInBounding(containerRect: Rect, nodeRect: Rect): boolean {
	if (
		nodeRect.x < containerRect.x ||
		nodeRect.y < containerRect.y ||
		nodeRect.x + nodeRect.width >= containerRect.x + containerRect.width ||
		nodeRect.y + nodeRect.height >= containerRect.y + containerRect.height
	) {
		return false;
	}

	return true;
}
