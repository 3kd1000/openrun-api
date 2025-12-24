package com.example.openrunapi.domain.auth.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {
    private String firebaseCustomToken;
    private boolean newUser;  // is 제거 → Jackson이 "newUser"로 직렬화
}
