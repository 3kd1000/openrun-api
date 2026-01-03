package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.common.service.PermissionService;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus;
import com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.openrunapi.common.utils.TimeValidationUtils;
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

    /**
     * 일정 참가 신청
     */
    @Transactional
    public ParticipantResponse joinSchedule(Long scheduleId, Long userId) {
        // 1. 일정 존재 여부 확인
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 2. 과거 일정 체크 (KST 기준)
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

        // 7. 참가자 생성 및 저장
        ScheduleParticipant participant = ScheduleParticipant.builder()
                .scheduleId(scheduleId)
                .userId(userId)
                .status(status)
                .position(nextPosition)
                .build();

        ScheduleParticipant savedParticipant = participantRepository.save(participant);

        // 8. Schedule의 currentParticipants 업데이트 (상태 무관, 신청한 모든 사람 카운트)
        schedule.incrementParticipants();

        // 9. User 조회하여 userName 포함된 Response 반환
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));

        return new ParticipantResponse(savedParticipant, user.getName());
    }

    /**
     * 참가 신청 취소
     */
    @Transactional
    public void cancelParticipation(Long scheduleId, Long userId) {
        // 1. 일정 존재 여부 확인
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 2. 참가 신청 내역 확인 (취소되지 않은 것만)
        ScheduleParticipant participant = participantRepository
                .findActiveParticipation(scheduleId, userId, ParticipantStatus.CANCELLED)
                .orElseThrow(() -> new EntityNotFoundException("참가 신청 내역을 찾을 수 없습니다."));

        // 3. 참가 신청 취소 처리 (레코드 삭제 - 재신청 가능하도록)
        boolean wasConfirmed = participant.isConfirmed();
        participantRepository.delete(participant);

        // 4. Schedule의 currentParticipants 감소
        schedule.decrementParticipants();

        // 5. 대진 무효화 (참가자 변동으로 기존 대진은 더 이상 유효하지 않음)
        schedule.invalidateDraw();

        // 6. CONFIRMED 상태였다면 대기 중인 사람을 CONFIRMED로 변경
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
            }
        }
    }

    /**
     * 특정 일정의 참가자 목록 조회 (userName 포함)
     */
    public List<ParticipantResponse> getParticipants(Long scheduleId) {
        // User와 JOIN하여 userName 포함하여 조회
        return participantRepository.findActiveParticipantsWithUserName(scheduleId, ParticipantStatus.CANCELLED);
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

        // 2. 권한 체크: System Admin 또는 Club ADMIN 이상
        permissionService.requireScheduleManagePermission(requestUserId, schedule.getClubId());
        log.info("권한 체크 통과: userId={}, clubId={}", requestUserId, schedule.getClubId());

        // 3. 기존 참가자 조회 (CANCELLED 제외)
        List<ScheduleParticipant> currentParticipants = participantRepository
                .findActiveParticipantsByScheduleId(scheduleId, ParticipantStatus.CANCELLED);

        Set<Long> currentUserIds = currentParticipants.stream()
                .map(ScheduleParticipant::getUserId)
                .collect(Collectors.toSet());

        Set<Long> newUserIds = new HashSet<>(userIds);

        log.info("기존 참가자: {}, 새로운 참가자 목록: {}", currentUserIds, newUserIds);

        // 4. 제거할 참가자 처리 (기존에 있지만 새로운 목록에 없는 사람)
        List<ScheduleParticipant> toRemove = currentParticipants.stream()
                .filter(p -> !newUserIds.contains(p.getUserId()))
                .collect(Collectors.toList());

        if (!toRemove.isEmpty()) {
            int removedConfirmedCount = 0;
            for (ScheduleParticipant participant : toRemove) {
                boolean wasConfirmed = participant.isConfirmed();
                participantRepository.delete(participant);
                schedule.decrementParticipants();
                if (wasConfirmed) {
                    removedConfirmedCount++;
                }
            }
            log.info("제거된 참가자: {} 명 (확정: {}명)", toRemove.size(), removedConfirmedCount);

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

                participantRepository.save(participant);
                schedule.incrementParticipants();
            }
            log.info("추가된 참가자: {} 명 (확정: {}명, 대기: {}명)", 
                    toAdd.size(), confirmedCount, waitingCount);

            // 대진 무효화 (참가자가 추가되었으므로 기존 대진은 더 이상 유효하지 않음)
            schedule.invalidateDraw();
            log.info("참가자 추가로 대진 무효화");
        } else {
            log.info("변경사항 없음 (추가할 참가자 없음)");
        }

        log.info("=== 참가자 일괄 수정 완료 ===");
    }
}
