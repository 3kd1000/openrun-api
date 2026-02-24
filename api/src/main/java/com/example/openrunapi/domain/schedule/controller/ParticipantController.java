package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.schedule.model.dto.BulkUpdateParticipantsRequest;
import com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse;
import com.example.openrunapi.domain.schedule.service.ScheduleParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedules/{scheduleId}/participants")
@RequiredArgsConstructor
public class ParticipantController {

    private final ScheduleParticipantService participantService;

    /**
     * 일정 참가 신청
     */
    @PostMapping
    public ResponseEntity<ParticipantResponse> joinSchedule(
            @PathVariable Long scheduleId,
            @RequestParam Long userId) { // TODO: 나중에 SecurityContext에서 가져오기
        ParticipantResponse response = participantService.joinSchedule(scheduleId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 참가 신청 취소 (CONFIRMED/WAITING 상태, 카운터 감소)
     */
    @DeleteMapping
    public ResponseEntity<Void> cancelParticipation(
            @PathVariable Long scheduleId,
            @RequestParam Long userId) { // TODO: 나중에 SecurityContext에서 가져오기
        participantService.cancelParticipation(scheduleId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PENDING 상태의 게스트 참가 신청 취소 (카운터 변경 없음)
     * DELETE /api/schedules/{scheduleId}/participants/request
     */
    @DeleteMapping("/request")
    public ResponseEntity<Void> cancelParticipantRequest(
            @PathVariable Long scheduleId,
            @RequestParam Long userId) {
        participantService.cancelParticipantRequest(scheduleId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 특정 일정의 참가자 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<ParticipantResponse>> getParticipants(@PathVariable Long scheduleId) {
        List<ParticipantResponse> participants = participantService.getParticipants(scheduleId);
        return ResponseEntity.ok(participants);
    }

    /**
     * 내 참가 신청 내역 조회
     * - 참가하지 않은 경우에도 200 OK 반환 (404가 아님)
     * - 참가 여부 확인은 정상적인 조회 성공이므로 에러가 아님
     * - Map으로 감싸서 null도 JSON으로 직렬화 ("data": null)
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, ParticipantResponse>> getMyParticipation(
            @PathVariable Long scheduleId,
            @RequestParam Long userId) { // TODO: 나중에 SecurityContext에서 가져오기
        ParticipantResponse response = participantService.getMyParticipation(scheduleId, userId);
        // Map으로 감싸면 null도 JSON으로 직렬화됨: {"data": null}
        return ResponseEntity.ok(Collections.singletonMap("data", response));
    }

    /**
     * 참가자 일괄 수정 (운영진 전용)
     * - System Admin 또는 Club ADMIN 이상만 가능
     * - 기존 참가자의 position 유지
     * - 새로 추가되는 참가자는 마지막에 append
     */
    @PutMapping("/bulk")
    public ResponseEntity<Void> bulkUpdateParticipants(
            @PathVariable Long scheduleId,
            @RequestBody BulkUpdateParticipantsRequest request,
            @RequestParam Long userId) { // TODO: 나중에 SecurityContext에서 가져오기
        participantService.bulkUpdateParticipants(scheduleId, request.getUserIds(), userId);
        return ResponseEntity.ok().build();
    }
}
