package com.todo.controller;

import com.todo.entity.Node;
import com.todo.service.NodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nodes")
@CrossOrigin(origins = "http://localhost:4200")
public class NodeController {
    
    private final NodeService nodeService;
    
    public NodeController(NodeService nodeService) {
        this.nodeService = nodeService;
    }
    
    @GetMapping
    public List<Node> getRootNodes() {
        return nodeService.getAllRootNodes();
    }
    
    @GetMapping("/{id}/children")
    public List<Node> getChildren(@PathVariable Long id) {
        return nodeService.getChildren(id);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Node> getNode(@PathVariable Long id) {
        return ResponseEntity.ok(nodeService.getNodeById(id));
    }
    
    @PostMapping
    public ResponseEntity<Node> createNode(@RequestBody Node node) {
        return ResponseEntity.ok(nodeService.createNode(node));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Node> updateNode(@PathVariable Long id, @RequestBody Node node) {
        return ResponseEntity.ok(nodeService.updateNode(id, node));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable Long id) {
        nodeService.deleteNode(id);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}/move")
    public ResponseEntity<Node> moveNode(
            @PathVariable Long id,
            @RequestParam(required = false) Long parentId,
            @RequestParam(required = false) Integer position) {
        return ResponseEntity.ok(nodeService.moveNode(id, parentId, position));
    }
}

