package com.example.openrunapi.domain.match.service;

import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.match.model.dto.MatchResponse;
import com.example.openrunapi.domain.match.model.dto.UpdateMatchRequest;
import com.example.openrunapi.domain.match.repository.MatchRepository;
import com.example.openrunapi.domain.match.repository.MatchSpecification;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserStatistics;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.example.openrunapi.domain.user.repository.UserStatisticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchService {

    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final UserStatisticsRepository userStatisticsRepository;

    /**
     * 클럽의 모든 대진 조회 (선수 이름 검색, 기간 필터링 지원)
     * JPA Specification을 사용한 동적 쿼리 방식
     *
     * @param clubId 클럽 ID
     * @param playerName 선수 이름 (optional)
     * @param startDate 시작일 (optional)
     * @param endDate 종료일 (optional)
     * @return 대진 목록
     */
    public List<MatchResponse> getMatches(Long clubId, String playerName, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("=== 대진 목록 조회 ===");
        log.info("clubId: {}, playerName: {}, startDate: {}, endDate: {}", clubId, playerName, startDate, endDate);

        // 선수 이름 -> 선수 ID 변환
        Long playerId = null;
        if (playerName != null && !playerName.isBlank()) {
            User player = userRepository.findByName(playerName)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 선수입니다: " + playerName));
            playerId = player.getId();
        }

        // Specification을 사용한 동적 쿼리 실행
        Specification<Match> spec = MatchSpecification.search(clubId, playerId, startDate, endDate);
        List<Match> matches = matchRepository.findAll(spec);

        log.info("조회된 대진 수: {}", matches.size());

        // MatchResponse로 변환
        return matches.stream()
                .map(this::toMatchResponse)
                .collect(Collectors.toList());
    }

    /**
     * Match -> MatchResponse 변환 (선수 이름 포함)
     */
    private MatchResponse toMatchResponse(Match match) {
        String teamAPlayer1Name = getUserName(match.getTeamAPlayer1Id());
        String teamAPlayer2Name = match.getTeamAPlayer2Id() != null ? getUserName(match.getTeamAPlayer2Id()) : null;
        String teamBPlayer1Name = getUserName(match.getTeamBPlayer1Id());
        String teamBPlayer2Name = match.getTeamBPlayer2Id() != null ? getUserName(match.getTeamBPlayer2Id()) : null;

        return MatchResponse.from(match, teamAPlayer1Name, teamAPlayer2Name, teamBPlayer1Name, teamBPlayer2Name);
    }

    /**
     * 경기 결과 업데이트
     *
     * @param matchId 경기 ID
     * @param request 업데이트 요청
     * @return 업데이트된 경기 정보
     */
    @Transactional
    public MatchResponse updateMatchResult(Long matchId, UpdateMatchRequest request) {
        log.info("=== 경기 결과 업데이트 ===");
        log.info("matchId: {}, teamAScore: {}, teamBScore: {}, result: {}",
                matchId, request.getTeamAScore(), request.getTeamBScore(), request.getResult());

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 경기입니다: " + matchId));

        // 1. 이전 결과가 있으면 통계에서 차감
        if (match.getResult() != null && match.getTeamAScore() != null && match.getTeamBScore() != null) {
            log.info("이전 경기 결과 차감: result={}, scoreA={}, scoreB={}",
                    match.getResult(), match.getTeamAScore(), match.getTeamBScore());
            removeStatistics(match);
        }

        // 2. 경기 결과 업데이트
        match.updateResult(
                request.getTeamAScore(),
                request.getTeamBScore(),
                request.getResult(),
                request.getPlayedAt()
        );

        // 3. 새로운 결과로 통계 추가
        addStatistics(match);

        Match savedMatch = matchRepository.save(match);
        log.info("경기 결과 업데이트 완료: matchId={}", savedMatch.getId());

        return toMatchResponse(savedMatch);
    }

    /**
     * 경기 결과를 통계에 추가
     */
    private void addStatistics(Match match) {
        if (match.getResult() == null || match.getTeamAScore() == null || match.getTeamBScore() == null) {
            return;
        }

        // Team A 선수들 통계 추가
        if (match.getTeamAPlayer1Id() != null) {
            updatePlayerStatistics(match.getClubId(), match.getTeamAPlayer1Id(), match, true, true);
        }
        if (match.getTeamAPlayer2Id() != null) {
            updatePlayerStatistics(match.getClubId(), match.getTeamAPlayer2Id(), match, true, true);
        }

        // Team B 선수들 통계 추가
        if (match.getTeamBPlayer1Id() != null) {
            updatePlayerStatistics(match.getClubId(), match.getTeamBPlayer1Id(), match, false, true);
        }
        if (match.getTeamBPlayer2Id() != null) {
            updatePlayerStatistics(match.getClubId(), match.getTeamBPlayer2Id(), match, false, true);
        }

        log.info("통계 추가 완료: matchId={}", match.getId());
    }

    /**
     * 경기 결과를 통계에서 차감
     */
    private void removeStatistics(Match match) {
        if (match.getResult() == null || match.getTeamAScore() == null || match.getTeamBScore() == null) {
            return;
        }

        // Team A 선수들 통계 차감
        if (match.getTeamAPlayer1Id() != null) {
            updatePlayerStatistics(match.getClubId(), match.getTeamAPlayer1Id(), match, true, false);
        }
        if (match.getTeamAPlayer2Id() != null) {
            updatePlayerStatistics(match.getClubId(), match.getTeamAPlayer2Id(), match, true, false);
        }

        // Team B 선수들 통계 차감
        if (match.getTeamBPlayer1Id() != null) {
            updatePlayerStatistics(match.getClubId(), match.getTeamBPlayer1Id(), match, false, false);
        }
        if (match.getTeamBPlayer2Id() != null) {
            updatePlayerStatistics(match.getClubId(), match.getTeamBPlayer2Id(), match, false, false);
        }

        log.info("통계 차감 완료: matchId={}", match.getId());
    }

    /**
     * 개별 선수 통계 업데이트
     *
     * @param clubId 클럽 ID
     * @param playerId 선수 ID
     * @param match 경기 정보
     * @param isTeamA Team A 소속 여부
     * @param isAdd true=추가, false=차감
     */
    private void updatePlayerStatistics(Long clubId, Long playerId, Match match, boolean isTeamA, boolean isAdd) {
        UserStatistics stats = userStatisticsRepository.findByUserIdAndClubId(playerId, clubId)
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

        // 추가 또는 차감
        if (isAdd) {
            stats.addMatchResult(isWin, isDraw, scored, conceded);
        } else {
            stats.removeMatchResult(isWin, isDraw, scored, conceded);
        }

        userStatisticsRepository.save(stats);
    }

    /**
     * 사용자 ID로 이름 조회
     */
    private String getUserName(Long userId) {
        return userRepository.findById(userId)
                .map(User::getName)
                .orElse("알 수 없음");
    }
}
