import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResult } from '../../models/node.model';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="search-results" *ngIf="results.length > 0">
      <div class="search-results-header">
        <h3>Search Results ({{ results.length }})</h3>
        <button class="btn btn-secondary" (click)="clearSearch.emit()">Clear</button>
      </div>
      
      <div class="results-list">
        <div 
          *ngFor="let result of results; trackBy: trackByNode" 
          class="search-result-item"
          (click)="selectNode(result.node)"
        >
          <div class="result-content">
            <div class="result-text" [innerHTML]="highlightText(result.context, searchQuery)"></div>
            <div class="result-meta">
              <span class="result-matches" *ngIf="result.matches.length > 0">
                Found in: {{ result.matches.join(', ') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="no-results" *ngIf="searchQuery && results.length === 0">
      <p>No results found for "{{ searchQuery }}"</p>
    </div>
  `,
  styles: [`
    .search-results {
      background-color: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin: 16px 0;
      overflow: hidden;
    }
    
    .search-results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background-color: #ffffff;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .search-results-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #333333;
    }
    
    .results-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .search-result-item {
      padding: 12px 20px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    
    .search-result-item:hover {
      background-color: rgba(0, 123, 255, 0.05);
    }
    
    .search-result-item:last-child {
      border-bottom: none;
    }
    
    .result-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .result-text {
      font-size: 14px;
      line-height: 1.4;
      color: #333333;
    }
    
    .result-meta {
      font-size: 12px;
      color: #666666;
    }
    
    .result-matches {
      font-style: italic;
    }
    
    .no-results {
      text-align: center;
      padding: 40px 20px;
      color: #666666;
    }
    
    .highlight {
      background-color: #fff3cd;
      padding: 1px 2px;
      border-radius: 2px;
      font-weight: 500;
    }
  `]
})
export class SearchResultsComponent {
  @Input() results: SearchResult[] = [];
  @Input() searchQuery: string = '';
  @Output() nodeSelected = new EventEmitter<any>();
  @Output() clearSearch = new EventEmitter<void>();

  trackByNode(index: number, result: SearchResult): number {
    return result.node.id;
  }

  selectNode(node: any): void {
    this.nodeSelected.emit(node);
  }

  highlightText(text: string, query: string): string {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }
}
