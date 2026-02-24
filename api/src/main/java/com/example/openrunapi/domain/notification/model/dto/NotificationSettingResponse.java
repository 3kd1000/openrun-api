package com.example.openrunapi.domain.notification.model.dto;

import com.example.openrunapi.domain.notification.model.UserNotificationSetting;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class NotificationSettingResponse {
    private boolean notiSchedule;
    private boolean notiClub;
    private boolean notiMessage;
    private boolean notiSystem;

    public static NotificationSettingResponse from(UserNotificationSetting setting) {
        return new NotificationSettingResponse(
                setting.isNotiSchedule(),
                setting.isNotiClub(),
                setting.isNotiMessage(),
                setting.isNotiSystem()
        );
    }

    public static NotificationSettingResponse defaultSettings() {
        return new NotificationSettingResponse(true, true, true, true);
    }
}
