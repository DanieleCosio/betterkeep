<script lang="ts">
	import type { NodesIndex } from '$types/NodesIndex';
	import type NoteNode from '$types/NoteNode';
	import { afterUpdate, tick } from 'svelte';
	import Node from './Node.svelte';
	import {
		computeNodesPositions,
		createNewNode,
		getChildrenNodesRecursive,
		getNewNodeDepth,
		getNewNodePosition,
		getNodesIndex,
		isFocused,
		sortNodesByPosition,
		updateChildren
	} from './note';
	import type { NoteProps } from '$types/Note';
	import { getRandomString } from '../utils';

	const NODE_HEIGHT = 20;
	const NODE_PADDING = 10;
	const NODE_CONTAINER_FAKE_PADDING = 0;

	export let nodes: NoteNode[] = [];
	export let note: NoteProps = {
		id: getRandomString(),
		nodes: nodes,
		isFocused: true,
		created_at: -1,
		updated_at: -1
	};

	$: note.nodes = nodes;

	let isTitleFocused: boolean = false;
	let nodesCointainer: HTMLElement;
	let nodesContainerHeight: number = 0;
	let nodesIndex: NodesIndex = {};
	let isDragging: boolean = false;
	let draggedNodeId: string | undefined = undefined;
	let draggingNodeStartigState: NoteNode | undefined;

	/* EVENTS */
	function handleDelete(event: CustomEvent<{ id: string }>) {
		const id: string = event.detail.id;
		const position = nodesIndex[id];
		if (position === undefined) {
			return;
		}

		nodes.splice(position, 1);

		// Get new container height
		const newHeight = getNewNodePosition(nodes, NODE_PADDING) + 15;
		nodesContainerHeight = newHeight + NODE_CONTAINER_FAKE_PADDING;
		nodes = nodes;

		// I need a timeout here because the textarea is been focused while the backspace is still pressed; Select previous node
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

		// Get and set new container height
		let newHeight = NODE_HEIGHT;
		if (nodesContainerHeight) {
			newHeight = nodesContainerHeight + NODE_HEIGHT;
		}
		nodesContainerHeight = newHeight + 30;

		// Add new node
		const top = getNewNodePosition(nodes, NODE_PADDING);
		nodes = [createNewNode(top, NODE_HEIGHT), ...nodes];
	function handleTitleFocus() {
		note.isFocused = isTitleFocused = true;
	}

	function handleTitleBlur() {
		isTitleFocused = false;
		note.isFocused = isFocused(isTitleFocused, nodes);
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
		const focusedNode = nodes[nodesIndex[event.detail.id]];
		const top = focusedNode.top + 1;

		const tmpNodes = nodes;
		tmpNodes.push(createNewNode(top, NODE_HEIGHT, focusedNode.depth));
		tmpNodes.sort(sortNodesByPosition);

		nodesContainerHeight = getNewNodePosition(nodes, NODE_PADDING) + 15;
		nodes = computeNodesPositions(tmpNodes, NODE_PADDING);
	}

	async function handleDragStarted(
		event: CustomEvent<{ id: string; nodeHtml: HTMLDivElement; position: { x: number; y: number } }>
	) {
		isDragging = true;
		draggedNodeId = event.detail.id;
		draggingNodeStartigState = { ...nodes[nodesIndex[draggedNodeId]] };

		nodes[nodesIndex[draggedNodeId]].dragging = true;

		// Resize nodes container
		nodes[nodesIndex[draggedNodeId]].height = NODE_HEIGHT;
		nodesContainerHeight -= draggingNodeStartigState.height - NODE_HEIGHT;

		// Hide all children
		const children = getChildrenNodesRecursive(nodes, draggedNodeId);
		for (const child of children) {
			nodes[nodesIndex[child.id]].isVisible = false;
			nodesContainerHeight -= child.height + NODE_PADDING;
		}

		nodes = nodes;

		//await tick();
		nodes[nodesIndex[draggedNodeId]].parentRect = nodesCointainer.getBoundingClientRect();
	}

	function handleDragEnded(event: CustomEvent<{ id: string }>) {
		isDragging = false;

		if (!draggedNodeId || !draggingNodeStartigState) {
			return;
		}

		nodes[nodesIndex[draggedNodeId]].dragging = false;

		nodesContainerHeight += draggingNodeStartigState.height - NODE_HEIGHT;
		nodes[nodesIndex[draggedNodeId]].height = draggingNodeStartigState.height;

		const children = getChildrenNodesRecursive(nodes, draggedNodeId);
		children.sort(sortNodesByPosition);

		let childrenCounter = 1;
		const depthDifference = draggingNodeStartigState.depth - nodes[nodesIndex[draggedNodeId]].depth;

		for (const child of children) {
			nodes[nodesIndex[child.id]].isVisible = true;
			nodes[nodesIndex[child.id]].top = nodes[nodesIndex[draggedNodeId]].top + childrenCounter;
			nodes[nodesIndex[child.id]].depth -= depthDifference;
			nodesContainerHeight += child.height + NODE_PADDING;
			childrenCounter++;
		}

		const draggedNodeIdx = nodesIndex[draggedNodeId];
		nodesIndex = getNodesIndex(nodes);
		for (let idx = nodesIndex[draggedNodeId] + children.length; idx < nodes.length; idx++) {
			if (nodesIndex[draggedNodeId] < draggedNodeIdx) {
				nodes[idx].top = (NODE_HEIGHT + NODE_PADDING) * children.length;
			} else if (nodesIndex[draggedNodeId] > draggedNodeIdx) {
				nodes[idx].top = (NODE_HEIGHT - NODE_PADDING) * children.length;
			}
		}

		let tmpNodes = nodes.sort(sortNodesByPosition);
		nodesIndex = getNodesIndex(tmpNodes);
		tmpNodes = computeNodesPositions(tmpNodes, NODE_PADDING, []);
		tmpNodes = updateChildren(tmpNodes, nodesIndex);
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
			nodes,
			event.detail.deltaX
		);

		nodes = computeNodesPositions(nodes, NODE_PADDING, [draggedNode.id]);
	}

	function handleFocused() {
		note.isFocused = true;
	}

	function handleBlured() {
		note.isFocused = isFocused(isTitleFocused, nodes);
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
		on:focus={handleTitleFocus}
		on:blur={handleTitleBlur}
	/>
	<fieldset
		bind:this={nodesCointainer}
		style="height: {nodesContainerHeight}px;"
		class="
			bg-red-700
			relative
			{`gap-[${NODE_PADDING}px]`} 
			{isDragging ? '[&>div]:brightness-75' : ''}
		"
	>
		{#each nodes as node (node.id)}
			<Node
				{node}
				on:focused={handleFocused}
				on:blured={handleBlured}
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
