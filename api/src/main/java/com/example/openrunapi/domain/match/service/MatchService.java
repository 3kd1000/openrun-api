package com.example.openrunapi.domain.match.service;

import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.match.model.dto.MatchResponse;
import com.example.openrunapi.domain.match.repository.MatchRepository;
import com.example.openrunapi.domain.match.repository.MatchSpecification;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
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
     * 사용자 ID로 이름 조회
     */
    private String getUserName(Long userId) {
        return userRepository.findById(userId)
                .map(User::getName)
                .orElse("알 수 없음");
    }
}
