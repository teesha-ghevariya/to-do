import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Node } from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {
  private zoomStackSubject = new BehaviorSubject<Node[]>([]);
  private currentZoomNodeSubject = new BehaviorSubject<Node | null>(null);

  zoomStack$ = this.zoomStackSubject.asObservable();
  currentZoomNode$ = this.currentZoomNodeSubject.asObservable();

  constructor() {}

  zoomIn(node: Node): void {
    const currentStack = this.zoomStackSubject.value;
    const newStack = [...currentStack, node];
    this.zoomStackSubject.next(newStack);
    this.currentZoomNodeSubject.next(node);
  }

  zoomOut(): void {
    const currentStack = this.zoomStackSubject.value;
    if (currentStack.length > 0) {
      const newStack = currentStack.slice(0, -1);
      this.zoomStackSubject.next(newStack);
      const newCurrentNode = newStack.length > 0 ? newStack[newStack.length - 1] : null;
      this.currentZoomNodeSubject.next(newCurrentNode);
    }
  }

  zoomToRoot(): void {
    this.zoomStackSubject.next([]);
    this.currentZoomNodeSubject.next(null);
  }

  getCurrentZoomNode(): Node | null {
    return this.currentZoomNodeSubject.value;
  }

  getZoomStack(): Node[] {
    return this.zoomStackSubject.value;
  }

  isZoomed(): boolean {
    return this.zoomStackSubject.value.length > 0;
  }

  getBreadcrumbPath(): string[] {
    return this.zoomStackSubject.value.map(node => node.content || 'Untitled');
  }
}
