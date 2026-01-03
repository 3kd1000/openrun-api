package com.example.openrunapi.common.service;

import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.user.repository.SystemAdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 권한 체크 서비스
 * - System Admin (Super User) 권한 체크
 * - Club 권한 체크 (ADMIN, OWNER)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermissionService {

    private final SystemAdminRepository systemAdminRepository;
    private final ClubMemberRepository clubMemberRepository;

    /**
     * System Admin 여부 확인
     */
    public boolean isSystemAdmin(Long userId) {
        if (userId == null) return false;
        return systemAdminRepository.existsByUserId(userId);
    }

    /**
     * 특정 클럽의 일정 관리 권한 확인
     * - System Admin
     * - Club ADMIN 이상
     *
     * @param userId 사용자 ID
     * @param clubId 클럽 ID
     * @return 권한 여부
     */
    public boolean canManageSchedule(Long userId, Long clubId) {

        if (userId == null || clubId == null) {
            return false;
        }

        // System Admin 체크
        if (isSystemAdmin(userId)) {
            return true;
        }

        // Club 권한 체크
        ClubMember clubMember = clubMemberRepository.findByClubIdAndUserId(clubId, userId).orElse(null);
        if (clubMember == null) {
            return false;
        }

        return clubMember.canManageSchedule();
    }

    /**
     * 특정 클럽의 회원 관리 권한 확인
     * - System Admin
     * - Club OWNER
     *
     * @param userId 사용자 ID
     * @param clubId 클럽 ID
     * @return 권한 여부
     */
    public boolean canManageMembers(Long userId, Long clubId) {
        if (userId == null || clubId == null) return false;

        // System Admin 체크
        if (isSystemAdmin(userId)) {
            log.debug("System Admin 권한으로 회원 관리 허용: userId={}", userId);
            return true;
        }

        // Club OWNER 체크
        return clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .map(ClubMember::canManageMembers)
                .orElse(false);
    }

    /**
     * 권한 없음 예외 발생
     */
    public void requireScheduleManagePermission(Long userId, Long clubId) {
        if (!canManageSchedule(userId, clubId)) {
            throw new SecurityException("일정 관리 권한이 없습니다.");
        }
    }

    /**
     * 권한 없음 예외 발생
     */
    public void requireMemberManagePermission(Long userId, Long clubId) {
        if (!canManageMembers(userId, clubId)) {
            throw new SecurityException("회원 관리 권한이 없습니다.");
        }
    }
}
