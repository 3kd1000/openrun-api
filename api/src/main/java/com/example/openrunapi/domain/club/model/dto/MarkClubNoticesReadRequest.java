package com.example.openrunapi.domain.club.model.dto;

import lombok.Getter;

/**
 * 공지 읽음 처리 요청
 * - upToNoticeId: 이 id 이하 공지를 모두 읽음 처리 (null이면 "최신 공지까지"로 간주)
 */
@Getter
public class MarkClubNoticesReadRequest {
    private Long upToNoticeId;
}

