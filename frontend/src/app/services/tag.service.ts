import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Node } from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private allTagsSubject = new BehaviorSubject<Map<string, number>>(new Map());
  
  allTags$ = this.allTagsSubject.asObservable();

  extractTags(content: string): string[] {
    const tagRegex = /#[\w-]+/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  updateTagCounts(nodes: Node[]): void {
    const tagCounts = new Map<string, number>();
    
    nodes.forEach(node => {
      if (node.tags && node.tags.length > 0) {
        node.tags.forEach(tag => {
          const count = tagCounts.get(tag) || 0;
          tagCounts.set(tag, count + 1);
        });
      }
    });
    
    this.allTagsSubject.next(tagCounts);
  }

  getAllTags(): string[] {
    return Array.from(this.allTagsSubject.value.keys());
  }

  getTagCount(tag: string): number {
    return this.allTagsSubject.value.get(tag) || 0;
  }

  getPopularTags(limit: number = 10): Array<{ tag: string; count: number }> {
    const tags = Array.from(this.allTagsSubject.value.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return tags;
  }

  searchByTag(nodes: Node[], tag: string): Node[] {
    return nodes.filter(node => 
      node.tags && node.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }

  searchByTags(nodes: Node[], tags: string[], operator: 'AND' | 'OR' = 'OR'): Node[] {
    if (operator === 'AND') {
      return nodes.filter(node => 
        tags.every(tag => 
          node.tags && node.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        )
      );
    } else {
      return nodes.filter(node => 
        node.tags && tags.some(tag =>
          node.tags!.some(t => t.toLowerCase() === tag.toLowerCase())
        )
      );
    }
  }

  addTagToNode(node: Node, tag: string): void {
    if (!node.tags) {
      node.tags = [];
    }
    if (!node.tags.includes(tag)) {
      node.tags.push(tag);
    }
  }

  removeTagFromNode(node: Node, tag: string): void {
    if (node.tags) {
      node.tags = node.tags.filter(t => t !== tag);
    }
  }
}

