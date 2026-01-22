package com.example.openrunapi.domain.club.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

/**
 * 클럽장 권한 양도 요청 DTO
 */
@Getter
public class TransferOwnershipRequest {

    @NotNull(message = "새 클럽장의 사용자 ID는 필수입니다.")
    private Long newOwnerUserId;
}
