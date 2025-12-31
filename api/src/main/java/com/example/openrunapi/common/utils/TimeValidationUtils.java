package com.example.openrunapi.common.utils;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * 시간 검증 유틸리티 클래스
 * 모든 시간 비교는 KST(한국 표준시) 기준으로 수행됩니다.
 */
public class TimeValidationUtils {

    private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");

    /**
     * KST(한국 표준시) 현재 시간 가져오기
     *
     * @return KST 기준 현재 시간
     */
    public static LocalDateTime getNowKST() {
        return LocalDateTime.now(KST_ZONE);
    }

    /**
     * targetTime이 현재 시간(KST) 이후인지 확인
     * 예: 참가신청 시작시간 이후에 신청 가능한지 확인
     *
     * @param targetTime 기준 시간
     * @return targetTime이 현재 시간 이후이면 true
     */
    public static boolean isAfter(LocalDateTime targetTime) {
        if (targetTime == null) {
            return false;
        }
        return getNowKST().isAfter(targetTime);
    }

    /**
     * targetTime이 현재 시간(KST) 이전인지 확인
     * 예: 일정 시간 이전에만 수정 가능한지 확인
     *
     * @param targetTime 기준 시간
     * @return targetTime이 현재 시간 이전이면 true
     */
    public static boolean isBefore(LocalDateTime targetTime) {
        if (targetTime == null) {
            return false;
        }
        return getNowKST().isBefore(targetTime);
    }

    /**
     * targetTime이 현재 시간(KST)보다 과거인지 확인
     * 예: 과거 일정에는 참가신청/수정 불가능한지 확인
     *
     * @param targetTime 기준 시간
     * @return targetTime이 현재 시간보다 과거이면 true
     */
    public static boolean isPast(LocalDateTime targetTime) {
        if (targetTime == null) {
            return false;
        }
        return targetTime.isBefore(getNowKST());
    }

    /**
     * targetTime이 현재 시간(KST)보다 미래인지 확인
     * 예: 미래 일정인지 확인
     *
     * @param targetTime 기준 시간
     * @return targetTime이 현재 시간보다 미래이면 true
     */
    public static boolean isFuture(LocalDateTime targetTime) {
        if (targetTime == null) {
            return false;
        }
        return targetTime.isAfter(getNowKST());
    }

    /**
     * 범용 시간 검증 메서드
     * targetTime과 비교 조건을 파라미터로 받아서 검증
     *
     * @param targetTime 기준 시간
     * @param condition 비교 조건 (AFTER, BEFORE, PAST, FUTURE)
     * @return 조건을 만족하면 true
     */
    public static boolean validateTime(LocalDateTime targetTime, TimeCondition condition) {
        if (targetTime == null || condition == null) {
            return false;
        }

        return switch (condition) {
            case AFTER -> isAfter(targetTime);
            case BEFORE -> isBefore(targetTime);
            case PAST -> isPast(targetTime);
            case FUTURE -> isFuture(targetTime);
        };
    }

    /**
     * 시간 비교 조건 열거형
     */
    public enum TimeCondition {
        /**
         * targetTime 이후 (현재 시간 > targetTime)
         * 예: 참가신청 시작시간 이후에 신청 가능
         */
        AFTER,

        /**
         * targetTime 이전 (현재 시간 < targetTime)
         * 예: 일정 시간 이전에만 수정 가능
         */
        BEFORE,

        /**
         * targetTime이 과거 (targetTime < 현재 시간)
         * 예: 과거 일정에는 참가신청 불가
         */
        PAST,

        /**
         * targetTime이 미래 (targetTime > 현재 시간)
         * 예: 미래 일정인지 확인
         */
        FUTURE
    }
}

