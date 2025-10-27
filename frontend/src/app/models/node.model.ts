export interface Node {
  id: number;
  content: string;
  parentId: number | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActionHistory {
  type: 'create' | 'delete' | 'update' | 'move';
  node: Node;
  previousState?: Partial<Node>;
  previousParentId?: number | null;
  previousPosition?: number;
}

