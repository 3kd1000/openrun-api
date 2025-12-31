package com.example.openrunapi.domain.user.service;

import com.example.openrunapi.domain.auth.service.OAuthService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserOAuthProvider;
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
    private final OAuthService oauthService;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String uid) throws UsernameNotFoundException {
        // Provider 구분 없이 provider_uid로 검색
        User user = oauthService.findUserByProviderUid(uid)
                .orElseGet(() -> {
                    // Firebase에서 정보 가져와서 신규 생성
                    try {
                        UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
                        return getOrCreateUser(userRecord);
                    } catch (FirebaseAuthException e) {
                        throw new UsernameNotFoundException("Failed to fetch user data from Firebase.", e);
                    }
                });

        return new org.springframework.security.core.userdetails.User(
                uid,
                "",
                new ArrayList<>());
    }

    @Transactional
    public UserDetails loadUserById(Long id) throws UsernameNotFoundException {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        return new org.springframework.security.core.userdetails.User(
                user.getId().toString(),
                "",
                new ArrayList<>());
    }

    @Transactional
    public User getOrCreateUser(UserRecord userRecord) {
        // OAuthService를 사용하여 email 기반 통합 계정 관리
        return oauthService.getOrCreateUser(
                UserOAuthProvider.OAuthProviderType.GOOGLE,
                userRecord.getUid(),
                userRecord.getEmail(),
                userRecord.getDisplayName() != null ? userRecord.getDisplayName() : "New User",
                userRecord.getPhotoUrl()
        ).getUser(); // UserCreationResult에서 User만 추출
    }

    public UserResponse getCurrentUser(String uid) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        return new UserResponse(user);
    }

    @Transactional
    public UserResponse updateUser(String uid, UpdateUserRequest request) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));

        user.updateProfile(request.getName(), request.getImageUrl());

        return new UserResponse(user);
    }

    @Transactional
    public void deleteUser(String uid) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        userRepository.delete(user);
    }

    /**
     * 게스트 사용자 목록 조회 (is_guest=true)
     * - 게스트1~16 반환
     */
    public java.util.List<UserResponse> getGuestUsers() {
        java.util.List<User> guests = userRepository.findByIsGuestOrderByIdAsc(true);
        return guests.stream()
                .map(UserResponse::new)
                .collect(java.util.stream.Collectors.toList());
    }
}
