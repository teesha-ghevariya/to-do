package com.todo.controller;

import com.todo.entity.Node;
import com.todo.service.NodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NodeControllerTest {

    @Mock
    private NodeService nodeService;

    @InjectMocks
    private NodeController nodeController;

    private Node testNode;

    @BeforeEach
    void setUp() {
        testNode = new Node("Test Node", null, 0);
        testNode.setId(1L);
    }

    @Test
    void getRootNodes_returnsListOfNodes() {
        List<Node> nodes = List.of(testNode);
        when(nodeService.getAllRootNodes()).thenReturn(nodes);

        List<Node> result = nodeController.getRootNodes();

        assertEquals(1, result.size());
        assertEquals(testNode.getId(), result.get(0).getId());
        verify(nodeService).getAllRootNodes();
    }

    @Test
    void getChildren_returnsChildrenList() {
        List<Node> children = List.of(testNode);
        when(nodeService.getChildren(1L)).thenReturn(children);

        List<Node> result = nodeController.getChildren(1L);

        assertEquals(1, result.size());
        verify(nodeService).getChildren(1L);
    }

    @Test
    void getNode_returnsNodeWithOkStatus() {
        when(nodeService.getNodeById(1L)).thenReturn(testNode);

        ResponseEntity<Node> response = nodeController.getNode(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testNode, response.getBody());
        verify(nodeService).getNodeById(1L);
    }

    @Test
    void createNode_returnsCreatedNodeWithOkStatus() {
        Node newNode = new Node("New Node", null, 0);
        when(nodeService.createNode(any(Node.class))).thenReturn(testNode);

        ResponseEntity<Node> response = nodeController.createNode(newNode);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testNode, response.getBody());
        verify(nodeService).createNode(newNode);
    }

    @Test
    void updateNode_returnsUpdatedNodeWithOkStatus() {
        Node updatedNode = new Node("Updated Node", null, 0);
        when(nodeService.updateNode(anyLong(), any(Node.class))).thenReturn(testNode);

        ResponseEntity<Node> response = nodeController.updateNode(1L, updatedNode);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testNode, response.getBody());
        verify(nodeService).updateNode(1L, updatedNode);
    }

    @Test
    void deleteNode_returnsOkStatus() {
        doNothing().when(nodeService).deleteNode(1L);

        ResponseEntity<Void> response = nodeController.deleteNode(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(nodeService).deleteNode(1L);
    }

    @Test
    void moveNode_returnsMovedNodeWithOkStatus() {
        when(nodeService.moveNode(anyLong(), any(), any())).thenReturn(testNode);

        ResponseEntity<Node> response = nodeController.moveNode(1L, 2L, 0);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testNode, response.getBody());
        verify(nodeService).moveNode(1L, 2L, 0);
    }

    @Test
    void moveNode_withNullParentId_works() {
        when(nodeService.moveNode(anyLong(), any(), any())).thenReturn(testNode);

        ResponseEntity<Node> response = nodeController.moveNode(1L, null, 0);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(nodeService).moveNode(1L, null, 0);
    }

    @Test
    void moveNode_withNullPosition_works() {
        when(nodeService.moveNode(anyLong(), any(), any())).thenReturn(testNode);

        ResponseEntity<Node> response = nodeController.moveNode(1L, 2L, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(nodeService).moveNode(1L, 2L, null);
    }
}
