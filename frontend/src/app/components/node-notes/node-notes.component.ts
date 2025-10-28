import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Node } from '../../models/node.model';

@Component({
  selector: 'app-node-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notes-panel" *ngIf="node">
      <div class="notes-header">
        <h3>Notes</h3>
        <button class="close-btn" (click)="close()" title="Close (Esc)">×</button>
      </div>
      <div class="notes-content">
        <textarea
          class="notes-input"
          [(ngModel)]="notesText"
          (input)="onNotesChange()"
          placeholder="Add notes for this item..."
          rows="10"
        ></textarea>
      </div>
      <div class="notes-footer">
        <small>Press Esc to close</small>
      </div>
    </div>
  `,
  styles: [`
    .notes-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      max-width: 90vw;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .notes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .notes-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .close-btn:hover {
      background-color: #f0f0f0;
    }

    .notes-content {
      flex: 1;
      padding: 16px;
      overflow: auto;
    }

    .notes-input {
      width: 100%;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      padding: 12px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      outline: none;
    }

    .notes-input:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
    }

    .notes-footer {
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }

    @media (max-width: 768px) {
      .notes-panel {
        width: 100vw;
      }
    }
  `]
})
export class NodeNotesComponent implements OnInit {
  @Input() node: Node | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveNotes = new EventEmitter<string>();

  notesText: string = '';

  ngOnInit(): void {
    if (this.node?.notes) {
      this.notesText = this.node.notes;
    }
  }

  ngOnChanges(): void {
    if (this.node?.notes) {
      this.notesText = this.node.notes;
    }
  }

  onNotesChange(): void {
    this.saveNotes.emit(this.notesText);
  }

  close(): void {
    this.closePanel.emit();
  }
}

