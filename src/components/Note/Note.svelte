<script lang="ts">
	import type NoteNode from '$types/NoteNode';
	import { getRandomString } from '../utils';
	import Node from './Node.svelte';
	import { compareNoteNodes, getNodesIndex } from './note';

	export let nodes: NoteNode[] = [];
	let nodesIndex: { [key: string]: number } = {};
	let isDragging: boolean = false;
	let draggedNodeId: string | undefined = undefined;

	function handleDelete(event: CustomEvent<{ id: string }>) {
		const id: string = event.detail.id;
		const position = nodesIndex[id];
		if (position === undefined) {
			return;
		}

		nodes.splice(position, 1);
		nodes.sort(compareNoteNodes.bind(nodes));
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
				children: [],
				isHovered: false,
				isFocused: false,
				isDragging: false,

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
			children: [],
			isHovered: false,
			isFocused: false,
			isDragging: false,
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

	function handleDragStarted(event: CustomEvent<{ id: string }>) {
		isDragging = true;
		draggedNodeId = event.detail.id;
	}

	function handleDragEnded(event: CustomEvent<{ id: string }>) {
		isDragging = false;
		draggedNodeId = undefined;
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
		const droppedNodePosition = nodesIndex[droppedId];

		const droppedNode = nodes[droppedNodePosition];
		nodes.splice(droppedNodePosition, 1, nodes[draggedNodePosition]);
		nodes.splice(draggedNodePosition, 1, droppedNode);

		nodesIndex = getNodesIndex(nodes);
		nodes = nodes;
	}
</script>

<div class="flex flex-col p-5 bg-lime-700 rounded max-w-xs gap-2">
	<input
		type="text"
		placeholder="Titolo"
		class="bg-lime-700 text-white border-none"
		on:keyup={handleTitleKeyUp}
	/>
	<fieldset class="flex flex-col gap-2 {isDragging ? '[&>div]:brightness-75' : ''}">
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
			/>
		{/each}
	</fieldset>
</div>

<style></style>
