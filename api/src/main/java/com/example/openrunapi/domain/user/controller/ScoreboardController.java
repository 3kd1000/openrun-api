package com.example.openrunapi.domain.user.controller;

import com.example.openrunapi.domain.user.model.dto.ScoreboardResponse;
import com.example.openrunapi.domain.user.service.ScoreboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
     * @return 랭킹 리스트 (승점 순)
     */
    @GetMapping
    public ResponseEntity<ScoreboardResponse> getScoreboard(@PathVariable Long clubId) {
        log.info("스코어보드 조회 요청: club_id={}", clubId);

        ScoreboardResponse response = scoreboardService.getClubScoreboard(clubId);

        return ResponseEntity.ok(response);
    }
}
