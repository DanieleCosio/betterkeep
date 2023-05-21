interface NodeProps {
	readonly id: string;
	isHovered: boolean;
	isFocused: boolean;
	isDragging: boolean;
	isVisible: boolean;
	depth: number;
}

export default NodeProps;
