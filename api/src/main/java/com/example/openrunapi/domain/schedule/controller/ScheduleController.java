package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.schedule.model.dto.CreateScheduleRequest;
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
}
