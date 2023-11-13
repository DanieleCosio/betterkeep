import type NoteNode from '$types/NoteNode';
import type { NodesIndex } from '$types/NodesIndex';
import { getRandomString } from '../utils';

export function createNewNode(top: number, height: number): NoteNode {
	return {
		id: getRandomString(8),
		isHovered: false,
		isVisible: true,
		depth: 0,
		parent_id: null,
		dragging: false,
		transitioning: false,
		order: 0,
		height: height,
		top: top,
		beingAdopted: false
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
	for (index; index > 0; --index) {
		if (nodes[index].depth === node.depth - 1) {
			return nodes[index].id;
		}
	}

	return null;
}

export function updateChildren(nodes: NoteNode[]): NoteNode[] {
	// Nodes need to be sorted by top
	const nodesIndex = getNodesIndex(nodes);
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].depth > 0) {
			nodes[i].parent_id = getParentId(nodes[i], nodes, nodesIndex);
		}
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
	if (nodes.length > 0) {
		for (const node of nodes) {
			sum += node.height;
		}
		sum += nodePadding * nodes.length - 1;
	}

	return sum;
}

export function getNodeIdxByPosition(
	nodes: NoteNode[],
	position: number,
	nodeHeight: number,
	direction: Direction | undefined,
	ignoreList: string[] = [],
	trashold = 3
): number | undefined {
	const nodeIndex = getNodesIndex(nodes);
	nodes = nodes.filter((node) => !ignoreList.includes(node.id));

	// If there are less than 2 nodes just iterate
	if (nodes.length < 3) {
		for (const node of nodes) {
			if (ignoreList.includes(node.id)) {
				continue;
			}

			const condition =
				position + nodeHeight > node.top + node.height / 2 - trashold &&
				position < node.top + node.height / 2 + trashold;
			if (condition) {
				return nodeIndex[node.id];
			}
		}

		return undefined;
	}

	// If more than 2 nodes use binary search
	let low = 0;
	let mid = 0;
	let iter = 0;
	let high = nodes.length - 1;
	const maxIter = nodes.length;

	while (high >= low && iter < maxIter) {
		mid = low + Math.floor((high - low) / 2);

		/* console.log(
			nodes[mid].top,
			position,
			position + nodeHeight,
			nodes[mid].top + nodes[mid].height,
			high,
			low,
			mid,
			iter
		); */

		const condition =
			position + nodeHeight > nodes[mid].top + nodes[mid].height / 2 - trashold &&
			position < nodes[mid].top + nodes[mid].height / 2 + trashold;
		if (condition) {
			return nodeIndex[nodes[mid].id];
		}

		if (nodes[mid].top > position) {
			high = mid - 1;
		} else {
			low = mid + 1;
		}

		iter++;
	}

	return undefined;
}

export function computeNodesPositions(
	nodes: NoteNode[],
	nodePadding: number,
	excludeList: string[] = []
): NoteNode[] {
	// L'array passato deve essere ordinato
	for (let i = 0; i < nodes.length; i++) {
		if (excludeList && excludeList.includes(nodes[i].id)) {
			continue;
		}

		nodes[i].top = getNewNodePosition(nodes.slice(0, i), nodePadding);
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
	requestingAdoption: boolean,
	requestingSeparation: boolean
): number {
	nodes = nodes.sort(sortNodesByPosition);
	const nodeIndex = getNodesIndex(nodes);

	if (nodeIndex[node.id] === 0) {
		return 0;
	}

	if (requestingSeparation && node.depth > 0) {
		return nodes[nodeIndex[node.id]].depth - 1;
	}

	if (requestingAdoption) {
		return nodes[nodeIndex[node.id] - 1].depth + 1;
	}

	return nodes[nodeIndex[node.id] - 1].depth;
}
