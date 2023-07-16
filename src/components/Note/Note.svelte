<script lang="ts">
	import type { NodesIndex } from '$types/NodesIndex';
	import type NoteNode from '$types/NoteNode';
	import { getRandomString } from '../utils';
	import Node from './Node.svelte';
	import {
		computeDrop,
		computeNodesPositions,
		getChildrenNodesRecursive,
		getNewNodePosition,
		getNodeIdxByPosition,
		getNodesIndex,
		updateChildren
	} from './note';

	const NODE_HEIGHT = 20;
	const NODE_PADDING = 12;

	export let nodes: NoteNode[] = [];
	let nodesContainer: HTMLFieldSetElement | undefined = undefined;
	let nodesIndex: NodesIndex = {};
	let isDragging: boolean = false;
	let draggedNodeId: string | undefined = undefined;
	let draggedNodeHeight: number = 0;
	let draggedNodePosition: number = 0;

	/* EVENTS */
	function handleDelete(event: CustomEvent<{ id: string }>) {
		const id: string = event.detail.id;
		const position = nodesIndex[id];
		if (position === undefined || !nodesContainer) {
			return;
		}

		nodes.splice(position, 1);

		const newHeight = getNewNodePosition(nodes, NODE_PADDING);
		nodesContainer.style.height = `${newHeight}px`;

		nodes = nodes;
		nodesIndex = getNodesIndex(nodes);

		// I need i timeout here because the textarea is been focused while the backspace is still pressed
		setTimeout(() => {
			const previousPosition = position - 1;
			if (previousPosition >= 0 && nodes[previousPosition].html) {
				const textArea = nodes[previousPosition].html?.querySelector('textarea');
				if (textArea) {
					textArea.focus();
				}
			}
		}, 25);
	}

	function handleTitleKeyUp(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !nodesContainer) {
			return;
		}

		for (const node of nodes) {
			if (!node.parent_id) {
				node.order = node.order + 1;
			}
		}

		let newHeight = NODE_HEIGHT;
		if (nodesContainer.style.height) {
			newHeight = parseInt(nodesContainer.style.height, 10) + NODE_HEIGHT;
		}
		nodesContainer.style.height = `${newHeight}px`;

		const top = getNewNodePosition(nodes, NODE_PADDING);
		nodes = [
			{
				id: getRandomString(8),
				isHovered: false,
				isVisible: true,
				depth: 0,
				parent_id: null,
				order: 0,
				height: NODE_HEIGHT,
				top: top
			},
			...nodes
		];

		nodesIndex = getNodesIndex(nodes);
	}

	function handleResized(event: CustomEvent<{ id: string; difference: number }>) {
		const id: string = event.detail.id;
		const difference: number = event.detail.difference;

		const position = nodesIndex[id];
		if (position === undefined || !nodesContainer) {
			return;
		}

		for (let i = position + 1; i < nodes.length; i++) {
			nodes[i].top = nodes[i].top + difference;
		}

		nodesContainer.style.height = parseInt(nodesContainer.style.height, 10) + difference + 'px';
		nodes = nodes;
	}

	function handleAdd(event: CustomEvent<{ id: string }>) {
		if (!nodesContainer) {
			return;
		}

		const top = getNewNodePosition(nodes, NODE_PADDING);

		nodes.splice(nodesIndex[event.detail.id] + 1, 0, {
			id: getRandomString(8),
			isHovered: false,
			isVisible: true,
			depth: 0,
			parent_id: null,
			order: nodes[nodesIndex[event.detail.id]].order + 1,
			height: NODE_HEIGHT,
			top: top
		});

		for (let i = nodesIndex[event.detail.id] + 2; i < nodes.length; i++) {
			nodes[i].order = nodes[i].order + 1;
		}

		const newHeight = getNewNodePosition(nodes, NODE_PADDING);
		nodesContainer.style.height = `${newHeight}px`;

		nodes = nodes;
		nodesIndex = getNodesIndex(nodes);
	}

	function handleDragStarted(
		event: CustomEvent<{ id: string; nodeHtml: HTMLDivElement; position: { x: number; y: number } }>
	) {
		isDragging = true;
		draggedNodeId = event.detail.id;

		draggedNodeHeight = nodes[nodesIndex[draggedNodeId]].height;
		draggedNodePosition = nodes[nodesIndex[draggedNodeId]].top;
		nodes[nodesIndex[draggedNodeId]].height = NODE_HEIGHT;

		for (let i = nodesIndex[draggedNodeId] + 1; i < nodes.length; i++) {
			nodes[i].top -= draggedNodeHeight + NODE_PADDING;
		}

		// Hide all children
		const children = getChildrenNodesRecursive(nodes, draggedNodeId);
		for (const child of children) {
			nodes[nodesIndex[child.id]].isVisible = false;
		}

		nodes = nodes;
	}

	function handleDragEnded(event: CustomEvent<{ id: string }>) {
		isDragging = false;

		if (!draggedNodeId) {
			return;
		}

		nodes[nodesIndex[draggedNodeId]].height = draggedNodeHeight;

		let tmpNodes = nodes;
		const hoveredNode = nodes.find((node) => node.isHovered);
		if (hoveredNode) {
			tmpNodes = computeDrop(hoveredNode.id, event.detail.id, tmpNodes, nodesIndex);
		} else {
			tmpNodes[nodesIndex[draggedNodeId]].top = draggedNodePosition;
		}
		tmpNodes = computeNodesPositions(tmpNodes, NODE_PADDING, []);

		for (const node of tmpNodes) {
			node.isVisible = true;
			node.isHovered = false;
		}

		nodesIndex = getNodesIndex(tmpNodes);
		nodes = tmpNodes;
	}

	function handleDragged(event: CustomEvent<{ id: string }>) {
		const draggedNode = nodes[nodesIndex[event.detail.id]];

		const draggedNodePosition = draggedNode.top;
		const index = getNodeIdxByPosition(nodes, draggedNodePosition, draggedNode.height, [
			draggedNode.id
		]);

		for (const node of nodes) {
			node.isHovered = false;
		}

		if (index === undefined) {
			nodes = nodes;
			return;
		}

		if (!nodes[index] || nodes[index].id === event.detail.id) {
			return;
		}

		nodes[index].isHovered = true;
		nodes = nodes;
		nodesIndex = getNodesIndex(nodes);
	}

	function handleAddChild(event: CustomEvent<{ id: string }>) {
		const droppedId: string = event.detail.id;
		let droppedNodePosition = nodesIndex[droppedId];
		if (droppedId === draggedNodeId || draggedNodeId === undefined) {
			nodes[droppedNodePosition].isHovered = false;
			return;
		}

		const draggedNodePosition = nodesIndex[draggedNodeId];
		const draggedNode = nodes[draggedNodePosition];
		if (draggedNodePosition > droppedNodePosition) {
			droppedNodePosition += 1;
		}

		nodes[droppedNodePosition].isHovered = false;
		nodes.splice(draggedNodePosition, 1);
		nodes.splice(droppedNodePosition, 0, draggedNode);

		nodes[droppedNodePosition].parent_id = droppedId;
		nodesIndex = getNodesIndex(nodes);
		nodes[droppedNodePosition].depth = nodes[nodesIndex[droppedId]].depth + 1;

		nodes = updateChildren(nodes[droppedNodePosition], nodes);
		nodesIndex = getNodesIndex(nodes);

		handleDragEnded(event);
	}
</script>

<div class="flex flex-col p-5 bg-lime-700 rounded max-w-xs gap-2">
	<input
		type="text"
		placeholder="Titolo"
		class="bg-lime-700 text-white border-none"
		on:keyup={handleTitleKeyUp}
	/>
	<fieldset
		bind:this={nodesContainer}
		class="
			relative
			{`gap-[${NODE_PADDING}px]`} 
			{isDragging ? '[&>div]:brightness-75' : ''}
		"
	>
		{#each nodes as node (node.id)}
			<!-- <Node
				{node}
				on:add={handleAdd}
				on:delete={handleDelete}
				on:dragstarted={handleDragStarted}
				on:dragended={handleDragEnded}
				on:dragentered={handleDragEntered}
				on:dragleft={handleDragLeft}
				on:dropped={handleDropped}
				on:addchild={handleAddChild}
				on:resized={handleResized}
			/> -->

			<Node
				{node}
				on:add={handleAdd}
				on:delete={handleDelete}
				on:dragstarted={handleDragStarted}
				on:dragended={handleDragEnded}
				on:dragged={handleDragged}
				on:resized={handleResized}
			/>
		{/each}
	</fieldset>
</div>

<style></style>
