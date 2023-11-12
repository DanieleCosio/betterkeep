<script lang="ts">
	import { getRandomString } from '../utils';
	import type NodeProps from '$types/Node';
	import { createEventDispatcher, onMount } from 'svelte';
	import type Point from '$types/Point';
	import { Direction } from '../../enums';

	const ADOPTION_REQUEST_THRESHOLD = 25;
	const DRAGGED_DISPATCH_THRESHOLD = 6;
	const previousPosition: Point = { x: 0, y: 0 };
	let textAreaHtml: HTMLTextAreaElement | undefined = undefined;
	let isDragging: boolean = false;
	let directionCounter: number = 0;
	export let node: NodeProps = {
		id: getRandomString(8),
		isHovered: false,
		isVisible: true,
		dragging: false,
		transitioning: false,
		depth: 0,
		html: undefined,
		height: 24,
		top: 0,
		beingAdopted: false
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
		//TODO  Move animation frame here
		event.preventDefault();
		if (!node.html || !isDragging || !node.parentRect || !node.nodeRect) {
			return;
		}

		// Compute top position
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

		directionCounter += event.clientY - previousPosition.y;
		let dispatchNeeded: boolean = false;
		let direction: Direction | undefined = undefined;
		if (directionCounter <= -DRAGGED_DISPATCH_THRESHOLD) {
			direction = Direction.Up;
			directionCounter = 0;
			dispatchNeeded = true;
		} else if (directionCounter >= DRAGGED_DISPATCH_THRESHOLD) {
			direction = Direction.Down;
			directionCounter = 0;
			dispatchNeeded = true;
		}

		node.top = y;
		previousPosition.x = event.clientX;
		previousPosition.y = event.clientY;

		if (dispatchNeeded) {
			dispatch('dragged', {
				id: node.id,
				direction: direction
			});
		}

		// Compute x positions difference to trigger adoption request
		if (previousPosition.x + ADOPTION_REQUEST_THRESHOLD < event.clientX) {
			dispatch('adoption-request', {
				id: node.id
			});
		}
	}

	function handlePointerUp(event: PointerEvent) {
		if (!node.html || !isDragging) {
			return;
		}

		isDragging = false;
		node.html.style.zIndex = '0';
		node.html.style.left = '0';
		directionCounter = 0;

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
	style="top: {node.top}px; {!node.dragging ? 'transition: top 0.4s ease-in-out' : ''}"
	on:transitionstart={() => (node.transitioning = true)}
	on:transitionend={() => {
		setTimeout(() => (node.transitioning = false), 25);
	}}
	class="
		flex justify-center flex-col absolute left-0 w-100 touch-none
	 	{!node.isVisible ? 'hidden' : ''}
		{node.isHovered ? '!brightness-100' : ''}
	"
>
	<div class="flex gap-2 items-center">
		<span class="px-1 text-lg self-start" on:pointerdown|preventDefault={handlePointerDown}>⋮</span>
		<input class="w-5 h-5 self-start" type="checkbox" />
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
