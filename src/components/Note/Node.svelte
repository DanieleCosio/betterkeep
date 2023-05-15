<script lang="ts">
	import { getRandomString } from '../utils';
	import type NodeProps from '$types/Node';
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let textAreaHtml: HTMLTextAreaElement | undefined = undefined;
	let nodeHtml: HTMLDivElement | undefined = undefined;
	const dispatch = createEventDispatcher();

	export let node: NodeProps = {
		id: getRandomString(8),
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
		if (textAreaHtml?.value === '') {
			dispatch('delete', {
				id: node.id
			});
		}
	}

	function handleInput() {
		if (!textAreaHtml) {
			return;
		}

		textAreaHtml.style.height = 'auto';
		textAreaHtml.style.height = textAreaHtml.scrollHeight + 'px';
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
			id: node.id,
			nodeHtml: nodeHtml
		});
	}

	function handleDragEnd(event: DragEvent) {
		node.isDragging = false;
		dispatch('dragended', {
			id: node.id
		});
	}

	let dragCounter = 0;
	function handleDragEnter(event: DragEvent) {
		dragCounter++;
		node.isHovered = true;

		dispatch('dragentered', {
			id: node.id,
			htmlNode: textAreaHtml?.parentElement?.parentElement ?? undefined
		});
	}

	function handleDragLeave(event: DragEvent) {
		dragCounter--;
		if (dragCounter > 0) {
			return;
		}

		node.isHovered = false;
		dispatch('dragleft', {
			id: node.id,
			htmlNode: textAreaHtml?.parentElement?.parentElement ?? undefined
		});
	}

	function handleDrop(event: DragEvent) {
		node.isHovered = false;
		dispatch('dropped', {
			id: node.id
		});
	}

	function handleDropChild(event: DragEvent) {
		dispatch('addchild', {
			id: node.id
		});
	}

	onMount(() => {
		if (!textAreaHtml) {
			return;
		}

		textAreaHtml.focus();
	});
</script>

<div
	on:dragstart={handleDragStart}
	on:dragend={handleDragEnd}
	on:dragenter={handleDragEnter}
	on:dragleave={handleDragLeave}
	on:dragover|preventDefault
	on:drop|preventDefault={handleDrop}
	draggable="true"
	class="flex justify-center flex-col"
	style="padding-left: {node.depth * 20}px;"
>
	<div class="flex gap-2">
		<input class="w-5 h-5" type="checkbox" />
		<textarea
			bind:this={textAreaHtml}
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:input={handleInput}
			on:keydown={handleKeyDown}
			class="overflow-hidden resize-none text-sm w-[100%] h-5"
			rows="1"
		/>
	</div>

	{#if node.isHovered}
		<div transition:fade class="h-8 bg-lime-600" on:drop|stopPropagation={handleDropChild} />
	{/if}
</div>
