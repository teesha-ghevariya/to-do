import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../models/node.model';
import { NodeItemComponent } from '../node-item/node-item.component';
import { StateService } from '../../services/state.service';
import { NodeService } from '../../services/node.service';
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
  
  nodes: TreeNode[] = [];
  private allNodes: Node[] = [];
  private subscription?: Subscription;
  private draggedNode: Node | null = null;

  constructor(
    private stateService: StateService, 
    private nodeService: NodeService,
    private zoomService: ZoomService
  ) {}

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
    
    // No additional filtering; respect each node's completed state as-is
    
    this.nodes = filteredNodes.map(node => ({
      node,
      children: this.buildChildren(node.id)
    }));
  }

  private buildChildren(parentId: number): TreeNode[] {
    let children = this.allNodes.filter(node => node.parentId === parentId);
    
    // Sort children by position
    children.sort((a, b) => a.position - b.position);
    
    // No additional filtering for children
    
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

    // Update in state first for immediate UI feedback
    const updatedNode = { ...node, content: newContent };
    this.stateService.updateNode(updatedNode);

    // Update in backend
    this.nodeService.updateNode(node.id, updatedNode).subscribe({
      next: (backendNode) => {
        // Update state with backend response to ensure consistency
        this.stateService.updateNode(backendNode);
      },
      error: (error) => {
        console.error('Failed to update node content:', error);
        // Revert state change on error
        const revertedNode = { ...node, content: previousContent };
        this.stateService.updateNode(revertedNode);
        // Could show user-friendly error message here
      }
    });
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

    // Remove all nodes from state first for immediate UI feedback
    nodesToDelete.forEach(nodeToDelete => {
      this.stateService.removeNode(nodeToDelete.id);
    });

    // Delete from backend (only the root node, backend handles cascading)
    this.nodeService.deleteNode(node.id).subscribe({
      next: () => {
        // Success - nodes already removed from state
        console.log('Node and descendants deleted successfully');
      },
      error: (error) => {
        console.error('Failed to delete node:', error);
        // Revert state changes on error - add nodes back
        nodesToDelete.forEach(nodeToDelete => {
          this.stateService.addNode(nodeToDelete);
        });
        // Could show user-friendly error message here
      }
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
    const newNodeData: Partial<Node> = {
      content: '',
      parentId: node.parentId,
      position: newPosition,
      isExpanded: true
    };
    
    // Create node in backend first
    this.nodeService.createNode(newNodeData).subscribe({
      next: (createdNode) => {
        // Add to state with real ID from backend
        this.stateService.addNode(createdNode);
        const historyItem = {
          type: 'create' as const,
          node: createdNode
        };
        this.stateService.addToUndoStack(historyItem);
      },
      error: (error) => {
        console.error('Failed to create sibling node:', error);
        // Could show user-friendly error message here
      }
    });
  }

  onCreateChild(node: Node): void {
    // Create a child node
    const children = this.allNodes.filter(n => n.parentId === node.id);
    const newPosition = children.length;
    
    const newNodeData: Partial<Node> = {
      content: '',
      parentId: node.id,
      position: newPosition,
      isExpanded: true
    };
    
    // Ensure parent is expanded when creating a child
    const updatedParent = { ...node, isExpanded: true };
    this.stateService.updateNode(updatedParent);
    
    // Create node in backend first
    this.nodeService.createNode(newNodeData).subscribe({
      next: (createdNode) => {
        // Add to state with real ID from backend
        this.stateService.addNode(createdNode);
        const historyItem = {
          type: 'create' as const,
          node: createdNode
        };
        this.stateService.addToUndoStack(historyItem);
      },
      error: (error) => {
        console.error('Failed to create child node:', error);
        // Could show user-friendly error message here
      }
    });
  }

  onDuplicate(node: Node): void {
    // Create a sibling with the same content
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position >= node.position
    );
    
    // Calculate new position
    let newPosition = node.position + 1;
    const newNodeData: Partial<Node> = {
      content: node.content, // Copy the content
      parentId: node.parentId,
      position: newPosition,
      isCompleted: node.isCompleted,
      tags: node.tags ? [...node.tags] : undefined,
      notes: node.notes,
      isExpanded: true
    };
    
    // Create node in backend first
    this.nodeService.createNode(newNodeData).subscribe({
      next: (createdNode) => {
        // Add to state with real ID from backend
        this.stateService.addNode(createdNode);
        const historyItem = {
          type: 'create' as const,
          node: createdNode
        };
        this.stateService.addToUndoStack(historyItem);
      },
      error: (error) => {
        console.error('Failed to duplicate node:', error);
        // Could show user-friendly error message here
      }
    });
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
    
    // Update in state first for immediate UI feedback
    const updatedNode = { ...node, parentId: previousSibling.id };
    this.stateService.updateNode(updatedNode);

    // Update in backend
    this.nodeService.moveNode(node.id, previousSibling.id, null).subscribe({
      next: (backendNode) => {
        // Update state with backend response to ensure consistency
        this.stateService.updateNode(backendNode);
      },
      error: (error) => {
        console.error('Failed to indent node:', error);
        // Revert state change on error
        const revertedNode = { ...node, parentId: node.parentId };
        this.stateService.updateNode(revertedNode);
        // Could show user-friendly error message here
      }
    });
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
    
    // Update in state first for immediate UI feedback
    const updatedNode = { ...node, parentId: parent.parentId };
    this.stateService.updateNode(updatedNode);

    // Update in backend
    this.nodeService.moveNode(node.id, parent.parentId, null).subscribe({
      next: (backendNode) => {
        // Update state with backend response to ensure consistency
        this.stateService.updateNode(backendNode);
      },
      error: (error) => {
        console.error('Failed to outdent node:', error);
        // Revert state change on error
        const revertedNode = { ...node, parentId: node.parentId };
        this.stateService.updateNode(revertedNode);
        // Could show user-friendly error message here
      }
    });
  }

  onMoveUp(node: Node): void {
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position < node.position
    );
    
    if (siblings.length === 0) return;
    
    const targetSibling = siblings[siblings.length - 1];
    const newPosition = targetSibling.position;
    
    // Update both nodes in state first for immediate UI feedback
    const updatedTarget = { ...targetSibling, position: node.position };
    const updatedNode = { ...node, position: newPosition };
    this.stateService.updateNode(updatedTarget);
    this.stateService.updateNode(updatedNode);

    // Update in backend
    this.nodeService.moveNode(node.id, node.parentId, newPosition).subscribe({
      next: (backendNode) => {
        // Update state with backend response to ensure consistency
        this.stateService.updateNode(backendNode);
      },
      error: (error) => {
        console.error('Failed to move node up:', error);
        // Revert state changes on error
        const revertedTarget = { ...targetSibling, position: targetSibling.position };
        const revertedNode = { ...node, position: node.position };
        this.stateService.updateNode(revertedTarget);
        this.stateService.updateNode(revertedNode);
        // Could show user-friendly error message here
      }
    });
  }

  onMoveDown(node: Node): void {
    const siblings = this.allNodes.filter(
      n => n.parentId === node.parentId && n.position > node.position
    );
    
    if (siblings.length === 0) return;
    
    const targetSibling = siblings[0];
    const newPosition = targetSibling.position;
    
    // Update both nodes in state first for immediate UI feedback
    const updatedTarget = { ...targetSibling, position: node.position };
    const updatedNode = { ...node, position: newPosition };
    this.stateService.updateNode(updatedTarget);
    this.stateService.updateNode(updatedNode);

    // Update in backend
    this.nodeService.moveNode(node.id, node.parentId, newPosition).subscribe({
      next: (backendNode) => {
        // Update state with backend response to ensure consistency
        this.stateService.updateNode(backendNode);
      },
      error: (error) => {
        console.error('Failed to move node down:', error);
        // Revert state changes on error
        const revertedTarget = { ...targetSibling, position: targetSibling.position };
        const revertedNode = { ...node, position: node.position };
        this.stateService.updateNode(revertedTarget);
        this.stateService.updateNode(revertedNode);
        // Could show user-friendly error message here
      }
    });
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

  onToggleCompleted(node: Node, isCompleted: boolean): void {
    // Update the node itself in state first for immediate UI feedback
    const updated = { ...node, isCompleted };
    this.stateService.updateNode(updated);

    // Cascade completion status to all descendants in state
    const descendants = this.collectDescendants(node.id);
    descendants.forEach(child => {
      const childUpdated = { ...child, isCompleted };
      this.stateService.updateNode(childUpdated);
    });

    // Update in backend
    this.nodeService.updateNode(node.id, updated).subscribe({
      next: (backendNode) => {
        // Update state with backend response to ensure consistency
        this.stateService.updateNode(backendNode);
      },
      error: (error) => {
        console.error('Failed to toggle completed status:', error);
        // Revert state change on error
        const revertedNode = { ...node, isCompleted: !isCompleted };
        this.stateService.updateNode(revertedNode);
        // Revert descendants too
        descendants.forEach(child => {
          const childReverted = { ...child, isCompleted: !isCompleted };
          this.stateService.updateNode(childReverted);
        });
        // Could show user-friendly error message here
      }
    });
  }

  private collectDescendants(parentId: number): Node[] {
    const result: Node[] = [];
    const children = this.allNodes.filter(n => n.parentId === parentId);
    children.forEach(c => {
      result.push(c, ...this.collectDescendants(c.id));
    });
    return result;
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

