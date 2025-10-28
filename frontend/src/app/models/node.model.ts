export interface Node {
  id: number;
  content: string;
  parentId: number | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  isCompleted?: boolean;
  isExpanded?: boolean;
  tags?: string[];
  notes?: string;
  isStarred?: boolean;
}

export interface ActionHistory {
  type: 'create' | 'delete' | 'update' | 'move' | 'complete' | 'expand';
  node: Node;
  previousState?: Partial<Node>;
  previousParentId?: number | null;
  previousPosition?: number;
}

export interface SearchResult {
  node: Node;
  matches: string[];
  context: string;
}

