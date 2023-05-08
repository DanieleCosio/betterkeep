<script lang="ts">
	import type NoteNode from '$types/NoteNode';
	import type Rect from '$types/Rect';
	import { debug } from 'svelte/internal';
	import { getRandomString } from '../utils';
	import Node from './Node.svelte';
	import { compareNoteNodes, getChildrenNodes, getNodesIndex, isDraggableInBounding } from './note';

	export let nodes: NoteNode[] = [];
	let nodesIndex: { [key: string]: number } = {};
	let isDragging: boolean = false;
	let draggedNodeId: string | undefined = undefined;
	let noteHtml: HTMLDivElement | undefined = undefined;
	let draggedNodeHtml: HTMLDivElement | undefined = undefined;
	let draggedPosition: { x: number; y: number } | undefined = undefined;
	let dragZoneHtml: HTMLFieldSetElement | undefined = undefined;

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

	function handleDragStarted(
		event: CustomEvent<{ id: string; nodeHtml: HTMLDivElement; position: { x: number; y: number } }>
	) {
		isDragging = true;
		draggedNodeId = event.detail.id;
		draggedNodeHtml = event.detail.nodeHtml;
		draggedPosition = event.detail.position;
	}

	function handleDragEnded(event: CustomEvent<{ id: string }>) {
		isDragging = false;
		draggedNodeId = undefined;
		draggedPosition = undefined;
		draggedNodeHtml = undefined;
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

	function handleInChildrenArea(event: CustomEvent<{ id: string }>) {
		if (draggedNodeId === undefined) {
			return;
		}

		const id: string = event.detail.id;
		const children = getChildrenNodes(nodes, id);
		children.sort(compareNoteNodes.bind(children));

		let newNodePosition = nodesIndex[id];
		let order = 0;
		if (children.length > 0) {
			newNodePosition = nodesIndex[children[0]['id']] - 1;
			order = children[0]['order'] - 1;
		}

		const draggedNode: NoteNode = nodes[nodesIndex[draggedNodeId]];
		draggedNode.parent_id = id;
		draggedNode.depth = nodes[nodesIndex[id]].depth + 1;
		draggedNode.order = order;

		// TODO Deve aggiustare l'order degli altri elementi
		// TODO Aggiustare depth dei figli

		nodes.splice(nodesIndex[draggedNodeId], 1);
		nodes.splice(newNodePosition, 0, draggedNode);

		nodes = nodes;
		nodesIndex = getNodesIndex(nodes);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!draggedNodeHtml || !isDragging || !draggedPosition || !noteHtml || !dragZoneHtml) {
			return;
		}

		const x = draggedPosition.x - event.clientX;
		const y = draggedPosition.y - event.clientY;
		draggedPosition = { x: event.clientX, y: event.clientY };

		const draggable = draggedNodeHtml.parentElement;
		if (!draggable) {
			return;
		}

		const dragZoneBounds = dragZoneHtml.getBoundingClientRect();
		const draggableBounds = draggable.getBoundingClientRect();

		const isInBoundingBox = isDraggableInBounding(
			{
				x: dragZoneBounds.x,
				y: dragZoneBounds.y,
				width: dragZoneBounds.width,
				height: dragZoneBounds.height
			},
			{
				x: draggableBounds.x + event.movementX,
				y: draggableBounds.y + event.movementY,
				width: draggableBounds.width,
				height: draggableBounds.height
			}
		);
		if (!isInBoundingBox) {
			return;
		}
		draggable.style.top = `${draggable.offsetTop - y}px`;
		draggable.style.left = `${draggable.offsetLeft - x}px`;
	}

	function handleMouseUp() {
		if (!isDragging) {
			return;
		}

		isDragging = false;
		draggedNodeId = undefined;
		draggedPosition = undefined;
		draggedNodeHtml = undefined;
	}
</script>

<svelte:window on:mousemove|preventDefault={handleMouseMove} on:mouseup={handleMouseUp} />

<div bind:this={noteHtml} class="flex flex-col p-5 bg-lime-700 rounded max-w-xs gap-2">
	<input
		type="text"
		placeholder="Titolo"
		class="bg-lime-700 text-white border-none"
		on:keyup={handleTitleKeyUp}
	/>
	<fieldset
		style="height: {8 * nodes.length + nodes.length * 20}px"
		class=" gap-2 relative {isDragging ? '[&>div]:brightness-75' : ''}"
		bind:this={dragZoneHtml}
	>
		{#each nodes as node, idx (node.id)}
			<div style="top: {8 * idx + idx * 20}px" class="absolute w-[90%]">
				<Node
					{node}
					on:add={handleAdd}
					on:delete={handleDelete}
					on:dragstarted={handleDragStarted}
					on:dragended={handleDragEnded}
					on:dragentered={handleDragEntered}
					on:dragleft={handleDragLeft}
					on:dropped={handleDropped}
					on:inchildrenarea={handleInChildrenArea}
				/>
			</div>
		{/each}
	</fieldset>
</div>

<style></style>
