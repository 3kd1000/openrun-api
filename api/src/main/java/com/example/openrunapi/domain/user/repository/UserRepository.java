package com.example.openrunapi.domain.user.repository;

import com.example.openrunapi.domain.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByName(String name);

    // 게스트 사용자 목록 조회 (ID 오름차순)
    List<User> findByIsGuestOrderByIdAsc(boolean isGuest);
}
