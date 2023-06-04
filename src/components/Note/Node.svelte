<script lang="ts">
	import { getRandomString } from '../utils';
	import type NodeProps from '$types/Node';
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { moveAt } from './node';
	import type Point from '$types/Point';

	let textAreaHtml: HTMLTextAreaElement | undefined = undefined;
	const previousPosition: Point = { x: 0, y: 0 };
	let parentRect: DOMRect;
	let nodeRect: DOMRect;
	export let node: NodeProps = {
		id: getRandomString(8),
		isHovered: false,
		isFocused: false,
		isDragging: false,
		isVisible: true,
		depth: 0,
		html: undefined
	};

	const dispatch = createEventDispatcher();
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

	function handleMouseDown(event: MouseEvent) {
		if (!node.html) {
			return;
		}

		const parent = node.html.parentElement;
		if (!parent) {
			return;
		}

		nodeRect = node.html.getBoundingClientRect();
		parentRect = parent.getBoundingClientRect();

		dispatch('dragstarted', {
			id: node.id,
			nodeHtml: node.html
		});

		node.isDragging = true;
		node.html.style.position = 'absolute';
		node.html.style.zIndex = '1000';
		previousPosition.x = event.clientX;
		previousPosition.y = event.clientY;

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!node.html || !node.isDragging) {
			return;
		}

		const delta: Point = {
			x: previousPosition.x - event.clientX,
			y: previousPosition.y - event.clientY
		};
		let y = node.html.offsetTop - delta.y;

		if (event.clientY + nodeRect.height >= parentRect.bottom) {
			y = parentRect.height - nodeRect.height;
		}

		if (event.clientY <= parentRect.top) {
			y = 0;
		}

		node.html.style.top = `${y}px`;
		previousPosition.x = event.clientX;
		previousPosition.y = event.clientY;
	}

	function handleMouseUp(event: MouseEvent) {
		if (!node.html || !node.isDragging) {
			return;
		}
		const parent = node.html.parentElement;
		if (!parent) {
			return;
		}

		node.isDragging = false;
		node.html.style.position = 'static';
		node.html.style.zIndex = '0';
		node.html.style.top = '0';
		node.html.style.left = '0';

		dispatch('dragended', {
			id: node.id
		});

		parent.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}

	/* 
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

		dragCounter = 0;

		console.log('dragleave');

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
*/

	onMount(() => {
		if (!textAreaHtml) {
			return;
		}

		textAreaHtml.focus();
	});
</script>

<div
	on:dragstart|preventDefault
	bind:this={node.html}
	class="flex justify-center flex-col w-[280px] {!node.isVisible ? 'hidden' : ''}"
>
	<div class="flex gap-2">
		<span on:mousedown={handleMouseDown}>⋮</span>
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
		<div transition:fade class="h-8 bg-lime-600" />
	{/if}
</div>
