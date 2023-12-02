interface NodeProps {
	readonly id: string;
	isVisible: boolean;
	dragging: boolean;
	depth: number;
	height: number;
	top: number;
	html?: HTMLElement;
	parentRect?: DOMRect;
	nodeRect?: DOMRect;
}

export default NodeProps;
