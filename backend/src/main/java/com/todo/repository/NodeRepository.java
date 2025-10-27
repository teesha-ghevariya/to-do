package com.todo.repository;

import com.todo.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeRepository extends JpaRepository<Node, Long> {
    
    List<Node> findByParentIdIsNullOrderByPositionAsc();
    
    List<Node> findByParentIdOrderByPositionAsc(Long parentId);
    
    @Query("SELECT MAX(n.position) FROM Node n WHERE n.parentId = :parentId")
    Integer findMaxPositionByParentId(Long parentId);
}

