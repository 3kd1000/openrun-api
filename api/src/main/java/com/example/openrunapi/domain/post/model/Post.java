package com.example.openrunapi.domain.post.model;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.user.model.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false, length = 20)
    private PostType postType;

    @Column(nullable = false, length = 500)
    private String content;

    // For INQUIRY posts from non-members
    @Column(name = "guest_name", length = 100)
    private String guestName;

    @Column(name = "guest_email", length = 100)
    private String guestEmail;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    @Column(nullable = false)
    private Boolean deleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 생성자
    public Post(Club club, User author, PostType postType, String content) {
        this.club = club;
        this.author = author;
        this.postType = postType;
        this.content = content;
    }

    // For INQUIRY posts from non-members
    public Post(Club club, PostType postType, String content, String guestName, String guestEmail) {
        this.club = club;
        this.postType = postType;
        this.content = content;
        this.guestName = guestName;
        this.guestEmail = guestEmail;
    }

    // 비즈니스 메서드
    public void update(String content) {
        this.content = content;
    }

    public void softDelete() {
        this.deleted = true;
    }

    public void incrementLikeCount() {
        this.likeCount++;
    }

    public void decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    public void incrementCommentCount() {
        this.commentCount++;
    }

    public void decrementCommentCount() {
        if (this.commentCount > 0) {
            this.commentCount--;
        }
    }
}
