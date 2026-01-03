package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.schedule.model.dto.BulkUpdateParticipantsRequest;
import com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse;
import com.example.openrunapi.domain.schedule.service.ScheduleParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
     * 참가 신청 취소
     */
    @DeleteMapping
    public ResponseEntity<Void> cancelParticipation(
            @PathVariable Long scheduleId,
            @RequestParam Long userId) { // TODO: 나중에 SecurityContext에서 가져오기
        participantService.cancelParticipation(scheduleId, userId);
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
     */
    @GetMapping("/me")
    public ResponseEntity<ParticipantResponse> getMyParticipation(
            @PathVariable Long scheduleId,
            @RequestParam Long userId) { // TODO: 나중에 SecurityContext에서 가져오기
        ParticipantResponse response = participantService.getMyParticipation(scheduleId, userId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
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
