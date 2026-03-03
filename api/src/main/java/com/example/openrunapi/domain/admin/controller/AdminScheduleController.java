package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.admin.service.AdminUserService;
import com.example.openrunapi.domain.notification.model.dto.AdminScheduleSimpleResponse;
import com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.schedule.service.ScheduleParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/schedules")
@RequiredArgsConstructor
public class AdminScheduleController {

    private final AdminUserService adminUserService;
    private final ScheduleRepository scheduleRepository;
    private final ScheduleParticipantService participantService;

    /**
     * 클럽별 일정 목록 조회 (Admin - 알림 발송 시 리소스 선택용)
     * 페이징 지원 (기본 size=10)
     */
    @GetMapping
    public ResponseEntity<Page<AdminScheduleSimpleResponse>> getSchedulesByClub(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long clubId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        adminUserService.validateAdminAccess(userDetails.getUsername());
        Page<AdminScheduleSimpleResponse> schedules = scheduleRepository
                .findByClubIdOrderByScheduledAtDesc(clubId, PageRequest.of(page, size))
                .map(AdminScheduleSimpleResponse::new);

        return ResponseEntity.ok(schedules);
    }

    /**
     * 일정 참가자 목록 조회 (Admin 전용 — 멤버십 체크 없음)
     */
    @GetMapping("/{scheduleId}/participants")
    public ResponseEntity<List<ParticipantResponse>> getParticipants(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long scheduleId
    ) {
        adminUserService.validateAdminAccess(userDetails.getUsername());
        List<ParticipantResponse> participants = participantService.getParticipants(scheduleId);
        return ResponseEntity.ok(participants);
    }
}
