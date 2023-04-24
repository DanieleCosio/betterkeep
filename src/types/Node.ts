interface NodeProps {
	readonly id: string;
	children: NodeProps[];
	isHovered: boolean;
	isFocused: boolean;
	isDragging: boolean;
	isOvered: boolean;
	depth: number;
}

export default NodeProps;
