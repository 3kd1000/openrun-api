package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.club.service.ClubService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/clubs")
@RequiredArgsConstructor
public class AdminClubController {

    private final ClubMemberRepository clubMemberRepository;
    private final ClubRepository clubRepository;
    private final ClubService clubService;
    private final UserRepository userRepository;

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

    /**
     * 전체 클럽 오너 목록 조회 (DM 대상 선택용)
     * 클럽명/지역 + 클럽장 이름/userId를 함께 반환
     */
    @GetMapping("/owners")
    public ResponseEntity<List<Map<String, Object>>> getClubOwners() {
        List<Club> clubs = clubRepository.findAll();

        Set<Long> ownerUserIds = clubs.stream()
                .map(Club::getOwnerUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, User> userMap = userRepository.findAllById(ownerUserIds)
                .stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<Map<String, Object>> result = clubs.stream()
                .map(club -> {
                    User owner = userMap.get(club.getOwnerUserId());
                    Map<String, Object> item = new HashMap<>();
                    item.put("clubId", club.getId());
                    item.put("clubName", club.getName());
                    item.put("regionDepth1", club.getRegionDepth1() != null ? club.getRegionDepth1() : "");
                    item.put("regionDepth2", club.getRegionDepth2() != null ? club.getRegionDepth2() : "");
                    item.put("ownerUserId", owner != null ? owner.getId() : null);
                    item.put("ownerName", owner != null ? owner.getName() : "알 수 없음");
                    return item;
                })
                .sorted(Comparator.comparing(m -> (String) m.get("clubName")))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
