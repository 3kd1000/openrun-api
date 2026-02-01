package com.example.openrunapi.domain.ball.controller;

import com.example.openrunapi.domain.ball.model.dto.*;
import com.example.openrunapi.domain.ball.service.ClubBallService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs/{clubId}/balls")
@RequiredArgsConstructor
public class ClubBallController {

    private final ClubBallService clubBallService;
    private final UserService userService;

    /**
     * 공용구 현황 조회 (보유자 목록 + 수량)
     */
    @GetMapping
    public ResponseEntity<BallSummaryResponse> getBallSummary(
            @PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        BallSummaryResponse response = clubBallService.getBallSummary(clubId, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 거래 내역 조회 (페이징)
     */
    @GetMapping("/transactions")
    public ResponseEntity<Page<BallTransactionResponse>> getTransactions(
            @PathVariable Long clubId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        Page<BallTransactionResponse> response = clubBallService.getTransactions(clubId, currentUser.getId(), pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * 일정별 사용 내역 조회
     */
    @GetMapping("/schedules/{scheduleId}/usages")
    public ResponseEntity<List<BallTransactionResponse>> getScheduleUsages(
            @PathVariable Long clubId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<BallTransactionResponse> response = clubBallService.getScheduleUsages(clubId, scheduleId, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 공용구 입고 (ADMIN+)
     */
    @PostMapping("/add")
    public ResponseEntity<BallTransactionResponse> addBalls(
            @PathVariable Long clubId,
            @Valid @RequestBody AddBallRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        BallTransactionResponse response = clubBallService.addBalls(clubId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 공용구 배분 (ADMIN+)
     */
    @PostMapping("/distribute")
    public ResponseEntity<BallTransactionResponse> distributeBalls(
            @PathVariable Long clubId,
            @Valid @RequestBody DistributeBallRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        BallTransactionResponse response = clubBallService.distributeBalls(clubId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 공용구 사용 기록 (본인(보유자) or ADMIN+)
     */
    @PostMapping("/use")
    public ResponseEntity<BallTransactionResponse> useBalls(
            @PathVariable Long clubId,
            @Valid @RequestBody UseBallRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        BallTransactionResponse response = clubBallService.useBalls(clubId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 보유자 지정/해제 (ADMIN+)
     */
    @PutMapping("/members/{memberId}/keeper")
    public ResponseEntity<Void> updateBallKeeper(
            @PathVariable Long clubId,
            @PathVariable Long memberId,
            @Valid @RequestBody UpdateBallKeeperRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        clubBallService.updateBallKeeper(clubId, memberId, request, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * 사용 기록 삭제 (본인(보유자) or ADMIN+)
     * - USE 타입 트랜잭션만 삭제 가능
     * - 삭제 시 보유자 수량 복원
     */
    @DeleteMapping("/transactions/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long clubId,
            @PathVariable Long transactionId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        clubBallService.deleteTransaction(clubId, transactionId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * 공용구 수량 일괄 조정 (ADMIN+)
     * - 재고관리용 배치 업데이트
     * - quantity는 차이값 (양수: 증가, 음수: 감소)
     */
    @PostMapping("/adjust/batch")
    public ResponseEntity<Void> batchAdjustQuantities(
            @PathVariable Long clubId,
            @Valid @RequestBody BatchAdjustBallRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        clubBallService.batchAdjustQuantities(clubId, request, currentUser.getId());
        return ResponseEntity.ok().build();
    }
}
