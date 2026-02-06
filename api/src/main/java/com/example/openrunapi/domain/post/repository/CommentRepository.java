package com.example.openrunapi.domain.post.repository;

import com.example.openrunapi.domain.post.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    /**
     * 탈퇴한 사용자의 댓글 익명화 (author_id를 null로 설정)
     */
    @Modifying
    @Query("UPDATE Comment c SET c.author = null WHERE c.author.id = :userId")
    void anonymizeByAuthorId(@Param("userId") Long userId);
}
