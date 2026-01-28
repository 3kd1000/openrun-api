package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequest;
import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequestWithIds;
import com.example.openrunapi.domain.draw.model.dto.DrawResponse;
import com.example.openrunapi.domain.draw.service.DrawService;
import com.example.openrunapi.domain.schedule.model.dto.BatchParticipationRequest;
import com.example.openrunapi.domain.schedule.model.dto.BatchParticipationResponse;
import com.example.openrunapi.domain.schedule.model.dto.CreateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleResponse;
import com.example.openrunapi.domain.schedule.model.dto.UpdateSchedulePinnedRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleGuestRecruitRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleInterclubRecruitRequest;
import com.example.openrunapi.domain.schedule.model.dto.PublicRecruitScheduleResponse;
import com.example.openrunapi.domain.schedule.service.ScheduleParticipantService;
import com.example.openrunapi.domain.schedule.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.openrunapi.common.utils.TimeValidationUtils;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final DrawService drawService;
    private final ScheduleParticipantService participantService;

    /**
     * 일정 생성
     */
    @PostMapping
    public ResponseEntity<ScheduleResponse> createSchedule(
            @Valid @RequestBody CreateScheduleRequest request,
            @RequestParam(required = false) Long userId) {
        ScheduleResponse response = scheduleService.createSchedule(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 모든 일정 조회
     */
    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> getAllSchedules(
            @RequestParam(required = false) Long clubId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(required = false, defaultValue = "false") Boolean upcoming) {

        List<ScheduleResponse> responses;

        if (clubId != null) {
            if (upcoming) {
                // 특정 클럽의 향후 일정
                responses = scheduleService.getUpcomingSchedules(clubId);
            } else if (start != null && end != null) {
                // 특정 클럽의 날짜 범위 일정
                responses = scheduleService.getSchedulesByDateRange(clubId, start, end);
            } else {
                // 특정 클럽의 모든 일정
                responses = scheduleService.getSchedulesByClubId(clubId);
            }
        } else {
            // 전체 일정
            responses = scheduleService.getAllSchedules();
        }

        return ResponseEntity.ok(responses);
    }

    /**
     * 특정 일정 조회
     */
    @GetMapping("/{scheduleId}")
    public ResponseEntity<ScheduleResponse> getScheduleById(
            @PathVariable Long scheduleId,
            @RequestParam(required = false) Long userId) { // 권한 체크용 (optional)
        ScheduleResponse response = scheduleService.getScheduleById(scheduleId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 일정 수정
     */
    @PutMapping("/{scheduleId}")
    public ResponseEntity<ScheduleResponse> updateSchedule(
            @PathVariable Long scheduleId,
            @Valid @RequestBody UpdateScheduleRequest request,
            @RequestParam(required = false) Long userId) {
        ScheduleResponse response = scheduleService.updateSchedule(scheduleId, request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 일정 삭제
     */
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable Long scheduleId,
            @RequestParam(required = false) Long userId) {
        scheduleService.deleteSchedule(scheduleId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 일정 PIN(공지성 고정) 설정/해제 - 운영진 이상
     * - schedules API는 현재 개발 단계로 인증이 완전히 강제되지 않아 userId를 파라미터로 받습니다.
     */
    @PatchMapping("/{scheduleId}/pinned")
    public ResponseEntity<ScheduleResponse> updatePinned(
            @PathVariable Long scheduleId,
            @RequestParam Long userId,
            @RequestBody(required = false) UpdateSchedulePinnedRequest request
    ) {
        ScheduleResponse response = scheduleService.updatePinned(scheduleId, request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 일정 게스트 모집 ON/OFF 및 안내문 설정 - 운영진 이상
     */
    @PatchMapping("/{scheduleId}/guest-recruit")
    public ResponseEntity<ScheduleResponse> updateGuestRecruit(
            @PathVariable Long scheduleId,
            @RequestParam Long userId,
            @RequestBody(required = false) UpdateScheduleGuestRecruitRequest request
    ) {
        ScheduleResponse response = scheduleService.updateGuestRecruit(scheduleId, request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 일정 교류전 모집 ON/OFF 및 안내문 설정 - 운영진 이상
     */
    @PatchMapping("/{scheduleId}/interclub-recruit")
    public ResponseEntity<ScheduleResponse> updateInterclubRecruit(
            @PathVariable Long scheduleId,
            @RequestParam Long userId,
            @RequestBody(required = false) UpdateScheduleInterclubRecruitRequest request
    ) {
        ScheduleResponse response = scheduleService.updateInterclubRecruit(scheduleId, request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 탐색 화면용: 게스트/교류전 모집 중인 일정 목록 (공개)
     * GET /api/schedules/recruit?type=GUEST&matchType=MENS_DOUBLES&fromDate=2026-01-22&toDate=2026-01-31&limit=10
     */
    @GetMapping("/recruit")
    public ResponseEntity<List<PublicRecruitScheduleResponse>> getPublicRecruitSchedules(
            @RequestParam(required = false, defaultValue = "GUEST") String type,
            @RequestParam(required = false) String matchType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate toDate,
            @RequestParam(required = false) Integer limit
    ) {
        List<PublicRecruitScheduleResponse> list = scheduleService.getPublicRecruitSchedules(type, matchType, fromDate, toDate, limit);
        return ResponseEntity.ok(list);
    }

    /**
     * 내가 참여한 일정 ID 목록 조회
     */
    @GetMapping("/my-participations")
    public ResponseEntity<List<Long>> getMyParticipations(@RequestParam Long userId) {
        List<Long> scheduleIds = scheduleService.getMyParticipatingScheduleIds(userId);
        return ResponseEntity.ok(scheduleIds);
    }

    /**
     * 일정 참가신청/취소 배치 처리
     * - 여러 일정에 대해 한 번에 참가신청 또는 취소
     * - 각 작업은 독립적으로 처리 (일부 실패해도 나머지는 계속 진행)
     */
    @PostMapping("/participants/batch")
    public ResponseEntity<BatchParticipationResponse> batchParticipation(
            @RequestBody BatchParticipationRequest request,
            @RequestParam Long userId) {
        BatchParticipationResponse response = participantService.batchParticipation(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 클럽용 대진 생성 (DB 저장) - userName 기반 (기존 API)
     */
    @PostMapping("/{scheduleId}/draw")
    public ResponseEntity<DrawResponse> createDrawForSchedule(
            @PathVariable Long scheduleId,
            @Valid @RequestBody CreateDrawRequest request) {

        // 일정 존재 확인 및 조회
        ScheduleResponse scheduleResponse = scheduleService.getScheduleById(scheduleId);

        // 대진 생성 (draw_statistics 자동 증가 포함)
        DrawResponse response = drawService.generateDrawSequence(request);

        // Match 테이블에 저장
        scheduleService.saveMatchesFromDraw(scheduleId, scheduleResponse, response, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 클럽용 대진 생성 (DB 저장) - userId 기반 (신규 API, 동명이인 문제 해결)
     */
    @PostMapping("/{scheduleId}/draw/with-ids")
    public ResponseEntity<DrawResponse> createDrawForScheduleWithIds(
            @PathVariable Long scheduleId,
            @Valid @RequestBody CreateDrawRequestWithIds request) {

        // 일정 존재 확인 및 조회
        ScheduleResponse scheduleResponse = scheduleService.getScheduleById(scheduleId);
        
        // 과거 일정 체크 (KST 기준)
        if (TimeValidationUtils.isPast(scheduleResponse.getScheduledAt())) {
            throw new IllegalStateException("이미 지난 일정에는 대진을 생성할 수 없습니다.");
        }

        // userId를 userName으로 변환하여 CreateDrawRequest 생성
        CreateDrawRequest drawRequest = convertToCreateDrawRequest(request);

        // 대진 생성 (draw_statistics 자동 증가 포함)
        DrawResponse response = drawService.generateDrawSequence(drawRequest);

        // Match 테이블에 저장 (userId 기반)
        scheduleService.saveMatchesFromDrawWithIds(scheduleId, scheduleResponse, response, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * CreateDrawRequestWithIds를 CreateDrawRequest로 변환
     */
    private CreateDrawRequest convertToCreateDrawRequest(
            CreateDrawRequestWithIds request) {
        // userId를 userName으로 변환
        List<String> userNames = scheduleService.convertUserIdsToNames(request.getUserIds());
        List<String> seedUserNames = request.getSeedUserIds() != null 
                ? scheduleService.convertUserIdsToNames(request.getSeedUserIds()) : null;
        List<String> groupAUserNames = request.getGroupAUserIds() != null 
                ? scheduleService.convertUserIdsToNames(request.getGroupAUserIds()) : null;
        List<String> groupBUserNames = request.getGroupBUserIds() != null 
                ? scheduleService.convertUserIdsToNames(request.getGroupBUserIds()) : null;

        return new CreateDrawRequest(
                userNames,
                seedUserNames,
                request.getDrawType(),
                groupAUserNames,
                groupBUserNames,
                request.getNumberOfTotalPlayer()
        );
    }

    /**
     * 일정의 대진표 조회
     */
    @GetMapping("/{scheduleId}/draw")
    public ResponseEntity<DrawResponse> getDrawForSchedule(@PathVariable Long scheduleId) {
        DrawResponse response = scheduleService.getDrawForSchedule(scheduleId);
        return ResponseEntity.ok(response);
    }

    /**
     * 일정의 대진표 삭제
     */
    @DeleteMapping("/{scheduleId}/draw")
    public ResponseEntity<Void> deleteDrawForSchedule(@PathVariable Long scheduleId) {
        scheduleService.deleteDrawForSchedule(scheduleId);
        return ResponseEntity.noContent().build();
    }
}
