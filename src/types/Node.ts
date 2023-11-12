interface NodeProps {
	readonly id: string;
	isHovered: boolean;
	isVisible: boolean;
	dragging: boolean;
	beingAdopted: boolean;
	transitioning: boolean;
	depth: number;
	height: number;
	top: number;
	html?: HTMLElement;
	parentRect?: DOMRect;
	nodeRect?: DOMRect;
}

export default NodeProps;
