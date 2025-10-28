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
    
    // New endpoints for enhanced features
    @PatchMapping("/{id}/complete")
    public ResponseEntity<Node> toggleComplete(@PathVariable Long id) {
        return ResponseEntity.ok(nodeService.toggleComplete(id));
    }
    
    @PatchMapping("/{id}/expand")
    public ResponseEntity<Node> toggleExpand(@PathVariable Long id) {
        return ResponseEntity.ok(nodeService.toggleExpand(id));
    }
    
    @PatchMapping("/{id}/star")
    public ResponseEntity<Node> toggleStar(@PathVariable Long id) {
        return ResponseEntity.ok(nodeService.toggleStar(id));
    }
    
    @PatchMapping("/{id}/notes")
    public ResponseEntity<Node> updateNotes(@PathVariable Long id, @RequestBody String notes) {
        return ResponseEntity.ok(nodeService.updateNotes(id, notes));
    }
    
    @PostMapping("/batch")
    public ResponseEntity<List<Node>> batchUpdate(@RequestBody List<Node> nodes) {
        return ResponseEntity.ok(nodeService.batchUpdate(nodes));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Node>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Boolean completed) {
        return ResponseEntity.ok(nodeService.search(q, tag, completed));
    }
}

