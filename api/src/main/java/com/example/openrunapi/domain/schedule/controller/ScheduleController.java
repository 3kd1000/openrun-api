package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequest;
import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequestWithIds;
import com.example.openrunapi.domain.draw.model.dto.DrawResponse;
import com.example.openrunapi.domain.draw.service.DrawService;
import com.example.openrunapi.domain.schedule.model.dto.CreateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleResponse;
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

    /**
     * 일정 생성
     */
    @PostMapping
    public ResponseEntity<ScheduleResponse> createSchedule(@Valid @RequestBody CreateScheduleRequest request) {
        ScheduleResponse response = scheduleService.createSchedule(request);
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
    public ResponseEntity<ScheduleResponse> getScheduleById(@PathVariable Long scheduleId) {
        ScheduleResponse response = scheduleService.getScheduleById(scheduleId);
        return ResponseEntity.ok(response);
    }

    /**
     * 일정 수정
     */
    @PutMapping("/{scheduleId}")
    public ResponseEntity<ScheduleResponse> updateSchedule(
            @PathVariable Long scheduleId,
            @Valid @RequestBody UpdateScheduleRequest request) {
        ScheduleResponse response = scheduleService.updateSchedule(scheduleId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 일정 삭제
     */
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long scheduleId) {
        scheduleService.deleteSchedule(scheduleId);
        return ResponseEntity.noContent().build();
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
