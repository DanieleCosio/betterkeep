interface NodeProps {
	readonly id: string;
	isVisible: boolean;
	isFocused: boolean;
	dragging: boolean;
	depth: number;
	height: number;
	top: number;
	html?: HTMLElement;
	parentRect?: DOMRect;
	nodeRect?: DOMRect;
	value: string;
}

export default NodeProps;
