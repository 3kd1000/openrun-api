package com.example.openrunapi.domain.notification.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingUpdateRequest {
    private boolean notiSchedule;
    private boolean notiClub;
    private boolean notiMessage;
    private boolean notiSystem;
}
