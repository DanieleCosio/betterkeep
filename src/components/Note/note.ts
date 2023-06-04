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

export function getChildrenNodesRecursive(nodes: NoteNode[], id: string | undefined): NoteNode[] {
	const children = getChildrenNodes(nodes, id);
	if (!children.length) {
		return [];
	}

	return children.concat(
		children.map((child) => getChildrenNodesRecursive(nodes, child.id)).flat()
	);
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
	let nodeIndex = getNodesIndex(nodes);
	let children = nodes.filter((element) => element.parent_id === node.id);
	if (!children.length) {
		return nodes;
	}

	children.sort(compareNoteNodes.bind(children));
	children = children.map((child) => {
		nodes.splice(nodeIndex[child.id], 1);
		child.depth = node.depth + 1;
		nodeIndex = getNodesIndex(nodes);
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

export function removeNode(node: NoteNode, nodes: NoteNode[]): NoteNode[] {
	const index = nodes.findIndex((element) => element.id === node.id);
	nodes.splice(index, 1);
	return nodes;
}

export function getNewNodePosition(nodes: NoteNode[], nodePadding: number): number {
	let sum = 0;
	for (const node of nodes) {
		if (node.html) {
			sum += node.html?.clientHeight;
		}
	}
	sum += nodePadding * nodes.length - 1;
	return sum;
}
