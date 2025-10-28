package com.todo.service;

import com.todo.entity.Node;
import com.todo.repository.NodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NodeServiceTest {

    @Mock
    private NodeRepository nodeRepository;

    @InjectMocks
    private NodeService nodeService;

    private Node rootNode;

    @BeforeEach
    void setUp() {
        rootNode = new Node("root", null, 0);
        rootNode.setId(1L);
    }

    @Test
    void getAllRootNodes_returnsOrderedRoots() {
        List<Node> roots = new ArrayList<>();
        roots.add(rootNode);
        when(nodeRepository.findByParentIdIsNullOrderByPositionAsc()).thenReturn(roots);

        List<Node> result = nodeService.getAllRootNodes();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        verify(nodeRepository).findByParentIdIsNullOrderByPositionAsc();
    }

    @Test
    void getNodeById_whenNotFound_throws() {
        when(nodeRepository.findById(99L)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> nodeService.getNodeById(99L));
        assertTrue(ex.getMessage().contains("Node not found"));
    }

    @Test
    void createNode_setsDefaultPosition() {
        Node newNode = new Node("child", 1L, null);
        when(nodeRepository.existsById(1L)).thenReturn(true);
        when(nodeRepository.findMaxPositionByParentId(1L)).thenReturn(2);
        when(nodeRepository.save(any(Node.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Node saved = nodeService.createNode(newNode);

        assertEquals(3, saved.getPosition());
        assertEquals(1L, saved.getParentId());
        verify(nodeRepository).save(any(Node.class));
    }

    @Test
    void createNode_missingParent_throws() {
        Node newNode = new Node("child", 42L, null);
        when(nodeRepository.existsById(42L)).thenReturn(false);
        assertThrows(RuntimeException.class, () -> nodeService.createNode(newNode));
        verify(nodeRepository, never()).save(any());
    }

    @Test
    void updateNode_updatesContentAndPosition() {
        Node existing = new Node("old", null, 0);
        existing.setId(10L);
        when(nodeRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(nodeRepository.save(any(Node.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Node update = new Node("new", null, 5);
        Node updated = nodeService.updateNode(10L, update);

        assertEquals("new", updated.getContent());
        assertEquals(5, updated.getPosition());
    }

    @Test
    void deleteNode_recursivelyDeletesChildren() {
        Node parent = new Node("p", null, 0);
        parent.setId(1L);
        Node child = new Node("c", 1L, 0);
        child.setId(2L);
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(parent));
        when(nodeRepository.findByParentIdOrderByPositionAsc(1L)).thenReturn(List.of(child));
        when(nodeRepository.findById(2L)).thenReturn(Optional.of(child));
        when(nodeRepository.findByParentIdOrderByPositionAsc(2L)).thenReturn(List.of());

        nodeService.deleteNode(1L);

        verify(nodeRepository, times(1)).delete(child);
        verify(nodeRepository, times(1)).delete(parent);
    }

    @Test
    void moveNode_preventsCircularReferences() {
        Node a = new Node("a", null, 0); a.setId(1L);
        Node b = new Node("b", 1L, 0); b.setId(2L);
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(a));
        when(nodeRepository.findById(2L)).thenReturn(Optional.of(b));

        // attempt to move a under b (would create cycle)
        assertThrows(RuntimeException.class, () -> nodeService.moveNode(1L, 2L, 0));
    }

    @Test
    void toggleComplete_togglesFlag() {
        Node n = new Node("n", null, 0); n.setId(3L); n.setIsCompleted(false);
        when(nodeRepository.findById(3L)).thenReturn(Optional.of(n));
        when(nodeRepository.save(any(Node.class))).thenAnswer(i -> i.getArgument(0));

        Node updated = nodeService.toggleComplete(3L);

        assertTrue(updated.getIsCompleted());
        verify(nodeRepository).save(updated);
    }

    @Test
    void toggleExpand_togglesFlag() {
        Node n = new Node("n", null, 0); n.setId(4L); n.setIsExpanded(true);
        when(nodeRepository.findById(4L)).thenReturn(Optional.of(n));
        when(nodeRepository.save(any(Node.class))).thenAnswer(i -> i.getArgument(0));

        Node updated = nodeService.toggleExpand(4L);
        assertFalse(updated.getIsExpanded());
    }

    @Test
    void toggleStar_togglesFlag() {
        Node n = new Node("n", null, 0); n.setId(5L); n.setIsStarred(false);
        when(nodeRepository.findById(5L)).thenReturn(Optional.of(n));
        when(nodeRepository.save(any(Node.class))).thenAnswer(i -> i.getArgument(0));

        Node updated = nodeService.toggleStar(5L);
        assertTrue(updated.getIsStarred());
    }

    @Test
    void updateNotes_setsNotes() {
        Node n = new Node("n", null, 0); n.setId(6L);
        when(nodeRepository.findById(6L)).thenReturn(Optional.of(n));
        when(nodeRepository.save(any(Node.class))).thenAnswer(i -> i.getArgument(0));

        Node updated = nodeService.updateNotes(6L, "hello");
        assertEquals("hello", updated.getNotes());
    }

    @Test
    void batchUpdate_updatesFields() {
        Node existing = new Node("old", null, 0); existing.setId(7L);
        when(nodeRepository.findById(7L)).thenReturn(Optional.of(existing));

        Node update = new Node("new", null, 0); update.setId(7L);
        update.setIsCompleted(true);
        update.setIsExpanded(false);
        update.setIsStarred(true);
        update.setNotes("n");

        List<Node> result = nodeService.batchUpdate(List.of(update));

        assertEquals(1, result.size());
        verify(nodeRepository, atLeastOnce()).save(any(Node.class));
    }

    @Test
    void search_combinesFilters() {
        when(nodeRepository.findByContentContaining("foo")).thenReturn(List.of(new Node("foo", null, 0)));
        when(nodeRepository.findByTagsContaining("work"))
                .thenReturn(List.of(new Node("bar", null, 0)));
        when(nodeRepository.findByIsCompletedOrderByPositionAsc(true))
                .thenReturn(new ArrayList<>());

        List<Node> result = nodeService.search("foo", "work", true);
        assertNotNull(result);
    }
}


