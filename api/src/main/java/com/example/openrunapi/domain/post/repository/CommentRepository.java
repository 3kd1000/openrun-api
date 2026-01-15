package com.example.openrunapi.domain.post.repository;

import com.example.openrunapi.domain.post.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.deleted = false ORDER BY c.createdAt ASC")
    List<Comment> findByPostIdAndNotDeleted(@Param("postId") Long postId);

    @Query("SELECT c FROM Comment c WHERE c.id = :commentId AND c.deleted = false")
    Optional<Comment> findByIdAndNotDeleted(@Param("commentId") Long commentId);

    @Query("SELECT c FROM Comment c WHERE c.id = :commentId AND c.post.id = :postId AND c.deleted = false")
    Optional<Comment> findByIdAndPostIdAndNotDeleted(@Param("commentId") Long commentId, @Param("postId") Long postId);
}
