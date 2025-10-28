import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Node, SearchResult } from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  private searchResultsSubject = new BehaviorSubject<SearchResult[]>([]);
  private isSearchingSubject = new BehaviorSubject<boolean>(false);

  searchQuery$ = this.searchQuerySubject.asObservable();
  searchResults$ = this.searchResultsSubject.asObservable();
  isSearching$ = this.isSearchingSubject.asObservable();

  constructor() {}

  search(query: string, nodes: Node[]): void {
    this.searchQuerySubject.next(query);
    
    if (!query.trim()) {
      this.searchResultsSubject.next([]);
      this.isSearchingSubject.next(false);
      return;
    }

    this.isSearchingSubject.next(true);
    const results = this.performSearch(query.toLowerCase(), nodes);
    this.searchResultsSubject.next(results);
  }

  private performSearch(query: string, nodes: Node[]): SearchResult[] {
    const results: SearchResult[] = [];
    
    for (const node of nodes) {
      const content = node.content.toLowerCase();
      const tags = node.tags?.join(' ').toLowerCase() || '';
      const notes = node.notes?.toLowerCase() || '';
      
      const searchText = `${content} ${tags} ${notes}`;
      
      if (searchText.includes(query)) {
        const matches: string[] = [];
        
        // Find matches in content
        if (content.includes(query)) {
          matches.push('content');
        }
        
        // Find matches in tags
        if (tags.includes(query)) {
          matches.push('tags');
        }
        
        // Find matches in notes
        if (notes.includes(query)) {
          matches.push('notes');
        }
        
        // Extract context around the match
        const context = this.extractContext(node.content, query);
        
        results.push({
          node,
          matches,
          context
        });
      }
    }
    
    return results;
  }

  private extractContext(content: string, query: string): string {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return content;
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);
    
    let context = content.substring(start, end);
    
    if (start > 0) {
      context = '...' + context;
    }
    
    if (end < content.length) {
      context = context + '...';
    }
    
    return context;
  }

  clearSearch(): void {
    this.searchQuerySubject.next('');
    this.searchResultsSubject.next([]);
    this.isSearchingSubject.next(false);
  }

  getCurrentQuery(): string {
    return this.searchQuerySubject.value;
  }

  getCurrentResults(): SearchResult[] {
    return this.searchResultsSubject.value;
  }

  isCurrentlySearching(): boolean {
    return this.isSearchingSubject.value;
  }
}
