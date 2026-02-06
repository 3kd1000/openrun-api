package com.example.openrunapi.domain.batch.repository;

import com.example.openrunapi.domain.batch.model.BatchJobHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BatchJobHistoryRepository extends JpaRepository<BatchJobHistory, Long> {

    /**
     * 최근 실행 이력 조회 (페이징)
     */
    Page<BatchJobHistory> findAllByOrderByStartedAtDesc(Pageable pageable);

    /**
     * 특정 작업의 최근 실행 이력 조회
     */
    Page<BatchJobHistory> findByJobNameOrderByStartedAtDesc(String jobName, Pageable pageable);

    /**
     * 특정 작업의 마지막 실행 기록 조회
     */
    Optional<BatchJobHistory> findTopByJobNameOrderByStartedAtDesc(String jobName);

    /**
     * 각 작업별 최근 실행 기록 조회
     */
    @Query("SELECT b FROM BatchJobHistory b WHERE b.startedAt = " +
           "(SELECT MAX(b2.startedAt) FROM BatchJobHistory b2 WHERE b2.jobName = b.jobName)")
    List<BatchJobHistory> findLatestByEachJob();

    /**
     * 특정 작업의 최근 N개 실행 기록 조회
     */
    List<BatchJobHistory> findTop10ByJobNameOrderByStartedAtDesc(String jobName);
}
