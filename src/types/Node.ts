interface NodeProps {
	readonly id: string;
	isHovered: boolean;
	isFocused: boolean;
	isDragging: boolean;
	isVisible: boolean;
	depth: number;
	html?: HTMLElement;
	height: number;
	top: number;
}

export default NodeProps;
