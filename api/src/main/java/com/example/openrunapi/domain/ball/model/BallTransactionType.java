package com.example.openrunapi.domain.ball.model;

/**
 * 공용구 거래 유형
 */
public enum BallTransactionType {
    /**
     * 입고: 클럽에 공용구 추가 (to_member에게 배정)
     */
    ADD,

    /**
     * 배분: 보유자 간 공용구 이동
     */
    DISTRIBUTE,

    /**
     * 사용: 일정에서 공용구 사용
     */
    USE,

    /**
     * 조정: 수량 직접 조정 (분실, 오류 수정 등)
     */
    ADJUST
}
