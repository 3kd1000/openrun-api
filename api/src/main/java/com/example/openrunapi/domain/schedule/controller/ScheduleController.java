package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequest;
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
     * 클럽용 대진 생성 (DB 저장)
     */
    @PostMapping("/{scheduleId}/draw")
    public ResponseEntity<DrawResponse> createDrawForSchedule(
            @PathVariable Long scheduleId,
            @Valid @RequestBody CreateDrawRequest request) {

        // 일정 존재 확인
        scheduleService.getScheduleById(scheduleId);

        // 대진 생성 (일반 DrawService 사용)
        DrawResponse response = drawService.generateDrawSequence(request);

        // TODO: DB 저장 로직 추가
        // - schedule_draw 테이블에 저장
        // - match 테이블에 경기들 저장
        // - 현재는 대진만 생성하고 DB 저장은 나중에 구현

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
