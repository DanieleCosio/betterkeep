import type NoteNode from '$types/NoteNode';
import type { NodesIndex } from '$types/NodesIndex';
import { getRandomString } from '../utils';

export function createNewNode(top: number, height: number): NoteNode {
	return {
		id: getRandomString(8),
		isVisible: true,
		depth: 0,
		parent_id: null,
		dragging: false,
		order: 0,
		height: height,
		top: top
	};
}

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

export function getNodesIndex(nodes: NoteNode[]): NodesIndex {
	const nodesIndex: NodesIndex = {};

	for (let i = 0; i < nodes.length; i++) {
		nodes[i].order = i;
		nodesIndex[nodes[i].id] = i;
	}

	return nodesIndex;
}

export function getParentId(
	node: NoteNode,
	nodes: NoteNode[],
	nodesIndex: NodesIndex
): string | null {
	// Nodes need to be sorted by top
	if (node.depth === 0) {
		return null;
	}

	let index = nodesIndex[node.id] === 0 ? 0 : nodesIndex[node.id] - 1;
	for (index; index >= 0; --index) {
		if (nodes[index].depth === node.depth - 1) {
			return nodes[index].id;
		}
	}

	return null;
}

export function updateChildren(
	nodes: NoteNode[],
	nodesIndex: NodesIndex | undefined = undefined
): NoteNode[] {
	// Nodes need to be sorted by top
	nodesIndex = nodesIndex ? nodesIndex : getNodesIndex(nodes);
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].depth > 0) {
			nodes[i].parent_id = getParentId(nodes[i], nodes, nodesIndex);
		} else {
			nodes[i].parent_id = null;
		}
	}
	return nodes;
}

export function getNewNodePosition(
	nodes: NoteNode[],
	nodePadding: number,
	startingValue = 15,
	excludeNonVisibles = true
): number {
	let sum = startingValue;
	let invisibleCounter = 0;
	if (nodes.length > 0) {
		for (const node of nodes) {
			if (!node.isVisible && excludeNonVisibles) {
				invisibleCounter++;
				continue;
			}
			sum += node.height;
		}
		sum += nodePadding * (nodes.length - invisibleCounter);
	}

	return sum;
}

export function computeNodesPositions(
	nodes: NoteNode[],
	nodePadding: number,
	excludeList: string[] = [],
	excludeNonVisibles = true
): NoteNode[] {
	// L'array passato deve essere ordinato
	for (let i = 0; i < nodes.length; i++) {
		if (excludeList && excludeList.includes(nodes[i].id)) {
			continue;
		}

		if (!nodes[i].isVisible && excludeNonVisibles) {
			continue;
		}

		nodes[i].top = getNewNodePosition(nodes.slice(0, i), nodePadding, 15, excludeNonVisibles);
	}

	return nodes;
}

export function sortNodesByPosition(a: NoteNode, b: NoteNode): number {
	if (a.top < b.top) {
		return -1;
	}

	if (a.top > b.top) {
		return 1;
	}

	return 0;
}

export function computeDrop(nodes: NoteNode[]): NoteNode[] {
	return nodes.sort(sortNodesByPosition);
}

export function getNewNodeDepth(
	node: NoteNode,
	nodes: NoteNode[],
	deltaX: number,
	trashold = 28
): number {
	nodes = nodes.sort(sortNodesByPosition);
	const nodeIndex = getNodesIndex(nodes);

	if (nodeIndex[node.id] === 0) {
		return 0;
	}

	const multiplier = Math.floor(deltaX / trashold);
	if (multiplier < 0) {
		const depth = nodes[nodeIndex[node.id] - 1].depth - -multiplier;
		return depth < 0 ? 0 : depth;
	}

	if (multiplier > 0) {
		const depth = node.depth + multiplier;
		const maxDepth = nodes[nodeIndex[node.id] - 1].depth + 1;
		return depth > maxDepth ? maxDepth : depth;
	}

	return nodes[nodeIndex[node.id] - 1].depth;
}

export function updateChildrenDepth(
	node: NoteNode,
	nodes: NoteNode[],
	nodesIndex: NodesIndex | undefined
): NoteNode[] {
	nodesIndex = nodesIndex ?? getNodesIndex(nodes);
	if (nodesIndex[node.id] + 1 >= nodes.length) {
		return nodes;
	}
	let child = nodes[nodesIndex[node.id] + 1];
	if (child.parent_id !== node.id) {
		return nodes;
	}
	nodes[nodesIndex[node.id] + 1].depth = node.depth + 1;

	for (let idx = nodesIndex[child.id] + 1; idx < nodes.length; idx++) {
		if (nodes[idx].parent_id === child.id) {
			nodes[idx].depth = child.depth + 1;
		}
		child = nodes[idx];
	}

	return nodes;
}
