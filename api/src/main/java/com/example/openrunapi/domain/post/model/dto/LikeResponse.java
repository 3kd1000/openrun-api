package com.example.openrunapi.domain.post.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LikeResponse {
    private Boolean liked;
    private Integer likeCount;

    public static LikeResponse of(boolean liked, int likeCount) {
        return new LikeResponse(liked, likeCount);
    }
}
