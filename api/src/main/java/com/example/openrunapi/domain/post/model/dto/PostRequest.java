package com.example.openrunapi.domain.post.model.dto;

import com.example.openrunapi.domain.post.model.PostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {

    @NotNull(message = "게시글 타입을 선택해주세요.")
    private PostType postType;

    @NotBlank(message = "내용을 입력해주세요.")
    @Size(max = 500, message = "내용은 500자를 초과할 수 없습니다.")
    private String content;

    // For INQUIRY posts from non-members
    @Size(max = 100, message = "이름은 100자를 초과할 수 없습니다.")
    private String guestName;

    @Size(max = 100, message = "이메일은 100자를 초과할 수 없습니다.")
    private String guestEmail;
}
