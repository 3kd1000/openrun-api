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
                    // 개발용 계정 생성 (OAuth 없이 간단히)
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .imageUrl(null)
                            .isGuest(false)
                            .build();

                    return userRepository.save(newUser);
                });
    }
}
