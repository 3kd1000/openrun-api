package com.example.openrunapi.domain.audit.service;

import com.example.openrunapi.domain.audit.dto.ClubAuditSnapshot;
import com.example.openrunapi.domain.audit.dto.ClubMemberAuditSnapshot;
import com.example.openrunapi.domain.audit.dto.ClubNoticeAuditSnapshot;
import com.example.openrunapi.domain.audit.dto.ClubPolicyAuditSnapshot;
import com.example.openrunapi.domain.audit.dto.ClubRuleAuditSnapshot;
import com.example.openrunapi.domain.audit.dto.MatchAuditSnapshot;
import com.example.openrunapi.domain.audit.dto.ScheduleAuditSnapshot;
import com.example.openrunapi.domain.audit.dto.ScheduleParticipantAuditSnapshot;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubNotice;
import com.example.openrunapi.domain.club.model.ClubPolicy;
import com.example.openrunapi.domain.club.model.ClubRule;
import com.example.openrunapi.domain.audit.model.AuditActionType;
import com.example.openrunapi.domain.audit.model.AuditEntityType;
import com.example.openrunapi.domain.audit.model.AuditLog;
import com.example.openrunapi.domain.audit.repository.AuditLogRepository;
import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * Audit Log 서비스
 * Schedule, ScheduleParticipant, Match 변경 이력을 기록
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    // === Schedule Audit ===

    /**
     * Schedule 생성 로그
     */
    @Transactional
    public void logScheduleCreate(Long userId, Schedule schedule) {
        ScheduleAuditSnapshot after = ScheduleAuditSnapshot.from(schedule);
        String changes = buildChangesJson(null, after);

        saveAuditLog(userId, AuditEntityType.SCHEDULE, schedule.getId(),
                AuditActionType.CREATE, changes, schedule.getClubId());
    }

    /**
     * Schedule 수정 로그
     */
    @Transactional
    public void logScheduleUpdate(Long userId, ScheduleAuditSnapshot before, Schedule afterSchedule) {
        ScheduleAuditSnapshot after = ScheduleAuditSnapshot.from(afterSchedule);
        String changes = buildChangesJson(before, after);

        saveAuditLog(userId, AuditEntityType.SCHEDULE, afterSchedule.getId(),
                AuditActionType.UPDATE, changes, afterSchedule.getClubId());
    }

    /**
     * Schedule 삭제 로그
     */
    @Transactional
    public void logScheduleDelete(Long userId, Schedule schedule) {
        ScheduleAuditSnapshot before = ScheduleAuditSnapshot.from(schedule);
        String changes = buildChangesJson(before, null);

        saveAuditLog(userId, AuditEntityType.SCHEDULE, schedule.getId(),
                AuditActionType.DELETE, changes, schedule.getClubId());
    }

    // === ScheduleParticipant Audit ===

    /**
     * ScheduleParticipant 생성 로그 (참가 신청)
     */
    @Transactional
    public void logParticipantCreate(Long userId, ScheduleParticipant participant, Long clubId) {
        ScheduleParticipantAuditSnapshot after = ScheduleParticipantAuditSnapshot.from(participant);
        String changes = buildChangesJson(null, after);

        saveAuditLog(userId, AuditEntityType.SCHEDULE_PARTICIPANT, participant.getId(),
                AuditActionType.CREATE, changes, clubId);
    }

    /**
     * ScheduleParticipant 수정 로그 (상태 변경 등)
     */
    @Transactional
    public void logParticipantUpdate(Long userId, ScheduleParticipantAuditSnapshot before,
                                      ScheduleParticipant afterParticipant, Long clubId) {
        ScheduleParticipantAuditSnapshot after = ScheduleParticipantAuditSnapshot.from(afterParticipant);
        String changes = buildChangesJson(before, after);

        saveAuditLog(userId, AuditEntityType.SCHEDULE_PARTICIPANT, afterParticipant.getId(),
                AuditActionType.UPDATE, changes, clubId);
    }

    /**
     * ScheduleParticipant 삭제 로그 (참가 취소)
     */
    @Transactional
    public void logParticipantDelete(Long userId, ScheduleParticipant participant, Long clubId) {
        ScheduleParticipantAuditSnapshot before = ScheduleParticipantAuditSnapshot.from(participant);
        String changes = buildChangesJson(before, null);

        saveAuditLog(userId, AuditEntityType.SCHEDULE_PARTICIPANT, participant.getId(),
                AuditActionType.DELETE, changes, clubId);
    }

    // === Match Audit ===

    /**
     * Match 생성 로그
     */
    @Transactional
    public void logMatchCreate(Long userId, Match match) {
        MatchAuditSnapshot after = MatchAuditSnapshot.from(match);
        String changes = buildChangesJson(null, after);

        saveAuditLog(userId, AuditEntityType.MATCH, match.getId(),
                AuditActionType.CREATE, changes, match.getClubId());
    }

    /**
     * Match 수정 로그 (결과 입력/수정)
     */
    @Transactional
    public void logMatchUpdate(Long userId, MatchAuditSnapshot before, Match afterMatch) {
        MatchAuditSnapshot after = MatchAuditSnapshot.from(afterMatch);
        String changes = buildChangesJson(before, after);

        saveAuditLog(userId, AuditEntityType.MATCH, afterMatch.getId(),
                AuditActionType.UPDATE, changes, afterMatch.getClubId());
    }

    /**
     * Match 삭제 로그
     */
    @Transactional
    public void logMatchDelete(Long userId, Match match) {
        MatchAuditSnapshot before = MatchAuditSnapshot.from(match);
        String changes = buildChangesJson(before, null);

        saveAuditLog(userId, AuditEntityType.MATCH, match.getId(),
                AuditActionType.DELETE, changes, match.getClubId());
    }

    // === Club Audit ===

    /**
     * Club 생성 로그
     */
    @Transactional
    public void logClubCreate(Long userId, Club club) {
        ClubAuditSnapshot after = ClubAuditSnapshot.from(club);
        String changes = buildChangesJson(null, after);

        saveAuditLog(userId, AuditEntityType.CLUB, club.getId(),
                AuditActionType.CREATE, changes, club.getId());
    }

    /**
     * Club 수정 로그 (프로필 수정)
     */
    @Transactional
    public void logClubUpdate(Long userId, ClubAuditSnapshot before, Club afterClub) {
        ClubAuditSnapshot after = ClubAuditSnapshot.from(afterClub);
        String changes = buildChangesJson(before, after);

        saveAuditLog(userId, AuditEntityType.CLUB, afterClub.getId(),
                AuditActionType.UPDATE, changes, afterClub.getId());
    }

    // === ClubPolicy Audit ===

    /**
     * ClubPolicy 수정 로그 (운영 정책/어워드 정책 수정)
     */
    @Transactional
    public void logClubPolicyUpdate(Long userId, ClubPolicyAuditSnapshot before, ClubPolicy afterPolicy) {
        ClubPolicyAuditSnapshot after = ClubPolicyAuditSnapshot.from(afterPolicy);
        String changes = buildChangesJson(before, after);

        saveAuditLog(userId, AuditEntityType.CLUB_POLICY, afterPolicy.getId(),
                AuditActionType.UPDATE, changes, afterPolicy.getClubId());
    }

    // === ClubMember Audit ===

    /**
     * ClubMember 수정 로그 (역할 변경)
     */
    @Transactional
    public void logClubMemberUpdate(Long userId, ClubMemberAuditSnapshot before, ClubMember afterMember) {
        ClubMemberAuditSnapshot after = ClubMemberAuditSnapshot.from(afterMember);
        String changes = buildChangesJson(before, after);

        saveAuditLog(userId, AuditEntityType.CLUB_MEMBER, afterMember.getId(),
                AuditActionType.UPDATE, changes, afterMember.getClub().getId());
    }

    /**
     * ClubMember 삭제 로그 (강퇴)
     */
    @Transactional
    public void logClubMemberDelete(Long userId, ClubMember member) {
        ClubMemberAuditSnapshot before = ClubMemberAuditSnapshot.from(member);
        String changes = buildChangesJson(before, null);

        saveAuditLog(userId, AuditEntityType.CLUB_MEMBER, member.getId(),
                AuditActionType.DELETE, changes, member.getClub().getId());
    }

    // === ClubRule Audit ===

    /**
     * ClubRule 생성 로그
     */
    @Transactional
    public void logClubRuleCreate(Long userId, ClubRule rule) {
        ClubRuleAuditSnapshot after = ClubRuleAuditSnapshot.from(rule);
        String changes = buildChangesJson(null, after);

        saveAuditLog(userId, AuditEntityType.CLUB_RULE, rule.getId(),
                AuditActionType.CREATE, changes, rule.getClub().getId());
    }

    /**
     * ClubRule 수정 로그
     */
    @Transactional
    public void logClubRuleUpdate(Long userId, ClubRuleAuditSnapshot before, ClubRule afterRule) {
        ClubRuleAuditSnapshot after = ClubRuleAuditSnapshot.from(afterRule);
        String changes = buildChangesJson(before, after);

        saveAuditLog(userId, AuditEntityType.CLUB_RULE, afterRule.getId(),
                AuditActionType.UPDATE, changes, afterRule.getClub().getId());
    }

    /**
     * ClubRule 삭제 로그
     */
    @Transactional
    public void logClubRuleDelete(Long userId, ClubRule rule) {
        ClubRuleAuditSnapshot before = ClubRuleAuditSnapshot.from(rule);
        String changes = buildChangesJson(before, null);

        saveAuditLog(userId, AuditEntityType.CLUB_RULE, rule.getId(),
                AuditActionType.DELETE, changes, rule.getClub().getId());
    }

    // === ClubNotice Audit ===

    /**
     * ClubNotice 생성 로그
     */
    @Transactional
    public void logClubNoticeCreate(Long userId, ClubNotice notice) {
        ClubNoticeAuditSnapshot after = ClubNoticeAuditSnapshot.from(notice);
        String changes = buildChangesJson(null, after);

        saveAuditLog(userId, AuditEntityType.CLUB_NOTICE, notice.getId(),
                AuditActionType.CREATE, changes, notice.getClub().getId());
    }

    /**
     * ClubNotice 수정 로그
     */
    @Transactional
    public void logClubNoticeUpdate(Long userId, ClubNoticeAuditSnapshot before, ClubNotice afterNotice) {
        ClubNoticeAuditSnapshot after = ClubNoticeAuditSnapshot.from(afterNotice);
        String changes = buildChangesJson(before, after);

        saveAuditLog(userId, AuditEntityType.CLUB_NOTICE, afterNotice.getId(),
                AuditActionType.UPDATE, changes, afterNotice.getClub().getId());
    }

    /**
     * ClubNotice 삭제 로그
     */
    @Transactional
    public void logClubNoticeDelete(Long userId, ClubNotice notice) {
        ClubNoticeAuditSnapshot before = ClubNoticeAuditSnapshot.from(notice);
        String changes = buildChangesJson(before, null);

        saveAuditLog(userId, AuditEntityType.CLUB_NOTICE, notice.getId(),
                AuditActionType.DELETE, changes, notice.getClub().getId());
    }

    // === ClubLogo Audit ===

    /**
     * 클럽 로고 업로드 로그 (ADMIN 이상 수행)
     */
    @Transactional
    public void logClubLogoUpload(Long userId, Long clubId, String beforeLogoUrl, String afterLogoUrl) {
        Map<String, Object> changes = new HashMap<>();
        changes.put("before", Map.of("logoUrl", beforeLogoUrl != null ? beforeLogoUrl : ""));
        changes.put("after", Map.of("logoUrl", afterLogoUrl != null ? afterLogoUrl : ""));
        try {
            String changesJson = objectMapper.writeValueAsString(changes);
            saveAuditLog(userId, AuditEntityType.CLUB_LOGO, clubId,
                    AuditActionType.UPDATE, changesJson, clubId);
        } catch (Exception e) {
            log.error("클럽 로고 업로드 audit log 저장 실패: clubId={}, error={}", clubId, e.getMessage());
        }
    }

    /**
     * 클럽 로고 삭제 로그
     */
    @Transactional
    public void logClubLogoDelete(Long userId, Long clubId, String deletedLogoUrl) {
        Map<String, Object> changes = new HashMap<>();
        changes.put("before", Map.of("logoUrl", deletedLogoUrl != null ? deletedLogoUrl : ""));
        try {
            String changesJson = objectMapper.writeValueAsString(changes);
            saveAuditLog(userId, AuditEntityType.CLUB_LOGO, clubId,
                    AuditActionType.DELETE, changesJson, clubId);
        } catch (Exception e) {
            log.error("클럽 로고 삭제 audit log 저장 실패: clubId={}, error={}", clubId, e.getMessage());
        }
    }

    // === Private Helper Methods ===

    private void saveAuditLog(Long userId, AuditEntityType entityType, Long entityId,
                              AuditActionType actionType, String changes, Long clubId) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .entityType(entityType)
                    .entityId(entityId)
                    .actionType(actionType)
                    .changes(changes)
                    .clubId(clubId)
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit log saved: entityType={}, entityId={}, actionType={}, userId={}",
                    entityType, entityId, actionType, userId);
        } catch (Exception e) {
            log.error("Failed to save audit log: entityType={}, entityId={}, actionType={}, error={}",
                    entityType, entityId, actionType, e.getMessage(), e);
        }
    }

    private String buildChangesJson(Object before, Object after) {
        try {
            Map<String, Object> changes = new HashMap<>();
            if (before != null) {
                changes.put("before", before);
            }
            if (after != null) {
                changes.put("after", after);
            }
            return objectMapper.writeValueAsString(changes);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize changes to JSON: {}", e.getMessage());
            return "{}";
        }
    }
}
