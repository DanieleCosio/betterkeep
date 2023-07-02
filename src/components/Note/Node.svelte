<script lang="ts">
	import { getRandomString } from '../utils';
	import type NodeProps from '$types/Node';
	import { createEventDispatcher, onMount } from 'svelte';
	import type Point from '$types/Point';

	let textAreaHtml: HTMLTextAreaElement | undefined = undefined;
	const previousPosition: Point = { x: 0, y: 0 };
	let parentRect: DOMRect;
	let nodeRect: DOMRect;
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

		const height = parseInt(textAreaHtml.style.height, 10);

		textAreaHtml.style.height = 'auto';
		textAreaHtml.style.height = textAreaHtml.scrollHeight + 'px';

		if (height === textAreaHtml.scrollHeight) {
			return;
		}

		const difference = textAreaHtml.scrollHeight - height;
		dispatch('resized', {
			id: node.id,
			difference: difference
		});
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

	function handlePointerDown(event: PointerEvent) {
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

		isDragging = true;
		node.html.style.zIndex = '1000';
		previousPosition.x = event.clientX;
		previousPosition.y = event.clientY;

		document.addEventListener('pointermove', handlePointerMove);
		document.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!node.html || !isDragging) {
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
	on:dragstart|preventDefault
	bind:this={node.html}
	style="top:{node.top}px"
	class="
		flex justify-center flex-col absolute left-0 w-100 touch-none
		{`h-[${node.height}px]`} 
	 	{!node.isVisible ? 'hidden' : ''}
		{node.isHovered ? '!brightness-100' : ''}
	"
>
	<div class="flex gap-2 items-center">
		<span class="px-1 text-lg" on:pointerdown={handlePointerDown}>⋮</span>
		<input class="w-5 h-5" type="checkbox" />
		<textarea
			bind:this={textAreaHtml}
			on:blur={handleBlur}
			on:input={handleInput}
			on:keydown={handleKeyDown}
			class="overflow-hidden resize-none text-sm w-[100%] h-5"
			rows="1"
		/>
	</div>
</div>
