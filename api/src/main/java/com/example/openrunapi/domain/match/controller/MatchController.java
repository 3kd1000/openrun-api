package com.example.openrunapi.domain.match.controller;

import com.example.openrunapi.domain.match.model.dto.MatchResponse;
import com.example.openrunapi.domain.match.service.MatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/clubs/{clubId}/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    /**
     * 클럽의 대진 목록 조회
     * GET /api/clubs/{clubId}/matches
     *
     * @param clubId 클럽 ID
     * @param playerName 선수 이름 (optional)
     * @param startDate 시작일 (optional, ISO 형식: 2025-01-01T00:00:00)
     * @param endDate 종료일 (optional, ISO 형식: 2025-12-31T23:59:59)
     * @return 대진 목록
     */
    @GetMapping
    public ResponseEntity<List<MatchResponse>> getMatches(
            @PathVariable Long clubId,
            @RequestParam(required = false) String playerName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("=== GET /api/clubs/{}/matches ===", clubId);
        log.info("playerName: {}, startDate: {}, endDate: {}", playerName, startDate, endDate);

        List<MatchResponse> matches = matchService.getMatches(clubId, playerName, startDate, endDate);
        return ResponseEntity.ok(matches);
    }
}
