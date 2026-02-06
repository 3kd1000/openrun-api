package com.example.openrunapi.domain.batch.service;

import com.example.openrunapi.domain.batch.model.BatchJobHistory;
import com.example.openrunapi.domain.batch.model.BatchJobStatus;
import com.example.openrunapi.domain.batch.repository.BatchJobHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 배치 작업 이력 관리 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BatchJobHistoryService {

    private final BatchJobHistoryRepository batchJobHistoryRepository;

    /**
     * 배치 작업 시작 기록
     * - 별도 트랜잭션으로 실행 (배치 작업 실패해도 이력은 저장)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BatchJobHistory startJob(String jobName) {
        BatchJobHistory history = BatchJobHistory.builder()
                .jobName(jobName)
                .status(BatchJobStatus.RUNNING)
                .startedAt(LocalDateTime.now())
                .build();

        return batchJobHistoryRepository.save(history);
    }

    /**
     * 배치 작업 성공 기록
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markSuccess(Long historyId, String resultSummary) {
        batchJobHistoryRepository.findById(historyId).ifPresent(history -> {
            history.markSuccess(resultSummary);
            batchJobHistoryRepository.save(history);
            log.info("[배치 완료] {} - {}", history.getJobName(), resultSummary);
        });
    }

    /**
     * 배치 작업 실패 기록
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long historyId, String errorMessage) {
        batchJobHistoryRepository.findById(historyId).ifPresent(history -> {
            history.markFailed(errorMessage);
            batchJobHistoryRepository.save(history);
            log.error("[배치 실패] {} - {}", history.getJobName(), errorMessage);
        });
    }

    /**
     * 전체 실행 이력 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<BatchJobHistory> getHistory(Pageable pageable) {
        return batchJobHistoryRepository.findAllByOrderByStartedAtDesc(pageable);
    }

    /**
     * 특정 작업의 실행 이력 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<BatchJobHistory> getHistoryByJobName(String jobName, Pageable pageable) {
        return batchJobHistoryRepository.findByJobNameOrderByStartedAtDesc(jobName, pageable);
    }

    /**
     * 각 작업별 최근 실행 기록 조회
     */
    @Transactional(readOnly = true)
    public List<BatchJobHistory> getLatestByEachJob() {
        return batchJobHistoryRepository.findLatestByEachJob();
    }

    /**
     * 특정 작업의 최근 10개 실행 기록 조회
     */
    @Transactional(readOnly = true)
    public List<BatchJobHistory> getRecentHistory(String jobName) {
        return batchJobHistoryRepository.findTop10ByJobNameOrderByStartedAtDesc(jobName);
    }
}
