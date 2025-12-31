package com.example.openrunapi.domain.match.listener;

import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.user.model.UserStatistics;
import com.example.openrunapi.domain.user.repository.UserStatisticsRepository;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/**
 * Match 엔티티 이벤트 리스너
 * - Match가 저장/수정될 때마다 관련 선수들의 통계를 실시간 업데이트
 * - 경기당 4명의 선수 통계만 증분 업데이트 (O(4) 복잡도)
 */
@Slf4j
@Component
public class MatchEntityListener {

    private static ApplicationContext applicationContext;

    /**
     * ApplicationContext 주입 (Spring에서 자동 호출)
     */
    public MatchEntityListener(ApplicationContext context) {
        MatchEntityListener.applicationContext = context;
    }

    /**
     * Match 저장 후 실행
     */
    @PostPersist
    public void onMatchCreated(Match match) {
        log.debug("Match 생성 감지: id={}, club={}", match.getId(), match.getClubId());
        updateStatistics(match);
    }

    /**
     * Match 수정 후 실행
     *
     * 주의: 경기 결과 수정 시 통계 업데이트는 MatchService.updateMatchResult()에서 명시적으로 처리됩니다.
     * 리스너에서는 중복 처리를 방지하기 위해 아무것도 하지 않습니다.
     */
    @PostUpdate
    public void onMatchUpdated(Match match) {
        log.debug("Match 수정 감지: id={}, club={} (통계 업데이트는 Service에서 처리)", match.getId(), match.getClubId());
        // 통계 업데이트는 MatchService.updateMatchResult()에서 명시적으로 처리
        // 여기서는 중복 처리 방지를 위해 아무것도 하지 않음
    }

    /**
     * 통계 업데이트 (증분 방식)
     */
    private void updateStatistics(Match match) {
        // 마이그레이션 데이터는 일괄 재계산하므로 스킵
        if (Boolean.TRUE.equals(match.getIsMigrated())) {
            log.debug("마이그레이션 데이터는 통계 자동 업데이트 스킵: match_id={}", match.getId());
            return;
        }

        // 점수나 결과가 없으면 스킵
        if (match.getResult() == null || match.getTeamAScore() == null || match.getTeamBScore() == null) {
            log.debug("결과가 없는 Match는 통계 업데이트 스킵: match_id={}", match.getId());
            return;
        }

        UserStatisticsRepository repository = getRepository();

        // Team A 선수 통계 업데이트
        if (match.getTeamAPlayer1Id() != null) {
            updatePlayerStatistics(repository, match.getClubId(), match.getTeamAPlayer1Id(), match, true);
        }
        if (match.getTeamAPlayer2Id() != null) {
            updatePlayerStatistics(repository, match.getClubId(), match.getTeamAPlayer2Id(), match, true);
        }

        // Team B 선수 통계 업데이트
        if (match.getTeamBPlayer1Id() != null) {
            updatePlayerStatistics(repository, match.getClubId(), match.getTeamBPlayer1Id(), match, false);
        }
        if (match.getTeamBPlayer2Id() != null) {
            updatePlayerStatistics(repository, match.getClubId(), match.getTeamBPlayer2Id(), match, false);
        }

        log.info("통계 업데이트 완료: match_id={}, club_id={}", match.getId(), match.getClubId());
    }

    /**
     * 개별 선수 통계 업데이트
     */
    private void updatePlayerStatistics(UserStatisticsRepository repository, Long clubId, Long playerId,
                                        Match match, boolean isTeamA) {
        // 통계 조회 또는 생성
        UserStatistics stats = repository.findByUserIdAndClubId(playerId, clubId)
                .orElse(UserStatistics.builder()
                        .userId(playerId)
                        .clubId(clubId)
                        .build());

        // 승무패 판정
        boolean isWin = (isTeamA && match.getResult() == Match.MatchResult.TEAM_A_WIN) ||
                        (!isTeamA && match.getResult() == Match.MatchResult.TEAM_B_WIN);
        boolean isDraw = match.getResult() == Match.MatchResult.DRAW;

        // 득점/실점
        int scored = isTeamA ? match.getTeamAScore() : match.getTeamBScore();
        int conceded = isTeamA ? match.getTeamBScore() : match.getTeamAScore();

        // 증분 업데이트
        stats.addMatchResult(isWin, isDraw, scored, conceded);

        // 저장
        repository.save(stats);

        log.debug("선수 통계 업데이트: user_id={}, wins={}, draws={}, losses={}, points={}",
                playerId, stats.getWins(), stats.getDraws(), stats.getLosses(), stats.getPoints());
    }

    /**
     * ApplicationContext에서 Repository 가져오기
     */
    private UserStatisticsRepository getRepository() {
        if (applicationContext == null) {
            throw new IllegalStateException("ApplicationContext가 초기화되지 않았습니다.");
        }
        return applicationContext.getBean(UserStatisticsRepository.class);
    }
}
