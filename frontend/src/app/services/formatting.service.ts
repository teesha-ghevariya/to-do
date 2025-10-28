import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormattingService {

  constructor() {}

  // Toggle bold formatting
  toggleBold(text: string, selectionStart: number, selectionEnd: number): string {
    const selectedText = text.substring(selectionStart, selectionEnd);
    
    if (this.isBold(selectedText)) {
      // Remove bold markers
      text = text.substring(0, selectionStart) + 
             selectedText.replace(/\*\*/g, '') + 
             text.substring(selectionEnd);
      return text;
    } else {
      // Add bold markers
      text = text.substring(0, selectionStart) + 
             '**' + selectedText + '**' + 
             text.substring(selectionEnd);
      return text;
    }
  }

  // Toggle italic formatting
  toggleItalic(text: string, selectionStart: number, selectionEnd: number): string {
    const selectedText = text.substring(selectionStart, selectionEnd);
    
    if (this.isItalic(selectedText)) {
      // Remove italic markers
      text = text.substring(0, selectionStart) + 
             selectedText.replace(/\*/g, '') + 
             text.substring(selectionEnd);
      return text;
    } else {
      // Add italic markers
      text = text.substring(0, selectionStart) + 
             '*' + selectedText + '*' + 
             text.substring(selectionEnd);
      return text;
    }
  }

  // Toggle underline (using custom markdown-style syntax)
  toggleUnderline(text: string, selectionStart: number, selectionEnd: number): string {
    const selectedText = text.substring(selectionStart, selectionEnd);
    
    if (this.isUnderline(selectedText)) {
      // Remove underline markers
      text = text.substring(0, selectionStart) + 
             selectedText.replace(/@@/g, '') + 
             text.substring(selectionEnd);
      return text;
    } else {
      // Add underline markers
      text = text.substring(0, selectionStart) + 
             '@@' + selectedText + '@@' + 
             text.substring(selectionEnd);
      return text;
    }
  }

  // Check if text is bold
  isBold(text: string): boolean {
    return /^\*\*.*\*\*$/.test(text.trim());
  }

  // Check if text is italic
  isItalic(text: string): boolean {
    return /^\*.*\*$/.test(text.trim());
  }

  // Check if text is underlined
  isUnderline(text: string): boolean {
    return /^@@.*@@$/.test(text.trim());
  }

  // Render markdown to HTML (basic implementation)
  renderMarkdown(text: string): string {
    if (!text) return '';
    
    let html = text;
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Underline (custom syntax)
    html = html.replace(/@@(.+?)@@/g, '<u>$1</u>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
    
    // Auto-link URLs
    html = html.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    return html;
  }

  // Strip markdown from text for plain editing
  stripMarkdown(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/@@(.+?)@@/g, '$1');
  }

  // Extract plain text from markdown
  toPlainText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/@@(.+?)@@/g, '$1')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1');
  }
}

