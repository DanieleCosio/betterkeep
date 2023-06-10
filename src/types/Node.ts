interface NodeProps {
	readonly id: string;
	isHovered: boolean;
	isVisible: boolean;
	depth: number;
	html?: HTMLElement;
	height: number;
	top: number;
}

export default NodeProps;
