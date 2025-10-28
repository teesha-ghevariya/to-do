import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NodeItemComponent } from './node-item.component';
import { SelectionService } from '../../services/selection.service';
import { FormattingService } from '../../services/formatting.service';
import { Node } from '../../models/node.model';

describe('NodeItemComponent', () => {
  let component: NodeItemComponent;
  let fixture: ComponentFixture<NodeItemComponent>;
  let mockSelectionService: jasmine.SpyObj<SelectionService>;
  let mockFormattingService: jasmine.SpyObj<FormattingService>;
  let testNode: Node;

  beforeEach(async () => {
    const selectionSpy = jasmine.createSpyObj('SelectionService', ['selectNode'], {
      selectedNodeIds$: { subscribe: jasmine.createSpy() }
    });
    const formattingSpy = jasmine.createSpyObj('FormattingService', ['toggleBold', 'toggleItalic', 'toggleUnderline']);

    await TestBed.configureTestingModule({
      imports: [NodeItemComponent],
      providers: [
        { provide: SelectionService, useValue: selectionSpy },
        { provide: FormattingService, useValue: formattingSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NodeItemComponent);
    component = fixture.componentInstance;
    mockSelectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    mockFormattingService = TestBed.inject(FormattingService) as jasmine.SpyObj<FormattingService>;

    testNode = {
      id: 1,
      content: 'Test Node',
      parentId: null,
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false,
      isExpanded: true,
      isStarred: false,
      tags: [],
      notes: ''
    };

    component.node = testNode;
    component.depth = 0;
    component.hasChildren = false;
    
    // Mock the ViewChild inputElement
    component.inputElement = {
      nativeElement: {
        blur: jasmine.createSpy(),
        setSelectionRange: jasmine.createSpy(),
        selectionStart: 0,
        selectionEnd: 0
      }
    } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with node content', () => {
    component.ngOnInit();
    expect(component.editContent).toBe(testNode.content);
    expect(component.isEditing).toBe(true);
  });

  it('should handle Enter key to create sibling', () => {
    spyOn(component.createSibling, 'emit');
    spyOn(component, 'saveContent');
    component.editContent = 'Test content';
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    
    component.onKeyDown(event);
    
    expect(component.saveContent).toHaveBeenCalled();
    expect(component.createSibling.emit).toHaveBeenCalled();
  });

  it('should handle Escape key to cancel editing', () => {
    component.editContent = 'Modified content';
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    
    component.onKeyDown(event);
    
    expect(component.editContent).toBe(testNode.content);
    expect(component.isEditing).toBe(false);
  });

  it('should handle Tab key to indent', () => {
    spyOn(component.indent, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    
    component.onKeyDown(event);
    
    expect(component.indent.emit).toHaveBeenCalled();
  });

  it('should handle Shift+Tab key to outdent', () => {
    spyOn(component.outdent, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
    
    component.onKeyDown(event);
    
    expect(component.outdent.emit).toHaveBeenCalled();
  });

  it('should handle Ctrl+B for bold formatting', () => {
    spyOn(component, 'toggleBold');
    const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true });
    
    component.onKeyDown(event);
    
    expect(component.toggleBold).toHaveBeenCalled();
  });

  it('should handle Ctrl+I for italic formatting', () => {
    spyOn(component, 'toggleItalic');
    const event = new KeyboardEvent('keydown', { key: 'i', ctrlKey: true });
    
    component.onKeyDown(event);
    
    expect(component.toggleItalic).toHaveBeenCalled();
  });

  it('should handle Ctrl+U for underline formatting', () => {
    spyOn(component, 'toggleUnderline');
    const event = new KeyboardEvent('keydown', { key: 'u', ctrlKey: true });
    
    component.onKeyDown(event);
    
    expect(component.toggleUnderline).toHaveBeenCalled();
  });

  it('should handle Delete key on empty content to delete node', () => {
    spyOn(component.delete, 'emit');
    component.editContent = '';
    const event = new KeyboardEvent('keydown', { key: 'Delete' });
    
    component.onKeyDown(event);
    
    expect(component.delete.emit).toHaveBeenCalled();
  });

  it('should toggle completion', () => {
    spyOn(component.toggleCompleted, 'emit');
    component.isCompleted = false;
    
    component.toggleCompletion();
    
    expect(component.isCompleted).toBe(true);
    expect(component.toggleCompleted.emit).toHaveBeenCalledWith(true);
  });

  it('should save content when changed', () => {
    spyOn(component.contentChange, 'emit');
    component.editContent = 'New content';
    
    component.saveContent();
    
    expect(component.contentChange.emit).toHaveBeenCalledWith('New content');
    expect(component.isEditing).toBe(false);
  });

  it('should not emit content change when unchanged', () => {
    spyOn(component.contentChange, 'emit');
    component.editContent = testNode.content;
    
    component.saveContent();
    
    expect(component.contentChange.emit).not.toHaveBeenCalled();
  });

  it('should handle double click to zoom in when has children', () => {
    spyOn(component.zoomIn, 'emit');
    component.hasChildren = true;
    
    component.onDoubleClick();
    
    expect(component.zoomIn.emit).toHaveBeenCalled();
  });

  it('should not zoom in on double click when no children', () => {
    spyOn(component.zoomIn, 'emit');
    component.hasChildren = false;
    
    component.onDoubleClick();
    
    expect(component.zoomIn.emit).not.toHaveBeenCalled();
  });

  it('should extract tags from content', () => {
    component.editContent = 'This is a #test #node with #tags';
    const tags = component.extractTags(component.editContent);
    
    expect(tags).toEqual(['test', 'node', 'tags']);
  });

  it('should get display content without tags', () => {
    component.editContent = 'This is a #test node';
    const displayContent = component.getDisplayContent();
    
    expect(displayContent).toBe('This is a  node');
  });

  it('should handle drag start', () => {
    spyOn(component.dragStart, 'emit');
    const event = new DragEvent('dragstart');
    Object.defineProperty(event, 'dataTransfer', {
      value: { setData: jasmine.createSpy(), effectAllowed: '' },
      writable: true
    });
    
    component.onDragStart(event);
    
    expect(component.dragStart.emit).toHaveBeenCalledWith(testNode);
  });

  it('should handle drag end', () => {
    spyOn(component.dragEnd, 'emit');
    const event = new DragEvent('dragend');
    
    component.onDragEnd(event);
    
    expect(component.dragEnd.emit).toHaveBeenCalled();
  });

  it('should handle drag over', () => {
    spyOn(component.dragOver, 'emit');
    const event = new DragEvent('dragover');
    Object.defineProperty(event, 'dataTransfer', {
      value: { dropEffect: '' },
      writable: true
    });
    
    component.onDragOver(event);
    
    expect(component.dragOver.emit).toHaveBeenCalledWith({node: testNode, event});
  });

  it('should handle drop', () => {
    spyOn(component.drop, 'emit');
    const event = new DragEvent('drop');
    
    component.onDrop(event);
    
    expect(component.drop.emit).toHaveBeenCalledWith({node: testNode, event});
  });
});
