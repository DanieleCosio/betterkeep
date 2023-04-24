<script lang="ts">
	import { getRandomString } from '../utils';
	import type NodeProps from '$types/Node';
	import { createEventDispatcher, onMount } from 'svelte';

	let htmlNode: HTMLTextAreaElement | undefined = undefined;
	const dispatch = createEventDispatcher();

	export let node: NodeProps = {
		id: getRandomString(8),
		children: [],
		isHovered: false,
		isFocused: false,
		isDragging: false,
		isOvered: false,
		depth: 0
	};

	function handleFocus() {
		if (htmlNode?.matches(':focus')) {
			node.isHovered = true;
		}

		node.isFocused = true;
	}

	function handleBlur() {
		node.isHovered = false;
		if (htmlNode?.value === '') {
			dispatch('delete', {
				id: node.id
			});
		}
	}

	function handleInput() {
		if (!htmlNode) {
			return;
		}

		htmlNode.style.height = 'auto';
		htmlNode.style.height = htmlNode.scrollHeight + 'px';
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			dispatch('add', {
				id: node.id
			});
			return;
		}
	}

	function handleDragStart(event: DragEvent) {
		node.isDragging = true;
	}

	function handleDragEnd(event: DragEvent) {
		node.isDragging = false;
	}

	function handleDragEnter(event: DragEvent) {
		node.isOvered = true;
	}

	function handleDragLeave(event: DragEvent) {
		node.isOvered = false;
	}

	onMount(() => {
		if (!htmlNode) {
			return;
		}

		htmlNode.focus();
	});
</script>

<div draggable="true">
	<div class="flex gap-2">
		<input class="w-5 h-5" type="checkbox" />
		<textarea
			bind:this={htmlNode}
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:input={handleInput}
			on:keydown={handleKeyDown}
			on:dragstart={handleDragStart}
			on:dragend={handleDragEnd}
			on:dragenter={handleDragEnter}
			on:dragleave={handleDragLeave}
			style="padding-left: {node.depth * 20}px;"
			class="overflow-hidden resize-none text-sm w-[100%] h-5"
			rows="1"
		/>
	</div>

	<div
		class="border-2 transition-all duration-1000 ease-in opacity-0"
		class:opacity-100={node.children.length > 0}
	/>
</div>
