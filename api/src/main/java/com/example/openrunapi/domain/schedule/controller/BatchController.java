package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.schedule.service.ScheduleMaintenanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 배치 작업 수동 실행 컨트롤러
 * 테스트 및 관리 목적
 */
@Slf4j
@RestController
@RequestMapping("/api/batch")
@RequiredArgsConstructor
public class BatchController {

    private final ScheduleMaintenanceService scheduleMaintenanceService;

    /**
     * 과거 일정 플래그 자동 OFF 배치 수동 실행
     *
     * 사용법:
     * curl -X POST http://localhost:8080/api/batch/execute-now
     *
     * @return 실행 결과 메시지
     */
    @PostMapping("/execute-now")
    public ResponseEntity<Map<String, String>> executeBatchNow() {
        log.info("[API 호출] 배치 작업 수동 실행 요청");

        try {
            String result = scheduleMaintenanceService.executeNow();
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", result
            ));
        } catch (Exception e) {
            log.error("[API 오류] 배치 작업 수동 실행 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "배치 작업 실행 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
}
