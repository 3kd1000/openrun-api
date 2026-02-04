package com.example.openrunapi.domain.notification.service;

import com.example.openrunapi.domain.notification.model.FcmDeviceToken;
import com.example.openrunapi.domain.notification.model.dto.RegisterTokenRequest;
import com.example.openrunapi.domain.notification.repository.FcmDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class FcmTokenService {

    private final FcmDeviceTokenRepository fcmDeviceTokenRepository;

    @Transactional
    public void registerToken(Long userId, RegisterTokenRequest request) {
        Optional<FcmDeviceToken> existing = fcmDeviceTokenRepository.findByUserIdAndToken(userId, request.getToken());

        if (existing.isPresent()) {
            // Update existing token
            existing.get().updateToken(request.getToken(), request.getDeviceInfo());
            log.info("Updated FCM token for user: {}", userId);
        } else {
            // Create new token
            FcmDeviceToken token = FcmDeviceToken.builder()
                    .userId(userId)
                    .token(request.getToken())
                    .deviceInfo(request.getDeviceInfo())
                    .build();
            fcmDeviceTokenRepository.save(token);
            log.info("Registered new FCM token for user: {}", userId);
        }
    }

    @Transactional
    public void removeToken(Long userId, String token) {
        fcmDeviceTokenRepository.deleteByUserIdAndToken(userId, token);
        log.info("Removed FCM token for user: {}", userId);
    }

    @Transactional
    public void removeAllTokens(Long userId) {
        fcmDeviceTokenRepository.deleteByUserId(userId);
        log.info("Removed all FCM tokens for user: {}", userId);
    }

    public List<String> getTokensByUserId(Long userId) {
        return fcmDeviceTokenRepository.findByUserId(userId).stream()
                .map(FcmDeviceToken::getToken)
                .collect(Collectors.toList());
    }
}
