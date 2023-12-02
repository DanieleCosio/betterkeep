<script lang="ts">
	import type { NodesIndex } from '$types/NodesIndex';
	import type NoteNode from '$types/NoteNode';
	import { afterUpdate, tick } from 'svelte';
	import Node from './Node.svelte';
	import {
		computeDrop,
		computeNodesPositions,
		createNewNode,
		getChildrenNodesRecursive,
		getNewNodeDepth,
		getNewNodePosition,
		getNodesIndex,
		sortNodesByPosition,
		updateChildren,
		updateChildrenDepth
	} from './note';

	const NODE_HEIGHT = 20;
	const NODE_PADDING = 10;
	const NODE_CONTAINER_FAKE_PADDING = 0;

	export let nodes: NoteNode[] = [];
	let nodesContainerHeight: number = 0;
	let nodesIndex: NodesIndex = {};
	let isDragging: boolean = false;
	let draggedNodeId: string | undefined = undefined;
	let draggedNodePosition: number = 0;
	let draggedNodeHeight: number = 0;

	/* EVENTS */
	function handleDelete(event: CustomEvent<{ id: string }>) {
		const id: string = event.detail.id;
		const position = nodesIndex[id];
		if (position === undefined) {
			return;
		}

		nodes.splice(position, 1);

		// Get new container height
		const newHeight = getNewNodePosition(nodes, NODE_PADDING);
		nodesContainerHeight = newHeight + NODE_CONTAINER_FAKE_PADDING;
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
		if (event.key !== 'Enter') {
			return;
		}

		for (const node of nodes) {
			if (!node.parent_id) {
				node.order = node.order + 1;
			}
		}

		// Get and set new container height
		let newHeight = NODE_HEIGHT;
		if (nodesContainerHeight) {
			newHeight = nodesContainerHeight + NODE_HEIGHT;
		}
		nodesContainerHeight = newHeight + 30;

		// Add new node
		const top = getNewNodePosition(nodes, NODE_PADDING);
		nodes = [createNewNode(top, NODE_HEIGHT), ...nodes];
	}

	function handleResized(event: CustomEvent<{ id: string; difference: number }>) {
		// Resize note container on node resize
		const id: string = event.detail.id;
		const difference: number = event.detail.difference;

		const position = nodesIndex[id];
		if (position === undefined) {
			return;
		}

		for (let i = position + 1; i < nodes.length; i++) {
			nodes[i].top = nodes[i].top + difference;
		}

		nodesContainerHeight = nodesContainerHeight + difference + NODE_CONTAINER_FAKE_PADDING;
		nodes = nodes;
	}

	function handleAdd(event: CustomEvent<{ id: string }>) {
		// Add node after the current focused one
		const top = getNewNodePosition(nodes, NODE_PADDING);
		nodes.splice(nodesIndex[event.detail.id] + 1, 0, createNewNode(top, NODE_HEIGHT));

		for (let i = nodesIndex[event.detail.id] + 2; i < nodes.length; i++) {
			nodes[i].order = nodes[i].order + 1;
		}

		// Resize note container
		nodesContainerHeight = getNewNodePosition(nodes, NODE_PADDING) + 15;
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
		draggedNodeHeight = nodes[nodesIndex[draggedNodeId]].height;
		nodes[nodesIndex[draggedNodeId]].height = NODE_HEIGHT;
		nodesContainerHeight -= draggedNodeHeight - NODE_HEIGHT;

		// Hide all children
		/* const children = getChildrenNodesRecursive(nodes, draggedNodeId);
		for (const child of children) {
			nodes[nodesIndex[child.id]].isVisible = false;
		} */

		nodes = nodes;
	}

	function handleDragEnded(event: CustomEvent<{ id: string }>) {
		isDragging = false;

		if (!draggedNodeId) {
			return;
		}

		nodes[nodesIndex[draggedNodeId]].dragging = false;

		nodesContainerHeight += draggedNodeHeight - NODE_HEIGHT;
		nodes[nodesIndex[draggedNodeId]].height = draggedNodeHeight;

		// Get sorted nodes after drop and thier new positions
		let tmpNodes = computeDrop(nodes);
		tmpNodes = computeNodesPositions(tmpNodes, NODE_PADDING, []);
		tmpNodes = updateChildren(nodes);
		nodes = tmpNodes;
	}

	function handleDragged(
		event: CustomEvent<{
			id: string;
			deltaX: number;
		}>
	) {
		const draggedNode = nodes[nodesIndex[event.detail.id]];

		nodes[nodesIndex[draggedNode.id]].depth = getNewNodeDepth(
			draggedNode,
			[...nodes],
			event.detail.deltaX
		);

		let tmpNodes = updateChildrenDepth(draggedNode, nodes, nodesIndex);
		tmpNodes = nodes.sort(sortNodesByPosition);
		nodes = computeNodesPositions(tmpNodes, NODE_PADDING, [draggedNode.id]);
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
		style="height: {nodesContainerHeight}px;"
		class="
			relative
			{`gap-[${NODE_PADDING}px]`} 
			{isDragging ? '[&>div]:brightness-75' : ''}
		"
	>
		{#each nodes as node (node.id)}
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
