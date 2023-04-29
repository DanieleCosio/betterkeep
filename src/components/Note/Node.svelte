<script lang="ts">
	import { getRandomString } from '../utils';
	import type NodeProps from '$types/Node';
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let htmlNode: HTMLTextAreaElement | undefined = undefined;
	let childsAreaHtmlNode: HTMLDivElement | undefined = undefined;
	const dispatch = createEventDispatcher();

	export let node: NodeProps = {
		id: getRandomString(8),
		children: [],
		isHovered: false,
		isFocused: false,
		isDragging: false,
		depth: 0
	};

	function handleFocus() {
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
		dispatch('dragstarted', {
			id: node.id
		});
	}

	function handleDragEnd(event: DragEvent) {
		node.isDragging = false;
		dispatch('dragended', {
			id: node.id
		});
	}

	function handleDragEnter(event: DragEvent) {
		node.isHovered = true;

		dispatch('dragentered', {
			id: node.id,
			htmlNode: htmlNode?.parentElement?.parentElement ?? undefined
		});
	}

	function handleDragLeave(event: DragEvent) {
		node.isHovered = false;
		dispatch('dragleft', {
			id: node.id,
			htmlNode: htmlNode?.parentElement?.parentElement ?? undefined
		});
	}

	onMount(() => {
		if (!htmlNode) {
			return;
		}

		htmlNode.focus();
	});
</script>

<div
	on:dragstart={handleDragStart}
	on:dragend={handleDragEnd}
	on:dragenter={handleDragEnter}
	on:dragleave={handleDragLeave}
	on:dragover|preventDefault
	draggable="true"
	class="flex justify-center flex-col"
>
	<div class="flex gap-2">
		<input class="w-5 h-5" type="checkbox" />
		<textarea
			bind:this={htmlNode}
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:input={handleInput}
			on:keydown={handleKeyDown}
			style="padding-left: {node.depth * 20}px;"
			class="overflow-hidden resize-none text-sm w-[100%] h-5"
			rows="1"
		/>
	</div>

	{#if node.isHovered || node.children.length > 0}
		<div bind:this={childsAreaHtmlNode} transition:fade />
	{/if}
</div>
