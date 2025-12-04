package com.example.openrunapi.domain.user.repository;

import com.example.openrunapi.domain.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByFirebaseUid(String firebaseUid);

    Optional<User> findBySocialId(String socialId);

    Optional<User> findByEmail(String email);
}
