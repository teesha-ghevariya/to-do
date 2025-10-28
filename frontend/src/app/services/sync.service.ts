import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Node } from '../models/node.model';
import { NodeService } from './node.service';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'toggle-complete' | 'toggle-expand' | 'toggle-star' | 'update-notes';
  node: Node;
  previousState?: Partial<Node>;
  timestamp: number;
  status: 'pending' | 'processing' | 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private operationQueue: SyncOperation[] = [];
  private isProcessing = false;
  private syncStatusSubject = new BehaviorSubject<'idle' | 'syncing' | 'error'>('idle');
  private pendingCountSubject = new BehaviorSubject<number>(0);

  syncStatus$: Observable<'idle' | 'syncing' | 'error'> = this.syncStatusSubject.asObservable();
  pendingCount$: Observable<number> = this.pendingCountSubject.asObservable();

  constructor(private nodeService: NodeService) {}

  queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status'>): void {
    const syncOperation: SyncOperation = {
      ...operation,
      id: `${operation.type}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.operationQueue.push(syncOperation);
    this.pendingCountSubject.next(this.operationQueue.length);
    
    // Trigger sync if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.syncStatusSubject.next('syncing');

    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift();
      if (!operation) continue;

      operation.status = 'processing';
      this.pendingCountSubject.next(this.operationQueue.length);

      try {
        await this.executeOperation(operation);
        operation.status = 'success';
      } catch (error) {
        console.error('Sync operation failed:', operation, error);
        operation.status = 'error';
        // Re-queue failed operations
        this.operationQueue.push(operation);
        this.syncStatusSubject.next('error');
      }
    }

    this.isProcessing = false;
    this.syncStatusSubject.next(this.operationQueue.length > 0 ? 'error' : 'idle');
    this.pendingCountSubject.next(this.operationQueue.length);
  }

  private async executeOperation(operation: SyncOperation): Promise<void> {
    // Skip operations on temporary IDs (they start with current timestamp)
    const currentTime = Date.now();
    const tempIdThreshold = currentTime - 60000; // 1 minute ago
    
    if (operation.node.id > tempIdThreshold) {
      console.log('Skipping operation on temporary node:', operation.node.id);
      return;
    }

    switch (operation.type) {
      case 'create':
        await this.nodeService.createNode(operation.node).toPromise();
        break;
      case 'update':
        await this.nodeService.updateNode(operation.node.id, operation.node).toPromise();
        break;
      case 'delete':
        await this.nodeService.deleteNode(operation.node.id).toPromise();
        break;
      case 'move':
        await this.nodeService.moveNode(
          operation.node.id,
          operation.node.parentId,
          operation.node.position
        ).toPromise();
        break;
      case 'toggle-complete':
        // This would call a specific endpoint for toggle operations
        break;
      case 'toggle-expand':
        // This would call a specific endpoint for toggle operations
        break;
      case 'toggle-star':
        // This would call a specific endpoint for toggle operations
        break;
      case 'update-notes':
        // This would call a specific endpoint for notes update
        break;
    }
  }

  async syncNow(): Promise<void> {
    await this.processQueue();
  }

  getPendingCount(): number {
    return this.operationQueue.length;
  }

  clearErrorQueue(): void {
    this.operationQueue = this.operationQueue.filter(op => op.status !== 'error');
    this.pendingCountSubject.next(this.operationQueue.length);
    if (!this.isProcessing && this.operationQueue.length > 0) {
      this.processQueue();
    }
  }
}

