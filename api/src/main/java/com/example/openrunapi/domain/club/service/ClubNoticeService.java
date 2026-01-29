package com.example.openrunapi.domain.club.service;

import com.example.openrunapi.domain.audit.dto.ClubNoticeAuditSnapshot;
import com.example.openrunapi.domain.audit.service.AuditLogService;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubNotice;
import com.example.openrunapi.domain.club.model.dto.ClubNoticeResponse;
import com.example.openrunapi.domain.club.model.dto.ClubNoticeUnreadCountResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubNoticeRequest;
import com.example.openrunapi.domain.club.model.dto.MarkClubNoticesReadRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubNoticeRequest;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.club.repository.ClubNoticeRepository;
import com.example.openrunapi.domain.club.repository.ClubNoticeReadRepository;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClubNoticeService {

    private final ClubNoticeRepository clubNoticeRepository;
    private final ClubNoticeReadRepository clubNoticeReadRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final AuditLogService auditLogService;

    private ClubMember requireMember(Long clubId, Long userId) {
        return clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new SecurityException("클럽 멤버만 접근할 수 있습니다."));
    }

    /**
     * 공지 목록 조회 - 모든 클럽 멤버 가능
     */
    public List<ClubNoticeResponse> getClubNotices(Long clubId, Long userId) {
        log.info("Getting club notices for clubId: {}, userId: {}", clubId, userId);

        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }
        requireMember(clubId, userId);

        return clubNoticeRepository.findByClubIdOrderByDisplayOrder(clubId)
                .stream()
                .map(ClubNoticeResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * unread 개수 조회 - 모든 클럽 멤버 가능
     */
    public ClubNoticeUnreadCountResponse getUnreadCount(Long clubId, Long userId) {
        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }
        requireMember(clubId, userId);
        long count = clubNoticeReadRepository.countUnread(clubId, userId);
        return new ClubNoticeUnreadCountResponse(count);
    }

    /**
     * 공지 읽음 처리 (upToNoticeId 이하, null이면 최신 공지까지) - 모든 클럽 멤버 가능
     */
    @Transactional
    public void markRead(Long clubId, MarkClubNoticesReadRequest request, Long userId) {
        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }
        requireMember(clubId, userId);

        Long upTo = request != null ? request.getUpToNoticeId() : null;
        if (upTo == null) {
            upTo = clubNoticeRepository.findMaxIdByClubId(clubId);
        }
        if (upTo == null) return; // 공지 없음

        clubNoticeReadRepository.markReadUpTo(clubId, userId, upTo);
    }

    /**
     * 공지 생성 - ADMIN/OWNER 가능
     */
    @Transactional
    public ClubNoticeResponse createClubNotice(Long clubId, CreateClubNoticeRequest request, Long userId) {
        log.info("Creating club notice for clubId: {}, title: {}, userId: {}", clubId, request.getTitle(), userId);

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        ClubMember member = requireMember(clubId, userId);
        if (!member.getRole().canManageSchedule()) {
            throw new SecurityException("공지사항 생성 권한이 없습니다. 운영진 이상만 가능합니다.");
        }

        if (clubNoticeRepository.existsByClubIdAndTitle(clubId, request.getTitle())) {
            throw new IllegalStateException("이미 동일한 제목의 공지사항이 존재합니다.");
        }

        int nextOrder = clubNoticeRepository.countByClubId(clubId);
        ClubNotice notice = ClubNotice.builder()
                .club(club)
                .title(request.getTitle())
                .content(request.getContent())
                .displayOrder(nextOrder)
                .build();

        ClubNotice saved = clubNoticeRepository.save(notice);
        log.info("Club notice created successfully: {}", saved.getId());

        // Audit 로깅
        auditLogService.logClubNoticeCreate(userId, saved);

        return new ClubNoticeResponse(saved);
    }

    /**
     * 공지 수정 - ADMIN/OWNER 가능
     */
    @Transactional
    public ClubNoticeResponse updateClubNotice(Long clubId, Long noticeId, UpdateClubNoticeRequest request, Long userId) {
        log.info("Updating club notice: {}, clubId: {}, userId: {}", noticeId, clubId, userId);

        ClubNotice notice = clubNoticeRepository.findById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 공지사항을 찾을 수 없습니다: " + noticeId));

        if (!notice.getClub().getId().equals(clubId)) {
            throw new SecurityException("다른 클럽의 공지사항은 수정할 수 없습니다.");
        }

        ClubMember member = requireMember(clubId, userId);
        if (!member.getRole().canManageSchedule()) {
            throw new SecurityException("공지사항 수정 권한이 없습니다. 운영진 이상만 가능합니다.");
        }

        // Audit용 스냅샷 (수정 전)
        ClubNoticeAuditSnapshot beforeSnapshot = ClubNoticeAuditSnapshot.from(notice);

        notice.update(request.getTitle(), request.getContent());
        log.info("Club notice updated successfully: {}", noticeId);

        // Audit 로깅
        auditLogService.logClubNoticeUpdate(userId, beforeSnapshot, notice);

        return new ClubNoticeResponse(notice);
    }

    /**
     * 공지 삭제 - ADMIN/OWNER 가능
     */
    @Transactional
    public void deleteClubNotice(Long clubId, Long noticeId, Long userId) {
        log.info("Deleting club notice: {}, clubId: {}, userId: {}", noticeId, clubId, userId);

        ClubNotice notice = clubNoticeRepository.findById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 공지사항을 찾을 수 없습니다: " + noticeId));

        if (!notice.getClub().getId().equals(clubId)) {
            throw new SecurityException("다른 클럽의 공지사항은 삭제할 수 없습니다.");
        }

        ClubMember member = requireMember(clubId, userId);
        if (!member.getRole().canManageSchedule()) {
            throw new SecurityException("공지사항 삭제 권한이 없습니다. 운영진 이상만 가능합니다.");
        }

        // Audit 로깅 (삭제 전)
        auditLogService.logClubNoticeDelete(userId, notice);

        clubNoticeRepository.delete(notice);
        log.info("Club notice deleted successfully: {}", noticeId);
    }
}

