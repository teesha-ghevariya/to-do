import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { NodeTreeComponent } from './components/node-tree/node-tree.component';
import { StateService } from './services/state.service';
import { NodeService } from './services/node.service';
import { ActionHistory } from './models/node.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MatButtonModule, NodeTreeComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'To-Do App';
  isEmpty = true;

  constructor(
    private stateService: StateService,
    private nodeService: NodeService
  ) {
    // Handle global undo (Ctrl+Z)
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        this.undo();
      }
    });
    
    // Listen for state changes to check if empty
    this.stateService.nodes$.subscribe(nodes => {
      this.isEmpty = nodes.length === 0;
    });
  }

  ngOnInit(): void {
    this.nodeService.getRootNodes().subscribe(nodes => {
      this.isEmpty = nodes.length === 0;
    });
  }

  createFirstNode(): void {
    this.nodeService.createNode({
      content: '',
      parentId: null,
      position: 0
    }).subscribe(newNode => {
      this.stateService.addNode(newNode);
      this.isEmpty = false;
    });
  }

  undo(): void {
    const action = this.stateService.popFromUndoStack();
    if (!action) return;

    switch (action.type) {
      case 'create':
        // Delete the created node
        this.nodeService.deleteNode(action.node.id).subscribe();
        break;
      case 'delete':
        // Recreate the deleted node with its previous state
        this.nodeService.createNode({
          content: action.node.content,
          parentId: action.node.parentId,
          position: action.node.position
        }).subscribe();
        break;
      case 'update':
        // Restore previous content
        if (action.previousState?.content) {
          this.nodeService.updateNode(action.node.id, { content: action.previousState.content }).subscribe();
        }
        break;
      case 'move':
        // Move back to previous position
        if (action.previousParentId !== undefined && action.previousPosition !== undefined) {
          this.nodeService.moveNode(
            action.node.id,
            action.previousParentId,
            action.previousPosition
          ).subscribe();
        }
        break;
    }
  }
}
