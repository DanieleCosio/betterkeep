<script lang="ts">
	// TODO: Fix bugs
	// TODO Il child dropped on parent?
	import type NoteNode from '$types/NoteNode';
	import { getRandomString } from '../utils';
	import Node from './Node.svelte';
	import { getChildrenNodesRecursive, getNodesIndex, removeNode, updateChildren } from './note';

	export let nodes: NoteNode[] = [];
	let nodesIndex: { [key: string]: number } = {};
	let isDragging: boolean = false;
	let draggedNodeId: string | undefined = undefined;
	let noteHtml: HTMLDivElement | undefined = undefined;
	let draggedNodeHtml: HTMLDivElement | undefined = undefined;
	let draggedPosition: { x: number; y: number } | undefined = undefined;

	function handleDelete(event: CustomEvent<{ id: string }>) {
		const id: string = event.detail.id;
		const position = nodesIndex[id];
		if (position === undefined) {
			return;
		}

		nodes.splice(position, 1);
		nodes = nodes;

		nodesIndex = getNodesIndex(nodes);
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

		nodes = [
			{
				id: getRandomString(8),
				isHovered: false,
				isFocused: false,
				isDragging: false,
				isVisible: true,
				depth: 0,
				parent_id: null,
				order: 0
			},
			...nodes
		];

		nodesIndex = getNodesIndex(nodes);
	}

	function handleAdd(event: CustomEvent<{ id: string }>) {
		nodes.splice(nodesIndex[event.detail.id] + 1, 0, {
			id: getRandomString(8),
			isHovered: false,
			isFocused: false,
			isDragging: false,
			isVisible: true,
			depth: 0,
			parent_id: null,
			order: nodes[nodesIndex[event.detail.id]].order + 1
		});

		for (let i = nodesIndex[event.detail.id] + 2; i < nodes.length; i++) {
			nodes[i].order = nodes[i].order + 1;
		}

		nodes = nodes;
		nodesIndex = getNodesIndex(nodes);
	}

	function handleDragStarted(
		event: CustomEvent<{ id: string; nodeHtml: HTMLDivElement; position: { x: number; y: number } }>
	) {
		isDragging = true;
		draggedNodeId = event.detail.id;
		draggedNodeHtml = event.detail.nodeHtml;
		draggedPosition = event.detail.position;

		// Hide all children
		const children = getChildrenNodesRecursive(nodes, draggedNodeId);
		for (const child of children) {
			nodes[nodesIndex[child.id]].isVisible = false;
		}

		nodes = nodes;
	}

	function handleDragEnded(event: CustomEvent<{ id: string }>) {
		isDragging = false;
		draggedNodeId = undefined;
		draggedPosition = undefined;
		draggedNodeHtml = undefined;

		for (const node of nodes) {
			node.isVisible = true;
		}

		nodes = nodes;
	}

	function handleDragEntered(event: CustomEvent<{ id: string; htmlNode: HTMLTextAreaElement }>) {
		if (!event.detail.htmlNode || !event.detail.htmlNode.parentElement) {
			return;
		}

		event.detail.htmlNode.classList.add('!brightness-100');
	}

	function handleDragLeft(event: CustomEvent<{ id: string; htmlNode: HTMLTextAreaElement }>) {
		if (!event.detail.htmlNode || !event.detail.htmlNode.parentElement) {
			return;
		}

		event.detail.htmlNode.classList.remove('!brightness-100');
	}

	function handleDropped(event: CustomEvent<{ id: string }>) {
		let droppedId: string = event.detail.id;

		if (droppedId === draggedNodeId || draggedNodeId === undefined) {
			return;
		}

		const draggedNodePosition = nodesIndex[draggedNodeId];
		let droppedNodePosition = nodesIndex[droppedId];
		const droppedNode = nodes[droppedNodePosition];
		const draggedNode = nodes[draggedNodePosition];
		let tmpNodes = nodes;

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
		}

		nodesIndex = getNodesIndex(tmpNodes);
		nodes = tmpNodes;

		handleDragEnded(event);
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

<div bind:this={noteHtml} class="flex flex-col p-5 bg-lime-700 rounded max-w-xs gap-2">
	<input
		type="text"
		placeholder="Titolo"
		class="bg-lime-700 text-white border-none"
		on:keyup={handleTitleKeyUp}
	/>
	<fieldset
		class="flex flex-col gap-2 relative h-[500px] {isDragging ? '[&>div]:brightness-75' : ''}"
	>
		{#each nodes as node (node.id)}
			<Node
				{node}
				on:add={handleAdd}
				on:delete={handleDelete}
				on:dragstarted={handleDragStarted}
				on:dragended={handleDragEnded}
				on:dragentered={handleDragEntered}
				on:dragleft={handleDragLeft}
				on:dropped={handleDropped}
				on:addchild={handleAddChild}
			/>
		{/each}
	</fieldset>
</div>

<style></style>
