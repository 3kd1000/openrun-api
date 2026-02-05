package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.notification.model.dto.AdminScheduleSimpleResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/schedules")
@RequiredArgsConstructor
public class AdminScheduleController {

    private final ScheduleRepository scheduleRepository;

    /**
     * 클럽별 일정 목록 조회 (Admin - 알림 발송 시 리소스 선택용)
     * 페이징 지원 (기본 size=10)
     */
    @GetMapping
    public ResponseEntity<Page<AdminScheduleSimpleResponse>> getSchedulesByClub(
            @RequestParam Long clubId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<AdminScheduleSimpleResponse> schedules = scheduleRepository
                .findByClubIdOrderByScheduledAtDesc(clubId, PageRequest.of(page, size))
                .map(AdminScheduleSimpleResponse::new);

        return ResponseEntity.ok(schedules);
    }
}
