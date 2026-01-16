package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * 일정 유지보수 배치 서비스
 * - 과거 일정의 pinned/guestRecruitOpen/interclubRecruitOpen 자동 OFF
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleMaintenanceService {

    private final ScheduleRepository scheduleRepository;

    /**
     * 매일 KST 새벽 3시 (= UTC 18시) 실행
     * 과거 일정의 고정/게스트모집/교류전모집 플래그를 자동으로 OFF
     */
    @Scheduled(cron = "0 0 18 * * *", zone = "UTC")
    @Transactional
    public void disableExpiredScheduleFeatures() {
        log.info("[배치 시작] 과거 일정 플래그 자동 OFF 작업 시작");

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));
        log.info("현재 시각 (KST): {}", now);

        List<Schedule> expiredSchedules = scheduleRepository.findExpiredSchedulesWithActiveFlags(now);

        if (expiredSchedules.isEmpty()) {
            log.info("[배치 완료] 처리할 과거 일정 없음");
            return;
        }

        log.info("[배치 진행] 처리 대상 일정 수: {}", expiredSchedules.size());

        int pinnedCount = 0;
        int guestCount = 0;
        int interclubCount = 0;

        for (Schedule schedule : expiredSchedules) {
            if (Boolean.TRUE.equals(schedule.getPinned())) {
                schedule.updatePinned(false);
                pinnedCount++;
                log.debug("일정 ID {} - 고정 해제", schedule.getId());
            }
            if (Boolean.TRUE.equals(schedule.getGuestRecruitOpen())) {
                schedule.updateGuestRecruit(false, null);
                guestCount++;
                log.debug("일정 ID {} - 게스트 모집 종료", schedule.getId());
            }
            if (Boolean.TRUE.equals(schedule.getInterclubRecruitOpen())) {
                schedule.updateInterclubRecruit(false, null);
                interclubCount++;
                log.debug("일정 ID {} - 교류전 모집 종료", schedule.getId());
            }
        }
        scheduleRepository.saveAll(expiredSchedules);
        log.info("[배치 완료] 처리 완료 - 고정 해제: {}건, 게스트 종료: {}건, 교류전 종료: {}건",
                 pinnedCount, guestCount, interclubCount);
    }

    /**
     * 테스트용 수동 실행 메서드
     * Controller에서 호출 가능
     */
    @Transactional
    public String executeNow() {
        log.info("[수동 실행] 과거 일정 플래그 자동 OFF 작업 수동 실행");
        disableExpiredScheduleFeatures();
        return "배치 작업이 수동으로 실행되었습니다.";
    }
}
