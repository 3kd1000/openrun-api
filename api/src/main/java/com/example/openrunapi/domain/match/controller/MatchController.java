package com.example.openrunapi.domain.match.controller;

import com.example.openrunapi.domain.match.model.dto.BatchUpdateMatchRequest;
import com.example.openrunapi.domain.match.model.dto.MatchPageResponse;
import com.example.openrunapi.domain.match.model.dto.MatchResponse;
import com.example.openrunapi.domain.match.model.dto.UpdateMatchRequest;
import com.example.openrunapi.domain.match.service.MatchService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/clubs/{clubId}/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final UserService userService;

    /**
     * 클럽의 대진 목록 조회
     * GET /api/clubs/{clubId}/matches
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
     */
    @PutMapping("/{matchId}")
    public ResponseEntity<MatchResponse> updateMatchResult(
            @PathVariable Long clubId,
            @PathVariable Long matchId,
            @Valid @RequestBody UpdateMatchRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("=== PUT /api/clubs/{}/matches/{} ===", clubId, matchId);
        log.info("request: teamAScore={}, teamBScore={}, result={}",
                request.getTeamAScore(), request.getTeamBScore(), request.getResult());

        Long userId = resolveUserId(userDetails);
        MatchResponse response = matchService.updateMatchResult(matchId, request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 경기 결과 배치 업데이트
     * PUT /api/clubs/{clubId}/matches/batch
     */
    @PutMapping("/batch")
    public ResponseEntity<List<MatchResponse>> updateMatchResultsBatch(
            @PathVariable Long clubId,
            @Valid @RequestBody BatchUpdateMatchRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("=== PUT /api/clubs/{}/matches/batch ===", clubId);
        log.info("업데이트할 경기 수: {}", request.getMatches().size());

        Long userId = resolveUserId(userDetails);
        List<MatchResponse> responses = matchService.updateMatchResultsBatch(clubId, request, userId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 경기 결과 삭제 (초기화)
     * DELETE /api/clubs/{clubId}/matches/{matchId}/result
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

    /**
     * 인증 선택: UserDetails에서 userId 추출 (Audit 용도, null 허용)
     */
    private Long resolveUserId(UserDetails userDetails) {
        if (userDetails == null) {
            return null;
        }
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        return currentUser.getId();
    }
}
