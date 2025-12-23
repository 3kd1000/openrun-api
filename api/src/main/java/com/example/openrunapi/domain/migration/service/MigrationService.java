package com.example.openrunapi.domain.migration.service;

import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.match.repository.MatchRepository;
import com.example.openrunapi.domain.migration.model.dto.CsvMatchRecord;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserStatistics;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.example.openrunapi.domain.user.repository.UserStatisticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MigrationService {

    private final CsvParser csvParser;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final UserStatisticsRepository userStatisticsRepository;

    private static final Long OPENRUN_CLUB_ID = 1L;  // 오픈런 클럽 ID 고정

    /**
     * 전체 데이터 마이그레이션 (개발/테스트용)
     * 1. CSV 파싱
     * 2. 모든 선수 임시 User 생성
     * 3. 모든 경기 Match 생성
     */
    @Transactional
    public MigrationResult migrateAll(MultipartFile csvFile) throws IOException {
        log.info("=== 전체 데이터 마이그레이션 시작 ===");

        // 1. CSV 파싱
        List<CsvMatchRecord> csvRecords = csvParser.parseMatches(csvFile);
        log.info("CSV 파싱 완료: {} 경기", csvRecords.size());

        // 2. 선수 이름 추출
        Set<String> playerNames = csvParser.extractAllPlayerNames(csvRecords);
        log.info("선수 추출 완료: {} 명", playerNames.size());

        // 3. 임시 User 생성 (이미 존재하면 스킵, 게스트 포함)
        int createdUsers = 0;
        Map<String, Long> nameToUserIdMap = new HashMap<>();

        for (String name : playerNames) {
            Optional<User> existing = userRepository.findByName(name);
            if (existing.isPresent()) {
                nameToUserIdMap.put(name, existing.get().getId());
                log.debug("기존 사용자 사용: {} (ID={})", name, existing.get().getId());
            } else {
                User tempUser = createTempUser(name);
                User savedUser = userRepository.save(tempUser);
                nameToUserIdMap.put(name, savedUser.getId());
                createdUsers++;
                log.debug("임시 사용자 생성: {} (ID={})", name, savedUser.getId());
            }
        }

        log.info("사용자 생성 완료: {} 명 (신규: {}, 기존: {})",
                playerNames.size(), createdUsers, playerNames.size() - createdUsers);

        // 4. Match 생성
        int matchNumber = 1;
        List<Match> matches = new ArrayList<>();

        for (CsvMatchRecord record : csvRecords) {
            // 선수 ID 조회 (게스트 포함)
            Long player1Id = nameToUserIdMap.get(record.getTeamAPlayer1());
            Long player2Id = nameToUserIdMap.get(record.getTeamAPlayer2());
            Long player3Id = nameToUserIdMap.get(record.getTeamBPlayer1());
            Long player4Id = nameToUserIdMap.get(record.getTeamBPlayer2());

            // 유효성 검사: player1과 player3는 필수 (복식 1번 자리는 NOT NULL)
            if (player1Id == null || player3Id == null) {
                log.warn("필수 선수 정보 없음, 경기 스킵: {} vs {}", record.getTeamAPlayer1(), record.getTeamBPlayer1());
                continue;
            }

            // played_at: 날짜 + 08:00 (기본 시간)
            LocalDateTime playedAt = LocalDateTime.of(record.getDate(), LocalTime.of(8, 0));

            Match match = Match.builder()
                    .clubId(OPENRUN_CLUB_ID)
                    .scheduleId(null)  // 과거 경기는 schedule 없음
                    .drawId(null)      // 과거 경기는 draw 없음
                    .matchNumber(matchNumber++)
                    .teamAPlayer1Id(player1Id)
                    .teamAPlayer2Id(player2Id)
                    .teamBPlayer1Id(player3Id)
                    .teamBPlayer2Id(player4Id)
                    .teamAScore(record.getTeamAScore())
                    .teamBScore(record.getTeamBScore())
                    .result(record.getMatchResult())
                    .playedAt(playedAt)
                    .isMigrated(true)
                    .build();

            matches.add(match);
        }

        matchRepository.saveAll(matches);
        log.info("Match 생성 완료: {} 경기", matches.size());

        // 5. 통계 재계산
        recalculateStatistics(OPENRUN_CLUB_ID);
        log.info("통계 재계산 완료");

        log.info("=== 전체 데이터 마이그레이션 완료 ===");
        return new MigrationResult(createdUsers, matches.size());
    }

    /**
     * 특정 선수의 경기만 마이그레이션 (운영용)
     * 가입 시점에 해당 선수의 경기만 처리
     */
    @Transactional
    public MigrationResult migrateForPlayer(String playerName, MultipartFile csvFile) throws IOException {
        log.info("=== {} 선수 경기 마이그레이션 시작 ===", playerName);

        // 1. CSV 파싱
        List<CsvMatchRecord> csvRecords = csvParser.parseMatches(csvFile);

        // 2. 해당 선수가 참여한 경기만 필터링
        List<CsvMatchRecord> playerMatches = csvRecords.stream()
                .filter(record ->
                        playerName.equals(record.getTeamAPlayer1()) ||
                        playerName.equals(record.getTeamAPlayer2()) ||
                        playerName.equals(record.getTeamBPlayer1()) ||
                        playerName.equals(record.getTeamBPlayer2()))
                .toList();

        log.info("{} 선수 참여 경기: {} / {} 경기", playerName, playerMatches.size(), csvRecords.size());

        // 3. 경기에 참여한 모든 선수 User 확인/생성
        Set<String> relatedPlayers = new HashSet<>();
        for (CsvMatchRecord record : playerMatches) {
            relatedPlayers.add(record.getTeamAPlayer1());
            relatedPlayers.add(record.getTeamAPlayer2());
            relatedPlayers.add(record.getTeamBPlayer1());
            relatedPlayers.add(record.getTeamBPlayer2());
        }

        Map<String, Long> nameToUserIdMap = new HashMap<>();
        int createdUsers = 0;

        for (String name : relatedPlayers) {
            Optional<User> existing = userRepository.findByName(name);
            if (existing.isPresent()) {
                nameToUserIdMap.put(name, existing.get().getId());
            } else {
                User tempUser = createTempUser(name);
                User savedUser = userRepository.save(tempUser);
                nameToUserIdMap.put(name, savedUser.getId());
                createdUsers++;
                log.debug("임시 사용자 생성: {}", name);
            }
        }

        // 4. Match 생성
        int matchNumber = 1;
        List<Match> matches = new ArrayList<>();

        for (CsvMatchRecord record : playerMatches) {
            Long player1Id = nameToUserIdMap.get(record.getTeamAPlayer1());
            Long player2Id = nameToUserIdMap.get(record.getTeamAPlayer2());
            Long player3Id = nameToUserIdMap.get(record.getTeamBPlayer1());
            Long player4Id = nameToUserIdMap.get(record.getTeamBPlayer2());

            // 유효성 검사: player1과 player3는 필수 (복식 1번 자리는 NOT NULL)
            if (player1Id == null || player3Id == null) {
                log.warn("필수 선수 정보 없음, 경기 스킵: {} vs {}", record.getTeamAPlayer1(), record.getTeamBPlayer1());
                continue;
            }

            LocalDateTime playedAt = LocalDateTime.of(record.getDate(), LocalTime.of(8, 0));

            Match match = Match.builder()
                    .clubId(OPENRUN_CLUB_ID)
                    .scheduleId(null)
                    .drawId(null)
                    .matchNumber(matchNumber++)
                    .teamAPlayer1Id(player1Id)
                    .teamAPlayer2Id(player2Id)
                    .teamBPlayer1Id(player3Id)
                    .teamBPlayer2Id(player4Id)
                    .teamAScore(record.getTeamAScore())
                    .teamBScore(record.getTeamBScore())
                    .result(record.getMatchResult())
                    .playedAt(playedAt)
                    .isMigrated(true)
                    .build();

            matches.add(match);
        }

        matchRepository.saveAll(matches);
        log.info("Match 생성 완료: {} 경기", matches.size());

        // 4. 통계 재계산
        recalculateStatistics(OPENRUN_CLUB_ID);
        log.info("통계 재계산 완료");

        log.info("=== {} 선수 마이그레이션 완료: {} 경기 ===", playerName, matches.size());

        return new MigrationResult(createdUsers, matches.size());
    }

    /**
     * 임시 User 생성 (마이그레이션용)
     * - Firebase 인증 없이 CSV 이름만으로 생성
     * - 실제 가입 시 병합 또는 대체 필요
     */
    private User createTempUser(String name) {
        String tempFirebaseUid = "migrated_" + UUID.randomUUID().toString();
        String tempEmail = "migrated_" + UUID.randomUUID().toString() + "@temp.openrun.app";

        return User.builder()
                .firebaseUid(tempFirebaseUid)
                .socialId(null)
                .email(tempEmail)
                .name(name)
                .imageUrl(null)
                .build();
    }

    /**
     * 클럽 전체 사용자 통계 재계산
     * - 해당 클럽의 모든 경기를 읽어서 각 선수별 통계 집계
     * - 승점: 승=3점, 무=1점, 패=0점
     * - 승률: (승 + 무×0.5) / 경기수
     */
    private void recalculateStatistics(Long clubId) {
        log.info("=== {} 클럽 통계 재계산 시작 ===", clubId);

        // 1. 해당 클럽의 모든 경기 조회
        List<Match> matches = matchRepository.findByClubIdOrderByPlayedAtDesc(clubId);
        log.info("총 {} 경기 조회", matches.size());

        // 2. 선수별 통계 집계
        Map<Long, PlayerStats> statsMap = new HashMap<>();

        for (Match match : matches) {
            // Team A Player 1
            if (match.getTeamAPlayer1Id() != null) {
                updatePlayerStats(statsMap, match.getTeamAPlayer1Id(), match, true);
            }
            // Team A Player 2
            if (match.getTeamAPlayer2Id() != null) {
                updatePlayerStats(statsMap, match.getTeamAPlayer2Id(), match, true);
            }
            // Team B Player 1
            if (match.getTeamBPlayer1Id() != null) {
                updatePlayerStats(statsMap, match.getTeamBPlayer1Id(), match, false);
            }
            // Team B Player 2
            if (match.getTeamBPlayer2Id() != null) {
                updatePlayerStats(statsMap, match.getTeamBPlayer2Id(), match, false);
            }
        }

        // 3. UserStatistics 엔티티 업데이트
        for (Map.Entry<Long, PlayerStats> entry : statsMap.entrySet()) {
            Long userId = entry.getKey();
            PlayerStats stats = entry.getValue();

            UserStatistics userStats = userStatisticsRepository.findByUserIdAndClubId(userId, clubId)
                    .orElse(UserStatistics.builder()
                            .userId(userId)
                            .clubId(clubId)
                            .build());

            userStats.recalculate(
                    stats.wins,
                    stats.draws,
                    stats.losses,
                    stats.pointsScored,
                    stats.pointsConceded
            );

            userStatisticsRepository.save(userStats);
        }

        log.info("=== 통계 재계산 완료: {} 명 ===", statsMap.size());
    }

    /**
     * 선수 통계 업데이트 (집계용)
     */
    private void updatePlayerStats(Map<Long, PlayerStats> statsMap, Long playerId, Match match, boolean isTeamA) {
        PlayerStats stats = statsMap.computeIfAbsent(playerId, k -> new PlayerStats());

        Integer teamScore = isTeamA ? match.getTeamAScore() : match.getTeamBScore();
        Integer opponentScore = isTeamA ? match.getTeamBScore() : match.getTeamAScore();

        if (teamScore == null || opponentScore == null) {
            return;
        }

        stats.pointsScored += teamScore;
        stats.pointsConceded += opponentScore;

        Match.MatchResult result = match.getResult();
        if (result == null) {
            return;
        }

        // 승무패 판정
        if ((isTeamA && result == Match.MatchResult.TEAM_A_WIN) ||
            (!isTeamA && result == Match.MatchResult.TEAM_B_WIN)) {
            stats.wins++;
        } else if (result == Match.MatchResult.DRAW) {
            stats.draws++;
        } else {
            stats.losses++;
        }
    }

    /**
     * 선수 통계 집계용 내부 클래스
     */
    private static class PlayerStats {
        int wins = 0;
        int draws = 0;
        int losses = 0;
        int pointsScored = 0;
        int pointsConceded = 0;
    }

    /**
     * 마이그레이션 결과
     */
    public record MigrationResult(int createdUsers, int createdMatches) {
    }
}
