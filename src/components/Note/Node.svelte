<script lang="ts">
	import { getRandomString } from '../utils';
	import type NodeProps from '$types/Node';
	import { onMount } from 'svelte';
	import type Point from '$types/Point';
	import { tweened, Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	const previousPosition: Point = { x: 0, y: 0 };
	let textAreaHtml: HTMLTextAreaElement | undefined = $state(undefined);
	let isDragging: boolean = $state(false);
	let xStartPosition: number = 0;
	let requestAnimationId: number | undefined;
	let deltaX: number = 0;
	//let value: string = $state('');
	//let requestSaveDebounceTimer: NodeJS.Timeout | undefined;

	interface Props {
		node?: NodeProps;
		add: (id: string) => void;
		focused: (id: string) => void;
		blured: (id: string) => void;
		deleted: (id: string) => void;
		resized: (id: string, difference: number) => void;
		dragstarted: (id: string, nodeHtml: HTMLDivElement) => void;
		dragged: (id: string, deltaX: number) => void;
		dragended: (id: string) => void;
	}

	let {
		node = $bindable({
			id: getRandomString(8),
			isVisible: true,
			isFocused: true,
			dragging: false,
			depth: 0,
			html: undefined,
			height: 24,
			top: 0,
			value: ''
		}),
		focused,
		blured,
		add,
		deleted,
		resized,
		dragstarted,
		dragged,
		dragended
	}: Props = $props();

	//value = node.value;
	/* run(() => {
		node.value = value;
	}); */

	/* const animatedTop = tweened(node.top, {
		duration: 300
	}); */

	const animatedTop = new Tween(node.top, { duration: 300, easing: cubicOut });

	$effect.pre(() => {
		//node.value = value;
		animatedTop.set(node.top);
	});

	/* run(() => {
		$animatedTop = node.top;
	}); */

	//const dispatch = createEventDispatcher();

	function handleFocus() {
		node.isFocused = true;
		focused(node.id);
	}

	function handleBlur() {
		if (textAreaHtml?.value === '') {
			deleted(node.id);
		}

		node.isFocused = false;

		blured(node.id);
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

		resized(node.id, difference);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (textAreaHtml?.value !== '') {
				add(node.id);
			}

			return;
		}

		if (event.key === 'Backspace' && textAreaHtml?.value === '') {
			deleted(node.id);

			return;
		}
	}

	function handlePointerDown(event: PointerEvent) {
		event.preventDefault();

		if (!node.html) {
			return;
		}

		const parent = node.html.parentElement;
		if (!parent) {
			return;
		}

		node.nodeRect = node.html.getBoundingClientRect();
		node.parentRect = parent.getBoundingClientRect();

		dragstarted(node.id, node.html as HTMLDivElement);

		isDragging = true;
		node.html.style.zIndex = '1000';
		previousPosition.x = xStartPosition = event.clientX;
		previousPosition.y = event.clientY;

		document.addEventListener('pointermove', handlePointerMove);
		document.addEventListener('pointerup', handlePointerUp);

		requestAnimationId = requestAnimationFrame(onDragged);
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

		dragended(node.id);

		document.removeEventListener('pointermove', handlePointerMove);
		document.removeEventListener('pointerup', handlePointerUp);

		if (requestAnimationId) {
			cancelAnimationFrame(requestAnimationId);
		}
		requestAnimationId = undefined;
	}

	function onDragged() {
		dragged(node.id, deltaX);

		requestAnimationId = requestAnimationFrame(onDragged);
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
		top: {isDragging ? node.top : animatedTop.current}px; 
		margin-left:{node.depth * 10}px; 
	"
	class="
		flex justify-center flex-col absolute left-0 w-100 touch-none
	 	{!node.isVisible ? 'hidden' : ''}
	"
>
	<div class="flex gap-2 items-center">
		<span class="px-1 text-lg self-start" onpointerdown={handlePointerDown}>⋮</span>
		<input class="w-5 h-5 self-start" type="checkbox" />
		<textarea
			bind:this={textAreaHtml}
			bind:value={node.value}
			onfocus={handleFocus}
			onblur={handleBlur}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			class="overflow-hidden resize-none text-sm w-[100%] h-5"
			style="height: {node.height}px;"
			rows="1"
		></textarea>
	</div>
</div>
