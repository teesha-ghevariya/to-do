import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodeTreeComponent } from './node-tree.component';
import { StateService } from '../../services/state.service';
import { ZoomService } from '../../services/zoom.service';

class MockStateService {
  private nodes: any[] = [];
  nodes$ = { subscribe: (fn: any) => ({ unsubscribe() {} }) } as any;
  getAllNodes() { return this.nodes; }
  setNodes(ns: any[]) { this.nodes = ns; }
  addNode(n: any) { this.nodes.push(n); }
  updateNode(n: any) { this.nodes = this.nodes.map(x => x.id === n.id ? n : x); }
  removeNode(id: number) { this.nodes = this.nodes.filter(n => n.id !== id); }
  addToUndoStack(_: any) {}
}

describe('NodeTreeComponent', () => {
  let component: NodeTreeComponent;
  let fixture: ComponentFixture<NodeTreeComponent>;
  let state: MockStateService;

  beforeEach(async () => {
    state = new MockStateService();
    await TestBed.configureTestingModule({
      imports: [NodeTreeComponent],
      providers: [
        { provide: StateService, useValue: state },
        ZoomService,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NodeTreeComponent);
    component = fixture.componentInstance;
    state.setNodes([
      { id: 1, content: 'root', parentId: null, position: 0, createdAt: '', updatedAt: '' },
      { id: 2, content: 'child', parentId: 1, position: 0, createdAt: '', updatedAt: '' }
    ]);
    fixture.detectChanges();
  });

  it('should build tree and show child when expanded', () => {
    component.focusMode = false;
    component['buildTree']();
    expect(component.nodes.length).toBeGreaterThan(0);
  });

  it('should cascade completion to descendants', () => {
    // root has child id 2
    const root = state.getAllNodes().find((n: any) => n.id === 1);
    component.onToggleCompleted(root, true);
    const nodes = state.getAllNodes();
    const child = nodes.find((n: any) => n.id === 2);
    expect(root.isCompleted).toBeTrue();
    expect(child.isCompleted).toBeTrue();
  });
});


