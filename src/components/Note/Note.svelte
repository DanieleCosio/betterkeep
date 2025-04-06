<script lang="ts">
	/*
		TODO Fix focus and blur logic 
		TODO Updated_at 
	 */
	import type { Index } from '$types/Index';
	import type {NoteNode} from '$types/NoteNode';
	import { onMount } from 'svelte';
	import NodeComponet from './Node.svelte';

	import {
		computeNodesPositions,
		createNewNode,
		createNote,
		getChildrenNodesRecursive,
		getNewNodeDepth,
		getNewNodePosition,
		getNodesIndex,
		sortNodesByPosition,
		updateChildren
	} from './ts/note.svelte';
	import type { NoteProps } from '$types/Note';

	const NODE_HEIGHT = 20;
	const NODE_PADDING = 10;
	const NODE_CONTAINER_FAKE_PADDING = 0;

	interface Props {
		note?: NoteProps;
		blurred: (note: NoteProps) => void;
		deleted: (id: string) => void;
	}

	let { note = $bindable(createNote([])), blurred, deleted }: Props = $props();

	let noteHtml: HTMLDivElement | undefined = $state();
	let title: string = $state(note.title);
	let nodes: NoteNode[] = $state(note.nodes);
	let nodesCointainer: HTMLElement | undefined = $state();
	// svelte-ignore state_referenced_locally
	let nodesContainerHeight: number = $state(getNewNodePosition(nodes, NODE_PADDING + 2));
	let nodesIndex: Index = {};
	let isDragging: boolean = $state(false);
	let draggedNodeId: string | undefined = undefined;
	let draggingNodeStartigState: NoteNode | undefined;

	const blurNote = (event: Event) => {
		if (noteHtml && noteHtml.contains(event.target as Node)) {
			return;
		}

		// Wait for node generation
		setTimeout(() => {
			if (!noteHtml) {
				return;
			}

			for (const child of noteHtml.getElementsByTagName('*')) {
				if (child === document.activeElement) {
					return;
				}
			}

			document.removeEventListener('click', blurNote);

			note.isFocused = false;
			blurred(note);
		}, 50);
	};

	$effect.pre(() => {
		//updateNodes(note.id, nodes);
		note.nodes = nodes;
		note.title = title;
	});

	/* EVENTS */
	function handleDelete(id: string) {
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

	async function handleTitleKeyUp(event: KeyboardEvent) {
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
	}

	function handleResized(id: string, difference: number) {
		// Resize note container on node resize
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

	function handleAdd(id: string) {
		// Add node after the current focused one
		const focusedNode = nodes[nodesIndex[id]];
		const top = focusedNode.top + 1;

		const tmpNodes = nodes;
		tmpNodes.push(createNewNode(top, NODE_HEIGHT, focusedNode.depth));
		tmpNodes.sort(sortNodesByPosition);

		nodesContainerHeight = getNewNodePosition(nodes, NODE_PADDING) + 15;
		nodes = computeNodesPositions(tmpNodes, NODE_PADDING);
	}

	function handleDragStarted(id: string, nodeHtml: HTMLDivElement) {
		if (!nodesCointainer) {
			return;
		}

		isDragging = true;
		draggedNodeId = id;
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
		nodes[nodesIndex[draggedNodeId]].parentRect = nodesCointainer.getBoundingClientRect();
	}

	function handleDragEnded(id: string) {
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

	function handleDragged(id: string, deltaX: number) {
		const draggedNode = nodes[nodesIndex[id]];
		nodes[nodesIndex[draggedNode.id]].depth = getNewNodeDepth(draggedNode, nodes, deltaX);

		nodes = computeNodesPositions(nodes, NODE_PADDING, [draggedNode.id]);
	}

	function handleNoteFocus(event: Event | MouseEvent) {
		if (note.isFocused) {
			return;
		}

		note.isFocused = true;
		document.addEventListener('click', blurNote);
	}

	function handleFocus(id: string) {
		note.isFocused = true;
	}

	function handleBlur() {
		setTimeout(() => {
			if (!noteHtml) {
				return;
			}

			for (const child of noteHtml.getElementsByTagName('*')) {
				if (child === document.activeElement) {
					return;
				}
			}

			document.removeEventListener('click', blurNote);

			note.isFocused = false;
			blurred(note);
		}, 50);
	}

	function handleDeleteClick() {
		deleted(note.id);
	}

	onMount(() => {
		note.isFocused = true;
		document.addEventListener('click', blurNote);
	});

	$effect(() => {
		nodesIndex = getNodesIndex(nodes);
	});
</script>

<div
	bind:this={noteHtml}
	onclick={handleNoteFocus}
	onfocus={handleNoteFocus}
	onblur={handleBlur}
	onkeydown={() => {}}
	role="textbox"
	tabindex="0"
	class="flex flex-col p-5 bg-lime-700 rounded max-w-xs gap-2"
>
	<input
		type="text"
		placeholder="Titolo"
		class="bg-lime-700 text-white border-none"
		onkeyup={handleTitleKeyUp}
		onblur={handleBlur}
		bind:value={title}
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
			<NodeComponet
				{node}
				add={handleAdd}
				deleted={handleDelete}
				dragstarted={handleDragStarted}
				dragended={handleDragEnded}
				dragged={handleDragged}
				resized={handleResized}
				blured={handleBlur}
				focused={handleFocus}
			/>
		{/each}
	</fieldset>

	<div class="flex">
		<button onclick={handleDeleteClick}>🔴</button>
	</div>
</div>
