import { TestBed } from '@angular/core/testing';
import { StateService } from './state.service';
import { Node, ActionHistory } from '../models/node.model';

describe('StateService', () => {
  let service: StateService;
  let testNode: Node;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateService);
    
    testNode = {
      id: 1,
      content: 'Test Node',
      parentId: null,
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false,
      isExpanded: true,
      isStarred: false,
      tags: [],
      notes: ''
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get nodes', () => {
    const nodes = [testNode];
    service.setNodes(nodes);
    
    service.nodes$.subscribe(result => {
      expect(result).toEqual(nodes);
    });
    
    expect(service.getAllNodes()).toEqual(nodes);
  });

  it('should add node', () => {
    service.addNode(testNode);
    
    service.nodes$.subscribe(result => {
      expect(result).toContain(testNode);
    });
    
    expect(service.getNode(testNode.id)).toEqual(testNode);
  });

  it('should update node', () => {
    service.addNode(testNode);
    const updatedNode = { ...testNode, content: 'Updated Content' };
    
    service.updateNode(updatedNode);
    
    service.nodes$.subscribe(result => {
      const found = result.find(n => n.id === testNode.id);
      expect(found?.content).toBe('Updated Content');
    });
  });

  it('should remove node', () => {
    service.addNode(testNode);
    service.removeNode(testNode.id);
    
    service.nodes$.subscribe(result => {
      expect(result).not.toContain(testNode);
    });
    
    expect(service.getNode(testNode.id)).toBeUndefined();
  });

  it('should manage undo/redo stack', () => {
    const action: ActionHistory = {
      type: 'create',
      node: testNode
    };
    
    service.addToUndoStack(action);
    expect(service.canUndo()).toBe(true);
    expect(service.canRedo()).toBe(false);
    
    const popped = service.popFromUndoStack();
    expect(popped).toEqual(action);
    expect(service.canUndo()).toBe(false);
    expect(service.canRedo()).toBe(true);
    
    const redone = service.popFromRedoStack();
    expect(redone).toEqual(action);
    expect(service.canUndo()).toBe(true);
    expect(service.canRedo()).toBe(false);
  });

  it('should manage focused node', () => {
    service.setFocusedNodeId(testNode.id);
    
    service.focusedNodeId$.subscribe(id => {
      expect(id).toBe(testNode.id);
    });
    
    expect(service.getFocusedNodeId()).toBe(testNode.id);
  });
});
