import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Node } from '../../models/node.model';

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
  @Output() indent = new EventEmitter<void>();
  @Output() outdent = new EventEmitter<void>();
  @Output() moveUp = new EventEmitter<void>();
  @Output() moveDown = new EventEmitter<void>();

  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  isEditing = false;
  editContent = '';

  ngOnInit(): void {
    this.editContent = this.node.content;
    this.isEditing = true; // Make inputs editable by default
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  onFocus(): void {
    this.isEditing = true;
  }

  onBlur(): void {
    this.saveContent();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.saveContent();
      if (this.editContent.trim()) {
        this.createSibling.emit();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.editContent = this.node.content;
      this.isEditing = false;
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        this.outdent.emit();
      } else {
        this.indent.emit();
      }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.editContent.trim() === '') {
        event.preventDefault();
        this.delete.emit();
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'ArrowUp') {
          this.moveUp.emit();
        } else {
          this.moveDown.emit();
        }
      }
    }
  }

  saveContent(): void {
    if (this.editContent !== this.node.content) {
      this.contentChange.emit(this.editContent);
    }
    this.isEditing = false;
  }
}

