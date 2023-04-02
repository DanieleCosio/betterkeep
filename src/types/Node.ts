interface NodeProps {
    id: string;
    children: NodeProps[];
    indent: number;
    isHovered: boolean;

}

export default NodeProps;