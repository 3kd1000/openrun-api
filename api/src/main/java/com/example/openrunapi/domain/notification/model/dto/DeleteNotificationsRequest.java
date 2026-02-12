package com.example.openrunapi.domain.notification.model.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DeleteNotificationsRequest {
    @NotEmpty
    private List<Long> ids;
}
