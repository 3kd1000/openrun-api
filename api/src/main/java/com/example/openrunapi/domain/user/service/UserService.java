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
        User user = userRepository.findByFirebaseUid(uid).orElseGet(() -> {
            try {
                UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
                return getOrCreateUser(userRecord);
            } catch (FirebaseAuthException e) {
                throw new UsernameNotFoundException("Failed to fetch user data from Firebase.", e);
            }
        });

        return new org.springframework.security.core.userdetails.User(
                user.getFirebaseUid(),
                "",
                new ArrayList<>());
    }

    @Transactional
    public UserDetails loadUserById(Long id) throws UsernameNotFoundException {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        return new org.springframework.security.core.userdetails.User(
                user.getFirebaseUid(),
                "",
                new ArrayList<>());
    }

    @Transactional
    public User getOrCreateUser(UserRecord userRecord) {
        return userRepository.findByFirebaseUid(userRecord.getUid()).orElseGet(() -> {
            User newUser = User.builder()
                    .firebaseUid(userRecord.getUid())
                    .email(userRecord.getEmail())
                    .name(userRecord.getDisplayName() != null ? userRecord.getDisplayName() : "New User")
                    .imageUrl(userRecord.getPhotoUrl())
                    .build();
            return userRepository.save(newUser);
        });
    }

    public UserResponse getCurrentUser(String uid) {
        User user = userRepository.findByFirebaseUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        return new UserResponse(user);
    }

    @Transactional
    public UserResponse updateUser(String uid, UpdateUserRequest request) {
        User user = userRepository.findByFirebaseUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));

        user.updateProfile(request.getName(), request.getImageUrl()); // name 사용

        return new UserResponse(user);
    }

    @Transactional
    public void deleteUser(String uid) {
        User user = userRepository.findByFirebaseUid(uid)
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
