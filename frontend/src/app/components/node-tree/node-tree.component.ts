import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../models/node.model';
import { NodeItemComponent } from '../node-item/node-item.component';
import { StateService } from '../../services/state.service';
import { ZoomService } from '../../services/zoom.service';
import { Subscription } from 'rxjs';

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
export class NodeTreeComponent implements OnInit, OnDestroy {
  @Input() parentId: number | null = null;
  @Input() depth: number = 0;
  @Input() focusMode: boolean = false;
  @Input() showCompleted: boolean = true;
  
  nodes: TreeNode[] = [];
  private allNodes: Node[] = [];
  private subscription?: Subscription;
  private draggedNode: Node | null = null;

  constructor(private stateService: StateService, private zoomService: ZoomService) {}

  ngOnInit(): void {
    // Load initial state
    this.buildTree();
    
    // Subscribe to state changes - only rebuild tree without making API calls
    this.subscription = this.stateService.nodes$.subscribe(() => {
      this.buildTree();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private buildTree(): void {
    this.allNodes = this.stateService.getAllNodes();
    
    // Get the current zoom node
    const currentZoomNode = this.zoomService.getCurrentZoomNode();
    
    // Determine which nodes to show based on zoom state
    let filteredNodes: Node[];
    
    if (currentZoomNode && this.parentId === null) {
      // If we're zoomed in, show only the children of the current zoom node
      filteredNodes = this.allNodes.filter(node => node.parentId === currentZoomNode.id);
    } else {
      // Normal filtering based on parentId
      filteredNodes = this.allNodes.filter(
        node => (node.parentId === null && this.parentId === null) ||
                (node.parentId === this.parentId)
      );
    }
    
    // Sort nodes by position
    filteredNodes.sort((a, b) => a.position - b.position);
    
    // Apply focus mode filtering
    if (this.focusMode) {
      filteredNodes = filteredNodes.filter(node => !node.isCompleted);
    }
    
    // Apply completed items filtering
    if (!this.showCompleted) {
      filteredNodes = filteredNodes.filter(node => !node.isCompleted);
    }
    
    this.nodes = filteredNodes.map(node => ({
      node,
      children: this.buildChildren(node.id)
    }));
  }

  private buildChildren(parentId: number): TreeNode[] {
    let children = this.allNodes.filter(node => node.parentId === parentId);
    
    // Sort children by position
    children.sort((a, b) => a.position - b.position);
    
    // Apply focus mode filtering to children
    if (this.focusMode) {
      children = children.filter(node => !node.isCompleted);
    }
    
    // Apply completed items filtering to children
    if (!this.showCompleted) {
      children = children.filter(node => !node.isCompleted);
    }
    
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

    // Update in state - this will trigger rebuild
    const updatedNode = { ...node, content: newContent };
    this.stateService.updateNode(updatedNode);
  }

  onDelete(node: Node): void {
    // Collect all nodes to delete (node + all descendants)
    const nodesToDelete = this.collectNodeWithDescendants(node, this.allNodes);
    
    // Add each node to undo stack
    nodesToDelete.forEach(nodeToDelete => {
      const historyItem = {
        type: 'delete' as const,
        node: { ...nodeToDelete }
      };
      this.stateService.addToUndoStack(historyItem);
    });

    // Remove all nodes from state
    nodesToDelete.forEach(nodeToDelete => {
      this.stateService.removeNode(nodeToDelete.id);
    });
  }

  private collectNodeWithDescendants(node: Node, allNodes: Node[]): Node[] {
    const result: Node[] = [node];
    const children = allNodes.filter(n => n.parentId === node.id);
    
    children.forEach(child => {
      result.push(...this.collectNodeWithDescendants(child, allNodes));
    });
    
    return result;
  }

  onCreateSibling(node: Node): void {
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position >= node.position
    );
    
    // Calculate new position
    let newPosition = node.position + 1;
    const newNode: Node = {
      id: Date.now(), // Temporary ID until backend responds
      content: '',
      parentId: node.parentId,
      position: newPosition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isExpanded: true
    };
    
    // Add to state immediately
    this.stateService.addNode(newNode);
    const historyItem = {
      type: 'create' as const,
      node: newNode
    };
    this.stateService.addToUndoStack(historyItem);
  }

  onCreateChild(node: Node): void {
    // Create a child node
    const children = this.allNodes.filter(n => n.parentId === node.id);
    const newPosition = children.length;
    
    const newNode: Node = {
      id: Date.now(), // Temporary ID until backend responds
      content: '',
      parentId: node.id,
      position: newPosition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isExpanded: true
    };
    
    // Ensure parent is expanded when creating a child
    const updatedParent = { ...node, isExpanded: true };
    this.stateService.updateNode(updatedParent);
    
    // Add to state immediately
    this.stateService.addNode(newNode);
    const historyItem = {
      type: 'create' as const,
      node: newNode
    };
    this.stateService.addToUndoStack(historyItem);
  }

  onDuplicate(node: Node): void {
    // Create a sibling with the same content
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position >= node.position
    );
    
    // Calculate new position
    let newPosition = node.position + 1;
    const newNode: Node = {
      id: Date.now(), // Temporary ID until backend responds
      content: node.content, // Copy the content
      parentId: node.parentId,
      position: newPosition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: node.isCompleted,
      tags: node.tags ? [...node.tags] : undefined,
      notes: node.notes,
      isExpanded: true
    };
    
    // Add to state immediately
    this.stateService.addNode(newNode);
    const historyItem = {
      type: 'create' as const,
      node: newNode
    };
    this.stateService.addToUndoStack(historyItem);
  }

  onIndent(node: Node): void {
    const historyItem = {
      type: 'move' as const,
      node: { ...node },
      previousParentId: node.parentId,
      previousPosition: node.position
    };
    this.stateService.addToUndoStack(historyItem);

    // Find previous sibling
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position < node.position
    );
    
    if (siblings.length === 0) return;
    
    const previousSibling = siblings[siblings.length - 1];
    
    // Update in state
    const updatedNode = { ...node, parentId: previousSibling.id };
    this.stateService.updateNode(updatedNode);
  }

  onOutdent(node: Node): void {
    if (node.parentId === null) return;
    
    const historyItem = {
      type: 'move' as const,
      node: { ...node },
      previousParentId: node.parentId,
      previousPosition: node.position
    };
    this.stateService.addToUndoStack(historyItem);

    const parent = this.allNodes.find(n => n.id === node.parentId);
    if (!parent) return;
    
    // Update in state
    const updatedNode = { ...node, parentId: parent.parentId };
    this.stateService.updateNode(updatedNode);
  }

  onMoveUp(node: Node): void {
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position < node.position
    );
    
    if (siblings.length === 0) return;
    
    const targetSibling = siblings[siblings.length - 1];
    const newPosition = targetSibling.position;
    
    // Update both nodes
    const updatedTarget = { ...targetSibling, position: node.position };
    const updatedNode = { ...node, position: newPosition };
    this.stateService.updateNode(updatedTarget);
    this.stateService.updateNode(updatedNode);
  }

  onMoveDown(node: Node): void {
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position > node.position
    );
    
    if (siblings.length === 0) return;
    
    const targetSibling = siblings[0];
    const newPosition = targetSibling.position;
    
    // Update both nodes
    const updatedTarget = { ...targetSibling, position: node.position };
    const updatedNode = { ...node, position: newPosition };
    this.stateService.updateNode(updatedTarget);
    this.stateService.updateNode(updatedNode);
  }

  hasChildren(node: Node): boolean {
    return this.allNodes.some(n => n.parentId === node.id);
  }

  onZoomIn(node: Node): void {
    this.zoomService.zoomIn(node);
  }

  onToggleExpanded(node: Node): void {
    // Toggle the expanded state of the node
    const updatedNode = { ...node, isExpanded: !node.isExpanded };
    this.stateService.updateNode(updatedNode);
  }

  onDragStart(node: Node): void {
    this.draggedNode = node;
  }

  onDragEnd(): void {
    this.draggedNode = null;
  }

  onDragOver(data: {node: Node, event: DragEvent}): void {
    if (!this.draggedNode || this.draggedNode.id === data.node.id) {
      return;
    }
    
    data.event.preventDefault();
  }

  onDrop(data: {node: Node, event: DragEvent}): void {
    if (!this.draggedNode || this.draggedNode.id === data.node.id) {
      return;
    }

    const targetNode = data.node;
    const draggedNode = this.draggedNode;
    
    // Calculate new position
    const siblings = this.allNodes.filter(
      n => n.parentId === targetNode.parentId && n.id !== draggedNode.id
    );
    
    const targetPosition = targetNode.position;
    const newPosition = targetPosition;
    
    // Update positions of affected nodes
    siblings.forEach(sibling => {
      if (sibling.position >= targetPosition) {
        sibling.position += 1;
        this.stateService.updateNode(sibling);
      }
    });
    
    // Update the dragged node
    const updatedDraggedNode = {
      ...draggedNode,
      parentId: targetNode.parentId,
      position: newPosition
    };
    
    this.stateService.updateNode(updatedDraggedNode);
    this.draggedNode = null;
  }
}

