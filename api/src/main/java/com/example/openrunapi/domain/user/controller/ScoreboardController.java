package com.example.openrunapi.domain.user.controller;

import com.example.openrunapi.domain.user.model.dto.ScoreboardResponse;
import com.example.openrunapi.domain.user.service.ScoreboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/clubs/{clubId}/scoreboard")
@RequiredArgsConstructor
public class ScoreboardController {

    private final ScoreboardService scoreboardService;

    /**
     * 클럽 스코어보드 조회
     * GET /api/clubs/{clubId}/scoreboard
     *
     * @param clubId 클럽 ID
     * @param startDate 시작일 (optional, ISO 형식: 2026-01-01T00:00:00)
     * @param endDate 종료일 (optional, ISO 형식: 2026-12-31T23:59:59)
     * @param sortBy 정렬 기준 (optional, 기본값: points) - points, totalMatches, winRate
     * @return 랭킹 리스트
     */
    @GetMapping
    public ResponseEntity<ScoreboardResponse> getScoreboard(
            @PathVariable Long clubId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false, defaultValue = "points") String sortBy
    ) {
        log.info("=== GET /api/clubs/{}/scoreboard ===", clubId);
        log.info("startDate: {}, endDate: {}, sortBy: {}", startDate, endDate, sortBy);
        
        ScoreboardResponse response = scoreboardService.getClubScoreboard(clubId, startDate, endDate, sortBy);
        return ResponseEntity.ok(response);
    }
}
