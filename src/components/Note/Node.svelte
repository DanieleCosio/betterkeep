<script lang="ts">
	import { debounce, getRandomString } from '../utils';
	import type NodeProps from '$types/Node';
	import { createEventDispatcher, onMount } from 'svelte';
	import type Point from '$types/Point';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	const previousPosition: Point = { x: 0, y: 0 };
	let textAreaHtml: HTMLTextAreaElement | undefined = undefined;
	let isDragging: boolean = false;
	let xStartPosition: number = 0;
	let requestAnimationId: number | undefined;
	let deltaX: number = 0;
	let value: string = '';
	let requestSaveDebounceTimer: NodeJS.Timeout | undefined;

	export let node: NodeProps = {
		id: getRandomString(8),
		isVisible: true,
		isFocused: true,
		dragging: false,
		depth: 0,
		html: undefined,
		height: 24,
		top: 0,
		value: ''
	};

	value = node.value;
	$: node.value = value;

	const animatedTop = tweened(node.top, {
		duration: 300
	});

	$: $animatedTop = node.top;

	const dispatch = createEventDispatcher();

	function handleFocus() {
		node.isFocused = true;
		dispatch('focused', {
			id: node.id
		});
	}

	function handleBlur() {
		if (textAreaHtml?.value === '') {
			dispatch('delete', {
				id: node.id
			});
		}

		node.isFocused = false;
		dispatch('blured', {
			id: node.id
		});
	}

	function handleInput() {
		/* requestSaveDebounceTimer = debounce(() => {
			dispatch('valueChanged', {
				id: node.id
			});
		}, requestSaveDebounceTimer); */

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
		previousPosition.x = xStartPosition = event.clientX;
		previousPosition.y = event.clientY;

		document.addEventListener('pointermove', handlePointerMove);
		document.addEventListener('pointerup', handlePointerUp);

		requestAnimationId = requestAnimationFrame(dragged);
	}

	function handlePointerMove(event: PointerEvent) {
		event.preventDefault();
		if (!node.html || !isDragging || !node.parentRect || !node.nodeRect) {
			return;
		}

		// Compute top position
		const delta: Point = {
			x: previousPosition.x - event.clientX,
			y: previousPosition.y - event.clientY
		};

		let y = node.top - delta.y;
		if (node.parentRect && event.clientY + node.nodeRect.height >= node.parentRect.bottom) {
			y = node.parentRect.height - node.nodeRect.height;
		}

		if (node.parentRect && event.clientY <= node.parentRect.top) {
			y = 0;
		}

		node.top = y;
		previousPosition.x = event.clientX;
		previousPosition.y = event.clientY;
		deltaX = event.clientX - xStartPosition;
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

		if (requestAnimationId) {
			cancelAnimationFrame(requestAnimationId);
		}
		requestAnimationId = undefined;
	}

	function dragged() {
		dispatch('dragged', {
			id: node.id,
			deltaX: deltaX
		});

		requestAnimationId = requestAnimationFrame(dragged);
	}

	onMount(() => {
		if (!textAreaHtml) {
			return;
		}

		textAreaHtml.focus();
	});
</script>

<div
	id={node.id}
	bind:this={node.html}
	style="
		top: {isDragging ? node.top : $animatedTop}px; 
		margin-left:{node.depth * 10}px; 
	"
	class="
		flex justify-center flex-col absolute left-0 w-100 touch-none
	 	{!node.isVisible ? 'hidden' : ''}
	"
>
	<div class="flex gap-2 items-center">
		<span class="px-1 text-lg self-start" on:pointerdown|preventDefault={handlePointerDown}>⋮</span>
		<input class="w-5 h-5 self-start" type="checkbox" />
		<textarea
			bind:this={textAreaHtml}
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:input={handleInput}
			on:keydown={handleKeyDown}
			bind:value
			class="overflow-hidden resize-none text-sm w-[100%] h-5"
			style="height: {node.height}px;"
			rows="1"
		/>
	</div>
</div>
