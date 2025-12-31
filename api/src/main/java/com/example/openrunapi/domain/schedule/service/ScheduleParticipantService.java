package com.example.openrunapi.domain.schedule.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.openrunapi.common.utils.TimeValidationUtils;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ScheduleParticipantService {

    private final ScheduleParticipantRepository participantRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

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
}
