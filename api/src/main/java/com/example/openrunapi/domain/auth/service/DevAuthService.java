package com.example.openrunapi.domain.auth.service;

import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DevAuthService {

    private final UserRepository userRepository;

    public User login(String email, String name) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    // 개발용 계정 생성
                    // Firebase UID는 임의로 생성 (dev_ prefix)
                    String devUid = "dev_" + UUID.randomUUID().toString();

                    User newUser = User.builder()
                            .firebaseUid(devUid)
                            .email(email)
                            .name(name)
                            .imageUrl(null) // 개발용은 이미지 없음
                            .socialId("dev")
                            .build();

                    return userRepository.save(newUser);
                });
    }
}
