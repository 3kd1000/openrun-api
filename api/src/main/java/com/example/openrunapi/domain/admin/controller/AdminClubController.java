package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.club.service.ClubService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/clubs")
@RequiredArgsConstructor
public class AdminClubController {

    private final ClubMemberRepository clubMemberRepository;
    private final ClubRepository clubRepository;
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

    /**
     * 모든 클럽 목록 조회 (Audit Log 필터용)
     * Frontend에서 로컬 필터링에 사용
     */
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllClubs() {
        List<Club> clubs = clubRepository.findAll();

        List<Map<String, Object>> result = clubs.stream()
                .map(club -> Map.<String, Object>of(
                        "id", club.getId(),
                        "name", club.getName(),
                        "regionDepth1", club.getRegionDepth1() != null ? club.getRegionDepth1() : "",
                        "regionDepth2", club.getRegionDepth2() != null ? club.getRegionDepth2() : ""
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
