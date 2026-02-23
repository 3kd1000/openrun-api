package com.example.openrunapi.domain.message.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotNull(message = "수신자를 선택해주세요.")
    private Long receiverId;

    @NotBlank(message = "메시지 내용을 입력해주세요.")
    @Size(max = 2000, message = "메시지는 2000자를 초과할 수 없습니다.")
    private String content;

    private String referenceType;  // nullable, e.g. "PUBLIC_SCHEDULE"
    private Long referenceId;      // nullable, e.g. scheduleId
}
