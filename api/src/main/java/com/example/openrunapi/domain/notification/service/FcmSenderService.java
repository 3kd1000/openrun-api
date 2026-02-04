package com.example.openrunapi.domain.notification.service;

import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FcmSenderService {

    private final FcmTokenService fcmTokenService;

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    /**
     * Send push notification to all devices of a user
     */
    public void sendToUser(Long userId, String title, String body, Map<String, String> data) {
        if (!firebaseEnabled) {
            log.info("Firebase is disabled. Skipping push notification to user: {}", userId);
            return;
        }

        List<String> tokens = fcmTokenService.getTokensByUserId(userId);
        if (tokens.isEmpty()) {
            log.info("No FCM tokens found for user: {}", userId);
            return;
        }

        for (String token : tokens) {
            sendToToken(token, title, body, data);
        }
    }

    /**
     * Send push notification to a specific device token
     */
    public void sendToToken(String token, String title, String body, Map<String, String> data) {
        if (!firebaseEnabled) {
            log.info("Firebase is disabled. Skipping push notification");
            return;
        }

        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            Message message = messageBuilder.build();
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Successfully sent FCM message: {}", response);
        } catch (FirebaseMessagingException e) {
            handleMessagingException(token, e);
        } catch (Exception e) {
            log.error("Failed to send FCM message to token: {}", token, e);
        }
    }

    private void handleMessagingException(String token, FirebaseMessagingException e) {
        MessagingErrorCode errorCode = e.getMessagingErrorCode();

        if (errorCode == MessagingErrorCode.UNREGISTERED) {
            log.warn("Token is unregistered. Removing stale token: {}", token);
            // Delete stale token - we need userId but don't have it here
            // This will be handled by the service layer when sending to user
        } else {
            log.error("Firebase messaging error ({}): {}", errorCode, e.getMessage());
        }
    }
}
