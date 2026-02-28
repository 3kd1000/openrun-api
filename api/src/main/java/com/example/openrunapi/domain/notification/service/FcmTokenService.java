package com.example.openrunapi.domain.notification.service;

import com.example.openrunapi.domain.notification.model.DeviceType;
import com.example.openrunapi.domain.notification.model.FcmDeviceToken;
import com.example.openrunapi.domain.notification.model.dto.RegisterTokenRequest;
import com.example.openrunapi.domain.notification.repository.FcmDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class FcmTokenService {

    private final FcmDeviceTokenRepository fcmDeviceTokenRepository;

    private static final int MAX_TOKENS_PER_USER = 5;

    @Transactional
    public void registerToken(Long userId, RegisterTokenRequest request) {
        DeviceType deviceType = request.getResolvedDeviceType();

        // 1. 같은 토큰이 이미 있으면 업데이트만
        Optional<FcmDeviceToken> existingByToken = fcmDeviceTokenRepository.findByUserIdAndToken(userId, request.getToken());
        if (existingByToken.isPresent()) {
            existingByToken.get().updateToken(request.getToken(), request.getDeviceInfo());
            log.info("Updated FCM token for user: {} ({})", userId, deviceType);
            return;
        }

        // 2. deviceIdentifier가 있으면 같은 디바이스의 기존 토큰을 교체
        if (request.getDeviceIdentifier() != null && !request.getDeviceIdentifier().isBlank()) {
            Optional<FcmDeviceToken> existingByDevice = fcmDeviceTokenRepository
                    .findByUserIdAndDeviceIdentifier(userId, request.getDeviceIdentifier());
            if (existingByDevice.isPresent()) {
                existingByDevice.get().updateToken(request.getToken(), request.getDeviceInfo());
                log.info("Replaced FCM token for user: {} device: {} ({})", userId, request.getDeviceIdentifier(), deviceType);
                return;
            }
        }

        // 3. 새 토큰 등록 — 상한 초과 시 가장 오래된 토큰 삭제
        List<FcmDeviceToken> allTokens = fcmDeviceTokenRepository.findByUserId(userId);
        if (allTokens.size() >= MAX_TOKENS_PER_USER) {
            allTokens.stream()
                    .min(Comparator.comparing(FcmDeviceToken::getUpdatedAt))
                    .ifPresent(oldest -> {
                        fcmDeviceTokenRepository.delete(oldest);
                        log.info("Deleted oldest FCM token for user: {} (limit: {})", userId, MAX_TOKENS_PER_USER);
                    });
        }

        FcmDeviceToken token = FcmDeviceToken.builder()
                .userId(userId)
                .token(request.getToken())
                .deviceInfo(request.getDeviceInfo())
                .deviceType(deviceType)
                .deviceIdentifier(request.getDeviceIdentifier())
                .build();
        fcmDeviceTokenRepository.save(token);
        log.info("Registered new FCM token for user: {} ({})", userId, deviceType);
    }

    @Transactional
    public void removeToken(Long userId, String token) {
        fcmDeviceTokenRepository.deleteByUserIdAndToken(userId, token);
        log.info("Removed FCM token for user: {}", userId);
    }

    @Transactional
    public void removeStaleToken(String token) {
        fcmDeviceTokenRepository.deleteByToken(token);
        log.info("Removed stale FCM token: {}...", token.substring(0, Math.min(20, token.length())));
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

    public List<String> getRegisteredDeviceTypes(Long userId) {
        return fcmDeviceTokenRepository.findByUserId(userId).stream()
                .map(t -> t.getDeviceType().name())
                .distinct()
                .collect(Collectors.toList());
    }
}
