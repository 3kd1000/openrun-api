package com.example.openrunapi.domain.user.repository;

import com.example.openrunapi.domain.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByName(String name);

    // 게스트 사용자 목록 조회 (ID 오름차순)
    List<User> findByIsGuestOrderByIdAsc(boolean isGuest);

    // ======== 통계용 쿼리 ========

    /**
     * 전체 사용자 수 (게스트 제외)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.isGuest = false")
    long countNonGuestUsers();

    /**
     * 특정 기간 내에 로그인한 사용자 수 (게스트 제외)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.isGuest = false AND u.lastLoginAt >= :since")
    long countActiveUsersSince(@Param("since") LocalDateTime since);

    /**
     * 특정 기간 내에 가입한 사용자 수 (게스트 제외)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.isGuest = false AND u.createdAt >= :since")
    long countNewUsersSince(@Param("since") LocalDateTime since);
}
