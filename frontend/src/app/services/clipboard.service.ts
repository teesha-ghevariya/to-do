import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Node } from '../models/node.model';

export interface ClipboardData {
  type: 'copy' | 'cut';
  nodes: Node[];
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private clipboardDataSubject = new BehaviorSubject<ClipboardData | null>(null);
  
  clipboardData$ = this.clipboardDataSubject.asObservable();

  copyNodes(nodes: Node[]): void {
    const clipboardData: ClipboardData = {
      type: 'copy',
      nodes: this.deepCopyNodes(nodes),
      timestamp: Date.now()
    };
    this.clipboardDataSubject.next(clipboardData);
  }

  cutNodes(nodes: Node[]): void {
    const clipboardData: ClipboardData = {
      type: 'cut',
      nodes: this.deepCopyNodes(nodes),
      timestamp: Date.now()
    };
    this.clipboardDataSubject.next(clipboardData);
  }

  pasteNodes(targetParentId: number | null, targetPosition: number): Node[] {
    const clipboardData = this.clipboardDataSubject.value;
    if (!clipboardData) return [];

    const pastedNodes: Node[] = [];

    clipboardData.nodes.forEach((node, index) => {
      const newNode: Node = {
        ...node,
        id: Date.now() + index, // Temporary ID until backend returns real ID
        parentId: targetParentId,
        position: targetPosition + index,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      pastedNodes.push(newNode);
    });

    return pastedNodes;
  }

  getClipboardData(): ClipboardData | null {
    return this.clipboardDataSubject.value;
  }

  clear(): void {
    this.clipboardDataSubject.next(null);
  }

  hasData(): boolean {
    return this.clipboardDataSubject.value !== null;
  }

  private deepCopyNodes(nodes: Node[]): Node[] {
    return nodes.map(node => ({
      ...node,
      tags: node.tags ? [...node.tags] : undefined
    }));
  }

  // Helper to collect all descendants of a node
  collectNodeWithDescendants(node: Node, allNodes: Node[]): Node[] {
    const result: Node[] = [node];
    const children = allNodes.filter(n => n.parentId === node.id);
    
    children.forEach(child => {
      result.push(...this.collectNodeWithDescendants(child, allNodes));
    });
    
    return result;
  }
}

