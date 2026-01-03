package com.example.openrunapi.domain.user.repository;

import com.example.openrunapi.domain.user.model.SystemAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemAdminRepository extends JpaRepository<SystemAdmin, Long> {

    /**
     * userId로 System Admin 조회
     */
    Optional<SystemAdmin> findByUserId(Long userId);

    /**
     * userId가 System Admin인지 확인
     */
    boolean existsByUserId(Long userId);
}
