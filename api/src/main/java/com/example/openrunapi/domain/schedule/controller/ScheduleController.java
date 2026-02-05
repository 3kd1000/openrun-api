package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.draw.model.DrawType;
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
import com.example.openrunapi.domain.schedule.model.dto.ScheduleCursorResponse;
import com.example.openrunapi.domain.schedule.service.ScheduleParticipantService;
import com.example.openrunapi.domain.schedule.service.ScheduleService;
import com.example.openrunapi.common.service.PermissionService;
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
    private final PermissionService permissionService;

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
     * - clubId가 있는 경우: 해당 클럽의 멤버만 조회 가능
     * - clubId가 없는 경우: System Admin만 전체 일정 조회 가능
     */
    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> getAllSchedules(
            @RequestParam Long userId,
            @RequestParam(required = false) Long clubId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(required = false, defaultValue = "false") Boolean upcoming) {

        List<ScheduleResponse> responses;

        if (clubId != null) {
            // 클럽 멤버십 체크
            permissionService.requireClubMembership(userId, clubId);

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
            // 전체 일정 조회는 System Admin만 가능
            if (!permissionService.isSystemAdmin(userId)) {
                throw new SecurityException("전체 일정 조회는 관리자만 가능합니다.");
            }
            responses = scheduleService.getAllSchedules();
        }

        return ResponseEntity.ok(responses);
    }

    /**
     * 커서 기반 페이지네이션 일정 조회 (Infinite Scroll 리스트뷰용)
     * - direction=PAST: pivotDate 이전 일정 조회 (과거 방향)
     * - direction=FUTURE: pivotDate 이후 일정 조회 (미래 방향)
     */
    @GetMapping("/cursor")
    public ResponseEntity<ScheduleCursorResponse> getSchedulesByCursor(
            @RequestParam Long userId,
            @RequestParam Long clubId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime pivotDate,
            @RequestParam(defaultValue = "FUTURE") String direction,
            @RequestParam(defaultValue = "30") int size) {

        // 클럽 멤버십 체크
        permissionService.requireClubMembership(userId, clubId);

        // size 제한 (최대 50)
        int limitedSize = Math.min(size, 50);

        ScheduleCursorResponse response;
        if ("PAST".equalsIgnoreCase(direction)) {
            response = scheduleService.getSchedulesByClubIdPast(clubId, pivotDate, limitedSize);
        } else {
            response = scheduleService.getSchedulesByClubIdFuture(clubId, pivotDate, limitedSize);
        }

        return ResponseEntity.ok(response);
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
        DrawResponse response = drawService.generateDrawSequence(request, scheduleResponse.getNumberOfCourts());

        // Match 테이블에 저장
        scheduleService.saveMatchesFromDraw(scheduleId, scheduleResponse, response, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 클럽용 대진 생성 (DB 저장) - userId 기반 (신규 API, 동명이인 문제 해결)
     * MANUAL 타입인 경우 프론트에서 직접 구성한 대진을 저장
     */
    @PostMapping("/{scheduleId}/draw/with-ids")
    public ResponseEntity<DrawResponse> createDrawForScheduleWithIds(
            @PathVariable Long scheduleId,
            @Valid @RequestBody CreateDrawRequestWithIds request) {

        // 일정 존재 확인 및 조회
        ScheduleResponse scheduleResponse = scheduleService.getScheduleById(scheduleId);

        // MANUAL 타입: DrawService 우회, 직접 Match 저장
        if (request.getDrawType() == DrawType.MANUAL) {
            DrawResponse response = scheduleService.saveManualDraw(scheduleId, scheduleResponse, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        // 자동 대진 (AA, AB, SEED)
        // userId를 userName으로 변환하여 CreateDrawRequest 생성
        CreateDrawRequest drawRequest = convertToCreateDrawRequest(request);

        // 대진 생성 (draw_statistics 자동 증가 포함)
        DrawResponse response = drawService.generateDrawSequence(drawRequest, scheduleResponse.getNumberOfCourts());

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
