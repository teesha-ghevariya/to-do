import { SearchService } from './search.service';

describe('SearchService', () => {
  it('should search across content, tags and notes', () => {
    const svc = new SearchService();
    const nodes: any[] = [
      { id: 1, content: 'Buy milk #groceries', notes: 'from store', tags: ['groceries'] },
      { id: 2, content: 'Work task', notes: 'deadline soon', tags: ['work'] }
    ];

    svc.search('groceries', nodes as any);
    const res = svc.getCurrentResults();
    expect(res.length).toBe(1);
    expect(res[0].node.id).toBe(1);
  });
});


