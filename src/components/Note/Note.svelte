<script lang="ts">
	import type { NodesIndex } from '$types/NodesIndex';
	import type NoteNode from '$types/NoteNode';
	import { afterUpdate, tick } from 'svelte';
	import { getRandomString } from '../utils';
	import Node from './Node.svelte';
	import {
		computeDrop,
		computeNodesPositions,
		createNewNode,
		getChildrenNodesRecursive,
		getNewNodePosition,
		getNodeIdxByPosition,
		getNodesIndex,
		updateChildren
	} from './note';
	import { Direction } from '../../enums';

	const NODE_HEIGHT = 20;
	const NODE_PADDING = 6;
	const NODE_CONTAINER_FAKE_PADDING = 0;

	export let nodes: NoteNode[] = [];
	let nodesContainer: HTMLFieldSetElement | undefined = undefined;
	let nodesIndex: NodesIndex = {};
	let isDragging: boolean = false;
	let draggedNodeId: string | undefined = undefined;
	let draggedNodeHeight: number = NODE_HEIGHT;
	let draggedNodePosition: number = 0;
	let lastDraggedNodeIdx: number | undefined = undefined;

	/* EVENTS */
	function handleDelete(event: CustomEvent<{ id: string }>) {
		const id: string = event.detail.id;
		const position = nodesIndex[id];
		if (position === undefined || !nodesContainer) {
			return;
		}

		nodes.splice(position, 1);

		// Get new container height
		const newHeight = getNewNodePosition(nodes, NODE_PADDING);
		nodesContainer.style.height = `${newHeight + NODE_CONTAINER_FAKE_PADDING}px`;
		nodes = nodes;

		// I need i timeout here because the textarea is been focused while the backspace is still pressed; Select previous node
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

		// Get and set new container height
		let newHeight = NODE_HEIGHT;
		if (nodesContainer.style.height) {
			newHeight = parseInt(nodesContainer.style.height, 10) + NODE_HEIGHT;
		}
		nodesContainer.style.height = `${newHeight + NODE_CONTAINER_FAKE_PADDING}px`;

		// Add new node
		const top = getNewNodePosition(nodes, NODE_PADDING);
		nodes = [createNewNode(top, NODE_HEIGHT), ...nodes];
	}

	function handleResized(event: CustomEvent<{ id: string; difference: number }>) {
		// Resize note container on node resize
		const id: string = event.detail.id;
		const difference: number = event.detail.difference;

		const position = nodesIndex[id];
		if (position === undefined || !nodesContainer) {
			return;
		}

		for (let i = position + 1; i < nodes.length; i++) {
			nodes[i].top = nodes[i].top + difference;
		}

		nodesContainer.style.height =
			parseInt(nodesContainer.style.height, 10) + difference + NODE_CONTAINER_FAKE_PADDING + 'px';
		nodes = nodes;
	}

	function handleAdd(event: CustomEvent<{ id: string }>) {
		if (!nodesContainer) {
			return;
		}

		// Add node after the current focused one
		const top = getNewNodePosition(nodes, NODE_PADDING);
		nodes.splice(nodesIndex[event.detail.id] + 1, 0, createNewNode(top, NODE_HEIGHT));

		for (let i = nodesIndex[event.detail.id] + 2; i < nodes.length; i++) {
			nodes[i].order = nodes[i].order + 1;
		}

		// Resize note container
		const newHeight = getNewNodePosition(nodes, NODE_PADDING);
		nodesContainer.style.height = `${newHeight + NODE_CONTAINER_FAKE_PADDING}px`;

		nodes = nodes;
	}

	async function handleDragStarted(
		event: CustomEvent<{ id: string; nodeHtml: HTMLDivElement; position: { x: number; y: number } }>
	) {
		isDragging = true;
		draggedNodeId = event.detail.id;

		draggedNodePosition = nodes[nodesIndex[draggedNodeId]].top;
		nodes[nodesIndex[draggedNodeId]].dragging = true;

		// Resize nodes container
		if (!nodesContainer) {
			return;
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

		/* nodes[nodesIndex[draggedNodeId]].height = draggedNodeHeight; */
		nodes[nodesIndex[draggedNodeId]].dragging = false;

		// Get sorted nodes after drop and thier new positions
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

		// Resize nodes container
		if (nodesContainer) {
			const newHeight =
				parseInt(nodesContainer.style.height, 10) + draggedNodeHeight + NODE_PADDING;
			nodesContainer.style.height = `${newHeight + NODE_CONTAINER_FAKE_PADDING}px`;

			// Update nodes container rect instance
			const rect = nodesContainer.getBoundingClientRect();
			for (const node of tmpNodes) {
				node.parentRect = rect;
			}
		}

		nodes = tmpNodes;
	}

	function handleDragged(event: CustomEvent<{ id: string; direction: Direction }>) {
		const draggedNode = nodes[nodesIndex[event.detail.id]];

		// Get hovered node
		const draggedNodePosition = draggedNode.top;
		const index = getNodeIdxByPosition(
			nodes,
			draggedNodePosition,
			draggedNode.height,
			event.detail.direction,
			[draggedNode.id]
			//event.detail.direction
		);

		if (index === undefined) {
			nodes = nodes;
			return;
		}

		if (!nodes[index] || nodes[index].id === event.detail.id) {
			return;
		}

		if (!nodes[index].transitioning && event.detail.direction !== undefined) {
			if (event.detail.direction === Direction.Up) {
				nodes[index].top += draggedNode.height + NODE_PADDING;
			} else if (event.detail.direction === Direction.Down) {
				nodes[index].top -= draggedNode.height + NODE_PADDING;
			}

			lastDraggedNodeIdx = index;
		}

		nodes = nodes;
	}

	function handleAdoptionRequest(event: CustomEvent<{ id: string }>) {
		// Idx not found or first node
		if (!nodesIndex[event.detail.id]) {
			return;
		}

		nodes[nodesIndex[event.detail.id]].beingAdopted = true;
		nodes = nodes;
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
		nodes[droppedNodePosition].depth = nodes[nodesIndex[droppedId]].depth + 1;

		nodes = updateChildren(nodes[droppedNodePosition], nodes);

		handleDragEnded(event);
	}

	afterUpdate(() => {
		nodesIndex = getNodesIndex(nodes);
	});
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
