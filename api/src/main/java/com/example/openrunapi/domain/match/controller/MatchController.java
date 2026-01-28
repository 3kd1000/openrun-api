package com.example.openrunapi.domain.match.controller;

import com.example.openrunapi.domain.match.model.dto.BatchUpdateMatchRequest;
import com.example.openrunapi.domain.match.model.dto.MatchPageResponse;
import com.example.openrunapi.domain.match.model.dto.MatchResponse;
import com.example.openrunapi.domain.match.model.dto.UpdateMatchRequest;
import com.example.openrunapi.domain.match.service.MatchService;
import jakarta.validation.Valid;
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

    /**
     * 클럽의 대진 페이징 조회 (인피니티 스크롤용)
     * GET /api/clubs/{clubId}/matches/paged
     *
     * @param clubId 클럽 ID
     * @param playerName 선수 이름 (optional)
     * @param startDate 시작일 (optional)
     * @param endDate 종료일 (optional)
     * @param page 페이지 번호 (0부터 시작, 기본값 0)
     * @param size 페이지 크기 (기본값 20)
     * @return 페이징된 대진 목록
     */
    @GetMapping("/paged")
    public ResponseEntity<MatchPageResponse> getMatchesPaged(
            @PathVariable Long clubId,
            @RequestParam(required = false) String playerName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("=== GET /api/clubs/{}/matches/paged === page: {}, size: {}", clubId, page, size);
        log.info("playerName: {}, startDate: {}, endDate: {}", playerName, startDate, endDate);

        MatchPageResponse response = matchService.getMatchesPaged(clubId, playerName, startDate, endDate, page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * 경기 결과 업데이트
     * PUT /api/clubs/{clubId}/matches/{matchId}
     *
     * @param clubId 클럽 ID (경로 파라미터, 현재는 검증용)
     * @param matchId 경기 ID
     * @param request 경기 결과 업데이트 요청
     * @param userId 요청한 사용자 ID (Audit용)
     * @return 업데이트된 경기 정보
     */
    @PutMapping("/{matchId}")
    public ResponseEntity<MatchResponse> updateMatchResult(
            @PathVariable Long clubId,
            @PathVariable Long matchId,
            @Valid @RequestBody UpdateMatchRequest request,
            @RequestParam(required = false) Long userId
    ) {
        log.info("=== PUT /api/clubs/{}/matches/{} ===", clubId, matchId);
        log.info("request: teamAScore={}, teamBScore={}, result={}",
                request.getTeamAScore(), request.getTeamBScore(), request.getResult());

        MatchResponse response = matchService.updateMatchResult(matchId, request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 경기 결과 배치 업데이트
     * PUT /api/clubs/{clubId}/matches/batch
     *
     * @param clubId 클럽 ID (경로 파라미터, 현재는 검증용)
     * @param request 배치 업데이트 요청
     * @param userId 요청한 사용자 ID (Audit용)
     * @return 업데이트된 경기 정보 목록
     */
    @PutMapping("/batch")
    public ResponseEntity<List<MatchResponse>> updateMatchResultsBatch(
            @PathVariable Long clubId,
            @Valid @RequestBody BatchUpdateMatchRequest request,
            @RequestParam(required = false) Long userId
    ) {
        log.info("=== PUT /api/clubs/{}/matches/batch ===", clubId);
        log.info("업데이트할 경기 수: {}", request.getMatches().size());

        List<MatchResponse> responses = matchService.updateMatchResultsBatch(clubId, request, userId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 경기 결과 삭제 (초기화)
     * DELETE /api/clubs/{clubId}/matches/{matchId}/result
     *
     * @param clubId 클럽 ID (경로 파라미터, 현재는 검증용)
     * @param matchId 경기 ID
     * @return 204 No Content
     */
    @DeleteMapping("/{matchId}/result")
    public ResponseEntity<Void> deleteMatchResult(
            @PathVariable Long clubId,
            @PathVariable Long matchId
    ) {
        log.info("=== DELETE /api/clubs/{}/matches/{}/result ===", clubId, matchId);

        matchService.deleteMatchResult(matchId);
        return ResponseEntity.noContent().build();
    }
}
