package com.example.openrunapi.domain.batch.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 배치 작업 실행 이력 엔티티
 */
@Getter
@Entity
@Table(name = "batch_job_history")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BatchJobHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_name", nullable = false, length = 100)
    private String jobName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BatchJobStatus status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "result_summary", columnDefinition = "TEXT")
    private String resultSummary;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder
    public BatchJobHistory(String jobName, BatchJobStatus status, LocalDateTime startedAt) {
        this.jobName = jobName;
        this.status = status;
        this.startedAt = startedAt;
    }

    /**
     * 작업 성공 시 완료 처리
     */
    public void markSuccess(String resultSummary) {
        this.status = BatchJobStatus.SUCCESS;
        this.finishedAt = LocalDateTime.now();
        this.durationMs = java.time.Duration.between(startedAt, finishedAt).toMillis();
        this.resultSummary = resultSummary;
    }

    /**
     * 작업 실패 시 완료 처리
     */
    public void markFailed(String errorMessage) {
        this.status = BatchJobStatus.FAILED;
        this.finishedAt = LocalDateTime.now();
        this.durationMs = java.time.Duration.between(startedAt, finishedAt).toMillis();
        this.errorMessage = errorMessage;
    }
}
