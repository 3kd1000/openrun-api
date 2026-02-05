package com.example.openrunapi.domain.notification.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SendNotificationRequest {
    @NotNull
    private Long clubId;
    @NotEmpty
    private List<Long> userIds;
    @NotBlank
    private String title;
    @NotBlank
    private String body;
    private String type; // SCHEDULE, DRAW, CLUB_INVITE, EXTERNAL_REQUEST, REQUEST_RESULT, SYSTEM
    private Long referenceId;
    private String referenceType;
}
