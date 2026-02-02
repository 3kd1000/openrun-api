package com.example.openrunapi.domain.post.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class InquiryRequest {

    @NotBlank(message = "문의 내용을 입력해주세요.")
    @Size(max = 500, message = "문의 내용은 500자 이내로 입력해주세요.")
    private String content;
}
