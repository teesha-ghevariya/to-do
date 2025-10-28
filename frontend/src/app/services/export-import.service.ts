import { Injectable } from '@angular/core';
import { Node } from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class ExportImportService {

  constructor() {}

  exportToJSON(nodes: Node[]): string {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      nodes: nodes
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  exportToMarkdown(nodes: Node[]): string {
    let markdown = '# Workflowy Export\n\n';
    markdown += `Exported on: ${new Date().toLocaleDateString()}\n\n`;
    
    const rootNodes = nodes.filter(node => node.parentId === null);
    rootNodes.forEach(node => {
      markdown += this.nodeToMarkdown(node, nodes, 0);
    });
    
    return markdown;
  }

  private nodeToMarkdown(node: Node, allNodes: Node[], depth: number): string {
    const indent = '  '.repeat(depth);
    const checkbox = node.isCompleted ? '[x]' : '[ ]';
    const content = node.content || 'Untitled';
    const tags = node.tags && node.tags.length > 0 ? ` ${node.tags.map(tag => `#${tag}`).join(' ')}` : '';
    
    let markdown = `${indent}- ${checkbox} ${content}${tags}\n`;
    
    const children = allNodes.filter(n => n.parentId === node.id);
    children.forEach(child => {
      markdown += this.nodeToMarkdown(child, allNodes, depth + 1);
    });
    
    return markdown;
  }

  exportToText(nodes: Node[]): string {
    let text = 'Workflowy Export\n';
    text += `Exported on: ${new Date().toLocaleDateString()}\n\n`;
    
    const rootNodes = nodes.filter(node => node.parentId === null);
    rootNodes.forEach(node => {
      text += this.nodeToText(node, nodes, 0);
    });
    
    return text;
  }

  private nodeToText(node: Node, allNodes: Node[], depth: number): string {
    const indent = '  '.repeat(depth);
    const checkbox = node.isCompleted ? '✓' : '○';
    const content = node.content || 'Untitled';
    const tags = node.tags && node.tags.length > 0 ? ` ${node.tags.map(tag => `#${tag}`).join(' ')}` : '';
    
    let text = `${indent}${checkbox} ${content}${tags}\n`;
    
    const children = allNodes.filter(n => n.parentId === node.id);
    children.forEach(child => {
      text += this.nodeToText(child, allNodes, depth + 1);
    });
    
    return text;
  }

  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  importFromJSON(jsonContent: string): Node[] {
    try {
      const data = JSON.parse(jsonContent);
      
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Invalid file format: missing nodes array');
      }
      
      return data.nodes;
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`);
    }
  }

  importFromMarkdown(markdownContent: string): Node[] {
    const lines = markdownContent.split('\n');
    const nodes: Node[] = [];
    const nodeStack: { node: Node, depth: number }[] = [];
    let nextId = 1;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and headers
      if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('Exported on:')) {
        return;
      }

      // Parse markdown list item
      const match = trimmedLine.match(/^[-*]\s*\[([ x])\]\s*(.+)$/);
      if (!match) {
        return;
      }

      const isCompleted = match[1] === 'x';
      const content = match[2];
      
      // Extract tags
      const tagMatches = content.match(/#[\w-]+/g);
      const tags = tagMatches ? tagMatches.map(tag => tag.substring(1)) : [];
      const cleanContent = content.replace(/#[\w-]+/g, '').trim();

      // Calculate depth
      const depth = (line.match(/^(\s*)/)?.[1]?.length || 0) / 2;
      
      // Find parent
      let parentId: number | null = null;
      while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].depth >= depth) {
        nodeStack.pop();
      }
      
      if (nodeStack.length > 0) {
        parentId = nodeStack[nodeStack.length - 1].node.id;
      }

      const node: Node = {
        id: nextId++,
        content: cleanContent,
        parentId,
        position: nodes.filter(n => n.parentId === parentId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCompleted,
        tags: tags.length > 0 ? tags : undefined
      };

      nodes.push(node);
      nodeStack.push({ node, depth });
    });

    return nodes;
  }

  importFromText(textContent: string): Node[] {
    const lines = textContent.split('\n');
    const nodes: Node[] = [];
    const nodeStack: { node: Node, depth: number }[] = [];
    let nextId = 1;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and headers
      if (!trimmedLine || trimmedLine.startsWith('Workflowy Export') || trimmedLine.startsWith('Exported on:')) {
        return;
      }

      // Parse text list item
      const match = trimmedLine.match(/^([○✓])\s*(.+)$/);
      if (!match) {
        return;
      }

      const isCompleted = match[1] === '✓';
      const content = match[2];
      
      // Extract tags
      const tagMatches = content.match(/#[\w-]+/g);
      const tags = tagMatches ? tagMatches.map(tag => tag.substring(1)) : [];
      const cleanContent = content.replace(/#[\w-]+/g, '').trim();

      // Calculate depth
      const depth = (line.match(/^(\s*)/)?.[1]?.length || 0) / 2;
      
      // Find parent
      let parentId: number | null = null;
      while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].depth >= depth) {
        nodeStack.pop();
      }
      
      if (nodeStack.length > 0) {
        parentId = nodeStack[nodeStack.length - 1].node.id;
      }

      const node: Node = {
        id: nextId++,
        content: cleanContent,
        parentId,
        position: nodes.filter(n => n.parentId === parentId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCompleted,
        tags: tags.length > 0 ? tags : undefined
      };

      nodes.push(node);
      nodeStack.push({ node, depth });
    });

    return nodes;
  }
}
