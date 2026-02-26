package com.example.openrunapi.domain.club.service;

import com.example.openrunapi.common.exception.PermissionDeniedException;
import com.example.openrunapi.domain.audit.dto.ClubRuleAuditSnapshot;
import com.example.openrunapi.domain.audit.service.AuditLogService;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubRule;
import com.example.openrunapi.domain.club.model.dto.ClubRuleResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubRuleRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubRuleRequest;
import com.example.openrunapi.domain.club.model.dto.MarkClubRulesReadRequest;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.club.repository.ClubRuleReadRepository;
import com.example.openrunapi.domain.club.repository.ClubRuleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClubRuleService {

    private final ClubRuleRepository clubRuleRepository;
    private final ClubRuleReadRepository clubRuleReadRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final AuditLogService auditLogService;

    /**
     * 클럽 회칙 목록 조회 - 모든 클럽 멤버 가능
     */
    public List<ClubRuleResponse> getClubRules(Long clubId, Long userId) {
        log.info("Getting club rules for clubId: {}, userId: {}", clubId, userId);

        // 클럽 존재 확인
        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }

        // 멤버 확인
        if (!clubMemberRepository.existsByClubIdAndUserId(clubId, userId)) {
            throw new PermissionDeniedException("클럽 멤버만 회칙을 조회할 수 있습니다.");
        }

        List<ClubRule> rules = clubRuleRepository.findByClubIdOrderByDisplayOrder(clubId);
        return rules.stream()
                .map(ClubRuleResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 클럽 회칙 생성 - OWNER 또는 ADMIN 가능
     */
    @Transactional
    public ClubRuleResponse createClubRule(Long clubId, CreateClubRuleRequest request, Long userId) {
        log.info("Creating club rule for clubId: {}, title: {}, userId: {}", clubId, request.getTitle(), userId);

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        // OWNER 또는 ADMIN 권한 확인
        validateRuleManagePermission(clubId, userId, "회칙 생성");

        // 회칙 제목 중복 확인 (선택사항)
        if (clubRuleRepository.existsByClubIdAndTitle(clubId, request.getTitle())) {
            throw new IllegalStateException("이미 동일한 제목의 회칙이 존재합니다.");
        }

        // displayOrder 자동 계산 (마지막 순서 + 1)
        int nextOrder = clubRuleRepository.countByClubId(clubId);

        ClubRule clubRule = ClubRule.builder()
                .club(club)
                .title(request.getTitle())
                .content(request.getContent())
                .displayOrder(nextOrder)
                .build();

        ClubRule savedRule = clubRuleRepository.save(clubRule);
        log.info("Club rule created successfully: {}", savedRule.getId());

        // Audit 로깅
        auditLogService.logClubRuleCreate(userId, savedRule);

        return new ClubRuleResponse(savedRule);
    }

    /**
     * 클럽 회칙 수정 - OWNER 또는 ADMIN 가능
     */
    @Transactional
    public ClubRuleResponse updateClubRule(Long ruleId, UpdateClubRuleRequest request, Long userId) {
        log.info("Updating club rule: {}, userId: {}", ruleId, userId);

        ClubRule clubRule = clubRuleRepository.findById(ruleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 회칙을 찾을 수 없습니다: " + ruleId));

        Club club = clubRule.getClub();

        // OWNER 또는 ADMIN 권한 확인
        validateRuleManagePermission(club.getId(), userId, "회칙 수정");

        // Audit용 스냅샷 (수정 전)
        ClubRuleAuditSnapshot beforeSnapshot = ClubRuleAuditSnapshot.from(clubRule);

        // 제목 중복 확인 (다른 회칙과 중복되는지)
        List<ClubRule> existingRules = clubRuleRepository.findByClubIdOrderByDisplayOrder(club.getId());
        boolean isDuplicate = existingRules.stream()
                .anyMatch(rule -> !rule.getId().equals(ruleId) && rule.getTitle().equals(request.getTitle()));

        if (isDuplicate) {
            throw new IllegalStateException("이미 동일한 제목의 회칙이 존재합니다.");
        }

        clubRule.update(request.getTitle(), request.getContent());
        log.info("Club rule updated successfully: {}", ruleId);

        // Audit 로깅
        auditLogService.logClubRuleUpdate(userId, beforeSnapshot, clubRule);

        return new ClubRuleResponse(clubRule);
    }

    /**
     * 클럽 회칙 삭제 - OWNER 또는 ADMIN 가능
     */
    @Transactional
    public void deleteClubRule(Long ruleId, Long userId) {
        log.info("Deleting club rule: {}, userId: {}", ruleId, userId);

        ClubRule clubRule = clubRuleRepository.findById(ruleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 회칙을 찾을 수 없습니다: " + ruleId));

        Club club = clubRule.getClub();

        // OWNER 또는 ADMIN 권한 확인
        validateRuleManagePermission(club.getId(), userId, "회칙 삭제");

        // Audit 로깅 (삭제 전)
        auditLogService.logClubRuleDelete(userId, clubRule);

        clubRuleRepository.delete(clubRule);
        log.info("Club rule deleted successfully: {}", ruleId);
    }

    /**
     * 회칙 unread 개수 조회 - 모든 클럽 멤버 가능
     */
    public long getUnreadCount(Long clubId, Long userId) {
        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }
        if (!clubMemberRepository.existsByClubIdAndUserId(clubId, userId)) {
            throw new PermissionDeniedException("클럽 멤버만 접근할 수 있습니다.");
        }
        return clubRuleReadRepository.countUnread(clubId, userId);
    }

    /**
     * 회칙 읽음 처리 (upToRuleId 이하, null이면 최신 회칙까지) - 모든 클럽 멤버 가능
     */
    @Transactional
    public void markRead(Long clubId, MarkClubRulesReadRequest request, Long userId) {
        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }
        if (!clubMemberRepository.existsByClubIdAndUserId(clubId, userId)) {
            throw new PermissionDeniedException("클럽 멤버만 접근할 수 있습니다.");
        }

        Long upTo = request != null ? request.getUpToRuleId() : null;
        if (upTo == null) {
            upTo = clubRuleRepository.findMaxIdByClubId(clubId);
        }
        if (upTo == null) return; // 회칙 없음

        clubRuleReadRepository.markReadUpTo(clubId, userId, upTo);
    }

    /**
     * 클럽 회칙 순서 변경 - OWNER 또는 ADMIN 가능
     */
    @Transactional
    public void reorderClubRules(Long clubId, Map<Long, Integer> orders, Long userId) {
        log.info("Reordering club rules for clubId: {}, userId: {}", clubId, userId);

        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }

        // OWNER 또는 ADMIN 권한 확인
        validateRuleManagePermission(clubId, userId, "회칙 순서 변경");

        // 각 회칙의 순서 업데이트
        orders.forEach((ruleId, newOrder) -> {
            ClubRule rule = clubRuleRepository.findById(ruleId)
                    .orElseThrow(() -> new EntityNotFoundException("해당 ID의 회칙을 찾을 수 없습니다: " + ruleId));

            // 해당 회칙이 이 클럽의 것인지 확인
            if (!rule.getClub().getId().equals(clubId)) {
                throw new IllegalArgumentException("해당 회칙은 이 클럽의 회칙이 아닙니다: " + ruleId);
            }

            rule.updateDisplayOrder(newOrder);
        });

        log.info("Club rules reordered successfully for clubId: {}", clubId);
    }

    // === Private Helper Methods ===

    /**
     * 회칙 관리 권한 확인 (OWNER 또는 ADMIN)
     */
    private void validateRuleManagePermission(Long clubId, Long userId, String action) {
        ClubMember member = clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new PermissionDeniedException(action + " 권한이 없습니다. 클럽 멤버가 아닙니다."));

        if (!member.getRole().canManageSchedule()) {
            throw new PermissionDeniedException(action + " 권한이 없습니다. 운영진 이상만 가능합니다.");
        }
    }
}
