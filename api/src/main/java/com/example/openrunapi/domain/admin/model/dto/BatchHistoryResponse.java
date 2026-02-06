package com.example.openrunapi.domain.admin.model.dto;

import com.example.openrunapi.domain.batch.model.BatchJobHistory;
import com.example.openrunapi.domain.batch.model.BatchJobStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 배치 작업 이력 응답 DTO
 */
@Getter
@Builder
public class BatchHistoryResponse {

    private Long id;

    /**
     * 작업 이름 (예: SCHEDULE_MAINTENANCE, AUDIT_LOG_CLEANUP)
     */
    private String jobName;

    /**
     * 실행 상태 (RUNNING, SUCCESS, FAILED)
     */
    private BatchJobStatus status;

    /**
     * 시작 시각
     */
    private LocalDateTime startedAt;

    /**
     * 종료 시각
     */
    private LocalDateTime finishedAt;

    /**
     * 실행 시간 (밀리초)
     */
    private Long durationMs;

    /**
     * 결과 요약 (JSON 형식)
     */
    private String resultSummary;

    /**
     * 에러 메시지 (실패 시)
     */
    private String errorMessage;

    /**
     * Entity -> DTO 변환
     */
    public static BatchHistoryResponse from(BatchJobHistory entity) {
        return BatchHistoryResponse.builder()
                .id(entity.getId())
                .jobName(entity.getJobName())
                .status(entity.getStatus())
                .startedAt(entity.getStartedAt())
                .finishedAt(entity.getFinishedAt())
                .durationMs(entity.getDurationMs())
                .resultSummary(entity.getResultSummary())
                .errorMessage(entity.getErrorMessage())
                .build();
    }
}
