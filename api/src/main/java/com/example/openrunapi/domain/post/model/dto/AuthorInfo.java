package com.example.openrunapi.domain.post.model.dto;

import com.example.openrunapi.domain.user.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AuthorInfo {
    private Long id;
    private String name;
    private String profileImageUrl;

    public static AuthorInfo from(User user) {
        return new AuthorInfo(
            user.getId(),
            user.getName(),
            user.getImageUrl()
        );
    }
}
