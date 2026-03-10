package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.common.service.PermissionService;
import com.example.openrunapi.domain.audit.dto.ScheduleParticipantAuditSnapshot;
import com.example.openrunapi.domain.audit.service.AuditLogService;
import com.example.openrunapi.domain.award.service.AwardService;
import com.example.openrunapi.domain.match.repository.MatchRepository;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus;
import com.example.openrunapi.domain.schedule.model.dto.BatchParticipationRequest;
import com.example.openrunapi.domain.schedule.model.dto.BatchParticipationResponse;
import com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.example.openrunapi.common.exception.PermissionDeniedException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.openrunapi.domain.calendar.service.CalendarSyncService;
import com.example.openrunapi.domain.club.model.ClubRole;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.notification.model.NotificationType;
import com.example.openrunapi.domain.notification.service.NotificationService;
import com.example.openrunapi.common.utils.TimeValidationUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ScheduleParticipantService {

    private final ScheduleParticipantRepository participantRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final PermissionService permissionService;
    private final AuditLogService auditLogService;
    private final AwardService awardService;
    private final MatchRepository matchRepository;
    private final NotificationService notificationService;
    private final ClubMemberRepository clubMemberRepository;
    private final CalendarSyncService calendarSyncService;

    /**
     * 일정 참가 신청
     * - 해당 클럽의 멤버만 참가신청 가능
     * - 게스트 사용자(isGuest=true)는 클럽 멤버십 체크 없이 참가 가능
     * - 외부 게스트는 별도의 externalRequest 프로세스를 거쳐야 함
     */
    @Transactional
    public ParticipantResponse joinSchedule(Long scheduleId, Long userId) {
        // 1. 일정 존재 여부 확인
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 2. 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));

        // 3. 클럽 멤버십 체크 (클럽 일정에서 클럽원만 직접 참가 가능)
        // 게스트/외부 사용자는 requestJoinPublicSchedule(PENDING → 승인) 플로우를 사용해야 함
        if (schedule.isClubSchedule()) {
            permissionService.requireClubMembership(userId, schedule.getClubId());
        }

        // 3. 과거 일정 체크 (KST 기준)
        if (TimeValidationUtils.isPast(schedule.getScheduledAt())) {
            throw new IllegalStateException("이미 지난 일정에는 참가신청할 수 없습니다.");
        }

        // 3. 참가신청 시작시간 체크 (participationStartAt이 설정되어 있고, 아직 시간이 도래하지 않았으면 예외 발생, KST 기준)
        if (schedule.getParticipationStartAt() != null) {
            if (!TimeValidationUtils.isAfter(schedule.getParticipationStartAt())) {
                throw new IllegalStateException(
                    String.format("참가신청 시작 시간이 아직 도래하지 않았습니다. 시작 시간: %s",
                        schedule.getParticipationStartAt())
                );
            }
        }

        // 3. 이미 신청한 사용자인지 확인 (취소하지 않은 신청이 있는지)
        if (participantRepository.findActiveParticipation(scheduleId, userId, ParticipantStatus.CANCELLED).isPresent()) {
            throw new IllegalStateException("이미 참가 신청한 일정입니다.");
        }

        // 4. 현재 참가자 수 (취소 제외) 확인
        Long currentParticipants = participantRepository.countActiveParticipants(scheduleId, ParticipantStatus.CANCELLED);

        // 5. 상태 결정: maxCapacity 미만이면 CONFIRMED, 이상이면 WAITING
        ParticipantStatus status = currentParticipants < schedule.getMaxCapacity()
                ? ParticipantStatus.CONFIRMED
                : ParticipantStatus.WAITING;

        // 6. 다음 position 번호 가져오기
        Integer nextPosition = participantRepository.getNextPosition(scheduleId);

        // 7. 참가자 생성 및 저장 (게스트 사용자는 asGuest=true)
        ScheduleParticipant participant = ScheduleParticipant.builder()
                .scheduleId(scheduleId)
                .userId(userId)
                .status(status)
                .position(nextPosition)
                .asGuest(user.isGuest())
                .build();

        ScheduleParticipant savedParticipant = participantRepository.save(participant);

        // 8. Schedule의 currentParticipants 업데이트 (상태 무관, 신청한 모든 사람 카운트)
        schedule.incrementParticipants();

        // 9. Audit 로깅
        auditLogService.logParticipantCreate(userId, savedParticipant, schedule.getClubId());

        // 10. 외부 캘린더 동기화 (CONFIRMED 상태일 때만, 트랜잭션 커밋 후 실행)
        if (status == ParticipantStatus.CONFIRMED) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    calendarSyncService.onParticipantConfirmed(userId, scheduleId);
                }
            });
        }

        // 11. userName 포함된 Response 반환 (user는 위에서 이미 조회함)
        return new ParticipantResponse(savedParticipant, user.getName());
    }

    /**
     * 외부 승인 게스트 참가 반영 (운영진 승인 시 호출)
     * - 참가자 슬롯/대기 로직은 joinSchedule과 동일하게 "현재 활성 참가자 수" 기준
     * - asGuest=true로 기록
     */
    @Transactional
    public ParticipantResponse addApprovedExternalGuest(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 이미 참가자라면(확정/대기) asGuest만 true로 보정
        Optional<ScheduleParticipant> existing = participantRepository.findActiveParticipation(scheduleId, userId, ParticipantStatus.CANCELLED);
        if (existing.isPresent()) {
            ScheduleParticipant p = existing.get();
            if (!p.isAsGuest()) {
                // 기존 내부 참가자를 외부 게스트로 바꾸는 건 의도치 않으므로 그대로 둔다.
                // (대리 신청 등으로 userId가 클럽원일 수 있음)
            }
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));
            return new ParticipantResponse(p, user.getName());
        }

        Long currentParticipants = participantRepository.countActiveParticipants(scheduleId, ParticipantStatus.CANCELLED);
        ParticipantStatus status = currentParticipants < schedule.getMaxCapacity()
                ? ParticipantStatus.CONFIRMED
                : ParticipantStatus.WAITING;
        Integer nextPosition = participantRepository.getNextPosition(scheduleId);

        ScheduleParticipant participant = ScheduleParticipant.builder()
                .scheduleId(scheduleId)
                .userId(userId)
                .status(status)
                .position(nextPosition)
                .asGuest(true)
                .build();

        ScheduleParticipant saved = participantRepository.save(participant);
        schedule.incrementParticipants();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));
        return new ParticipantResponse(saved, user.getName());
    }

    /**
     * 외부 승인 게스트 참가 제거 (운영진 반려/외부신청 취소 시 호출)
     * - asGuest=true인 참가자만 제거 (클럽원이 대리 신청한 케이스 보호)
     */
    @Transactional
    public void removeApprovedExternalGuest(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        ScheduleParticipant participant = participantRepository
                .findActiveParticipation(scheduleId, userId, ParticipantStatus.CANCELLED)
                .orElse(null);
        if (participant == null) return;
        if (!participant.isAsGuest()) return;

        boolean wasConfirmed = participant.isConfirmed();
        participantRepository.delete(participant);
        schedule.decrementParticipants();

        // 대진에 포함된 사용자가 제거되는 경우에만 무효화
        invalidateDrawIfUserInDraw(schedule, userId);

        if (wasConfirmed) {
            List<ScheduleParticipant> waitingList = participantRepository
                    .findActiveParticipantsByScheduleId(scheduleId, ParticipantStatus.CANCELLED)
                    .stream()
                    .filter(ScheduleParticipant::isWaiting)
                    .collect(Collectors.toList());

            if (!waitingList.isEmpty()) {
                ScheduleParticipant firstWaiting = waitingList.get(0);
                firstWaiting.confirm();
            }
        }
    }

    /**
     * 참가 신청 취소
     */
    @Transactional
    public void cancelParticipation(Long scheduleId, Long userId) {
        // 1. 일정 존재 여부 확인
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 2. 과거 일정 취소 방지 (KST 기준)
        if (TimeValidationUtils.isPast(schedule.getScheduledAt())) {
            throw new IllegalStateException("이미 지난 일정의 참가신청은 취소할 수 없습니다.");
        }

        // 3. 참가 신청 내역 확인 (취소되지 않은 것만)
        ScheduleParticipant participant = participantRepository
                .findActiveParticipation(scheduleId, userId, ParticipantStatus.CANCELLED)
                .orElseThrow(() -> new EntityNotFoundException("참가 신청 내역을 찾을 수 없습니다."));

        // 3. Audit 로깅 (삭제 전)
        auditLogService.logParticipantDelete(userId, participant, schedule.getClubId());

        // 4. 참가 신청 취소 처리 (레코드 삭제 - 재신청 가능하도록)
        boolean wasConfirmed = participant.isConfirmed();
        participantRepository.delete(participant);

        // 5. 외부 캘린더 이벤트 삭제 (트랜잭션 커밋 후 실행)
        if (wasConfirmed) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    calendarSyncService.onParticipantCancelled(userId, scheduleId);
                }
            });
        }

        // 6. Schedule의 currentParticipants 감소
        schedule.decrementParticipants();

        // 7. 대진에 포함된 사용자가 취소하는 경우에만 무효화
        invalidateDrawIfUserInDraw(schedule, userId);

        // 7. CONFIRMED 상태였다면 대기 중인 사람을 CONFIRMED로 변경
        if (wasConfirmed) {
            List<ScheduleParticipant> waitingList = participantRepository
                    .findActiveParticipantsByScheduleId(scheduleId, ParticipantStatus.CANCELLED)
                    .stream()
                    .filter(ScheduleParticipant::isWaiting)
                    .collect(Collectors.toList());

            if (!waitingList.isEmpty()) {
                ScheduleParticipant firstWaiting = waitingList.get(0);
                firstWaiting.confirm();
                // currentParticipants는 이미 카운트되어 있으므로 증가시키지 않음

                // 대기→확정 승격 알림
                if (firstWaiting.getUserId() != null) {
                    try {
                        notificationService.sendNotification(
                                schedule.getClubId(), firstWaiting.getUserId(),
                                "참가 확정", schedule.getCourtName() + " 일정에 대기에서 확정으로 변경되었습니다",
                                NotificationType.SCHEDULE, scheduleId, "SCHEDULE");
                    } catch (Exception e) {
                        log.warn("대기→확정 승격 알림 발송 실패: {}", e.getMessage());
                    }
                }
            }
        }
    }

    /**
     * 특정 일정의 참가자 목록 조회 (userName, awardTypes 포함)
     */
    public List<ParticipantResponse> getParticipants(Long scheduleId) {
        // 1. 참가자 목록 조회
        List<ParticipantResponse> participants = participantRepository
                .findActiveParticipantsWithUserName(scheduleId, ParticipantStatus.CANCELLED);

        if (participants.isEmpty()) {
            return participants;
        }

        // 2. Schedule에서 clubId 가져오기
        Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
        if (schedule == null) {
            return participants;
        }

        // 3. 직전 완료 기간의 수상자 조회 (공개 일정은 클럽 없으므로 스킵)
        if (schedule.isPublicSchedule()) {
            return participants;
        }
        try {
            var winnersResponse = awardService.getCurrentWinners(schedule.getClubId());

            // userId -> List<AwardType> 매핑
            Map<Long, List<String>> userAwardTypes = new HashMap<>();
            if (winnersResponse.getWinners() != null) {
                for (var winner : winnersResponse.getWinners()) {
                    userAwardTypes.computeIfAbsent(winner.getUserId(), k -> new ArrayList<>())
                            .add(winner.getType().name());
                }
            }

            // 4. 참가자별 수상 타입 설정
            return participants.stream()
                    .map(p -> {
                        List<String> types = userAwardTypes.getOrDefault(p.getUserId(), List.of());
                        return types.isEmpty() ? p : p.withAwardTypes(types);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("수상자 정보 조회 실패: {}", e.getMessage());
            return participants;
        }
    }

    /**
     * 사용자의 특정 일정 참가 신청 내역 조회 (userName 포함)
     */
    public ParticipantResponse getMyParticipation(Long scheduleId, Long userId) {
        // User와 JOIN하여 userName 포함하여 조회
        return participantRepository.findActiveParticipationWithUserName(scheduleId, userId, ParticipantStatus.CANCELLED)
                .orElse(null);
    }

    /**
     * 참가자 일괄 수정 (운영진 전용)
     * - 권한 체크: System Admin 또는 Club ADMIN 이상
     * - 기존 참가자 추가/삭제 가능
     * - 기존 참가자의 position은 유지
     * - 새로 추가되는 참가자는 마지막에 append
     *
     * @param scheduleId 일정 ID
     * @param userIds 참가자로 지정할 userId 목록
     * @param requestUserId 요청한 사용자 ID (권한 체크용)
     */
    @Transactional
    public void bulkUpdateParticipants(Long scheduleId, List<Long> userIds, Long requestUserId) {
        log.info("=== 참가자 일괄 수정 시작 ===");
        log.info("scheduleId: {}, requestUserId: {}, userIds: {}", scheduleId, requestUserId, userIds);

        // 1. 일정 존재 여부 확인
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 2. 권한 체크: 공개 일정은 호스트, 클럽 일정은 System Admin 또는 Club ADMIN 이상
        if (schedule.isPublicSchedule()) {
            if (!requestUserId.equals(schedule.getCreatedByUserId())) {
                throw new PermissionDeniedException("일정 호스트만 참가자를 관리할 수 있습니다.");
            }
        } else {
            permissionService.requireScheduleManagePermission(requestUserId, schedule.getClubId());
        }
        log.info("권한 체크 통과: userId={}, clubId={}", requestUserId, schedule.getClubId());

        // 3. 기존 참가자 조회 (CANCELLED 제외)
        List<ScheduleParticipant> currentParticipants = participantRepository
                .findActiveParticipantsByScheduleId(scheduleId, ParticipantStatus.CANCELLED);

        // 등록 회원만 diff 대상 (게스트 참가자는 userId=null이므로 제외)
        List<ScheduleParticipant> registeredParticipants = currentParticipants.stream()
                .filter(p -> p.getUserId() != null)
                .collect(Collectors.toList());

        Set<Long> currentUserIds = registeredParticipants.stream()
                .map(ScheduleParticipant::getUserId)
                .collect(Collectors.toSet());

        Set<Long> newUserIds = new HashSet<>(userIds);

        log.info("기존 등록 참가자: {}, 새로운 참가자 목록: {}", currentUserIds, newUserIds);

        // 4. 제거할 참가자 처리 (기존 등록 회원 중 새로운 목록에 없는 사람, 게스트는 제외)
        List<ScheduleParticipant> toRemove = registeredParticipants.stream()
                .filter(p -> !newUserIds.contains(p.getUserId()))
                .collect(Collectors.toList());

        if (!toRemove.isEmpty()) {
            int removedConfirmedCount = 0;
            List<Long> removedConfirmedUserIds = new ArrayList<>();
            for (ScheduleParticipant participant : toRemove) {
                // Audit 로깅 (삭제 전)
                auditLogService.logParticipantDelete(requestUserId, participant, schedule.getClubId());

                boolean wasConfirmed = participant.isConfirmed();
                participantRepository.delete(participant);
                schedule.decrementParticipants();
                if (wasConfirmed) {
                    removedConfirmedCount++;
                    if (participant.getUserId() != null) {
                        removedConfirmedUserIds.add(participant.getUserId());
                    }
                }
            }
            log.info("제거된 참가자: {} 명 (확정: {}명)", toRemove.size(), removedConfirmedCount);

            // 제거된 확정 참가자의 외부 캘린더 이벤트 삭제 (트랜잭션 커밋 후)
            if (!removedConfirmedUserIds.isEmpty()) {
                final Long sid = scheduleId;
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        for (Long uid : removedConfirmedUserIds) {
                            calendarSyncService.onParticipantCancelled(uid, sid);
                        }
                    }
                });
            }

            // 대진에 포함된 참가자가 제거된 경우에만 무효화
            Set<Long> removedUserIds = toRemove.stream()
                    .map(ScheduleParticipant::getUserId)
                    .collect(Collectors.toSet());
            invalidateDrawIfAnyUserInDraw(schedule, removedUserIds);

            // 제거된 확정 참가자가 있으면 대기 중인 사람을 확정으로 변경
            if (removedConfirmedCount > 0) {
                List<ScheduleParticipant> waitingList = participantRepository
                        .findActiveParticipantsByScheduleId(scheduleId, ParticipantStatus.CANCELLED)
                        .stream()
                        .filter(ScheduleParticipant::isWaiting)
                        .sorted((a, b) -> Integer.compare(a.getPosition(), b.getPosition()))
                        .limit(removedConfirmedCount)
                        .collect(Collectors.toList());

                for (ScheduleParticipant waiting : waitingList) {
                    waiting.confirm();
                }
                log.info("대기 → 확정 변경: {} 명", waitingList.size());
            }
        }

        // 5. 추가할 참가자만 처리 (현재 목록에 없는 사람)
        List<Long> toAdd = userIds.stream()
                .filter(userId -> !currentUserIds.contains(userId))
                .collect(Collectors.toList());

        if (!toAdd.isEmpty()) {
            // 현재 최대 position 찾기
            Integer maxPosition = participantRepository.getMaxPosition(scheduleId);
            int nextPosition = (maxPosition != null ? maxPosition : 0) + 1;

            // 제거 후 현재 확정된 참가자 수 확인 (제거 후 다시 조회)
            List<ScheduleParticipant> remainingParticipants = participantRepository
                    .findActiveParticipantsByScheduleId(scheduleId, ParticipantStatus.CANCELLED);
            long currentConfirmedCount = remainingParticipants.stream()
                    .filter(p -> p.getStatus() == ParticipantStatus.CONFIRMED)
                    .count();

            // 총원 확인
            int maxCapacity = schedule.getMaxCapacity();
            int availableSlots = (int) (maxCapacity - currentConfirmedCount);

            log.info("제거 후 현재 확정 참가자: {}명, 총원: {}명, 사용 가능한 슬롯: {}명", 
                    currentConfirmedCount, maxCapacity, availableSlots);

            int confirmedCount = 0;
            int waitingCount = 0;
            List<Long> addedConfirmedUserIds = new ArrayList<>();

            for (Long userId : toAdd) {
                // User 존재 확인
                if (!userRepository.existsById(userId)) {
                    throw new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId);
                }

                // 총원을 고려하여 상태 결정
                // 사용 가능한 슬롯이 있으면 CONFIRMED, 없으면 WAITING
                ParticipantStatus status;
                if (confirmedCount < availableSlots) {
                    status = ParticipantStatus.CONFIRMED;
                    confirmedCount++;
                    addedConfirmedUserIds.add(userId);
                } else {
                    status = ParticipantStatus.WAITING;
                    waitingCount++;
                }

                ScheduleParticipant participant = ScheduleParticipant.builder()
                        .scheduleId(scheduleId)
                        .userId(userId)
                        .status(status)
                        .position(nextPosition++)
                        .build();

                ScheduleParticipant savedParticipant = participantRepository.save(participant);
                schedule.incrementParticipants();

                // Audit 로깅
                auditLogService.logParticipantCreate(requestUserId, savedParticipant, schedule.getClubId());
            }
            log.info("추가된 참가자: {} 명 (확정: {}명, 대기: {}명)",
                    toAdd.size(), confirmedCount, waitingCount);

            // 추가된 확정 참가자의 외부 캘린더 이벤트 생성 (트랜잭션 커밋 후)
            if (!addedConfirmedUserIds.isEmpty()) {
                final Long sid = scheduleId;
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        for (Long uid : addedConfirmedUserIds) {
                            calendarSyncService.onParticipantConfirmed(uid, sid);
                        }
                    }
                });
            }
            // 참가자 추가는 기존 대진에 영향을 주지 않으므로 무효화하지 않음
        } else {
            log.info("변경사항 없음 (추가할 참가자 없음)");
        }

        log.info("=== 참가자 일괄 수정 완료 ===");
    }

    /**
     * 일정 참가신청/취소 배치 처리
     * - 최종적으로 참가하고 싶은 일정 목록을 받아서 현재 상태와 비교
     * - 추가해야 할 일정과 취소해야 할 일정을 자동으로 계산
     * - 각 작업은 독립적으로 처리되며, 일부 실패해도 나머지는 계속 진행
     *
     * @param userId 사용자 ID
     * @param request 배치 요청 (최종 참가 희망 일정 목록)
     * @return 성공/실패 결과
     */
    @Transactional
    public BatchParticipationResponse batchParticipation(Long userId, BatchParticipationRequest request) {
        log.info("=== 배치 참가신청/취소 시작 - userId: {} ===", userId);

        List<Long> joinedScheduleIds = new ArrayList<>();
        List<Long> canceledScheduleIds = new ArrayList<>();
        List<BatchParticipationResponse.FailedOperation> failedOperations = new ArrayList<>();

        // 1. 현재 참가 중인 일정 조회 (CANCELLED 제외)
        List<ScheduleParticipant> currentParticipations = participantRepository
                .findByUserIdAndStatusNot(userId, ParticipantStatus.CANCELLED);

        // 과거 일정은 diff 계산에서 제외 (미래 일정만 대상으로 비교)
        Set<Long> pastScheduleIds = new HashSet<>();
        Set<Long> currentScheduleIds = new HashSet<>();
        for (ScheduleParticipant p : currentParticipations) {
            Schedule schedule = scheduleRepository.findById(p.getScheduleId()).orElse(null);
            if (schedule != null && TimeValidationUtils.isPast(schedule.getScheduledAt())) {
                pastScheduleIds.add(p.getScheduleId());
            } else {
                currentScheduleIds.add(p.getScheduleId());
            }
        }

        log.info("현재 참가 중인 미래 일정: {}, 제외된 과거 일정: {}", currentScheduleIds, pastScheduleIds);

        // 2. 최종 선택한 일정 목록
        Set<Long> selectedScheduleIds = request.getSelectedScheduleIds() != null
                ? new HashSet<>(request.getSelectedScheduleIds())
                : new HashSet<>();

        log.info("최종 선택한 일정: {}", selectedScheduleIds);

        // 3. 추가할 일정 계산 (선택했지만 현재 참가 중이 아닌 것)
        Set<Long> toJoin = new HashSet<>(selectedScheduleIds);
        toJoin.removeAll(currentScheduleIds);

        // 4. 취소할 일정 계산 (현재 참가 중이지만 선택하지 않은 것)
        Set<Long> toCancel = new HashSet<>(currentScheduleIds);
        toCancel.removeAll(selectedScheduleIds);

        log.info("추가할 일정: {}, 취소할 일정: {}", toJoin, toCancel);

        // 5. 참가신청 처리
        for (Long scheduleId : toJoin) {
            try {
                joinSchedule(scheduleId, userId);
                joinedScheduleIds.add(scheduleId);
                log.info("참가신청 성공 - scheduleId: {}", scheduleId);
            } catch (Exception e) {
                log.warn("참가신청 실패 - scheduleId: {}, error: {}", scheduleId, e.getMessage());
                failedOperations.add(BatchParticipationResponse.FailedOperation.builder()
                        .scheduleId(scheduleId)
                        .operation("JOIN")
                        .errorMessage(e.getMessage())
                        .build());
            }
        }

        // 6. 취소 처리
        for (Long scheduleId : toCancel) {
            try {
                cancelParticipation(scheduleId, userId);
                canceledScheduleIds.add(scheduleId);
                log.info("참가취소 성공 - scheduleId: {}", scheduleId);
            } catch (Exception e) {
                log.warn("참가취소 실패 - scheduleId: {}, error: {}", scheduleId, e.getMessage());
                failedOperations.add(BatchParticipationResponse.FailedOperation.builder()
                        .scheduleId(scheduleId)
                        .operation("CANCEL")
                        .errorMessage(e.getMessage())
                        .build());
            }
        }

        log.info("=== 배치 참가신청/취소 완료 - 신청: {}개, 취소: {}개, 실패: {}개 ===",
                joinedScheduleIds.size(), canceledScheduleIds.size(), failedOperations.size());

        return BatchParticipationResponse.builder()
                .joinedScheduleIds(joinedScheduleIds)
                .canceledScheduleIds(canceledScheduleIds)
                .failedOperations(failedOperations)
                .build();
    }

    // === 게스트 참가자 관리 ===

    /**
     * 게스트(비회원) 참가자 추가
     * - 공개 일정: 호스트만 가능
     * - 클럽 일정: 운영진 이상 가능
     */
    @Transactional
    public ParticipantResponse addGuestParticipant(Long scheduleId, String guestName, Long requestUserId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다: " + scheduleId));

        requireGuestManagePermission(requestUserId, schedule);

        if (participantRepository.existsByScheduleIdAndGuestName(scheduleId, guestName)) {
            throw new IllegalStateException("이미 같은 이름의 게스트가 존재합니다: " + guestName);
        }

        Long currentCount = participantRepository.countActiveParticipants(scheduleId, ParticipantStatus.CANCELLED);
        ParticipantStatus status = currentCount < schedule.getMaxCapacity()
                ? ParticipantStatus.CONFIRMED
                : ParticipantStatus.WAITING;

        Integer nextPosition = participantRepository.getNextPosition(scheduleId);

        ScheduleParticipant guest = ScheduleParticipant.builder()
                .scheduleId(scheduleId)
                .userId(null)
                .guestName(guestName)
                .status(status)
                .position(nextPosition != null ? nextPosition : 1)
                .asGuest(true)
                .build();

        ScheduleParticipant saved = participantRepository.save(guest);
        if (status == ParticipantStatus.CONFIRMED) {
            schedule.incrementParticipants();
        }

        log.info("게스트 참가자 추가: scheduleId={}, guestName={}, status={}", scheduleId, guestName, status);
        return new ParticipantResponse(saved, guestName);
    }

    /**
     * 게스트(비회원) 참가자 삭제
     */
    @Transactional
    public void removeGuestParticipant(Long scheduleId, Long participantId, Long requestUserId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다: " + scheduleId));

        requireGuestManagePermission(requestUserId, schedule);

        ScheduleParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new EntityNotFoundException("참가자를 찾을 수 없습니다: " + participantId));

        if (!participant.isGuest()) {
            throw new IllegalArgumentException("게스트 참가자만 삭제할 수 있습니다.");
        }

        boolean wasConfirmed = participant.isConfirmed();
        participant.cancel();
        participantRepository.save(participant);

        if (wasConfirmed) {
            schedule.decrementParticipants();
            // 게스트가 대진에 포함된 경우 대진 무효화
            if (schedule.hasDraw() && participant.getGuestName() != null
                    && matchRepository.existsGuestInDraw(scheduleId, participant.getGuestName())) {
                schedule.invalidateDraw();
                log.info("대진에 포함된 게스트({}) 삭제로 대진 무효화", participant.getGuestName());
            }
        }

        log.info("게스트 참가자 삭제: scheduleId={}, participantId={}, guestName={}",
                scheduleId, participantId, participant.getGuestName());
    }

    /**
     * 게스트 참가자 이름 변경
     */
    @Transactional
    public ParticipantResponse updateGuestName(Long scheduleId, Long participantId, String newGuestName, Long requestUserId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다: " + scheduleId));

        requireGuestManagePermission(requestUserId, schedule);

        ScheduleParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new EntityNotFoundException("참가자를 찾을 수 없습니다: " + participantId));

        if (!participant.isGuest()) {
            throw new IllegalArgumentException("게스트 참가자의 이름만 변경할 수 있습니다.");
        }

        if (participantRepository.existsByScheduleIdAndGuestName(scheduleId, newGuestName)) {
            throw new IllegalStateException("이미 같은 이름의 게스트가 존재합니다: " + newGuestName);
        }

        participant.updateGuestName(newGuestName);
        participantRepository.save(participant);

        log.info("게스트 이름 변경: scheduleId={}, participantId={}, newGuestName={}", scheduleId, participantId, newGuestName);
        return new ParticipantResponse(participant, newGuestName);
    }

    // === 공개/클럽 일정 참가 신청/승인/거절 ===

    /**
     * 공개 또는 클럽 일정 게스트 참가 신청 (PENDING 상태로 등록)
     * - 공개 일정: 누구나 신청 가능
     * - 클럽 일정: guestRecruitOpen=true인 경우에만 신청 가능, asGuest=true로 기록
     */
    @Transactional
    public ParticipantResponse requestJoinPublicSchedule(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다: " + scheduleId));

        if (schedule.isClubSchedule()) {
            // 클럽 일정은 게스트 모집이 열려있어야 함
            if (!Boolean.TRUE.equals(schedule.getGuestRecruitOpen())) {
                throw new IllegalStateException("게스트 모집이 열려있지 않습니다.");
            }
        }

        // 이미 활성 참가 내역이 있는지 확인
        List<ScheduleParticipant> existing = participantRepository.findByScheduleIdOrderByPositionAsc(scheduleId)
                .stream()
                .filter(p -> userId.equals(p.getUserId()))
                .collect(Collectors.toList());

        boolean hasActive = existing.stream()
                .anyMatch(p -> !p.isCancelled() && !p.isRejected());
        if (hasActive) {
            throw new IllegalStateException("이미 신청한 일정입니다.");
        }

        // 기존 REJECTED 레코드가 있으면 PENDING으로 재활용 (unique constraint 충돌 방지)
        Optional<ScheduleParticipant> rejectedOpt = existing.stream()
                .filter(ScheduleParticipant::isRejected)
                .findFirst();

        User user = userRepository.findById(userId).orElse(null);
        String displayName = user != null ? user.getPublicDisplayName() : "알 수 없음";

        ScheduleParticipant participant;
        if (rejectedOpt.isPresent()) {
            participant = rejectedOpt.get();
            ScheduleParticipantAuditSnapshot beforeSnapshot = ScheduleParticipantAuditSnapshot.from(participant);
            participant.pending();
            participantRepository.save(participant);
            auditLogService.logParticipantUpdate(userId, beforeSnapshot, participant, schedule.getClubId());
            log.info("거절된 참가 신청 재신청(REJECTED→PENDING): scheduleId={}, userId={}", scheduleId, userId);
        } else {
            Integer nextPosition = participantRepository.getNextPosition(scheduleId);
            participant = ScheduleParticipant.builder()
                    .scheduleId(scheduleId)
                    .userId(userId)
                    .status(ParticipantStatus.PENDING)
                    .position(nextPosition != null ? nextPosition : 1)
                    .asGuest(schedule.isClubSchedule()) // 클럽 일정 게스트 신청자는 asGuest=true
                    .build();
            participantRepository.save(participant);
            auditLogService.logParticipantCreate(userId, participant, schedule.getClubId());
            log.info("일정 참가 신청(PENDING): scheduleId={}, userId={}", scheduleId, userId);
        }

        // 참가 신청 알림 발송 (호스트/운영진에게)
        try {
            List<Long> recipientIds;
            if (schedule.isPublicSchedule()) {
                recipientIds = schedule.getCreatedByUserId() != null
                        ? List.of(schedule.getCreatedByUserId()) : List.of();
            } else {
                recipientIds = clubMemberRepository.findUserIdsByClubIdAndRoleIn(
                        schedule.getClubId(), List.of(ClubRole.ADMIN, ClubRole.OWNER));
            }
            if (!recipientIds.isEmpty()) {
                notificationService.sendNotification(
                        schedule.getClubId(), recipientIds,
                        "참가 신청", schedule.getCourtName() + " 일정에 새 참가 신청이 있습니다",
                        NotificationType.EXTERNAL_REQUEST, scheduleId, "SCHEDULE");
            }
        } catch (Exception e) {
            log.warn("참가 신청 알림 발송 실패: {}", e.getMessage());
        }

        return new ParticipantResponse(participant, displayName);
    }

    /**
     * PENDING 상태의 참가 신청 취소 (카운터 변경 없음 - PENDING은 승인 전이므로 미집계)
     */
    @Transactional
    public void cancelParticipantRequest(Long scheduleId, Long userId) {
        participantRepository.findActiveParticipation(scheduleId, userId, ParticipantStatus.CANCELLED)
                .ifPresent(participant -> {
                    if (!participant.isPending()) {
                        throw new IllegalStateException("대기 중인 신청만 이 방법으로 취소할 수 있습니다.");
                    }
                    participantRepository.delete(participant);
                    log.info("게스트 참가 신청 취소: scheduleId={}, userId={}", scheduleId, userId);
                });
    }

    /**
     * 공개/클럽 일정 참가 승인 (호스트 또는 운영진 전용)
     */
    @Transactional
    public ParticipantResponse approveParticipant(Long scheduleId, Long participantId, Long hostUserId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다."));

        boolean isAuthorized;
        if (schedule.isPublicSchedule()) {
            isAuthorized = hostUserId.equals(schedule.getCreatedByUserId());
        } else {
            // 클럽 일정: 일정 생성자(호스트) 또는 클럽 운영진 이상
            isAuthorized = hostUserId.equals(schedule.getCreatedByUserId())
                    || permissionService.canManageSchedule(hostUserId, schedule.getClubId());
        }
        if (!isAuthorized) {
            throw new PermissionDeniedException("호스트 또는 운영진만 참가를 승인할 수 있습니다.");
        }

        ScheduleParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new EntityNotFoundException("참가자를 찾을 수 없습니다."));

        if (!participant.isPending()) {
            throw new IllegalStateException("승인 대기 상태가 아닙니다.");
        }

        ScheduleParticipantAuditSnapshot beforeSnapshot = ScheduleParticipantAuditSnapshot.from(participant);

        Long currentCount = participantRepository.countActiveParticipants(scheduleId, ParticipantStatus.CANCELLED);
        if (currentCount < schedule.getMaxCapacity()) {
            participant.confirm();
        } else {
            participant.waitlist();
        }
        schedule.incrementParticipants();
        participantRepository.save(participant);

        auditLogService.logParticipantUpdate(hostUserId, beforeSnapshot, participant, schedule.getClubId());

        User user = participant.getUserId() != null
                ? userRepository.findById(participant.getUserId()).orElse(null)
                : null;
        String displayName = user != null ? user.getPublicDisplayName()
                : (participant.getGuestName() != null ? participant.getGuestName() : "알 수 없음");

        log.info("공개 일정 참가 승인: scheduleId={}, participantId={}, status={}", scheduleId, participantId, participant.getStatus());

        // 외부 캘린더 동기화 (CONFIRMED 상태일 때만, 트랜잭션 커밋 후 실행)
        if (participant.isConfirmed() && participant.getUserId() != null) {
            Long participantUserId = participant.getUserId();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    calendarSyncService.onParticipantConfirmed(participantUserId, scheduleId);
                }
            });
        }

        // 참가 승인 알림 발송 (신청자에게)
        if (participant.getUserId() != null) {
            try {
                notificationService.sendNotification(
                        schedule.getClubId(), participant.getUserId(),
                        "참가 승인", schedule.getCourtName() + " 일정 참가가 승인되었습니다",
                        NotificationType.REQUEST_RESULT, scheduleId, "SCHEDULE");
            } catch (Exception e) {
                log.warn("참가 승인 알림 발송 실패: {}", e.getMessage());
            }
        }

        return new ParticipantResponse(participant, displayName);
    }

    /**
     * 공개/클럽 일정 참가 거절 (호스트 또는 운영진 전용)
     */
    @Transactional
    public void rejectParticipant(Long scheduleId, Long participantId, Long hostUserId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다."));

        boolean isAuthorized;
        if (schedule.isPublicSchedule()) {
            isAuthorized = hostUserId.equals(schedule.getCreatedByUserId());
        } else {
            isAuthorized = hostUserId.equals(schedule.getCreatedByUserId())
                    || permissionService.canManageSchedule(hostUserId, schedule.getClubId());
        }
        if (!isAuthorized) {
            throw new PermissionDeniedException("호스트 또는 운영진만 참가를 거절할 수 있습니다.");
        }

        ScheduleParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new EntityNotFoundException("참가자를 찾을 수 없습니다."));

        ScheduleParticipantAuditSnapshot beforeSnapshot = ScheduleParticipantAuditSnapshot.from(participant);
        participant.reject();
        participantRepository.save(participant);
        auditLogService.logParticipantUpdate(hostUserId, beforeSnapshot, participant, schedule.getClubId());

        // 참가 거절 알림 발송 (신청자에게)
        if (participant.getUserId() != null) {
            try {
                notificationService.sendNotification(
                        schedule.getClubId(), participant.getUserId(),
                        "참가 거절", schedule.getCourtName() + " 일정 참가가 거절되었습니다",
                        NotificationType.REQUEST_RESULT, scheduleId, "SCHEDULE");
            } catch (Exception e) {
                log.warn("참가 거절 알림 발송 실패: {}", e.getMessage());
            }
        }

        log.info("공개 일정 참가 거절: scheduleId={}, participantId={}", scheduleId, participantId);
    }

    // === Private Helper Methods ===

    /**
     * 게스트 관리 권한 체크
     * - 공개 일정: 호스트(createdByUserId)만 가능
     * - 클럽 일정: 운영진 이상(requireScheduleManagePermission) 가능
     */
    private void requireGuestManagePermission(Long userId, Schedule schedule) {
        if (schedule.isPublicSchedule()) {
            if (!userId.equals(schedule.getCreatedByUserId())) {
                throw new PermissionDeniedException("일정 호스트만 게스트를 관리할 수 있습니다.");
            }
        } else {
            permissionService.requireScheduleManagePermission(userId, schedule.getClubId());
        }
    }

    /**
     * 특정 사용자가 대진에 포함되어 있는 경우에만 대진 무효화
     */
    private void invalidateDrawIfUserInDraw(Schedule schedule, Long userId) {
        if (!schedule.hasDraw()) {
            return;
        }
        if (matchRepository.existsUserInDraw(schedule.getId(), userId)) {
            schedule.invalidateDraw();
            log.info("대진에 포함된 사용자({}) 제거로 대진 무효화", userId);
        }
    }

    /**
     * 여러 사용자 중 하나라도 대진에 포함되어 있는 경우 대진 무효화
     */
    private void invalidateDrawIfAnyUserInDraw(Schedule schedule, Set<Long> userIds) {
        if (!schedule.hasDraw() || userIds.isEmpty()) {
            return;
        }
        for (Long userId : userIds) {
            if (matchRepository.existsUserInDraw(schedule.getId(), userId)) {
                schedule.invalidateDraw();
                log.info("대진에 포함된 사용자({}) 제거로 대진 무효화", userId);
                return; // 하나라도 있으면 바로 무효화하고 종료
            }
        }
        log.info("제거된 참가자 중 대진에 포함된 사람 없음 - 대진 유효 상태 유지");
    }
}
