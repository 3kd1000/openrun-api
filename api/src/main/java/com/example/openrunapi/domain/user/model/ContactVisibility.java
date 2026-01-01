package com.example.openrunapi.domain.user.model;

/**
 * 연락처 및 이메일 공개 범위
 */
public enum ContactVisibility {
    PRIVATE,    // 비공개 (본인만)
    CLUB_ONLY,  // 클럽원만 공개
    PUBLIC      // 전체 공개
}
