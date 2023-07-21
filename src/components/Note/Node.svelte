<script lang="ts">
	import { getRandomString } from '../utils';
	import type NodeProps from '$types/Node';
	import { createEventDispatcher, onMount } from 'svelte';
	import type Point from '$types/Point';

	let textAreaHtml: HTMLTextAreaElement | undefined = undefined;
	const previousPosition: Point = { x: 0, y: 0 };
	//let parentRect: DOMRect;
	//let nodeRect: DOMRect;
	let isDragging: boolean = false;
	export let node: NodeProps = {
		id: getRandomString(8),
		isHovered: false,
		isVisible: true,
		depth: 0,
		html: undefined,
		height: 24,
		top: 0
	};

	const dispatch = createEventDispatcher();
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

		const currentHeight = node.height;
		textAreaHtml.style.height = 'auto';
		node.height = textAreaHtml.scrollHeight;

		if (currentHeight === node.height) {
			return;
		}

		const difference = node.height - currentHeight;
		dispatch('resized', {
			id: node.id,
			difference: difference
		});
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (textAreaHtml?.value !== '') {
				dispatch('add', {
					id: node.id
				});
			}
			return;
		}

		if (event.key === 'Backspace' && textAreaHtml?.value === '') {
			dispatch('delete', {
				id: node.id
			});
			return;
		}
	}

	function handlePointerDown(event: PointerEvent) {
		if (!node.html) {
			return;
		}

		const parent = node.html.parentElement;
		if (!parent) {
			return;
		}

		node.nodeRect = node.html.getBoundingClientRect();
		node.parentRect = parent.getBoundingClientRect();
		//parentRect = parent.getBoundingClientRect();

		dispatch('dragstarted', {
			id: node.id,
			nodeHtml: node.html
		});

		isDragging = true;
		node.html.style.zIndex = '1000';
		previousPosition.x = event.clientX;
		previousPosition.y = event.clientY;

		document.addEventListener('pointermove', handlePointerMove);
		document.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerMove(event: PointerEvent) {
		event.preventDefault();
		if (!node.html || !isDragging || !node.parentRect || !node.nodeRect) {
			return;
		}

		const delta: Point = {
			x: previousPosition.x - event.clientX,
			y: previousPosition.y - event.clientY
		};
		let y = node.html.offsetTop - delta.y;

		if (node.parentRect && event.clientY + node.nodeRect.height >= node.parentRect.bottom) {
			y = node.parentRect.height - node.nodeRect.height;
		}

		if (node.parentRect && event.clientY <= node.parentRect.top) {
			y = 0;
		}

		node.top = y;
		previousPosition.x = event.clientX;
		previousPosition.y = event.clientY;

		dispatch('dragged', {
			id: node.id
		});
	}

	function handlePointerUp(event: PointerEvent) {
		if (!node.html || !isDragging) {
			return;
		}

		isDragging = false;
		node.html.style.zIndex = '0';
		node.html.style.left = '0';

		dispatch('dragended', {
			id: node.id
		});

		document.removeEventListener('pointermove', handlePointerMove);
		document.removeEventListener('pointerup', handlePointerUp);
	}

	onMount(() => {
		if (!textAreaHtml) {
			return;
		}

		textAreaHtml.focus();
	});
</script>

<div
	bind:this={node.html}
	style="top:{node.top}px"
	class="
		flex justify-center flex-col absolute left-0 w-100 touch-none
	 	{!node.isVisible ? 'hidden' : ''}
		{node.isHovered ? '!brightness-100' : ''}
	"
>
	<div class="flex gap-2 items-center">
		<span class="px-1 text-lg" on:pointerdown|preventDefault={handlePointerDown}>⋮</span>
		<input class="w-5 h-5" type="checkbox" />
		<textarea
			bind:this={textAreaHtml}
			on:blur={handleBlur}
			on:input={handleInput}
			on:keydown={handleKeyDown}
			class="overflow-hidden resize-none text-sm w-[100%] h-5"
			style="height: {node.height}px;"
			rows="1"
		/>
	</div>
</div>
