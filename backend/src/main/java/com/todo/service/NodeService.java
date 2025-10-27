package com.todo.service;

import com.todo.entity.Node;
import com.todo.repository.NodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NodeService {
    
    private final NodeRepository nodeRepository;
    
    public NodeService(NodeRepository nodeRepository) {
        this.nodeRepository = nodeRepository;
    }
    
    public List<Node> getAllRootNodes() {
        return nodeRepository.findByParentIdIsNullOrderByPositionAsc();
    }
    
    public List<Node> getChildren(Long parentId) {
        return nodeRepository.findByParentIdOrderByPositionAsc(parentId);
    }
    
    public Node getNodeById(Long id) {
        return nodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Node not found with id: " + id));
    }
    
    @Transactional
    public Node createNode(Node node) {
        if (node.getParentId() != null && !nodeRepository.existsById(node.getParentId())) {
            throw new RuntimeException("Parent node not found");
        }
        
        // Set default position if not set
        if (node.getPosition() == null) {
            Integer maxPosition = nodeRepository.findMaxPositionByParentId(node.getParentId());
            node.setPosition(maxPosition != null ? maxPosition + 1 : 0);
        }
        
        return nodeRepository.save(node);
    }
    
    @Transactional
    public Node updateNode(Long id, Node node) {
        Node existing = getNodeById(id);
        existing.setContent(node.getContent());
        if (node.getPosition() != null) {
            existing.setPosition(node.getPosition());
        }
        return nodeRepository.save(existing);
    }
    
    @Transactional
    public void deleteNode(Long id) {
        Node node = getNodeById(id);
        
        // Recursively delete all children
        List<Node> children = nodeRepository.findByParentIdOrderByPositionAsc(id);
        for (Node child : children) {
            deleteNode(child.getId());
        }
        
        nodeRepository.delete(node);
    }
    
    @Transactional
    public Node moveNode(Long id, Long newParentId, Integer newPosition) {
        Node node = getNodeById(id);
        
        // Validate no circular reference
        if (newParentId != null) {
            Node tempParent = nodeRepository.findById(newParentId).orElse(null);
            while (tempParent != null) {
                if (tempParent.getId().equals(id)) {
                    throw new RuntimeException("Cannot create circular reference");
                }
                tempParent = tempParent.getParentId() != null ? 
                    nodeRepository.findById(tempParent.getParentId()).orElse(null) : null;
            }
        }
        
        Long oldParentId = node.getParentId();
        
        // If parent changed, recalculate positions in old parent's children
        if (!java.util.Objects.equals(oldParentId, newParentId)) {
            List<Node> oldSiblings = nodeRepository.findByParentIdOrderByPositionAsc(oldParentId);
            int position = 0;
            for (Node sibling : oldSiblings) {
                if (!sibling.getId().equals(id)) {
                    sibling.setPosition(position++);
                    nodeRepository.save(sibling);
                }
            }
        }
        
        // Update node's parent and position
        node.setParentId(newParentId);
        
        // Recalculate positions in new parent's children
        List<Node> newSiblings = nodeRepository.findByParentIdOrderByPositionAsc(newParentId);
        
        if (newPosition == null || newPosition < 0 || newPosition > newSiblings.size()) {
            newPosition = newSiblings.size();
        }
        
        int position = 0;
        for (Node sibling : newSiblings) {
            if (!sibling.getId().equals(id)) {
                if (position == newPosition) {
                    position++;
                }
                sibling.setPosition(position++);
                nodeRepository.save(sibling);
            }
        }
        
        node.setPosition(newPosition);
        return nodeRepository.save(node);
    }
}

