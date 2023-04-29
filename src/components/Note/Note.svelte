<script lang="ts">
	import type NoteNode from '$types/NoteNode';
	import { element } from 'svelte/internal';
	import { getRandomString } from '../utils';
	import Node from './Node.svelte';
	import { compareNoteNodes, getNodesIndex } from './note';

	export let nodes: NoteNode[] = [];
	let nodesIndex: { [key: string]: number } = {};
	let dragging: boolean = false;

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
		dragging = true;
	}

	function handleDragEnded(event: CustomEvent<{ id: string }>) {
		dragging = false;
	}

	function handleDragEntered(event: CustomEvent<{ id: string; htmlNode: HTMLTextAreaElement }>) {
		if (!event.detail.htmlNode || !event.detail.htmlNode.parentElement) {
			return;
		}

		event.detail.htmlNode.parentElement.classList.remove('brightness-75');
	}

	function handleDragLeft(event: CustomEvent<{ id: string; htmlNode: HTMLTextAreaElement }>) {
		if (!event.detail.htmlNode || !event.detail.htmlNode.parentElement) {
			return;
		}

		event.detail.htmlNode.parentElement.classList.add('brightness-75');
	}
</script>

<!-- Sto cazzo di hover non worka -->
<div class="flex flex-col p-5 bg-lime-700 rounded max-w-xs gap-2">
	<input
		type="text"
		placeholder="Titolo"
		class="bg-lime-700 text-white border-none"
		on:keyup={handleTitleKeyUp}
	/>
	<fieldset class="flex flex-col gap-2">
		{#each nodes as node (node.id)}
			<div class:brightness-75={dragging}>
				<Node
					{node}
					on:add={handleAdd}
					on:delete={handleDelete}
					on:dragstarted={handleDragStarted}
					on:dragended={handleDragEnded}
					on:dragentered={handleDragEntered}
					on:dragleft={handleDragLeft}
				/>
			</div>
		{/each}
	</fieldset>
</div>
