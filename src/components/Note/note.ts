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

export function getChildrenNodes(nodes: NoteNode[], id: string | undefined): NoteNode[] {
	return nodes.filter((element) => element.parent_id === id);
}

export function getNodesIndex(nodes: NoteNode[]): { [key: string]: number } {
	const nodesIndex: { [key: string]: number } = {};

	for (let i = 0; i < nodes.length; i++) {
		nodes[i].order = i;
		nodesIndex[nodes[i].id] = i;
	}

	return nodesIndex;
}

export function updateChildren(node: NoteNode, nodes: NoteNode[]): NoteNode[] {
	let children = nodes.filter((element) => element.parent_id === node.id);
	if (!children.length) {
		return nodes;
	}

	children.sort(compareNoteNodes.bind(children));
	let nodeIndex = getNodesIndex(nodes);
	children = children.map((child) => {
		nodes.splice(nodeIndex[child.id], 1);
		child.depth = node.depth + 1;
		return child;
	});

	nodeIndex = getNodesIndex(nodes);
	const parentPosition = nodeIndex[node.id];
	nodes.splice(parentPosition + 1, 0, ...children);

	for (const child of children) {
		updateChildren(child, nodes);
	}

	return nodes;
}
