package com.example.openrunapi.domain.post.repository;

import com.example.openrunapi.domain.post.model.Post;
import com.example.openrunapi.domain.post.model.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p WHERE p.club.id = :clubId AND p.deleted = false ORDER BY p.createdAt DESC")
    List<Post> findByClubIdAndNotDeleted(@Param("clubId") Long clubId);

    @Query("SELECT p FROM Post p WHERE p.club.id = :clubId AND p.postType = :postType AND p.deleted = false ORDER BY p.createdAt DESC")
    List<Post> findByClubIdAndPostTypeAndNotDeleted(@Param("clubId") Long clubId, @Param("postType") PostType postType);

    @Query("SELECT p FROM Post p WHERE p.id = :postId AND p.deleted = false")
    Optional<Post> findByIdAndNotDeleted(@Param("postId") Long postId);

    @Query("SELECT p FROM Post p WHERE p.id = :postId AND p.club.id = :clubId AND p.deleted = false")
    Optional<Post> findByIdAndClubIdAndNotDeleted(@Param("postId") Long postId, @Param("clubId") Long clubId);

    // 페이징 지원 쿼리
    @Query("SELECT p FROM Post p WHERE p.club.id = :clubId AND p.deleted = false")
    Page<Post> findByClubIdAndNotDeletedPaged(@Param("clubId") Long clubId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.club.id = :clubId AND p.postType = :postType AND p.deleted = false")
    Page<Post> findByClubIdAndPostTypeAndNotDeletedPaged(@Param("clubId") Long clubId, @Param("postType") PostType postType, Pageable pageable);
}
