package com.example.openrunapi.domain.post.model.dto;

import com.example.openrunapi.domain.post.model.Comment;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private String content;
    private AuthorInfo author;
    private Integer likeCount;
    private Boolean liked;
    private Boolean canEdit;
    private Boolean canDelete;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommentResponse from(Comment comment, boolean liked, boolean canEdit, boolean canDelete) {
        return new CommentResponse(
            comment.getId(),
            comment.getContent(),
            AuthorInfo.from(comment.getAuthor()),
            comment.getLikeCount(),
            liked,
            canEdit,
            canDelete,
            comment.getCreatedAt(),
            comment.getUpdatedAt()
        );
    }
}
