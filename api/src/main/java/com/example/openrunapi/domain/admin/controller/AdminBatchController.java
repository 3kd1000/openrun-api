package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.admin.model.dto.BatchHistoryResponse;
import com.example.openrunapi.domain.admin.service.AdminUserService;
import com.example.openrunapi.domain.batch.model.BatchJobHistory;
import com.example.openrunapi.domain.batch.service.BatchJobHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin 배치 작업 이력 조회 API
 * - 배치 작업 실행 결과 모니터링
 * - System Admin 권한 필요
 */
@RestController
@RequestMapping("/api/admin/batch")
@RequiredArgsConstructor
public class AdminBatchController {

    private final BatchJobHistoryService batchJobHistoryService;
    private final AdminUserService adminUserService;

    /**
     * 전체 배치 이력 조회 (페이징)
     */
    @GetMapping("/history")
    public ResponseEntity<Page<BatchHistoryResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        Page<BatchJobHistory> historyPage = batchJobHistoryService.getHistory(PageRequest.of(page, size));
        Page<BatchHistoryResponse> responsePage = historyPage.map(BatchHistoryResponse::from);

        return ResponseEntity.ok(responsePage);
    }

    /**
     * 특정 작업의 배치 이력 조회 (페이징)
     */
    @GetMapping("/history/{jobName}")
    public ResponseEntity<Page<BatchHistoryResponse>> getHistoryByJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        Page<BatchJobHistory> historyPage = batchJobHistoryService.getHistoryByJobName(
                jobName, PageRequest.of(page, size));
        Page<BatchHistoryResponse> responsePage = historyPage.map(BatchHistoryResponse::from);

        return ResponseEntity.ok(responsePage);
    }

    /**
     * 각 작업별 최근 실행 결과 조회 (대시보드용)
     */
    @GetMapping("/latest")
    public ResponseEntity<List<BatchHistoryResponse>> getLatestByEachJob(
            @AuthenticationPrincipal UserDetails userDetails) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        List<BatchJobHistory> latestJobs = batchJobHistoryService.getLatestByEachJob();
        List<BatchHistoryResponse> response = latestJobs.stream()
                .map(BatchHistoryResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * 특정 작업의 최근 10개 이력 조회
     */
    @GetMapping("/recent/{jobName}")
    public ResponseEntity<List<BatchHistoryResponse>> getRecentHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobName) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        List<BatchJobHistory> recentJobs = batchJobHistoryService.getRecentHistory(jobName);
        List<BatchHistoryResponse> response = recentJobs.stream()
                .map(BatchHistoryResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
