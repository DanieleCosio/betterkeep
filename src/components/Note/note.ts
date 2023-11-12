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

export function computeDrop(
	/* droppedId: string,
	draggedNodeId: string, */
	nodes: NoteNode[]
	/* nodesIndex: NodesIndex | undefined = undefined */
): NoteNode[] {
	/* if (droppedId === draggedNodeId || draggedNodeId === undefined) {
		return nodes;
	}

	if (nodesIndex === undefined) {
		nodesIndex = getNodesIndex(nodes);
	}

	const draggedNodePosition = nodesIndex[draggedNodeId];
	let droppedNodePosition = nodesIndex[droppedId];
	const droppedNode = nodes[droppedNodePosition];
	const draggedNode = nodes[draggedNodePosition];
	let tmpNodes = nodes;

	// Same parent just swap
	if (nodes[draggedNodePosition].parent_id === nodes[droppedNodePosition].parent_id) {
		const droppedNode = nodes[droppedNodePosition];
		nodes.splice(droppedNodePosition, 1, nodes[draggedNodePosition]);
		nodes.splice(draggedNodePosition, 1, droppedNode);
		tmpNodes = updateChildren(droppedNode, nodes);
		tmpNodes = updateChildren(draggedNode, tmpNodes);
	} else {
		if (draggedNodePosition < droppedNodePosition) {
			droppedNodePosition -= 1;
		}

		nodes.splice(draggedNodePosition, 1);
		nodes.splice(droppedNodePosition, 0, draggedNode);
		nodes[droppedNodePosition].parent_id = droppedNode.parent_id;
		nodes[droppedNodePosition].depth = droppedNode.depth;

		tmpNodes = updateChildren(droppedNode, nodes);
		tmpNodes = updateChildren(draggedNode, tmpNodes);
	} */

	nodes = nodes.sort((a: NoteNode, b: NoteNode) => {
		if (a.top < b.top) {
			return -1;
		}

		if (a.top > b.top) {
			return 1;
		}

		return 0;
	});

	return nodes;
}
