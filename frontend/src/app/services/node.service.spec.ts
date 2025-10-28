import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NodeService } from './node.service';
import { Node } from '../models/node.model';

describe('NodeService', () => {
  let service: NodeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(NodeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch root nodes', () => {
    const mock: Node[] = [{ id: 1, content: 'root', parentId: null, position: 0, createdAt: '', updatedAt: '' }];

    service.getRootNodes().subscribe(nodes => {
      expect(nodes.length).toBe(1);
      expect(nodes[0].id).toBe(1);
    });

    const req = httpMock.expectOne('/api/nodes');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('should create node', () => {
    const payload: Partial<Node> = { content: 'n', parentId: null, position: 0 };
    const created: Node = { id: 10, content: 'n', parentId: null, position: 0, createdAt: '', updatedAt: '' };

    service.createNode(payload).subscribe(n => {
      expect(n.id).toBe(10);
    });

    const req = httpMock.expectOne('/api/nodes');
    expect(req.request.method).toBe('POST');
    req.flush(created);
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NodeService } from './node.service';
import { Node } from '../models/node.model';

describe('NodeService', () => {
  let service: NodeService;
  let httpMock: HttpTestingController;
  let testNode: Node;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NodeService]
    });
    service = TestBed.inject(NodeService);
    httpMock = TestBed.inject(HttpTestingController);

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
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get root nodes', () => {
    const mockNodes = [testNode];
    
    service.getRootNodes().subscribe(nodes => {
      expect(nodes).toEqual(mockNodes);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes');
    expect(req.request.method).toBe('GET');
    req.flush(mockNodes);
  });

  it('should get children of a node', () => {
    const mockChildren = [testNode];
    
    service.getChildren(1).subscribe(children => {
      expect(children).toEqual(mockChildren);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes/1/children');
    expect(req.request.method).toBe('GET');
    req.flush(mockChildren);
  });

  it('should get a specific node', () => {
    service.getNode(1).subscribe(node => {
      expect(node).toEqual(testNode);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes/1');
    expect(req.request.method).toBe('GET');
    req.flush(testNode);
  });

  it('should create a new node', () => {
    const newNode = { content: 'New Node', parentId: null, position: 0 };
    
    service.createNode(newNode).subscribe(node => {
      expect(node).toEqual(testNode);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newNode);
    req.flush(testNode);
  });

  it('should update a node', () => {
    const updatedNode = { content: 'Updated Node' };
    
    service.updateNode(1, updatedNode).subscribe(node => {
      expect(node).toEqual(testNode);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedNode);
    req.flush(testNode);
  });

  it('should delete a node', () => {
    service.deleteNode(1).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should move a node with parent and position', () => {
    service.moveNode(1, 2, 0).subscribe(node => {
      expect(node).toEqual(testNode);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes/1/move?parentId=2&position=0');
    expect(req.request.method).toBe('PUT');
    req.flush(testNode);
  });

  it('should move a node with only parent', () => {
    service.moveNode(1, 2, null).subscribe(node => {
      expect(node).toEqual(testNode);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes/1/move?parentId=2&');
    expect(req.request.method).toBe('PUT');
    req.flush(testNode);
  });

  it('should move a node with only position', () => {
    service.moveNode(1, null, 0).subscribe(node => {
      expect(node).toEqual(testNode);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes/1/move?position=0');
    expect(req.request.method).toBe('PUT');
    req.flush(testNode);
  });

  it('should move a node with no parent or position', () => {
    service.moveNode(1, null, null).subscribe(node => {
      expect(node).toEqual(testNode);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/nodes/1/move?');
    expect(req.request.method).toBe('PUT');
    req.flush(testNode);
  });
});
