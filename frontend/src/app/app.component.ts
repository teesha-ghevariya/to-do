import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NodeTreeComponent } from './components/node-tree/node-tree.component';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { NodeNotesComponent } from './components/node-notes/node-notes.component';
import { StateService } from './services/state.service';
import { NodeService } from './services/node.service';
import { SearchService } from './services/search.service';
import { ZoomService } from './services/zoom.service';
import { ExportImportService } from './services/export-import.service';
import { SyncService } from './services/sync.service';
import { SelectionService } from './services/selection.service';
import { ClipboardService } from './services/clipboard.service';
import { FormattingService } from './services/formatting.service';
import { ViewSettingsService } from './services/view-settings.service';
import { TagService } from './services/tag.service';
import { ActionHistory, SearchResult, Node } from './models/node.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, NodeTreeComponent, SearchResultsComponent, NodeNotesComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'NodeFlow';
  isEmpty = true;
  showSearch = false;
  searchQuery = '';
  showShortcuts = false;
  searchResults: SearchResult[] = [];
  breadcrumbPath: string[] = [];
  isZoomed = false;
  showExportMenu = false;
  showNotes = false;
  notesNode: Node | null = null;
  syncStatus: 'idle' | 'syncing' | 'error' = 'idle';
  pendingCount = 0;

  constructor(
    private stateService: StateService,
    private nodeService: NodeService,
    private searchService: SearchService,
    private zoomService: ZoomService,
    private exportImportService: ExportImportService,
    private syncService: SyncService,
    private selectionService: SelectionService,
    private clipboardService: ClipboardService,
    private formattingService: FormattingService,
    private viewSettingsService: ViewSettingsService,
    private tagService: TagService
  ) {
    // Handle global keyboard shortcuts
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Undo/Redo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo();
      } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        this.redo();
      }
      // Search
      else if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        this.toggleSearch();
      }
      // Advanced search
      else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        this.toggleAdvancedSearch();
      }
      // Copy/Cut/Paste
      else if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        this.copySelected();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
        event.preventDefault();
        this.cutSelected();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        this.pasteNodes();
      }
      // Select all
      else if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        this.selectAll();
      }
      // Font size
      else if ((event.ctrlKey || event.metaKey) && event.key === '=') {
        event.preventDefault();
        this.viewSettingsService.increaseFontSize();
      } else if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        this.viewSettingsService.decreaseFontSize();
      }
      // Notes
      else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '9') {
        event.preventDefault();
        this.toggleNotes();
      }
      // Star
      else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '8') {
        event.preventDefault();
        this.toggleStar();
      }
      // Sort
      else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        this.sortChildren();
      }
      // Help
      else if ((event.ctrlKey || event.metaKey) && event.key === '?') {
        event.preventDefault();
        this.showShortcuts = !this.showShortcuts;
      }
      // Escape
      else if (event.key === 'Escape') {
        this.handleEscape();
      }
    });
    
    // Listen for state changes to check if empty
    this.stateService.nodes$.subscribe(nodes => {
      this.isEmpty = nodes.length === 0;
      this.tagService.updateTagCounts(nodes);
    });
    
    // Listen for search results
    this.searchService.searchResults$.subscribe(results => {
      this.searchResults = results;
    });
    
    // Listen for zoom changes
    this.zoomService.zoomStack$.subscribe(stack => {
      this.breadcrumbPath = this.zoomService.getBreadcrumbPath();
      this.isZoomed = stack.length > 0;
    });

    // Listen for sync status
    this.syncService.syncStatus$.subscribe(status => {
      this.syncStatus = status;
    });

    this.syncService.pendingCount$.subscribe(count => {
      this.pendingCount = count;
    });
  }

  ngOnInit(): void {
    // Load all nodes from backend (root nodes and their children)
    this.loadAllNodes();
  }

  private loadAllNodes(): void {
    this.nodeService.getRootNodes().subscribe(rootNodes => {
      if (rootNodes.length === 0) {
        this.stateService.setNodes([]);
        this.isEmpty = true;
        return;
      }

      // Load all nodes including children recursively
      this.loadNodesRecursively(rootNodes).then(allNodes => {
        this.stateService.setNodes(allNodes);
        this.isEmpty = allNodes.length === 0;
      });
    });
  }

  private async loadNodesRecursively(nodes: Node[]): Promise<Node[]> {
    const allNodes: Node[] = [...nodes];
    
    for (const node of nodes) {
      try {
        const children = await firstValueFrom(this.nodeService.getChildren(node.id));
        if (children && children.length > 0) {
          const childNodes = await this.loadNodesRecursively(children);
          allNodes.push(...childNodes);
        }
      } catch (error) {
        console.error(`Failed to load children for node ${node.id}:`, error);
      }
    }
    
    return allNodes;
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

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchService.search(this.searchQuery, this.stateService.getAllNodes());
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.showSearch = false;
    this.searchService.clearSearch();
  }


  onNodeSelected(node: Node): void {
    this.zoomService.zoomIn(node);
  }

  zoomOut(): void {
    this.zoomService.zoomOut();
  }

  zoomToRoot(): void {
    this.zoomService.zoomToRoot();
  }

  onBreadcrumbClick(index: number): void {
    // Zoom out to the clicked level
    const stack = this.zoomService.getZoomStack();
    if (index === -1) {
      this.zoomToRoot();
    } else {
      const targetNode = stack[index];
      // Zoom out to the target level
      while (this.zoomService.getCurrentZoomNode() !== targetNode) {
        this.zoomService.zoomOut();
      }
    }
  }

  undo(): void {
    const action = this.stateService.popFromUndoStack();
    if (!action) return;

    switch (action.type) {
      case 'create':
        this.stateService.removeNode(action.node.id);
        this.nodeService.deleteNode(action.node.id).subscribe({
          error: (error) => {
            console.error('Failed to undo create:', error);
            // Revert state change on error
            this.stateService.addNode(action.node);
          }
        });
        break;
      case 'delete':
        this.stateService.addNode(action.node);
        this.nodeService.createNode(action.node).subscribe({
          next: (createdNode) => {
            // Update state with real ID from backend
            this.stateService.removeNode(action.node.id);
            this.stateService.addNode(createdNode);
          },
          error: (error) => {
            console.error('Failed to undo delete:', error);
            // Revert state change on error
            this.stateService.removeNode(action.node.id);
          }
        });
        break;
      case 'update':
        if (action.previousState?.content) {
          const updatedNode = { ...action.node, content: action.previousState.content };
          this.stateService.updateNode(updatedNode);
          this.nodeService.updateNode(action.node.id, updatedNode).subscribe({
            error: (error) => {
              console.error('Failed to undo update:', error);
              // Revert state change on error
              this.stateService.updateNode(action.node);
            }
          });
        }
        break;
      case 'move':
        if (action.previousParentId !== undefined && action.previousPosition !== undefined) {
          const updatedNode = { 
            ...action.node, 
            parentId: action.previousParentId, 
            position: action.previousPosition 
          };
          this.stateService.updateNode(updatedNode);
          this.nodeService.moveNode(action.node.id, action.previousParentId, action.previousPosition).subscribe({
            error: (error) => {
              console.error('Failed to undo move:', error);
              // Revert state change on error
              this.stateService.updateNode(action.node);
            }
          });
        }
        break;
    }
  }

  redo(): void {
    const action = this.stateService.popFromRedoStack();
    if (!action) return;

    switch (action.type) {
      case 'create':
        this.stateService.addNode(action.node);
        this.nodeService.createNode(action.node).subscribe({
          next: (createdNode) => {
            // Update state with real ID from backend
            this.stateService.removeNode(action.node.id);
            this.stateService.addNode(createdNode);
          },
          error: (error) => {
            console.error('Failed to redo create:', error);
            // Revert state change on error
            this.stateService.removeNode(action.node.id);
          }
        });
        break;
      case 'delete':
        this.stateService.removeNode(action.node.id);
        this.nodeService.deleteNode(action.node.id).subscribe({
          error: (error) => {
            console.error('Failed to redo delete:', error);
            // Revert state change on error
            this.stateService.addNode(action.node);
          }
        });
        break;
      case 'update':
        this.stateService.updateNode(action.node);
        this.nodeService.updateNode(action.node.id, action.node).subscribe({
          error: (error) => {
            console.error('Failed to redo update:', error);
            // Revert state change on error
            if (action.previousState?.content) {
              const revertedNode = { ...action.node, content: action.previousState.content };
              this.stateService.updateNode(revertedNode);
            }
          }
        });
        break;
      case 'move':
        this.stateService.updateNode(action.node);
        this.nodeService.moveNode(action.node.id, action.node.parentId, action.node.position).subscribe({
          error: (error) => {
            console.error('Failed to redo move:', error);
            // Revert state change on error
            if (action.previousParentId !== undefined && action.previousPosition !== undefined) {
              const revertedNode = { 
                ...action.node, 
                parentId: action.previousParentId, 
                position: action.previousPosition 
              };
              this.stateService.updateNode(revertedNode);
            }
          }
        });
        break;
    }
  }

  handleEscape(): void {
    if (this.showNotes) {
      this.showNotes = false;
      this.notesNode = null;
    } else if (this.isZoomed) {
      this.zoomService.zoomOut();
    } else if (this.showSearch) {
      this.showSearch = false;
      this.searchQuery = '';
      this.searchService.clearSearch();
    } else if (this.showShortcuts) {
      this.showShortcuts = false;
    }
  }

  copySelected(): void {
    const selectedIds = this.selectionService.getSelectedNodeIds();
    if (selectedIds.length === 0) return;

    const selectedNodes = selectedIds.map(id => this.stateService.getNode(id)).filter(Boolean) as Node[];
    this.clipboardService.copyNodes(selectedNodes);
  }

  cutSelected(): void {
    const selectedIds = this.selectionService.getSelectedNodeIds();
    if (selectedIds.length === 0) return;

    const selectedNodes = selectedIds.map(id => this.stateService.getNode(id)).filter(Boolean) as Node[];
    this.clipboardService.cutNodes(selectedNodes);
    
    // Remove from state
    selectedNodes.forEach(node => {
      this.stateService.removeNode(node.id);
      
      // Delete from backend
      this.nodeService.deleteNode(node.id).subscribe({
        error: (error) => {
          console.error('Failed to cut node:', error);
          // Revert state change on error
          this.stateService.addNode(node);
        }
      });
    });
  }

  pasteNodes(): void {
    const clipboardData = this.clipboardService.getClipboardData();
    if (!clipboardData) return;

    // Find insertion point (for now, paste at root)
    const pastedNodes = this.clipboardService.pasteNodes(null, 0);
    
    pastedNodes.forEach(node => {
      this.stateService.addNode(node);
      this.nodeService.createNode(node).subscribe({
        next: (createdNode) => {
          // Update state with real ID from backend
          this.stateService.removeNode(node.id);
          this.stateService.addNode(createdNode);
        },
        error: (error) => {
          console.error('Failed to paste node:', error);
          // Revert state change on error
          this.stateService.removeNode(node.id);
        }
      });
    });
  }

  selectAll(): void {
    const allNodes = this.stateService.getAllNodes();
    const nodeIds = allNodes.map(node => node.id);
    this.selectionService.selectAll(nodeIds);
  }

  toggleNotes(): void {
    const selectedIds = this.selectionService.getSelectedNodeIds();
    if (selectedIds.length === 1) {
      const node = this.stateService.getNode(selectedIds[0]);
      if (node) {
        this.notesNode = node;
        this.showNotes = true;
      }
    }
  }

  toggleStar(): void {
    const selectedIds = this.selectionService.getSelectedNodeIds();
    selectedIds.forEach(id => {
      const node = this.stateService.getNode(id);
      if (node) {
        const updatedNode = { ...node, isStarred: !node.isStarred };
        this.stateService.updateNode(updatedNode);
        this.nodeService.updateNode(node.id, updatedNode).subscribe({
          error: (error) => {
            console.error('Failed to toggle star:', error);
            // Revert state change on error
            this.stateService.updateNode(node);
          }
        });
      }
    });
  }

  sortChildren(): void {
    // This would sort children alphabetically
    // Implementation depends on current context
  }

  toggleAdvancedSearch(): void {
    // This would show advanced search panel
    // Implementation depends on UI requirements
  }


  onNotesSave(notes: string): void {
    if (this.notesNode) {
      const updatedNode = { ...this.notesNode, notes };
      this.stateService.updateNode(updatedNode);
      this.nodeService.updateNode(this.notesNode.id, updatedNode).subscribe({
        error: (error) => {
          console.error('Failed to save notes:', error);
          // Revert state change on error
          this.stateService.updateNode(this.notesNode!);
        }
      });
    }
  }

  onNotesClose(): void {
    this.showNotes = false;
    this.notesNode = null;
  }


  // Export/Import Methods
  exportToJSON(): void {
    const nodes = this.stateService.getAllNodes();
    const jsonContent = this.exportImportService.exportToJSON(nodes);
    const filename = `nodeflow-export-${new Date().toISOString().split('T')[0]}.json`;
    this.exportImportService.downloadFile(jsonContent, filename, 'application/json');
  }

  exportToMarkdown(): void {
    const nodes = this.stateService.getAllNodes();
    const markdownContent = this.exportImportService.exportToMarkdown(nodes);
    const filename = `nodeflow-export-${new Date().toISOString().split('T')[0]}.md`;
    this.exportImportService.downloadFile(markdownContent, filename, 'text/markdown');
  }

  exportToText(): void {
    const nodes = this.stateService.getAllNodes();
    const textContent = this.exportImportService.exportToText(nodes);
    const filename = `nodeflow-export-${new Date().toISOString().split('T')[0]}.txt`;
    this.exportImportService.downloadFile(textContent, filename, 'text/plain');
  }

  importFromFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let nodes: Node[] = [];

        if (file.name.endsWith('.json')) {
          nodes = this.exportImportService.importFromJSON(content);
        } else if (file.name.endsWith('.md')) {
          nodes = this.exportImportService.importFromMarkdown(content);
        } else if (file.name.endsWith('.txt')) {
          nodes = this.exportImportService.importFromText(content);
        } else {
          throw new Error('Unsupported file format');
        }

        // Clear current data and import new data
        this.stateService.setNodes(nodes);
        this.zoomService.zoomToRoot();
        
        alert(`Successfully imported ${nodes.length} items`);
      } catch (error) {
        alert(`Import failed: ${error}`);
      }
    };
    
    reader.readAsText(file);
    input.value = ''; // Reset input
  }
}
