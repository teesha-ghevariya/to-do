import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Node } from '../models/node.model';

@Injectable({
  providedIn: 'root'
})
export class NodeService {
  private apiUrl = 'http://localhost:8080/api/nodes';

  constructor(private http: HttpClient) {}

  getRootNodes(): Observable<Node[]> {
    return this.http.get<Node[]>(this.apiUrl);
  }

  getChildren(parentId: number): Observable<Node[]> {
    return this.http.get<Node[]>(`${this.apiUrl}/${parentId}/children`);
  }

  getNode(id: number): Observable<Node> {
    return this.http.get<Node>(`${this.apiUrl}/${id}`);
  }

  createNode(node: Partial<Node>): Observable<Node> {
    return this.http.post<Node>(this.apiUrl, node);
  }

  updateNode(id: number, node: Partial<Node>): Observable<Node> {
    return this.http.put<Node>(`${this.apiUrl}/${id}`, node);
  }

  deleteNode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  moveNode(id: number, parentId: number | null, position: number | null): Observable<Node> {
    let url = `${this.apiUrl}/${id}/move?`;
    if (parentId !== null) {
      url += `parentId=${parentId}&`;
    }
    if (position !== null) {
      url += `position=${position}`;
    }
    return this.http.put<Node>(url, {});
  }
}

