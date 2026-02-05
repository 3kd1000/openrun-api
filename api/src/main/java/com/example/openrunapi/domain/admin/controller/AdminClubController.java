package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.club.service.ClubService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/clubs")
@RequiredArgsConstructor
public class AdminClubController {

    private final ClubMemberRepository clubMemberRepository;
    private final ClubService clubService;

    /**
     * 클럽의 ACTIVE 멤버 userId 목록 조회 (알림 발송 시 전체 선택용)
     */
    @GetMapping("/{clubId}/member-ids")
    public ResponseEntity<List<Long>> getActiveMemberIds(@PathVariable Long clubId) {
        List<Long> userIds = clubMemberRepository.findActiveUserIdsByClubId(clubId);
        return ResponseEntity.ok(userIds);
    }

    /**
     * 클럽의 ACTIVE 멤버 목록 조회 (알림 발송 시 개별 선택용)
     */
    @GetMapping("/{clubId}/members")
    public ResponseEntity<List<UserResponse>> getActiveMembers(@PathVariable Long clubId) {
        List<UserResponse> members = clubService.getClubMembers(clubId, ClubMemberStatus.ACTIVE);
        return ResponseEntity.ok(members);
    }
}
