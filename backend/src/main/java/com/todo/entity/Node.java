package com.todo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "nodes")
public class Node {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String content;
    
    @Column(name = "parent_id")
    private Long parentId;
    
    @Column(nullable = false)
    private Integer position = 0;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = false;
    
    @Column(name = "is_expanded", nullable = false)
    private Boolean isExpanded = true;
    
    @Column(name = "is_starred", nullable = false)
    private Boolean isStarred = false;
    
    @ElementCollection
    @CollectionTable(name = "node_tags", joinColumns = @JoinColumn(name = "node_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "mirror_id")
    private Long mirrorId;
    
    public Node() {
    }
    
    public Node(String content, Long parentId, Integer position) {
        this.content = content;
        this.parentId = parentId;
        this.position = position;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public Long getParentId() {
        return parentId;
    }
    
    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }
    
    public Integer getPosition() {
        return position;
    }
    
    public void setPosition(Integer position) {
        this.position = position;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // New fields getters and setters
    public Boolean getIsCompleted() {
        return isCompleted;
    }
    
    public void setIsCompleted(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }
    
    public Boolean getIsExpanded() {
        return isExpanded;
    }
    
    public void setIsExpanded(Boolean isExpanded) {
        this.isExpanded = isExpanded;
    }
    
    public Boolean getIsStarred() {
        return isStarred;
    }
    
    public void setIsStarred(Boolean isStarred) {
        this.isStarred = isStarred;
    }
    
    public List<String> getTags() {
        return tags;
    }
    
    public void setTags(List<String> tags) {
        this.tags = tags != null ? tags : new ArrayList<>();
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public Long getMirrorId() {
        return mirrorId;
    }
    
    public void setMirrorId(Long mirrorId) {
        this.mirrorId = mirrorId;
    }
}

