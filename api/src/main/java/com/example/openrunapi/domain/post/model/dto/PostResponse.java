package com.example.openrunapi.domain.post.model.dto;

import com.example.openrunapi.domain.post.model.Post;
import com.example.openrunapi.domain.post.model.PostType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private PostType postType;
    private String content;
    private AuthorInfo author;
    private Integer likeCount;
    private Integer commentCount;
    private Boolean liked;
    private Boolean canEdit;
    private Boolean canDelete;
    private String guestName;
    private String guestEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PostResponse from(Post post, boolean liked, boolean canEdit, boolean canDelete) {
        return new PostResponse(
            post.getId(),
            post.getPostType(),
            post.getContent(),
            post.getAuthor() != null ? AuthorInfo.from(post.getAuthor()) : null,
            post.getLikeCount(),
            post.getCommentCount(),
            liked,
            canEdit,
            canDelete,
            post.getGuestName(),
            post.getGuestEmail(),
            post.getCreatedAt(),
            post.getUpdatedAt()
        );
    }
}
