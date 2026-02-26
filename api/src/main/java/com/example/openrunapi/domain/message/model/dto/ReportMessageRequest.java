package com.example.openrunapi.domain.message.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class ReportMessageRequest {
    @NotNull
    private Long messageId;

    @NotBlank
    private String reason;   // SPAM, ABUSE, SEXUAL, OTHER

    @Size(max = 500)
    private String description;
}
