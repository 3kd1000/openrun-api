package com.example.openrunapi.domain.notification.service;

import com.example.openrunapi.domain.notification.model.NotificationType;
import com.example.openrunapi.domain.notification.model.UserNotificationSetting;
import com.example.openrunapi.domain.notification.model.dto.NotificationSettingResponse;
import com.example.openrunapi.domain.notification.model.dto.NotificationSettingUpdateRequest;
import com.example.openrunapi.domain.notification.repository.UserNotificationSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class UserNotificationSettingService {

    private final UserNotificationSettingRepository repository;

    @Transactional
    public UserNotificationSetting getOrCreateSettings(Long userId) {
        return repository.findByUserId(userId)
                .orElseGet(() -> repository.save(new UserNotificationSetting(userId)));
    }

    public NotificationSettingResponse getSettings(Long userId) {
        UserNotificationSetting setting = repository.findByUserId(userId)
                .orElse(null);
        if (setting == null) {
            return NotificationSettingResponse.defaultSettings();
        }
        return NotificationSettingResponse.from(setting);
    }

    @Transactional
    public NotificationSettingResponse updateSettings(Long userId, NotificationSettingUpdateRequest request) {
        UserNotificationSetting setting = getOrCreateSettings(userId);
        setting.update(
                request.isNotiSchedule(),
                request.isNotiClub(),
                request.isNotiMessage(),
                request.isNotiSystem()
        );
        log.info("Updated notification settings for user {}: schedule={}, club={}, message={}, system={}",
                userId, request.isNotiSchedule(), request.isNotiClub(), request.isNotiMessage(), request.isNotiSystem());
        return NotificationSettingResponse.from(setting);
    }

    public boolean isNotificationEnabled(Long userId, NotificationType type) {
        return repository.findByUserId(userId)
                .map(setting -> setting.isEnabled(type))
                .orElse(true); // 설정 없으면 기본값 ON
    }
}
