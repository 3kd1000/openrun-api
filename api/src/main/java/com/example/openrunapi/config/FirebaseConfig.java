package com.example.openrunapi.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.config.path:}")
    private String firebaseConfigPath;

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    @PostConstruct
    public void initialize() {
        // Firebase는 dev, prod 환경에서만 초기화
        // 로컬 개발 환경에서는 DevAuthenticationFilter 사용
        if (!firebaseEnabled) {
            log.info("Firebase initialization skipped (firebase.enabled=false)");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FileInputStream serviceAccount = new FileInputStream(firebaseConfigPath);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase application has been initialized from path: {}", firebaseConfigPath);
            }
        } catch (IOException e) {
            log.error("Error initializing Firebase from path: {}", firebaseConfigPath, e);
            throw new RuntimeException("Error initializing Firebase.", e);
        }
    }

    @Bean
    public FirebaseAuth firebaseAuth() {
        // Firebase 비활성화 시 null 반환
        if (!firebaseEnabled) {
            log.warn("FirebaseAuth bean returned null (firebase.enabled=false)");
            return null;
        }
        return FirebaseAuth.getInstance();
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        if (!firebaseEnabled) {
            log.warn("FirebaseMessaging bean returned null (firebase.enabled=false)");
            return null;
        }
        return FirebaseMessaging.getInstance();
    }
}
