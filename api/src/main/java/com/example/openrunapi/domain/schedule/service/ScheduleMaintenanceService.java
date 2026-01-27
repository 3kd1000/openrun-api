package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.club.repository.ClubRepository;
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
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 일정 유지보수 배치 서비스
 * - 과거 일정의 pinned/guestRecruitOpen/interclubRecruitOpen 자동 OFF
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleMaintenanceService {

    private final ScheduleRepository scheduleRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;

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

        // 클럽별 활동 요약 업데이트
        updateClubActivitySummaries();
    }

    /**
     * 클럽별 활동 요약(일정 수, 참가자 수) 및 멤버 수를 계산하여 저장
     */
    private void updateClubActivitySummaries() {
        log.info("[배치 시작] 클럽 활동 요약 및 멤버 수 업데이트 작업 시작");

        // 모든 클럽의 일정 통계 조회
        List<Object[]> stats = scheduleRepository.getActivityStatsByClub();

        // clubId -> { scheduleCount, totalParticipants } 맵 생성
        Map<Long, long[]> statsMap = stats.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> new long[]{
                                ((Number) row[1]).longValue(),
                                row[2] != null ? ((Number) row[2]).longValue() : 0L
                        }
                ));

        // 클럽별 ACTIVE 멤버 수 조회
        List<Object[]> memberCounts = clubMemberRepository.countActiveMembersByClub();
        Map<Long, Integer> memberCountMap = memberCounts.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> ((Number) row[1]).intValue()
                ));

        // 모든 클럽 조회 및 업데이트
        List<Club> clubs = clubRepository.findAll();
        int updatedCount = 0;

        for (Club club : clubs) {
            // 활동 요약 업데이트
            long[] clubStats = statsMap.get(club.getId());
            String summary;

            if (clubStats != null && clubStats[0] > 0) {
                long scheduleCount = clubStats[0];
                long totalParticipants = clubStats[1];
                summary = String.format("총 %d개 일정, %d명 참가", scheduleCount, totalParticipants);
            } else {
                summary = null; // 일정이 없는 클럽은 null로 설정
            }

            club.updateActivitySummary(summary);

            // 멤버 수 업데이트
            Integer memberCount = memberCountMap.getOrDefault(club.getId(), 0);
            club.updateMemberCount(memberCount);

            updatedCount++;
        }

        clubRepository.saveAll(clubs);
        log.info("[배치 완료] 클럽 활동 요약 및 멤버 수 업데이트 완료 - {}개 클럽 처리", updatedCount);
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
