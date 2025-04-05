import type Point from '$types/Point';

export function moveAt(nodeHtml: HTMLElement, event: MouseEvent, previousPosition: Point): void {
	const delta: Point = {
		x: previousPosition.x - event.clientX,
		y: previousPosition.y - event.clientY
	};

	nodeHtml.style.top = `${nodeHtml.offsetTop - delta.y}px`;
	nodeHtml.style.left = `${nodeHtml.offsetLeft - delta.x}px`;
}
