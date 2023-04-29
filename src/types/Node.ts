interface NodeProps {
	readonly id: string;
	children: NodeProps[];
	isHovered: boolean;
	isFocused: boolean;
	isDragging: boolean;
	depth: number;
}

export default NodeProps;
