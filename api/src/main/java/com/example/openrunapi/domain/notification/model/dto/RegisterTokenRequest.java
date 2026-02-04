package com.example.openrunapi.domain.notification.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterTokenRequest {
    @NotBlank
    private String token;
    private String deviceInfo;
}
