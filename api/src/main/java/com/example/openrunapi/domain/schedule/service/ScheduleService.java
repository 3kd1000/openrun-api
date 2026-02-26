package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.common.service.PermissionService;
import com.example.openrunapi.domain.audit.dto.ScheduleAuditSnapshot;
import com.example.openrunapi.domain.audit.service.AuditLogService;
import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequest;
import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequestWithIds;
import com.example.openrunapi.domain.draw.model.dto.DrawResponse;
import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.match.repository.MatchRepository;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.MatchType;
import com.example.openrunapi.domain.schedule.model.ScheduleType;
import com.example.openrunapi.domain.schedule.model.dto.CreateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleResponse;
import com.example.openrunapi.domain.schedule.model.dto.UpdateSchedulePinnedRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleGuestRecruitRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleInterclubRecruitRequest;
import com.example.openrunapi.domain.schedule.model.dto.PublicRecruitScheduleResponse;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleCursorResponse;
import com.example.openrunapi.domain.schedule.model.dto.CreatePublicScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.PublicScheduleResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.example.openrunapi.common.exception.AuthenticationRequiredException;
import com.example.openrunapi.common.exception.PermissionDeniedException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.openrunapi.domain.notification.model.NotificationType;
import com.example.openrunapi.domain.notification.service.NotificationService;
import com.example.openrunapi.common.utils.TimeValidationUtils;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Comparator;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleParticipantRepository participantRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final PermissionService permissionService;
    private final ClubRepository clubRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    /**
     * 일정 생성
     */
    @Transactional
    public ScheduleResponse createSchedule(CreateScheduleRequest request, Long userId) {
        // 과거 날짜 체크 (KST 기준)
        if (TimeValidationUtils.isPast(request.getScheduledAt())) {
            throw new IllegalStateException("과거 날짜에는 일정을 생성할 수 없습니다.");
        }

        // 참가신청 시작시간 검증
        if (request.getParticipationStartAt() != null) {
            if (request.getParticipationStartAt().isAfter(request.getScheduledAt()) ||
                request.getParticipationStartAt().isEqual(request.getScheduledAt())) {
                throw new IllegalArgumentException("참가신청 시작시간은 일정 시간보다 이전이어야 합니다.");
            }
        }

        Schedule schedule = request.toEntity();
        // 일정 생성자 기록 (클럽일정/공개일정 공통)
        if (userId != null) {
            schedule.setCreatedByUserId(userId);
        }
        Schedule savedSchedule = scheduleRepository.save(schedule);

        // Audit 로깅
        if (userId != null) {
            auditLogService.logScheduleCreate(userId, savedSchedule);
        }

        return new ScheduleResponse(savedSchedule, clubRepository, userRepository);
    }

    /**
     * 모든 일정 조회
     */
    public List<ScheduleResponse> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(schedule -> new ScheduleResponse(schedule, clubRepository, userRepository))
                .collect(Collectors.toList());
    }

    /**
     * 특정 일정 조회
     */
    public ScheduleResponse getScheduleById(Long scheduleId) {
        return getScheduleById(scheduleId, null);
    }

    /**
     * 특정 일정 조회 (권한 정보 포함)
     * - 클럽일정 + 모집 미진행: 멤버만 조회 가능
     * - 클럽일정 + 모집 중 (게스트/교류전): 비회원도 조회 가능 (ScheduleRecruitPage 플로우 보존)
     * - 공개일정: 누구나 조회 가능
     */
    public ScheduleResponse getScheduleById(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 클럽일정 + 모집 미진행: 멤버만 조회 가능
        if (schedule.isClubSchedule()
                && !Boolean.TRUE.equals(schedule.getGuestRecruitOpen())
                && !Boolean.TRUE.equals(schedule.getInterclubRecruitOpen())) {
            if (userId == null) {
                throw new AuthenticationRequiredException("클럽 일정을 조회하려면 로그인이 필요합니다.");
            }
            permissionService.requireClubMembership(userId, schedule.getClubId());
        }

        return new ScheduleResponse(schedule, clubRepository, userRepository, permissionService, userId);
    }

    /**
     * 특정 클럽의 모든 일정 조회
     */
    public List<ScheduleResponse> getSchedulesByClubId(Long clubId) {
        return scheduleRepository.findByClubId(clubId).stream()
                .map(schedule -> new ScheduleResponse(schedule, clubRepository, userRepository))
                .collect(Collectors.toList());
    }

    /**
     * 커서 기반 페이지네이션: 과거 방향 조회
     * - pivotDate 이전의 일정을 최신순(내림차순)으로 조회
     * - Infinite Scroll 리스트뷰용
     * @param clubId 클럽 ID
     * @param pivotDate 기준 날짜 (이 날짜 이전의 일정 조회)
     * @param size 조회할 개수
     * @return 커서 응답 (content는 오름차순으로 정렬하여 반환)
     */
    public ScheduleCursorResponse getSchedulesByClubIdPast(Long clubId, LocalDateTime pivotDate, int size) {
        List<Schedule> schedules = scheduleRepository.findByClubIdPast(
                clubId, pivotDate, org.springframework.data.domain.PageRequest.of(0, size + 1)
        );

        boolean hasMore = schedules.size() > size;
        if (hasMore) {
            schedules = schedules.subList(0, size);
        }

        // 내림차순으로 조회했으므로 오름차순으로 뒤집어서 반환 (프론트에서 prepend 시 순서 맞춤)
        Collections.reverse(schedules);

        LocalDateTime nextCursor = hasMore && !schedules.isEmpty()
                ? schedules.get(0).getScheduledAt()  // 가장 오래된 일정의 날짜가 다음 커서
                : null;

        List<ScheduleResponse> content = schedules.stream()
                .map(schedule -> new ScheduleResponse(schedule, clubRepository, userRepository))
                .collect(Collectors.toList());

        return new ScheduleCursorResponse(content, hasMore, nextCursor, content.size());
    }

    /**
     * 커서 기반 페이지네이션: 미래 방향 조회
     * - pivotDate 이후의 일정을 오름차순으로 조회
     * - Infinite Scroll 리스트뷰용
     * @param clubId 클럽 ID
     * @param pivotDate 기준 날짜 (이 날짜 이후의 일정 조회)
     * @param size 조회할 개수
     * @return 커서 응답
     */
    public ScheduleCursorResponse getSchedulesByClubIdFuture(Long clubId, LocalDateTime pivotDate, int size) {
        List<Schedule> schedules = scheduleRepository.findByClubIdFuture(
                clubId, pivotDate, org.springframework.data.domain.PageRequest.of(0, size + 1)
        );

        boolean hasMore = schedules.size() > size;
        if (hasMore) {
            schedules = schedules.subList(0, size);
        }

        LocalDateTime nextCursor = hasMore && !schedules.isEmpty()
                ? schedules.get(schedules.size() - 1).getScheduledAt()  // 가장 미래 일정의 날짜가 다음 커서
                : null;

        List<ScheduleResponse> content = schedules.stream()
                .map(schedule -> new ScheduleResponse(schedule, clubRepository, userRepository))
                .collect(Collectors.toList());

        return new ScheduleCursorResponse(content, hasMore, nextCursor, content.size());
    }

    /**
     * 특정 클럽의 향후 일정 조회 (현재 시간 이후, KST 기준)
     */
    public List<ScheduleResponse> getUpcomingSchedules(Long clubId) {
        LocalDateTime nowKST = TimeValidationUtils.getNowKST();
        return scheduleRepository.findByClubIdAndScheduledAtAfterOrderByScheduledAtAsc(clubId, nowKST).stream()
                .map(schedule -> new ScheduleResponse(schedule, clubRepository, userRepository))
                .collect(Collectors.toList());
    }

    /**
     * 탐색 화면용: 게스트/교류전 모집 중인 공개 일정 목록
     * - 로그인 없이도 조회 가능 (현재 schedules API는 permitAll)
     * - 현재 시각 이후(KST) 일정만 노출
     * - matchType 필터 지원 (MENS_DOUBLES, WOMENS_DOUBLES, MIXED_DOUBLES)
     * - fromDate/toDate 필터 지원 (날짜 범위 검색)
     */
    public List<PublicRecruitScheduleResponse> getPublicRecruitSchedules(
            String type, String matchType, java.time.LocalDate fromDate, java.time.LocalDate toDate, Integer limit) {
        LocalDateTime nowKST = TimeValidationUtils.getNowKST();
        int take = (limit == null || limit <= 0) ? 10 : Math.min(limit, 50);

        List<Schedule> schedules;
        final String recruitType = (type == null ? "GUEST" : type.toUpperCase());
        final boolean isInterclub = "INTERCLUB".equals(recruitType);
        if (isInterclub) {
            schedules = scheduleRepository.findByInterclubRecruitOpenTrueAndScheduledAtAfterOrderByScheduledAtAsc(nowKST);
        } else {
            schedules = scheduleRepository.findByGuestRecruitOpenTrueAndScheduledAtAfterOrderByScheduledAtAsc(nowKST);
        }

        // matchType 필터 적용
        if (matchType != null && !matchType.isEmpty()) {
            try {
                MatchType filterType = MatchType.valueOf(matchType.toUpperCase());
                schedules = schedules.stream()
                        .filter(s -> s.getMatchType() == filterType)
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                // 잘못된 matchType은 무시
            }
        }

        // 날짜 범위 필터 적용
        if (fromDate != null || toDate != null) {
            final LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
            final LocalDateTime toDateTime = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;
            schedules = schedules.stream()
                    .filter(s -> {
                        LocalDateTime scheduledAt = s.getScheduledAt();
                        if (fromDateTime != null && scheduledAt.isBefore(fromDateTime)) return false;
                        if (toDateTime != null && scheduledAt.isAfter(toDateTime)) return false;
                        return true;
                    })
                    .collect(Collectors.toList());
        }

        if (schedules.size() > take) {
            schedules = schedules.subList(0, take);
        }

        // club 정보 붙이기 (N+1이지만 현재는 리스트 소수 + MVP라서 허용)
        return schedules.stream().map(s -> {
            Club c = clubRepository.findById(s.getClubId())
                    .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + s.getClubId()));
            String note = isInterclub ? s.getInterclubRecruitNote() : s.getGuestRecruitNote();
            return new PublicRecruitScheduleResponse(s, c, isInterclub ? "INTERCLUB" : "GUEST", note);
        }).collect(Collectors.toList());
    }

    /**
     * 특정 클럽의 일정을 날짜 범위로 조회
     */
    public List<ScheduleResponse> getSchedulesByDateRange(Long clubId, LocalDateTime start, LocalDateTime end) {
        return scheduleRepository.findByClubIdAndScheduledAtBetween(clubId, start, end).stream()
                .map(schedule -> new ScheduleResponse(schedule, clubRepository, userRepository))
                .collect(Collectors.toList());
    }

    /**
     * 일정 수정
     */
    @Transactional
    public ScheduleResponse updateSchedule(Long scheduleId, UpdateScheduleRequest request, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 권한 체크: 공개일정은 생성자만, 클럽일정은 생성자 OR ADMIN 이상
        if (schedule.isPublicSchedule()) {
            if (!userId.equals(schedule.getCreatedByUserId())) {
                throw new PermissionDeniedException("일정 생성자만 수정할 수 있습니다.");
            }
        } else {
            if (!userId.equals(schedule.getCreatedByUserId())
                    && !permissionService.canManageSchedule(userId, schedule.getClubId())) {
                throw new PermissionDeniedException("일정 수정 권한이 없습니다. 생성자 또는 운영진 이상만 가능합니다.");
            }
        }

        // Audit용 스냅샷 (수정 전)
        ScheduleAuditSnapshot beforeSnapshot = ScheduleAuditSnapshot.from(schedule);

        // 과거 날짜 체크 (KST 기준)
        if (TimeValidationUtils.isPast(request.getScheduledAt())) {
            throw new IllegalStateException("과거 날짜에는 일정을 수정할 수 없습니다.");
        }

        // 참가신청 시작시간 검증
        if (request.getParticipationStartAt() != null) {
            if (request.getParticipationStartAt().isAfter(request.getScheduledAt()) ||
                request.getParticipationStartAt().isEqual(request.getScheduledAt())) {
                throw new IllegalArgumentException("참가신청 시작시간은 일정 시간보다 이전이어야 합니다.");
            }
        }

        // 기존 정원 저장
        Integer oldMaxCapacity = schedule.getMaxCapacity();

        schedule.update(
                request.getCourtName(),
                request.getScheduledAt(),
                request.getMaxCapacity(),
                request.getCost(),
                request.getDescription(),
                request.getReservedByUserId(),
                request.getParticipationStartAt(),
                request.getMatchType(),
                request.getDurationMinutes(),
                request.getNumberOfCourts()
        );

        // 정원이 증가한 경우, 대기자를 확정으로 승격
        if (request.getMaxCapacity() > oldMaxCapacity) {
            promoteWaitingParticipants(scheduleId, request.getMaxCapacity());
        }

        // Audit 로깅
        if (userId != null && beforeSnapshot != null) {
            auditLogService.logScheduleUpdate(userId, beforeSnapshot, schedule);
        }

        return new ScheduleResponse(schedule, clubRepository, userRepository);
    }

    /**
     * 일정 pinned 업데이트 (운영진 이상)
     */
    @Transactional
    public ScheduleResponse updatePinned(Long scheduleId, UpdateSchedulePinnedRequest request, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        if (userId == null) {
            throw new AuthenticationRequiredException("로그인이 필요합니다.");
        }
        if (!permissionService.canManageSchedule(userId, schedule.getClubId())) {
            throw new PermissionDeniedException("일정 고정(PIN) 권한이 없습니다. 운영진 이상만 가능합니다.");
        }

        boolean pinned = request != null && Boolean.TRUE.equals(request.getPinned());
        schedule.updatePinned(pinned);
        return new ScheduleResponse(schedule, clubRepository, userRepository, permissionService, userId);
    }

    /**
     * 게스트 모집 설정 업데이트 (운영진 이상)
     */
    @Transactional
    public ScheduleResponse updateGuestRecruit(Long scheduleId, UpdateScheduleGuestRecruitRequest request, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        if (userId == null) {
            throw new AuthenticationRequiredException("로그인이 필요합니다.");
        }
        if (!permissionService.canManageSchedule(userId, schedule.getClubId())) {
            throw new PermissionDeniedException("게스트 모집 설정 권한이 없습니다. 운영진 이상만 가능합니다.");
        }

        Boolean open = request != null ? request.getOpen() : null;
        String note = request != null ? request.getNote() : null;
        schedule.updateGuestRecruit(open, note);
        return new ScheduleResponse(schedule, clubRepository, userRepository, permissionService, userId);
    }

    /**
     * 교류전 모집 설정 업데이트 (운영진 이상)
     */
    @Transactional
    public ScheduleResponse updateInterclubRecruit(Long scheduleId, UpdateScheduleInterclubRecruitRequest request, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        if (userId == null) {
            throw new AuthenticationRequiredException("로그인이 필요합니다.");
        }
        if (!permissionService.canManageSchedule(userId, schedule.getClubId())) {
            throw new PermissionDeniedException("교류전 모집 설정 권한이 없습니다. 운영진 이상만 가능합니다.");
        }

        Boolean open = request != null ? request.getOpen() : null;
        String note = request != null ? request.getNote() : null;
        schedule.updateInterclubRecruit(open, note);
        return new ScheduleResponse(schedule, clubRepository, userRepository, permissionService, userId);
    }

    /**
     * 정원 증가 시 대기 중인 참가자를 확정으로 승격
     *
     * @param scheduleId 일정 ID
     * @param newMaxCapacity 새로운 정원
     */
    private void promoteWaitingParticipants(Long scheduleId, Integer newMaxCapacity) {
        log.info("=== 대기자 승격 시작 - scheduleId: {}, newMaxCapacity: {} ===", scheduleId, newMaxCapacity);

        // 모든 참가자 조회 (CANCELLED 제외, position 순)
        List<ScheduleParticipant> allParticipants = participantRepository.findActiveParticipantsByScheduleId(
                scheduleId, ScheduleParticipant.ParticipantStatus.CANCELLED);

        // CONFIRMED 참가자 수 계산
        long confirmedCount = allParticipants.stream()
                .filter(ScheduleParticipant::isConfirmed)
                .count();

        // 남은 자리 계산
        int availableSlots = newMaxCapacity - (int) confirmedCount;

        if (availableSlots <= 0) {
            log.info("남은 자리 없음 - confirmedCount: {}, maxCapacity: {}", confirmedCount, newMaxCapacity);
            return;
        }

        // WAITING 상태인 참가자를 position 순으로 필터링
        List<ScheduleParticipant> waitingParticipants = allParticipants.stream()
                .filter(ScheduleParticipant::isWaiting)
                .sorted(Comparator.comparing(ScheduleParticipant::getPosition))
                .limit(availableSlots)
                .collect(Collectors.toList());

        // WAITING → CONFIRMED 승격
        for (ScheduleParticipant participant : waitingParticipants) {
            participant.confirm();
            participantRepository.save(participant);
            log.info("대기자 승격 - userId: {}, position: {}, status: WAITING → CONFIRMED",
                    participant.getUserId(), participant.getPosition());
        }

        log.info("대기자 승격 완료 - 승격된 인원: {}", waitingParticipants.size());
    }

    /**
     * 일정 삭제
     */
    @Transactional
    public void deleteSchedule(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 권한 체크: 공개일정은 생성자만, 클럽일정은 생성자 OR ADMIN 이상
        if (userId == null) {
            throw new AuthenticationRequiredException("로그인이 필요합니다.");
        }
        if (schedule.isPublicSchedule()) {
            if (!userId.equals(schedule.getCreatedByUserId())) {
                throw new PermissionDeniedException("일정 생성자만 삭제할 수 있습니다.");
            }
        } else {
            if (!userId.equals(schedule.getCreatedByUserId())
                    && !permissionService.canManageSchedule(userId, schedule.getClubId())) {
                throw new PermissionDeniedException("일정 삭제 권한이 없습니다. 생성자 또는 운영진 이상만 가능합니다.");
            }
        }

        // 경기 결과가 존재하는 일정은 삭제 불가 (랭킹 데이터 보호)
        if (matchRepository.existsResultByScheduleId(scheduleId)) {
            throw new IllegalStateException("경기 결과가 존재하는 일정은 삭제할 수 없습니다.");
        }

        // 참가자에게 일정 삭제 알림 발송 (삭제 전)
        List<ScheduleParticipant> participants = participantRepository.findByScheduleIdOrderByPositionAsc(scheduleId);
        List<Long> notifyUserIds = participants.stream()
                .filter(p -> p.isConfirmed() || p.isWaiting() || p.isPending())
                .map(ScheduleParticipant::getUserId)
                .filter(id -> id != null && !id.equals(userId)) // 삭제자 본인 제외
                .distinct()
                .collect(Collectors.toList());

        if (!notifyUserIds.isEmpty()) {
            String courtName = schedule.getCourtName();
            notificationService.sendNotification(
                    schedule.getClubId(),
                    notifyUserIds,
                    "일정이 취소되었습니다",
                    courtName + " 일정이 취소되었습니다.",
                    NotificationType.SCHEDULE,
                    null,  // 삭제된 일정이므로 referenceId null → 알림 클릭 시 /explore로 이동
                    null
            );
        }

        // Audit 로깅 (삭제 전)
        auditLogService.logScheduleDelete(userId, schedule);

        scheduleRepository.delete(schedule);
    }

    /**
     * 대진 관리 권한 검증
     * - 공개일정: 호스트(생성자)만
     * - 클럽일정: 호스트 OR ADMIN 이상
     */
    public void validateDrawManagePermission(Long scheduleId, Long userId) {
        if (userId == null) {
            throw new AuthenticationRequiredException("로그인이 필요합니다.");
        }
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));
        if (schedule.isPublicSchedule()) {
            if (!userId.equals(schedule.getCreatedByUserId())) {
                throw new PermissionDeniedException("대진 관리는 호스트만 가능합니다.");
            }
        } else {
            if (!userId.equals(schedule.getCreatedByUserId())
                    && !permissionService.canManageSchedule(userId, schedule.getClubId())) {
                throw new PermissionDeniedException("대진 관리 권한이 없습니다. 호스트 또는 운영진 이상만 가능합니다.");
            }
        }
    }

    /**
     * 특정 사용자가 참여한 일정 ID 목록 조회
     */
    public List<Long> getMyParticipatingScheduleIds(Long userId) {
        return participantRepository.findScheduleIdsByUserId(userId);
    }

    /**
     * userId 기반 대진 생성 후 Match 테이블에 저장
     * 동일 schedule_id의 기존 대진이 있으면 삭제 후 새로 생성
     */
    @Transactional
    public void saveMatchesFromDrawWithIds(Long scheduleId, ScheduleResponse scheduleResponse,
                                            DrawResponse drawResponse, CreateDrawRequestWithIds request) {
        log.info("=== Match 저장 시작 (userId 기반) ===");
        log.info("scheduleId: {}, clubId: {}, games: {}",
                scheduleId, scheduleResponse.getClubId(), drawResponse.getGames().size());

        // 일정 조회
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 기존 대진이 있으면 삭제 (재생성 대응)
        List<Match> existingMatches = matchRepository.findByScheduleId(scheduleId);
        if (!existingMatches.isEmpty()) {
            // 경기 결과가 존재하면 재생성 불가
            validateNoGameResults(scheduleId);
            log.info("기존 대진 {} 건 삭제 후 재생성", existingMatches.size());
            matchRepository.deleteAll(existingMatches);
        }

        // Schedule에 대진 정보 저장
        schedule.createDraw(request.getDrawType());
        log.info("Schedule에 대진 정보 저장: drawType={}, isDrawValid=true", request.getDrawType());

        // userId -> userName 매핑 생성 (DrawResponse의 userName을 userId로 변환하기 위해)
        Map<Long, String> userIdToName = buildUserIdToNameMap(request);
        // userName -> userId 역매핑 생성
        Map<String, Long> nameToUserId = new HashMap<>();
        for (Map.Entry<Long, String> entry : userIdToName.entrySet()) {
            nameToUserId.put(entry.getValue(), entry.getKey());
        }

        // 게스트 이름 집합 추출
        Set<String> guestNames = request.getGuestNames() != null
                ? new HashSet<>(request.getGuestNames())
                : Collections.emptySet();

        Long clubId = scheduleResponse.getClubId();
        LocalDateTime playedAt = scheduleResponse.getScheduledAt();

        // 각 게임을 Match 엔티티로 변환하여 저장
        List<Match> matches = new ArrayList<>();
        for (DrawResponse.Game game : drawResponse.getGames()) {
            try {
                Match match = buildMatchFromGame(game, clubId, scheduleId, playedAt, nameToUserId, guestNames);
                matches.add(match);
            } catch (IllegalArgumentException e) {
                log.error("게임 {} Match 생성 실패: {}", game.getGameNo(), e.getMessage());
                throw e;
            }
        }

        matchRepository.saveAll(matches);
        log.info("Match 저장 완료: {} 건", matches.size());

        // 참가자 상태 업데이트: 대진에 포함된 선수는 CONFIRMED, 나머지는 WAITING
        updateParticipantStatusBasedOnDrawWithIds(scheduleId, request, guestNames);
    }

    /**
     * userId 리스트를 userName 리스트로 변환
     */
    public List<String> convertUserIdsToNames(List<Long> userIds) {
        if (userIds == null) {
            return null;
        }
        return userIds.stream()
                .map(userId -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userId));
                    return user.getName();
                })
                .collect(Collectors.toList());
    }

    /**
     * userId -> userName 매핑 생성
     */
    private Map<Long, String> buildUserIdToNameMap(CreateDrawRequestWithIds request) {
        Set<Long> allUserIds = new HashSet<>();

        if (request.getUserIds() != null) {
            allUserIds.addAll(request.getUserIds());
        }
        if (request.getSeedUserIds() != null) {
            allUserIds.addAll(request.getSeedUserIds());
        }
        if (request.getGroupAUserIds() != null) {
            allUserIds.addAll(request.getGroupAUserIds());
        }
        if (request.getGroupBUserIds() != null) {
            allUserIds.addAll(request.getGroupBUserIds());
        }

        Map<Long, String> userIdToName = new HashMap<>();
        for (Long userId : allUserIds) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userId));
            userIdToName.put(userId, user.getName());
        }

        return userIdToName;
    }

    /**
     * userId 기반 참가자 상태 업데이트 (게스트 포함)
     */
    private void updateParticipantStatusBasedOnDrawWithIds(Long scheduleId, CreateDrawRequestWithIds request,
                                                            Set<String> participatingGuestNames) {
        log.info("참가자 상태 업데이트 시작 (userId 기반)");
        log.info("scheduleId: {}, 대진 참여 선수 수: {}", scheduleId,
                (request.getUserIds() != null ? request.getUserIds().size() : 0) +
                (request.getSeedUserIds() != null ? request.getSeedUserIds().size() : 0) +
                (request.getGroupAUserIds() != null ? request.getGroupAUserIds().size() : 0) +
                (request.getGroupBUserIds() != null ? request.getGroupBUserIds().size() : 0));

        // 대진에 포함된 userId 집합
        Set<Long> participatingUserIds = new HashSet<>();
        if (request.getUserIds() != null) {
            participatingUserIds.addAll(request.getUserIds());
        }
        if (request.getSeedUserIds() != null) {
            participatingUserIds.addAll(request.getSeedUserIds());
        }
        if (request.getGroupAUserIds() != null) {
            participatingUserIds.addAll(request.getGroupAUserIds());
        }
        if (request.getGroupBUserIds() != null) {
            participatingUserIds.addAll(request.getGroupBUserIds());
        }
        log.info("대진 참여 userId: {}", participatingUserIds);
        log.info("대진 참여 게스트: {}", participatingGuestNames);

        // 해당 일정의 모든 참가자 조회
        List<com.example.openrunapi.domain.schedule.model.ScheduleParticipant> participants =
                participantRepository.findByScheduleIdOrderByPositionAsc(scheduleId);

        for (com.example.openrunapi.domain.schedule.model.ScheduleParticipant participant : participants) {
            boolean inDraw;
            if (participant.getUserId() != null) {
                inDraw = participatingUserIds.contains(participant.getUserId());
            } else if (participant.getGuestName() != null) {
                inDraw = participatingGuestNames.contains(participant.getGuestName());
            } else {
                inDraw = false;
            }

            if (inDraw) {
                if (participant.getStatus() != com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus.CONFIRMED) {
                    participant.confirm();
                    log.debug("userId={}, guestName={} CONFIRMED로 변경",
                            participant.getUserId(), participant.getGuestName());
                }
            } else {
                if (participant.getStatus() != com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus.WAITING) {
                    participant.waitlist();
                    log.debug("userId={}, guestName={} WAITING으로 변경",
                            participant.getUserId(), participant.getGuestName());
                }
            }
        }

        participantRepository.saveAll(participants);
        log.info("참가자 상태 업데이트 완료");
    }

    /**
     * 대진 생성 후 Match 테이블에 저장
     * 동일 schedule_id의 기존 대진이 있으면 삭제 후 새로 생성
     */
    @Transactional
    public void saveMatchesFromDraw(Long scheduleId, ScheduleResponse scheduleResponse,
                                     DrawResponse drawResponse, CreateDrawRequest request) {
        log.info("=== Match 저장 시작 ===");
        log.info("scheduleId: {}, clubId: {}, games: {}",
                scheduleId, scheduleResponse.getClubId(), drawResponse.getGames().size());

        // 일정 조회
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 기존 대진이 있으면 삭제 (재생성 대응)
        List<Match> existingMatches = matchRepository.findByScheduleId(scheduleId);
        if (!existingMatches.isEmpty()) {
            // 경기 결과가 존재하면 재생성 불가
            validateNoGameResults(scheduleId);
            log.info("기존 대진 {} 건 삭제 후 재생성", existingMatches.size());
            matchRepository.deleteAll(existingMatches);
        }

        // Schedule에 대진 정보 저장
        schedule.createDraw(request.getDrawType());
        log.info("Schedule에 대진 정보 저장: drawType={}, isDrawValid=true", request.getDrawType());

        // 선수 이름 -> userId 매핑 생성
        Map<String, Long> nameToUserId = buildNameToUserIdMap(request);

        Long clubId = scheduleResponse.getClubId();
        LocalDateTime playedAt = scheduleResponse.getScheduledAt();

        // 각 게임을 Match 엔티티로 변환하여 저장
        List<Match> matches = new ArrayList<>();
        for (DrawResponse.Game game : drawResponse.getGames()) {
            try {
                // 이름 기반 대진은 게스트 없음 (emptySet 전달)
                Match match = buildMatchFromGame(game, clubId, scheduleId, playedAt, nameToUserId, Collections.emptySet());
                matches.add(match);
            } catch (IllegalArgumentException e) {
                log.error("게임 {} Match 생성 실패: {}", game.getGameNo(), e.getMessage());
                throw e;
            }
        }

        matchRepository.saveAll(matches);
        log.info("Match 저장 완료: {} 건", matches.size());

        // 참가자 상태 업데이트: 대진에 포함된 선수는 CONFIRMED, 나머지는 WAITING
        updateParticipantStatusBasedOnDraw(scheduleId, nameToUserId);
    }

    /**
     * 선수 이름 -> userId 매핑 생성
     */
    private Map<String, Long> buildNameToUserIdMap(CreateDrawRequest request) {
        Set<String> allPlayerNames = new HashSet<>();

        if (request.getUserNames() != null) {
            allPlayerNames.addAll(request.getUserNames());
        }
        if (request.getSeedUserNames() != null) {
            allPlayerNames.addAll(request.getSeedUserNames());
        }
        if (request.getGroupAUserNames() != null) {
            allPlayerNames.addAll(request.getGroupAUserNames());
        }
        if (request.getGroupBUserNames() != null) {
            allPlayerNames.addAll(request.getGroupBUserNames());
        }

        Map<String, Long> nameToUserId = new HashMap<>();
        for (String name : allPlayerNames) {
            User user = userRepository.findByName(name)
                    .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + name));
            nameToUserId.put(name, user.getId());
        }

        return nameToUserId;
    }

    /**
     * DrawResponse.Game -> Match 엔티티 변환 (게스트 지원)
     */
    private Match buildMatchFromGame(DrawResponse.Game game, Long clubId, Long scheduleId,
                                      LocalDateTime playedAt, Map<String, Long> nameToUserId,
                                      Set<String> guestNames) {
        List<String> teamA = game.getTeamA();
        List<String> teamB = game.getTeamB();

        if (teamA.size() < 1 || teamB.size() < 1) {
            throw new IllegalArgumentException("팀은 최소 1명 이상이어야 합니다.");
        }

        // TeamA Player1
        String p1AName = teamA.get(0);
        Long teamAPlayer1Id = guestNames.contains(p1AName) ? null : nameToUserId.get(p1AName);
        String teamAPlayer1GuestName = guestNames.contains(p1AName) ? p1AName : null;

        // TeamA Player2
        Long teamAPlayer2Id = null;
        String teamAPlayer2GuestName = null;
        if (teamA.size() > 1) {
            String p2AName = teamA.get(1);
            teamAPlayer2Id = guestNames.contains(p2AName) ? null : nameToUserId.get(p2AName);
            teamAPlayer2GuestName = guestNames.contains(p2AName) ? p2AName : null;
        }

        // TeamB Player1
        String p1BName = teamB.get(0);
        Long teamBPlayer1Id = guestNames.contains(p1BName) ? null : nameToUserId.get(p1BName);
        String teamBPlayer1GuestName = guestNames.contains(p1BName) ? p1BName : null;

        // TeamB Player2
        Long teamBPlayer2Id = null;
        String teamBPlayer2GuestName = null;
        if (teamB.size() > 1) {
            String p2BName = teamB.get(1);
            teamBPlayer2Id = guestNames.contains(p2BName) ? null : nameToUserId.get(p2BName);
            teamBPlayer2GuestName = guestNames.contains(p2BName) ? p2BName : null;
        }

        // 최소 하나의 식별자(ID 또는 게스트 이름)가 있어야 함
        if (teamAPlayer1Id == null && teamAPlayer1GuestName == null) {
            throw new IllegalArgumentException("TeamA 첫 번째 선수 ID 또는 게스트 이름을 찾을 수 없습니다: " + p1AName);
        }
        if (teamBPlayer1Id == null && teamBPlayer1GuestName == null) {
            throw new IllegalArgumentException("TeamB 첫 번째 선수 ID 또는 게스트 이름을 찾을 수 없습니다: " + p1BName);
        }

        return Match.builder()
                .clubId(clubId)
                .scheduleId(scheduleId)
                .matchNumber(game.getGameNo())
                .teamAPlayer1Id(teamAPlayer1Id)
                .teamAPlayer2Id(teamAPlayer2Id)
                .teamAPlayer1GuestName(teamAPlayer1GuestName)
                .teamAPlayer2GuestName(teamAPlayer2GuestName)
                .teamBPlayer1Id(teamBPlayer1Id)
                .teamBPlayer2Id(teamBPlayer2Id)
                .teamBPlayer1GuestName(teamBPlayer1GuestName)
                .teamBPlayer2GuestName(teamBPlayer2GuestName)
                .playedAt(playedAt)
                .isMigrated(false)
                .build();
    }

    /**
     * 일정의 대진표 조회 (Match -> DrawResponse 변환)
     * - 클럽일정 + 모집 미진행: 멤버만 조회 가능
     * - 클럽일정 + 모집 중 / 공개일정: 누구나 조회 가능
     */
    public DrawResponse getDrawForSchedule(Long scheduleId, Long userId) {
        // 일정 존재 확인
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 클럽일정 + 모집 미진행: 멤버만 조회 가능
        if (schedule.isClubSchedule()
                && !Boolean.TRUE.equals(schedule.getGuestRecruitOpen())
                && !Boolean.TRUE.equals(schedule.getInterclubRecruitOpen())) {
            if (userId == null) {
                throw new AuthenticationRequiredException("클럽 대진표를 조회하려면 로그인이 필요합니다.");
            }
            permissionService.requireClubMembership(userId, schedule.getClubId());
        }

        // 대진표가 없으면 404
        if (schedule.getDrawType() == null) {
            throw new EntityNotFoundException("해당 일정에 생성된 대진표가 없습니다.");
        }

        // Match 목록 조회
        List<Match> matches = matchRepository.findByScheduleId(scheduleId);
        if (matches.isEmpty()) {
            throw new EntityNotFoundException("해당 일정의 대진 데이터를 찾을 수 없습니다.");
        }

        // Match -> DrawResponse.Game 변환
        List<DrawResponse.Game> games = matches.stream()
                .sorted(Comparator.comparing(Match::getMatchNumber))
                .map(match -> {
                    List<String> teamA = new ArrayList<>();
                    teamA.add(getPlayerDisplayName(match.getTeamAPlayer1Id(), match.getTeamAPlayer1GuestName()));
                    if (match.getTeamAPlayer2Id() != null || match.getTeamAPlayer2GuestName() != null) {
                        teamA.add(getPlayerDisplayName(match.getTeamAPlayer2Id(), match.getTeamAPlayer2GuestName()));
                    }

                    List<String> teamB = new ArrayList<>();
                    teamB.add(getPlayerDisplayName(match.getTeamBPlayer1Id(), match.getTeamBPlayer1GuestName()));
                    if (match.getTeamBPlayer2Id() != null || match.getTeamBPlayer2GuestName() != null) {
                        teamB.add(getPlayerDisplayName(match.getTeamBPlayer2Id(), match.getTeamBPlayer2GuestName()));
                    }

                    return DrawResponse.Game.builder()
                            .gameNo(match.getMatchNumber())
                            .roundNo(calculateRoundNumber(match.getMatchNumber(), matches.size()))
                            .teamA(teamA)
                            .teamB(teamB)
                            .matchId(match.getId())
                            .teamAScore(match.getTeamAScore())
                            .teamBScore(match.getTeamBScore())
                            .result(match.getResult() != null ? match.getResult().name() : null)
                            .playedAt(match.getPlayedAt() != null ? match.getPlayedAt().toString() : null)
                            .build();
                })
                .collect(Collectors.toList());

        return new DrawResponse(games);
    }

    /**
     * 사용자 ID로 이름 조회
     */
    private String getUserName(Long userId) {
        return userRepository.findById(userId)
                .map(User::getName)
                .orElse("알 수 없음");
    }

    /**
     * 선수 표시 이름 조회 (userId 우선, 없으면 guestName, 둘 다 없으면 기본값)
     */
    private String getPlayerDisplayName(Long playerId, String guestName) {
        if (playerId != null) {
            return getUserName(playerId);
        }
        if (guestName != null) {
            return guestName;
        }
        return "알 수 없음";
    }

    /**
     * 경기 번호로 라운드 계산 (간단한 추정)
     * 실제 로직은 대진표 생성 알고리즘에 따라 달라질 수 있음
     */
    private Integer calculateRoundNumber(Integer matchNumber, int totalMatches) {
        // 간단한 추정: 총 경기 수에 따라 라운드 계산
        // 예: 6경기 = 3라운드 (2경기씩)
        if (totalMatches <= 2) return 1;
        if (totalMatches <= 4) return matchNumber <= 2 ? 1 : 2;
        if (totalMatches <= 6) return matchNumber <= 2 ? 1 : matchNumber <= 4 ? 2 : 3;
        // 더 많은 경기는 matchNumber를 2로 나눈 값 + 1
        return (matchNumber - 1) / 2 + 1;
    }

    /**
     * 대진 생성 시 참가자 상태 업데이트
     * - 대진에 포함된 선수 → CONFIRMED
     * - 대진에 포함되지 않은 선수 → WAITING
     */
    private void updateParticipantStatusBasedOnDraw(Long scheduleId, Map<String, Long> nameToUserId) {
        log.info("=== 참가자 상태 업데이트 시작 ===");
        log.info("scheduleId: {}, 대진 참여 선수: {}", scheduleId, nameToUserId.size());

        // 대진에 포함된 userId 집합
        Set<Long> participatingUserIds = new HashSet<>(nameToUserId.values());
        log.info("대진 참여 userId: {}", participatingUserIds);

        // 해당 일정의 모든 참가자 조회 (취소된 사람 제외)
        List<com.example.openrunapi.domain.schedule.model.ScheduleParticipant> allParticipants =
                participantRepository.findByScheduleIdOrderByPositionAsc(scheduleId)
                        .stream()
                        .filter(p -> !p.isCancelled())
                        .collect(Collectors.toList());

        int confirmedCount = 0;
        int waitingCount = 0;
        List<com.example.openrunapi.domain.schedule.model.ScheduleParticipant> updatedParticipants = new ArrayList<>();

        for (com.example.openrunapi.domain.schedule.model.ScheduleParticipant participant : allParticipants) {
            boolean needsUpdate = false;

            if (participatingUserIds.contains(participant.getUserId())) {
                // 대진에 포함됨 → CONFIRMED
                if (!participant.isConfirmed()) {
                    participant.confirm();
                    confirmedCount++;
                    needsUpdate = true;
                    log.debug("userId={} CONFIRMED로 변경", participant.getUserId());
                }
            } else {
                // 대진에 포함되지 않음 → WAITING
                if (!participant.isWaiting()) {
                    participant.waitlist();
                    waitingCount++;
                    needsUpdate = true;
                    log.debug("userId={} WAITING으로 변경", participant.getUserId());
                }
            }

            if (needsUpdate) {
                updatedParticipants.add(participant);
            }
        }

        // 변경된 참가자만 저장
        if (!updatedParticipants.isEmpty()) {
            participantRepository.saveAll(updatedParticipants);
            log.info("참가자 상태 저장 완료: {} 명", updatedParticipants.size());
        }

        log.info("참가자 상태 업데이트 완료: CONFIRMED {} 명, WAITING {} 명", confirmedCount, waitingCount);
    }

    /**
     * 일정의 대진표 삭제
     */
    @Transactional
    public void deleteDrawForSchedule(Long scheduleId) {
        log.info("=== 대진표 삭제 시작 ===");
        log.info("scheduleId: {}", scheduleId);

        // 일정 조회
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 대진표가 없으면 예외
        if (!schedule.hasDraw()) {
            throw new IllegalStateException("삭제할 대진표가 존재하지 않습니다.");
        }

        // 경기 결과가 존재하면 대진 삭제 불가
        validateNoGameResults(scheduleId);

        // Match 테이블에서 해당 일정의 모든 매치 삭제
        List<Match> matches = matchRepository.findByScheduleId(scheduleId);
        if (!matches.isEmpty()) {
            matchRepository.deleteAll(matches);
            log.info("Match 삭제 완료: {} 건", matches.size());
        }

        // Schedule의 대진 정보 삭제
        schedule.deleteDraw();
        log.info("Schedule 대진 정보 삭제 완료");

        // 참가자 상태는 그대로 유지 (선착순 정보 보존)
        log.info("참가자 상태 유지 (선착순 정보 보존)");

        log.info("=== 대진표 삭제 완료 ===");
    }

    /**
     * 경기 결과가 존재하면 예외 발생 (대진 삭제/재생성 차단용)
     */
    private void validateNoGameResults(Long scheduleId) {
        if (matchRepository.existsResultByScheduleId(scheduleId)) {
            throw new IllegalStateException("경기 결과가 존재하는 대진표는 삭제하거나 재생성할 수 없습니다.");
        }
    }

    /**
     * 수동 대진 저장 (MANUAL 타입)
     * 프론트엔드에서 직접 구성한 대진을 저장
     */
    @Transactional
    public DrawResponse saveManualDraw(Long scheduleId, ScheduleResponse scheduleResponse,
                                        CreateDrawRequestWithIds request) {
        log.info("=== 수동 대진 저장 시작 ===");
        log.info("scheduleId: {}, manualGames: {}",
                scheduleId, request.getManualGames() != null ? request.getManualGames().size() : 0);

        if (request.getManualGames() == null || request.getManualGames().isEmpty()) {
            throw new IllegalArgumentException("수동 대진 정보가 없습니다.");
        }

        // 일정 조회
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 기존 대진이 있으면 삭제 (재생성 대응)
        List<Match> existingMatches = matchRepository.findByScheduleId(scheduleId);
        if (!existingMatches.isEmpty()) {
            // 경기 결과가 존재하면 재생성 불가
            validateNoGameResults(scheduleId);
            log.info("기존 대진 {} 건 삭제 후 재생성", existingMatches.size());
            matchRepository.deleteAll(existingMatches);
        }

        // Schedule에 대진 정보 저장
        schedule.createDraw(request.getDrawType());
        log.info("Schedule에 대진 정보 저장: drawType=MANUAL, isDrawValid=true");

        // userId -> userName 매핑 생성
        Map<Long, String> userIdToName = buildUserIdToNameMapFromManualGames(request.getManualGames());

        Long clubId = scheduleResponse.getClubId();
        LocalDateTime playedAt = scheduleResponse.getScheduledAt();

        // manualGames -> Match 엔티티 변환 및 저장
        List<Match> matches = new ArrayList<>();
        List<DrawResponse.Game> responseGames = new ArrayList<>();

        for (CreateDrawRequestWithIds.ManualGame game : request.getManualGames()) {
            // Team A 선수 처리 (등록 회원 + 게스트)
            List<Long> teamAUserIds = game.getTeamAUserIds() != null ? game.getTeamAUserIds() : List.of();
            List<String> teamAGuestNames = game.getTeamAGuestNames() != null ? game.getTeamAGuestNames() : List.of();
            List<Long> teamBUserIds = game.getTeamBUserIds() != null ? game.getTeamBUserIds() : List.of();
            List<String> teamBGuestNames = game.getTeamBGuestNames() != null ? game.getTeamBGuestNames() : List.of();

            // Match 엔티티 생성 (게스트 이름 포함)
            Match.MatchBuilder matchBuilder = Match.builder()
                    .clubId(clubId)
                    .scheduleId(scheduleId)
                    .matchNumber(game.getGameNo())
                    .playedAt(playedAt)
                    .isMigrated(false);

            // Team A Player 1
            if (!teamAUserIds.isEmpty()) {
                matchBuilder.teamAPlayer1Id(teamAUserIds.get(0));
            } else if (!teamAGuestNames.isEmpty()) {
                matchBuilder.teamAPlayer1GuestName(teamAGuestNames.get(0));
            }
            // Team A Player 2
            if (teamAUserIds.size() > 1) {
                matchBuilder.teamAPlayer2Id(teamAUserIds.get(1));
            } else if (teamAUserIds.size() == 1 && !teamAGuestNames.isEmpty()) {
                matchBuilder.teamAPlayer2GuestName(teamAGuestNames.get(0));
            } else if (teamAUserIds.isEmpty() && teamAGuestNames.size() > 1) {
                matchBuilder.teamAPlayer2GuestName(teamAGuestNames.get(1));
            }
            // Team B Player 1
            if (!teamBUserIds.isEmpty()) {
                matchBuilder.teamBPlayer1Id(teamBUserIds.get(0));
            } else if (!teamBGuestNames.isEmpty()) {
                matchBuilder.teamBPlayer1GuestName(teamBGuestNames.get(0));
            }
            // Team B Player 2
            if (teamBUserIds.size() > 1) {
                matchBuilder.teamBPlayer2Id(teamBUserIds.get(1));
            } else if (teamBUserIds.size() == 1 && !teamBGuestNames.isEmpty()) {
                matchBuilder.teamBPlayer2GuestName(teamBGuestNames.get(0));
            } else if (teamBUserIds.isEmpty() && teamBGuestNames.size() > 1) {
                matchBuilder.teamBPlayer2GuestName(teamBGuestNames.get(1));
            }

            matches.add(matchBuilder.build());

            // DrawResponse.Game 생성 (이름 리스트)
            List<String> teamANames = new ArrayList<>();
            teamAUserIds.forEach(id -> teamANames.add(userIdToName.getOrDefault(id, "알 수 없음")));
            teamANames.addAll(teamAGuestNames);
            List<String> teamBNames = new ArrayList<>();
            teamBUserIds.forEach(id -> teamBNames.add(userIdToName.getOrDefault(id, "알 수 없음")));
            teamBNames.addAll(teamBGuestNames);

            responseGames.add(DrawResponse.Game.builder()
                    .gameNo(game.getGameNo())
                    .roundNo(game.getRoundNo())
                    .teamA(teamANames)
                    .teamB(teamBNames)
                    .build());
        }

        matchRepository.saveAll(matches);
        log.info("수동 대진 Match 저장 완료: {} 건", matches.size());

        // 참가자 상태 업데이트
        updateParticipantStatusBasedOnManualGames(scheduleId, request.getManualGames());

        log.info("=== 수동 대진 저장 완료 ===");
        return new DrawResponse(responseGames);
    }

    /**
     * 수동 대진 게임에서 userId -> userName 매핑 생성
     */
    private Map<Long, String> buildUserIdToNameMapFromManualGames(List<CreateDrawRequestWithIds.ManualGame> manualGames) {
        Set<Long> allUserIds = new HashSet<>();
        for (CreateDrawRequestWithIds.ManualGame game : manualGames) {
            if (game.getTeamAUserIds() != null) allUserIds.addAll(game.getTeamAUserIds());
            if (game.getTeamBUserIds() != null) allUserIds.addAll(game.getTeamBUserIds());
        }

        Map<Long, String> userIdToName = new HashMap<>();
        for (Long userId : allUserIds) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userId));
            userIdToName.put(userId, user.getName());
        }

        return userIdToName;
    }

    /**
     * 공개 일정 생성
     */
    @Transactional
    public ScheduleResponse createPublicSchedule(CreatePublicScheduleRequest request, Long userId) {
        if (TimeValidationUtils.isPast(request.getScheduledAt())) {
            throw new IllegalStateException("과거 날짜에는 일정을 생성할 수 없습니다.");
        }

        Schedule schedule = Schedule.builder()
                .clubId(null)
                .scheduleType(ScheduleType.PUBLIC)
                .courtName(request.getCourtName())
                .courtAddress(request.getCourtAddress())
                .region(request.getRegion())
                .scheduledAt(request.getScheduledAt())
                .maxCapacity(request.getMaxCapacity())
                .cost(request.getCost())
                .description(request.getDescription())
                .createdByUserId(userId)
                .matchType(request.getMatchType())
                .durationMinutes(request.getDurationMinutes())
                .numberOfCourts(request.getNumberOfCourts())
                .build();

        Schedule saved = scheduleRepository.save(schedule);

        // Audit 로깅
        auditLogService.logScheduleCreate(userId, saved);

        // 호스트(생성자)를 첫 번째 CONFIRMED 참가자로 자동 등록
        Integer nextPosition = participantRepository.getNextPosition(saved.getId());
        ScheduleParticipant hostParticipant = ScheduleParticipant.builder()
                .scheduleId(saved.getId())
                .userId(userId)
                .status(ScheduleParticipant.ParticipantStatus.CONFIRMED)
                .position(nextPosition != null ? nextPosition : 1)
                .build();
        participantRepository.save(hostParticipant);
        saved.incrementParticipants();

        log.info("공개 일정 생성 완료: scheduleId={}, createdByUserId={}", saved.getId(), userId);
        return new ScheduleResponse(saved, clubRepository, userRepository);
    }

    /**
     * 공개 일정 목록 조회 (지역/matchType 필터 지원)
     */
    public List<PublicScheduleResponse> getPublicSchedules(String region, MatchType matchType, Integer limit) {
        LocalDateTime now = TimeValidationUtils.getNowKST();
        int take = (limit == null || limit <= 0) ? 20 : Math.min(limit, 50);
        Pageable pageable = PageRequest.of(0, take);

        List<Schedule> schedules;
        if (region != null && !region.isEmpty()) {
            schedules = scheduleRepository.findPublicSchedulesByRegion(now, region, pageable);
        } else {
            schedules = scheduleRepository.findPublicSchedules(now, pageable);
        }

        // matchType 필터 적용
        if (matchType != null) {
            schedules = schedules.stream()
                    .filter(s -> matchType.equals(s.getMatchType()))
                    .collect(Collectors.toList());
        }

        return schedules.stream()
                .map(s -> new PublicScheduleResponse(s, userRepository))
                .collect(Collectors.toList());
    }

    /**
     * 수동 대진 기반 참가자 상태 업데이트
     */
    private void updateParticipantStatusBasedOnManualGames(Long scheduleId,
                                                           List<CreateDrawRequestWithIds.ManualGame> manualGames) {
        log.info("참가자 상태 업데이트 시작 (수동 대진)");

        // 대진에 포함된 userId 집합
        Set<Long> participatingUserIds = new HashSet<>();
        Set<String> participatingGuestNames = new HashSet<>();
        for (CreateDrawRequestWithIds.ManualGame game : manualGames) {
            if (game.getTeamAUserIds() != null) participatingUserIds.addAll(game.getTeamAUserIds());
            if (game.getTeamBUserIds() != null) participatingUserIds.addAll(game.getTeamBUserIds());
            if (game.getTeamAGuestNames() != null) participatingGuestNames.addAll(game.getTeamAGuestNames());
            if (game.getTeamBGuestNames() != null) participatingGuestNames.addAll(game.getTeamBGuestNames());
        }
        log.info("대진 참여 userId: {}, guestNames: {}", participatingUserIds, participatingGuestNames);

        // 해당 일정의 모든 참가자 조회
        List<ScheduleParticipant> participants =
                participantRepository.findByScheduleIdOrderByPositionAsc(scheduleId);

        for (ScheduleParticipant participant : participants) {
            boolean isInDraw;
            if (participant.getUserId() != null) {
                isInDraw = participatingUserIds.contains(participant.getUserId());
            } else {
                isInDraw = participant.getGuestName() != null
                        && participatingGuestNames.contains(participant.getGuestName());
            }

            if (isInDraw) {
                if (participant.getStatus() != ScheduleParticipant.ParticipantStatus.CONFIRMED) {
                    participant.confirm();
                    log.debug("participant={} CONFIRMED로 변경", participant.getId());
                }
            } else {
                if (participant.getStatus() != ScheduleParticipant.ParticipantStatus.WAITING) {
                    participant.waitlist();
                    log.debug("participant={} WAITING으로 변경", participant.getId());
                }
            }
        }

        participantRepository.saveAll(participants);
        log.info("참가자 상태 업데이트 완료");
    }
}
