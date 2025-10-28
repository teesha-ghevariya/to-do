import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Node } from '../../models/node.model';
import { SelectionService } from '../../services/selection.service';
import { FormattingService } from '../../services/formatting.service';

@Component({
  selector: 'app-node-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './node-item.component.html',
  styleUrls: ['./node-item.component.css']
})
export class NodeItemComponent implements OnInit, OnDestroy {
  @Input() node!: Node;
  @Input() depth: number = 0;
  @Input() hasChildren: boolean = false;
  @Output() contentChange = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();
  @Output() createSibling = new EventEmitter<void>();
  @Output() createChild = new EventEmitter<void>();
  @Output() duplicate = new EventEmitter<void>();
  @Output() indent = new EventEmitter<void>();
  @Output() outdent = new EventEmitter<void>();
  @Output() moveUp = new EventEmitter<void>();
  @Output() moveDown = new EventEmitter<void>();
  @Output() toggleExpanded = new EventEmitter<void>();
  @Output() toggleCompleted = new EventEmitter<boolean>();
  @Output() zoomIn = new EventEmitter<void>();
  @Output() dragStart = new EventEmitter<Node>();
  @Output() dragEnd = new EventEmitter<void>();
  @Output() dragOver = new EventEmitter<{node: Node, event: DragEvent}>();
  @Output() drop = new EventEmitter<{node: Node, event: DragEvent}>();

  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  isEditing = false;
  editContent = '';
  isExpanded = true;
  isCompleted = false;
  isSelected = false;

  constructor(
    public selectionService: SelectionService,
    private formattingService: FormattingService
  ) {}

  ngOnInit(): void {
    this.editContent = this.node.content;
    this.isEditing = true; // Make inputs editable by default
    this.isCompleted = this.node.isCompleted || false;
    this.isExpanded = this.node.isExpanded !== false; // Default to expanded
    
    // Subscribe to selection changes
    this.selectionService.selectedNodeIds$.subscribe(selectedIds => {
      this.isSelected = selectedIds.has(this.node.id);
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  onFocus(): void {
    this.isEditing = true;
  }

  onDoubleClick(): void {
    if (this.hasChildren) {
      this.zoomIn.emit();
    }
  }

  onBlur(): void {
    this.saveContent();
  }

  onKeyDown(event: KeyboardEvent): void {
    // Enter key - create new sibling
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.saveContent();
      if (this.editContent.trim()) {
        this.createSibling.emit();
      }
    }
    // Shift+Enter - create new child without saving current content
    else if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      this.createChild.emit();
    }
    // Escape - cancel editing
    else if (event.key === 'Escape') {
      event.preventDefault();
      this.editContent = this.node.content;
      this.isEditing = false;
      this.inputElement.nativeElement.blur();
    }
    // Tab - indent
    else if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      this.indent.emit();
    }
    // Shift+Tab - outdent
    else if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      this.outdent.emit();
    }
    // Delete/Backspace on empty content - delete node
    else if ((event.key === 'Delete' || event.key === 'Backspace') && this.editContent.trim() === '') {
      event.preventDefault();
      this.delete.emit();
    }
    // Arrow keys - navigation
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        if (event.key === 'ArrowUp') {
          this.moveUp.emit();
        } else {
          this.moveDown.emit();
        }
      } else {
        // Navigate between nodes
        event.preventDefault();
        this.navigateToSibling(event.key === 'ArrowUp' ? -1 : 1);
      }
    }
    // Home/End - jump to first/last sibling
    else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.jumpToSibling(event.key === 'Home' ? 'first' : 'last');
    }
    // Alt+Up/Down - navigate to parent/first child
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (event.altKey) {
        event.preventDefault();
        if (event.key === 'ArrowUp') {
          this.navigateToParent();
        } else {
          this.navigateToFirstChild();
        }
      }
    }
    // Ctrl/Cmd + B - bold
    else if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      this.toggleBold();
    }
    // Ctrl/Cmd + I - italic
    else if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
      event.preventDefault();
      this.toggleItalic();
    }
    // Ctrl/Cmd + U - underline
    else if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
      event.preventDefault();
      this.toggleUnderline();
    }
    // Ctrl/Cmd + D - duplicate node
    else if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      this.duplicateNode();
    }
    // Ctrl/Cmd + / - toggle completion
    else if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      this.toggleCompletion();
    }
    // Space - toggle completion (if at beginning of line)
    else if (event.key === ' ' && this.inputElement.nativeElement.selectionStart === 0) {
      event.preventDefault();
      this.toggleCompletion();
    }
  }

  saveContent(): void {
    if (this.editContent !== this.node.content) {
      this.contentChange.emit(this.editContent);
    }
    this.isEditing = false;
  }

  toggleCompletion(): void {
    this.isCompleted = !this.isCompleted;
    this.toggleCompleted.emit(this.isCompleted);
  }

  duplicateNode(): void {
    // Emit duplicate event to parent component
    this.duplicate.emit();
  }

  onBulletClick(): void {
    if (this.hasChildren) {
      this.isExpanded = !this.isExpanded;
      this.toggleExpanded.emit();
    }
  }

  extractTags(content: string): string[] {
    const tagRegex = /#[\w-]+/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  getDisplayContent(): string {
    // Remove tags from display content
    return this.editContent.replace(/#[\w-]+/g, '').trim();
  }

  onDragStart(event: DragEvent): void {
    event.dataTransfer!.setData('text/plain', this.node.id.toString());
    event.dataTransfer!.effectAllowed = 'move';
    this.dragStart.emit(this.node);
  }

  onDragEnd(event: DragEvent): void {
    this.dragEnd.emit();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOver.emit({node: this.node, event});
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.drop.emit({node: this.node, event});
  }

  // Navigation methods
  navigateToSibling(direction: number): void {
    // This would need to be implemented with parent component coordination
    // For now, emit an event
    if (direction === -1) {
      this.moveUp.emit();
    } else {
      this.moveDown.emit();
    }
  }

  jumpToSibling(position: 'first' | 'last'): void {
    // This would need to be implemented with parent component coordination
  }

  navigateToParent(): void {
    // This would navigate to the parent node
  }

  navigateToFirstChild(): void {
    // This would navigate to the first child node
  }

  // Formatting methods
  toggleBold(): void {
    const input = this.inputElement.nativeElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    this.editContent = this.formattingService.toggleBold(this.editContent, start, end);
    this.contentChange.emit(this.editContent);
    
    // Restore selection
    setTimeout(() => {
      input.setSelectionRange(start + 2, end + 2);
    });
  }

  toggleItalic(): void {
    const input = this.inputElement.nativeElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    this.editContent = this.formattingService.toggleItalic(this.editContent, start, end);
    this.contentChange.emit(this.editContent);
    
    // Restore selection
    setTimeout(() => {
      input.setSelectionRange(start + 1, end + 1);
    });
  }

  toggleUnderline(): void {
    const input = this.inputElement.nativeElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    this.editContent = this.formattingService.toggleUnderline(this.editContent, start, end);
    this.contentChange.emit(this.editContent);
    
    // Restore selection
    setTimeout(() => {
      input.setSelectionRange(start + 2, end + 2);
    });
  }
}

