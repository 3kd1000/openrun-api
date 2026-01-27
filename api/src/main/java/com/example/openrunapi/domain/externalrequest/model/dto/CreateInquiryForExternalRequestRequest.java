package com.example.openrunapi.domain.externalrequest.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class CreateInquiryForExternalRequestRequest {
    @NotBlank(message = "내용을 입력해주세요.")
    @Size(max = 500, message = "내용은 500자를 초과할 수 없습니다.")
    private String content;
}

