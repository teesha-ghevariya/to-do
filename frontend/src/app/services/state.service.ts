import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Node } from '../models/node.model';
import { ActionHistory } from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private nodesSubject = new BehaviorSubject<Node[]>([]);
  private focusedNodeIdSubject = new BehaviorSubject<number | null>(null);
  private undoStackSubject = new BehaviorSubject<ActionHistory[]>([]);
  private redoStackSubject = new BehaviorSubject<ActionHistory[]>([]);

  nodes$ = this.nodesSubject.asObservable();
  focusedNodeId$ = this.focusedNodeIdSubject.asObservable();
  undoStack$ = this.undoStackSubject.asObservable();
  redoStack$ = this.redoStackSubject.asObservable();

  private nodes: Node[] = [];
  private nodeMap = new Map<number, Node>();
  private undoStack: ActionHistory[] = [];
  private redoStack: ActionHistory[] = [];

  setNodes(nodes: Node[]): void {
    this.nodes = nodes;
    this.nodeMap.clear();
    this.buildNodeMap(nodes);
    this.nodesSubject.next(nodes);
  }

  addNode(node: Node): void {
    this.nodes.push(node);
    this.nodeMap.set(node.id, node);
    this.nodesSubject.next([...this.nodes]);
  }

  updateNode(updatedNode: Node): void {
    const index = this.nodes.findIndex(n => n.id === updatedNode.id);
    if (index !== -1) {
      this.nodes[index] = updatedNode;
      this.nodeMap.set(updatedNode.id, updatedNode);
      this.nodesSubject.next([...this.nodes]);
    }
  }

  removeNode(nodeId: number): void {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.nodeMap.delete(nodeId);
    this.nodesSubject.next([...this.nodes]);
  }

  getNode(nodeId: number): Node | undefined {
    return this.nodeMap.get(nodeId);
  }

  getAllNodes(): Node[] {
    return [...this.nodes];
  }

  setFocusedNodeId(nodeId: number | null): void {
    this.focusedNodeIdSubject.next(nodeId);
  }

  getFocusedNodeId(): number | null {
    return this.focusedNodeIdSubject.value;
  }

  addToUndoStack(action: ActionHistory): void {
    this.undoStack.push(action);
    this.undoStackSubject.next([...this.undoStack]);
    // Clear redo stack when new action is performed
    this.redoStack = [];
    this.redoStackSubject.next([]);
  }

  popFromUndoStack(): ActionHistory | undefined {
    const action = this.undoStack.pop();
    if (action) {
      this.undoStackSubject.next([...this.undoStack]);
      // Move to redo stack
      this.redoStack.push(action);
      this.redoStackSubject.next([...this.redoStack]);
    }
    return action;
  }

  popFromRedoStack(): ActionHistory | undefined {
    const action = this.redoStack.pop();
    if (action) {
      this.redoStackSubject.next([...this.redoStack]);
      // Move to undo stack
      this.undoStack.push(action);
      this.undoStackSubject.next([...this.undoStack]);
    }
    return action;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private buildNodeMap(nodes: Node[]): void {
    nodes.forEach(node => {
      this.nodeMap.set(node.id, node);
    });
  }
}

