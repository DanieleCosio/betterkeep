<script lang="ts">
	import { getRandomString } from './utils';
	import type NodeProps from '$types/Node';
	import { createEventDispatcher, onMount } from 'svelte';

	export let node: NodeProps = {
		id: getRandomString(8),
		children: [],
		indent: 0,
		isHovered: false
	};

	let htmlNode: HTMLTextAreaElement | undefined = undefined;

	function handleFocus() {
		node.isHovered = true;
	}

	function handleBlur() {
		const dispatch = createEventDispatcher();
		node.isHovered = false;
		if (htmlNode?.value === '') {
			dispatch('delete', node.id);
		}
	}

	function handleInput() {
		if (!htmlNode) {
			return;
		}

		htmlNode.style.height = 'auto';
		htmlNode.style.height = htmlNode.scrollHeight + 'px';
	}

	onMount(() => {
		if (!htmlNode) {
			return;
		}

		htmlNode.focus();
	});
</script>

<div class="flex gap-2">
	<input class="w-5 h-5" type="checkbox" />
	<textarea
		bind:this={htmlNode}
		on:focus={handleFocus}
		on:blur={handleBlur}
		on:input={handleInput}
		style="padding-left: {node.indent}px;"
		class="overflow-hidden resize-none text-sm w-[100%] h-5"
	/>
</div>

{#each node.children as child (child.id)}
	<svelte:self {child} />
{/each}
