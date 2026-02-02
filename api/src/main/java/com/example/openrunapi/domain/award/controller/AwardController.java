package com.example.openrunapi.domain.award.controller;

import com.example.openrunapi.domain.award.model.dto.AwardRankingResponse;
import com.example.openrunapi.domain.award.model.dto.AwardWinnerResponse;
import com.example.openrunapi.domain.award.model.dto.AwardWinnersResponse;
import com.example.openrunapi.domain.award.model.dto.SaveAwardWinnerRequest;
import com.example.openrunapi.domain.award.service.AwardService;
import com.example.openrunapi.domain.club.model.AwardPeriod;
import com.example.openrunapi.domain.club.model.AwardType;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clubs/{clubId}/awards")
@RequiredArgsConstructor
public class AwardController {

    private final AwardService awardService;

    /**
     * 어워드 랭킹 조회
     *
     * @param clubId    클럽 ID
     * @param type      어워드 타입 (ATTENDANCE, POINTS, BOOKING) - 생략 시 활성화된 모든 타입 반환
     * @param startDate 조회 시작일 - 생략 시 현재 정산 주기 기준
     * @param endDate   조회 종료일 - 생략 시 현재 정산 주기 기준
     * @param limit     조회 개수 (기본 10)
     */
    @GetMapping
    public ResponseEntity<List<AwardRankingResponse>> getAwardRankings(
            @PathVariable Long clubId,
            @RequestParam(required = false) AwardType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "10") Integer limit
    ) {
        List<AwardRankingResponse> rankings = awardService.getAwardRankings(
                clubId, type, startDate, endDate, limit
        );
        return ResponseEntity.ok(rankings);
    }

    /**
     * 현재 정산 주기의 어워드 수상자(1등) 조회
     * 크라운 배지 표시에 사용
     *
     * @param clubId 클럽 ID
     */
    @GetMapping("/winners")
    public ResponseEntity<AwardWinnersResponse> getCurrentWinners(@PathVariable Long clubId) {
        AwardWinnersResponse winners = awardService.getCurrentWinners(clubId);
        return ResponseEntity.ok(winners);
    }

    // ==================== Admin 수상자 관리 ====================

    /**
     * 수상자 저장 (Admin용 - 수동 입력)
     */
    @PostMapping("/manage")
    public ResponseEntity<AwardWinnerResponse> saveAwardWinner(
            @PathVariable Long clubId,
            @RequestBody SaveAwardWinnerRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        AwardWinnerResponse response = awardService.saveAwardWinner(clubId, request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 클럽의 특정 기간 수상자 목록 조회 (Admin용)
     */
    @GetMapping("/manage")
    public ResponseEntity<List<AwardWinnerResponse>> getAwardWinners(
            @PathVariable Long clubId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd
    ) {
        List<AwardWinnerResponse> winners = awardService.getAwardWinners(clubId, periodStart, periodEnd);
        return ResponseEntity.ok(winners);
    }

    /**
     * 클럽의 모든 수상 기록 조회 (Admin용)
     */
    @GetMapping("/manage/all")
    public ResponseEntity<List<AwardWinnerResponse>> getAllAwardWinners(@PathVariable Long clubId) {
        List<AwardWinnerResponse> winners = awardService.getAllAwardWinners(clubId);
        return ResponseEntity.ok(winners);
    }

    /**
     * 수상자 삭제 (Admin용)
     */
    @DeleteMapping("/manage/{winnerId}")
    public ResponseEntity<Void> deleteAwardWinner(
            @PathVariable Long clubId,
            @PathVariable Long winnerId
    ) {
        awardService.deleteAwardWinner(winnerId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 기간 옵션 생성 (Admin용)
     */
    @GetMapping("/periods")
    public ResponseEntity<List<Map<String, Object>>> getPeriodOptions(
            @PathVariable Long clubId,
            @RequestParam(defaultValue = "HALF_YEAR") AwardPeriod period,
            @RequestParam(defaultValue = "6") int count
    ) {
        List<Map<String, Object>> options = awardService.generatePeriodOptions(period, count);
        return ResponseEntity.ok(options);
    }
}
