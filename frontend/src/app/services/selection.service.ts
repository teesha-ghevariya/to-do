import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Node } from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  private selectedNodeIdsSubject = new BehaviorSubject<Set<number>>(new Set());
  private lastSelectedNodeIdSubject = new BehaviorSubject<number | null>(null);
  private selectionModeSubject = new BehaviorSubject<'single' | 'multi' | 'range'>('single');

  selectedNodeIds$ = this.selectedNodeIdsSubject.asObservable();
  lastSelectedNodeId$ = this.lastSelectedNodeIdSubject.asObservable();
  selectionMode$ = this.selectionModeSubject.asObservable();

  selectNode(nodeId: number, event?: MouseEvent): void {
    const currentSelection = new Set(this.selectedNodeIdsSubject.value);
    const lastSelected = this.lastSelectedNodeIdSubject.value;

    if (event?.shiftKey && lastSelected !== null) {
      // Range selection
      this.selectRange(lastSelected, nodeId);
      return;
    }

    if (event?.ctrlKey || event?.metaKey) {
      // Toggle selection
      if (currentSelection.has(nodeId)) {
        currentSelection.delete(nodeId);
      } else {
        currentSelection.add(nodeId);
        this.lastSelectedNodeIdSubject.next(nodeId);
      }
      this.selectionModeSubject.next('multi');
    } else {
      // Single selection
      currentSelection.clear();
      currentSelection.add(nodeId);
      this.lastSelectedNodeIdSubject.next(nodeId);
      this.selectionModeSubject.next('single');
    }

    this.selectedNodeIdsSubject.next(currentSelection);
  }

  private selectRange(startId: number, endId: number): void {
    // Find all nodes between start and end
    const selected = new Set<number>();
    selected.add(startId);
    selected.add(endId);

    // This would require access to all nodes to find intermediate nodes
    // For now, we'll store the range and let the component handle it
    this.selectionModeSubject.next('range');
    this.lastSelectedNodeIdSubject.next(endId);
    this.selectedNodeIdsSubject.next(selected);
  }

  selectAll(nodeIds: number[]): void {
    const allSelected = new Set(nodeIds);
    this.selectedNodeIdsSubject.next(allSelected);
    this.selectionModeSubject.next('multi');
  }

  clearSelection(): void {
    this.selectedNodeIdsSubject.next(new Set());
    this.lastSelectedNodeIdSubject.next(null);
    this.selectionModeSubject.next('single');
  }

  isSelected(nodeId: number): boolean {
    return this.selectedNodeIdsSubject.value.has(nodeId);
  }

  getSelectedNodeIds(): number[] {
    return Array.from(this.selectedNodeIdsSubject.value);
  }

  getSelectedCount(): number {
    return this.selectedNodeIdsSubject.value.size;
  }

  selectNext(nodeIds: number[]): number | null {
    const selected = this.lastSelectedNodeIdSubject.value;
    if (selected === null) return null;
    
    const index = nodeIds.indexOf(selected);
    if (index === -1 || index === nodeIds.length - 1) return null;
    
    return nodeIds[index + 1];
  }

  selectPrevious(nodeIds: number[]): number | null {
    const selected = this.lastSelectedNodeIdSubject.value;
    if (selected === null) return null;
    
    const index = nodeIds.indexOf(selected);
    if (index <= 0) return null;
    
    return nodeIds[index - 1];
  }
}

