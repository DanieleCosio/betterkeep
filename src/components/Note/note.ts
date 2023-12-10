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

export function getNewNodeDepth(
	node: NoteNode,
	nodes: NoteNode[],
	deltaX: number,
	trashold = 28
): number {
	nodes = nodes.sort(sortNodesByPosition);
	const nodeIndex = getNodesIndex(nodes);

	const idx = nodeIndex[node.id];
	if (idx === 0) {
		return 0;
	}

	const multiplier = Math.floor(deltaX / trashold);
	let depth = nodes[idx - 1].depth;
	let minDepth = 0;

	if (idx + 1 < nodes.length && idx - 1 >= 0 && nodes[idx + 1].parent_id === nodes[idx - 1].id) {
		minDepth = nodes[idx + 1].depth;
	}

	if (multiplier > 0) {
		depth = node.depth + multiplier;
		const maxDepth = nodes[idx - 1].depth + 1;
		return depth > maxDepth ? maxDepth : depth;
	}

	if (multiplier < 0) {
		depth = node.depth - -multiplier;
	}

	return depth < minDepth ? minDepth : depth;
}
