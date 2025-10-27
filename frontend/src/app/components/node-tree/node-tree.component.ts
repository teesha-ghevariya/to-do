import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../models/node.model';
import { NodeItemComponent } from '../node-item/node-item.component';
import { NodeService } from '../../services/node.service';
import { StateService } from '../../services/state.service';

interface TreeNode {
  node: Node;
  children?: TreeNode[];
}

@Component({
  selector: 'app-node-tree',
  standalone: true,
  imports: [CommonModule, NodeItemComponent],
  templateUrl: './node-tree.component.html',
  styleUrls: ['./node-tree.component.css']
})
export class NodeTreeComponent implements OnInit {
  @Input() parentId: number | null = null;
  @Input() depth: number = 0;
  
  nodes: TreeNode[] = [];
  private allNodes: Node[] = [];

  constructor(
    private nodeService: NodeService,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.loadNodes();
    
    // Subscribe to state changes
    this.stateService.nodes$.subscribe(() => {
      this.loadNodes();
    });
  }

  loadNodes(): void {
    if (this.parentId === null) {
      this.nodeService.getRootNodes().subscribe(nodes => {
        this.stateService.setNodes(nodes);
        this.buildTree();
      });
    } else {
      this.nodeService.getChildren(this.parentId).subscribe(nodes => {
        this.buildTree();
      });
    }
  }

  private buildTree(): void {
    this.allNodes = this.stateService.getAllNodes();
    
    const filteredNodes = this.allNodes.filter(
      node => (node.parentId === null && this.parentId === null) ||
              (node.parentId === this.parentId)
    );
    
    this.nodes = filteredNodes.map(node => ({
      node,
      children: this.buildChildren(node.id)
    }));
  }

  private buildChildren(parentId: number): TreeNode[] {
    const children = this.allNodes.filter(node => node.parentId === parentId);
    return children.map(node => ({
      node,
      children: this.buildChildren(node.id)
    }));
  }

  onContentChange(node: Node, newContent: string): void {
    const previousContent = node.content;
    const historyItem = {
      type: 'update' as const,
      node: { ...node },
      previousState: { content: previousContent }
    };
    this.stateService.addToUndoStack(historyItem);

    node.content = newContent;
    this.nodeService.updateNode(node.id, { content: newContent }).subscribe();
    this.stateService.updateNode(node);
  }

  onDelete(node: Node): void {
    const historyItem = {
      type: 'delete' as const,
      node: { ...node }
    };
    this.stateService.addToUndoStack(historyItem);

    this.nodeService.deleteNode(node.id).subscribe(() => {
      this.loadNodes();
    });
  }

  onCreateSibling(node: Node): void {
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position >= node.position
    );
    
    // Calculate new position
    let newPosition = node.position + 1;
    for (const sibling of siblings) {
      if (sibling.id !== node.id) {
        sibling.position += 1;
        this.nodeService.updateNode(sibling.id, { position: sibling.position }).subscribe();
      }
    }
    
    this.nodeService.createNode({
      content: '',
      parentId: node.parentId,
      position: newPosition
    }).subscribe(newNode => {
      const historyItem = {
        type: 'create' as const,
        node: newNode
      };
      this.stateService.addToUndoStack(historyItem);
      this.stateService.addNode(newNode);
      this.loadNodes();
    });
  }

  onIndent(node: Node): void {
    // Find previous sibling
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position < node.position
    );
    
    if (siblings.length === 0) return;
    
    const previousSibling = siblings[siblings.length - 1];
    
    this.moveNode(node, previousSibling.id, null);
  }

  onOutdent(node: Node): void {
    if (node.parentId === null) return;
    
    const parent = this.allNodes.find(n => n.id === node.parentId);
    if (!parent) return;
    
    this.moveNode(node, parent.parentId, null);
  }

  onMoveUp(node: Node): void {
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position < node.position
    );
    
    if (siblings.length === 0) return;
    
    const targetSibling = siblings[siblings.length - 1];
    const newPosition = targetSibling.position;
    
    targetSibling.position = node.position;
    node.position = newPosition;
    
    this.nodeService.updateNode(targetSibling.id, { position: targetSibling.position }).subscribe();
    this.nodeService.updateNode(node.id, { position: node.position }).subscribe();
    
    this.loadNodes();
  }

  onMoveDown(node: Node): void {
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position > node.position
    );
    
    if (siblings.length === 0) return;
    
    const targetSibling = siblings[0];
    const newPosition = targetSibling.position;
    
    targetSibling.position = node.position;
    node.position = newPosition;
    
    this.nodeService.updateNode(targetSibling.id, { position: targetSibling.position }).subscribe();
    this.nodeService.updateNode(node.id, { position: node.position }).subscribe();
    
    this.loadNodes();
  }

  private moveNode(node: Node, newParentId: number | null, newPosition: number | null): void {
    const historyItem = {
      type: 'move' as const,
      node: { ...node },
      previousParentId: node.parentId,
      previousPosition: node.position
    };
    this.stateService.addToUndoStack(historyItem);

    this.nodeService.moveNode(node.id, newParentId, newPosition).subscribe(() => {
      this.loadNodes();
    });
  }

  hasChildren(node: Node): boolean {
    return this.allNodes.some(n => n.parentId === node.id);
  }
}

