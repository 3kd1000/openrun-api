package com.example.openrunapi.domain.schedule.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGuestNameRequest {
    @NotBlank
    @Size(max = 50)
    private String guestName;
}
