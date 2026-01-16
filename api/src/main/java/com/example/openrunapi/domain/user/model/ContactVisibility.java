package com.example.openrunapi.domain.user.model;

/**
 * 연락처 및 이메일 공개 범위
 */
public enum ContactVisibility {
    PRIVATE,    // 비공개 (나만 볼 수 있음)
    PUBLIC      // 공개 (클럽원 및 게스트 참여 시 공유)
}
