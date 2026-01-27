package com.example.openrunapi.domain.club.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class JoinRequestResponse {
    private boolean autoApproved;
    private String message;

    public static JoinRequestResponse autoApproved() {
        return new JoinRequestResponse(true, "가입이 승인되었습니다.");
    }

    public static JoinRequestResponse pending() {
        return new JoinRequestResponse(false, "가입 신청이 완료되었습니다. 승인을 기다려주세요.");
    }
}
