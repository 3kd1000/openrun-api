package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.dto.CreateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleParticipantRepository participantRepository;

    /**
     * 일정 생성
     */
    @Transactional
    public ScheduleResponse createSchedule(CreateScheduleRequest request) {
        Schedule schedule = request.toEntity();
        Schedule savedSchedule = scheduleRepository.save(schedule);
        return new ScheduleResponse(savedSchedule);
    }

    /**
     * 모든 일정 조회
     */
    public List<ScheduleResponse> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(ScheduleResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 특정 일정 조회
     */
    public ScheduleResponse getScheduleById(Long scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));
        return new ScheduleResponse(schedule);
    }

    /**
     * 특정 클럽의 모든 일정 조회
     */
    public List<ScheduleResponse> getSchedulesByClubId(Long clubId) {
        return scheduleRepository.findByClubId(clubId).stream()
                .map(ScheduleResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 특정 클럽의 향후 일정 조회 (현재 시간 이후)
     */
    public List<ScheduleResponse> getUpcomingSchedules(Long clubId) {
        LocalDateTime now = LocalDateTime.now();
        return scheduleRepository.findByClubIdAndScheduledAtAfterOrderByScheduledAtAsc(clubId, now).stream()
                .map(ScheduleResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 특정 클럽의 일정을 날짜 범위로 조회
     */
    public List<ScheduleResponse> getSchedulesByDateRange(Long clubId, LocalDateTime start, LocalDateTime end) {
        return scheduleRepository.findByClubIdAndScheduledAtBetween(clubId, start, end).stream()
                .map(ScheduleResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 일정 수정
     */
    @Transactional
    public ScheduleResponse updateSchedule(Long scheduleId, UpdateScheduleRequest request) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        schedule.update(
                request.getCourtName(),
                request.getScheduledAt(),
                request.getMaxCapacity(),
                request.getCost(),
                request.getDescription()
        );

        return new ScheduleResponse(schedule);
    }

    /**
     * 일정 삭제
     */
    @Transactional
    public void deleteSchedule(Long scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        scheduleRepository.delete(schedule);
    }

    /**
     * 특정 사용자가 참여한 일정 ID 목록 조회
     */
    public List<Long> getMyParticipatingScheduleIds(Long userId) {
        return participantRepository.findScheduleIdsByUserId(userId);
    }
}
