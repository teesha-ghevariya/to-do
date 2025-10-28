package com.todo.repository;

import com.todo.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeRepository extends JpaRepository<Node, Long> {
    
    List<Node> findByParentIdIsNullOrderByPositionAsc();
    
    List<Node> findByParentIdOrderByPositionAsc(Long parentId);
    
    @Query("SELECT MAX(n.position) FROM Node n WHERE n.parentId = :parentId")
    Integer findMaxPositionByParentId(Long parentId);
    
    // Search methods
    @Query("SELECT n FROM Node n WHERE LOWER(n.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Node> findByContentContaining(@Param("query") String query);
    
    @Query("SELECT n FROM Node n JOIN n.tags t WHERE LOWER(t) LIKE LOWER(CONCAT('%', :tag, '%'))")
    List<Node> findByTagsContaining(@Param("tag") String tag);
    
    // Filter by completion status
    List<Node> findByIsCompletedOrderByPositionAsc(Boolean isCompleted);
    
    List<Node> findByIsStarredTrueOrderByPositionAsc();
}

