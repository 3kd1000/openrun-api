package com.example.openrunapi.domain.user.service;

import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.dto.UpdateUserRequest;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String uid) throws UsernameNotFoundException {
        // DB에서 uid로 사용자를 찾고, 없으면 새로 생성(회원가입)을 시도
        User user = userRepository.findByUid(uid).orElseGet(() -> {
            try {
                UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
                return getOrCreateUser(userRecord);
            } catch (FirebaseAuthException e) {
                throw new UsernameNotFoundException("Failed to fetch user data from Firebase.", e);
            }
        });

        return new org.springframework.security.core.userdetails.User(
                user.getUid(),
                "", // 비밀번호는 사용하지 않으므로 빈 문자열
                new ArrayList<>() // 권한(Role)은 여기서 설정하지 않음
        );
    }

    @Transactional
    public User getOrCreateUser(UserRecord userRecord) {
        // uid로 사용자를 찾고, 없으면 새로 생성 (회원가입)
        return userRepository.findByUid(userRecord.getUid()).orElseGet(() -> {
            User newUser = User.builder()
                    .uid(userRecord.getUid())
                    .email(userRecord.getEmail())
                    .nickname(userRecord.getDisplayName() != null ? userRecord.getDisplayName() : "New User")
                    .imageUrl(userRecord.getPhotoUrl())
                    .build();
            return userRepository.save(newUser);
        });
    }

    public UserResponse getCurrentUser(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        return new UserResponse(user);
    }

    @Transactional
    public UserResponse updateUser(String uid, UpdateUserRequest request) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));

        user.updateProfile(request.getNickname(), request.getImageUrl());
        // JPA의 더티 체킹에 의해 트랜잭션 종료 시 자동으로 update 쿼리가 실행됩니다.

        return new UserResponse(user);
    }

    @Transactional
    public void deleteUser(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        userRepository.delete(user);
    }
}
