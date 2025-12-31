package com.example.openrunapi.domain.user.repository;

import com.example.openrunapi.domain.user.model.WebAuthnCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, Long> {

    /**
     * 특정 사용자의 모든 Credential 조회
     */
    List<WebAuthnCredential> findByUserId(Long userId);

    /**
     * Credential ID로 조회 (인증 시 사용)
     */
    Optional<WebAuthnCredential> findByCredentialId(String credentialId);

    /**
     * 특정 사용자가 해당 Credential을 소유하고 있는지 확인
     */
    boolean existsByUserIdAndCredentialId(Long userId, String credentialId);

    /**
     * 사용자가 등록한 Credential 개수
     */
    long countByUserId(Long userId);
}
