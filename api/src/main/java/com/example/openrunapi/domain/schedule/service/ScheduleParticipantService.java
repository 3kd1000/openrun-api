package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus;
import com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ScheduleParticipantService {

    private final ScheduleParticipantRepository participantRepository;
    private final ScheduleRepository scheduleRepository;

    /**
     * 일정 참가 신청
     */
    @Transactional
    public ParticipantResponse joinSchedule(Long scheduleId, Long userId) {
        // 1. 일정 존재 여부 확인
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 2. 이미 신청한 사용자인지 확인 (취소하지 않은 신청이 있는지)
        if (participantRepository.findActiveParticipation(scheduleId, userId, ParticipantStatus.CANCELLED).isPresent()) {
            throw new IllegalStateException("이미 참가 신청한 일정입니다.");
        }

        // 3. 현재 참가자 수 (취소 제외) 확인
        Long currentParticipants = participantRepository.countActiveParticipants(scheduleId, ParticipantStatus.CANCELLED);

        // 4. 상태 결정: maxCapacity 미만이면 CONFIRMED, 이상이면 WAITING
        ParticipantStatus status = currentParticipants < schedule.getMaxCapacity()
                ? ParticipantStatus.CONFIRMED
                : ParticipantStatus.WAITING;

        // 5. 다음 position 번호 가져오기
        Integer nextPosition = participantRepository.getNextPosition(scheduleId);

        // 6. 참가자 생성 및 저장
        ScheduleParticipant participant = ScheduleParticipant.builder()
                .scheduleId(scheduleId)
                .userId(userId)
                .status(status)
                .position(nextPosition)
                .build();

        ScheduleParticipant savedParticipant = participantRepository.save(participant);

        // 7. Schedule의 currentParticipants 업데이트 (상태 무관, 신청한 모든 사람 카운트)
        schedule.incrementParticipants();

        return new ParticipantResponse(savedParticipant);
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

        // 3. 참가 신청 취소 처리
        boolean wasConfirmed = participant.isConfirmed();
        participant.cancel();

        // 4. Schedule의 currentParticipants 감소 (상태 무관)
        schedule.decrementParticipants();

        // 5. CONFIRMED 상태였다면 대기 중인 사람을 CONFIRMED로 변경
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
     * 특정 일정의 참가자 목록 조회
     */
    public List<ParticipantResponse> getParticipants(Long scheduleId) {
        // 취소되지 않은 참가자만 조회
        return participantRepository.findActiveParticipantsByScheduleId(scheduleId, ParticipantStatus.CANCELLED)
                .stream()
                .map(ParticipantResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 사용자의 특정 일정 참가 신청 내역 조회
     */
    public ParticipantResponse getMyParticipation(Long scheduleId, Long userId) {
        return participantRepository.findActiveParticipation(scheduleId, userId, ParticipantStatus.CANCELLED)
                .map(ParticipantResponse::new)
                .orElse(null);
    }
}
