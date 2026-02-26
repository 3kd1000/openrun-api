package com.example.openrunapi.domain.notification.model;

public enum NotificationType {
    SCHEDULE,           // 일정 관련 알림
    DRAW,               // 대진표 관련 알림
    CLUB_INVITE,        // 클럽 초대 (사용자가 수신)
    EXTERNAL_REQUEST,   // 외부 신청 도착 (운영진이 수신) - 가입/게스트/교류전
    REQUEST_RESULT,     // 신청 결과 (신청자가 수신) - 승인/거절
    MESSAGE,            // 다이렉트 메시지 (DM)
    SYSTEM              // 시스템 알림
}
