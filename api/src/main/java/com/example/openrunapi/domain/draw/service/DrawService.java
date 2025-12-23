package com.example.openrunapi.domain.draw.service;

import com.example.openrunapi.common.model.ValidationResult;
import com.example.openrunapi.domain.draw.model.DrawPattern;
import com.example.openrunapi.domain.draw.model.DrawStatistics;
import com.example.openrunapi.domain.draw.model.DrawType;
import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequest;
import com.example.openrunapi.domain.draw.model.dto.DrawResponse;
import com.example.openrunapi.domain.draw.repository.DrawStatisticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DrawService {

    private final DrawStatisticsRepository drawStatisticsRepository;

    @Transactional
    public DrawResponse generateDrawSequence(CreateDrawRequest request) {

        ValidationResult validation = isValidRequest(request);
        if (!validation.isValid()) {
            throw new IllegalArgumentException(validation.getMessage());
        }

        DrawType drawType = request.getDrawType();

        // --- 통계 기록 로직 추가 ---
        DrawStatistics statistics = drawStatisticsRepository.findByDrawType(drawType)
                .orElseGet(() -> DrawStatistics.builder().drawType(drawType).build());

        statistics.incrementCount();
        drawStatisticsRepository.save(statistics);
        // --------------------------

        switch (drawType) {
            case AA:
                return generateAAMatches(request.getUserNames());
            case AB:
                return generateABMatches(request.getGroupAUserNames(), request.getGroupBUserNames());
            case SEED:
                return generateSEEDMatches(request.getUserNames(),  request.getSeedUserNames());
            default:
                throw new IllegalArgumentException("지원하지 않는 대진 방식입니다.");
        }
    }

    private DrawResponse generateAAMatches(List<String> userNames) {
        int n = userNames.size();
        int gamesPerRound = n / 4;

        List<String> sequence = DrawPattern.AA_PATTERNS.get(n);

        List<String> shuffledUsers = new ArrayList<>(userNames);
        Collections.shuffle(shuffledUsers);
        Map<String, String> numberToName = mapNumbersToUserNames(shuffledUsers);

        List<DrawResponse.Game> games = new ArrayList<>();
        for (int i = 0; i < sequence.size(); i++) {
            String match = sequence.get(i);
            String[] teams = match.split(":");
            List<String> teamA = mapTeamToNames(teams[0], numberToName);
            List<String> teamB = mapTeamToNames(teams[1], numberToName);
            int gameNo = i + 1;
            int roundNo = (i / gamesPerRound) + 1; // ★ 라운드 번호 계산
            games.add(DrawResponse.Game.builder()
                    .gameNo(gameNo)
                    .roundNo(roundNo)
                    .teamA(teamA)
                    .teamB(teamB)
                    .matchId(null)
                    .build());
        }
        return new DrawResponse(games);
    }

    private DrawResponse generateABMatches(List<String> groupAList, List<String> groupBList) {
        int n = groupAList.size() + groupBList.size();
        int gamesPerRound = n / 4;

        List<String> sequence = DrawPattern.AB_PATTERNS.get(n);

        List<String> shuffledA = new ArrayList<>(groupAList);
        List<String> shuffledB = new ArrayList<>(groupBList);
        Collections.shuffle(shuffledA);
        Collections.shuffle(shuffledB);

        // 그룹A: 1,2,3... / 그룹B: A,B,C...
        Map<String, String> numberToName = new HashMap<>();
        for (int i = 0; i < shuffledA.size(); i++) {
            numberToName.put(DrawPattern.BRACKET_NUMBERS[i], shuffledA.get(i));
        }
        for (int i = 0; i < shuffledB.size(); i++) {
            numberToName.put(DrawPattern.BRACKET_NUMBERS[9 + i], shuffledB.get(i)); // 9까지가 "1"~"9", 그 뒤가 "A"~
        }

        List<DrawResponse.Game> games = new ArrayList<>();
        for (int i = 0; i < sequence.size(); i++) {
            String match = sequence.get(i);
            String[] teams = match.split(":");
            List<String> teamA = mapTeamToNames(teams[0], numberToName);
            List<String> teamB = mapTeamToNames(teams[1], numberToName);
            int gameNo = i + 1;
            int roundNo = (i / gamesPerRound) + 1; // ★ 라운드 번호 계산
            games.add(DrawResponse.Game.builder()
                    .gameNo(gameNo)
                    .roundNo(roundNo)
                    .teamA(teamA)
                    .teamB(teamB)
                    .matchId(null)
                    .build());
        }
        return new DrawResponse(games);
    }

    private DrawResponse generateSEEDMatches(List<String> userNames, List<String> seedUserNames) {
        int n = userNames.size() + seedUserNames.size();
        int gamesPerRound = n / 4;

        List<String> sequence = DrawPattern.AA_PATTERNS.get(n);
        List<String> seedPositions = DrawPattern.SEED_POSITIONS.get(n);

        // 일반 플레이어 셔플
        List<String> shuffledUsers = new ArrayList<>(userNames);
        Collections.shuffle(shuffledUsers);

        // 시드 플레이어 셔플
        List<String> shuffledSeeds = new ArrayList<>(seedUserNames);
        Collections.shuffle(shuffledSeeds);
        
        // 시드 우선 배정: 시드 포지션에 시드 플레이어, 나머지 포지션에 일반 플레이어 랜덤 배정
        Map<String, String> numberToName = new HashMap<>();
        int seedIdx = 0, userIdx = 0;
        for (int i = 0; i < n; i++) {
            String pos = DrawPattern.BRACKET_NUMBERS[i];
            if (seedIdx < seedPositions.size() && pos.equals(seedPositions.get(seedIdx))) {
                numberToName.put(pos, shuffledSeeds.get(seedIdx));
                seedIdx++;
            } else {
                if (userIdx < shuffledUsers.size()) {
                    numberToName.put(pos, shuffledUsers.get(userIdx));
                    userIdx++;
                }
            }
        }

        List<DrawResponse.Game> games = new ArrayList<>();
        for (int i = 0; i < sequence.size(); i++) {
            String match = sequence.get(i);
            String[] teams = match.split(":");
            List<String> teamA = mapTeamToNames(teams[0], numberToName);
            List<String> teamB = mapTeamToNames(teams[1], numberToName);
            int gameNo = i + 1;
            int roundNo = (i / gamesPerRound) + 1; // ★ 라운드 번호 계산
            games.add(DrawResponse.Game.builder()
                    .gameNo(gameNo)
                    .roundNo(roundNo)
                    .teamA(teamA)
                    .teamB(teamB)
                    .matchId(null)
                    .build());
        }
        return new DrawResponse(games);
    }

    // 번호 → 이름 매핑
    private Map<String, String> mapNumbersToUserNames(List<String> userNames) {
        Map<String, String> map = new HashMap<>();
        for (int i = 0; i < userNames.size(); i++) {
            map.put(DrawPattern.BRACKET_NUMBERS[i], userNames.get(i));
        }
        return map;
    }

    // 팀 문자열("12" 등) → 이름 리스트 변환
    private List<String> mapTeamToNames(String team, Map<String, String> numberToName) {
        List<String> names = new ArrayList<>();
        for (char c : team.toCharArray()) {
            names.add(numberToName.getOrDefault(String.valueOf(c), String.valueOf(c)));
        }
        return names;
    }

    private ValidationResult isValidRequest(CreateDrawRequest request) {
        DrawType drawType = request.getDrawType();
        if (drawType == null) 
            return ValidationResult.fail("대진 타입이 선택되지 않았습니다.");
    
        switch (drawType) {
            case AA:
                return validateAA(request.getUserNames());
            case AB:
                return validateAB(request.getGroupAUserNames(), request.getGroupBUserNames());
            case SEED:
                return validateSEED(request.getUserNames(), request.getSeedUserNames());
            default:
                return ValidationResult.fail("지원하지 않는 대진 방식입니다.");
        }
    }
    
    private ValidationResult validateAA(List<String> userNames) {
        if (userNames == null)
            return ValidationResult.fail("참가자 명단이 입력되지 않았습니다.");
        int total = userNames.size();
        if (total < 5 || total > 16)
            return ValidationResult.fail("AA 방식은 5~16명만 가능합니다.");
        return ValidationResult.success();
    }
    
    private ValidationResult validateAB(List<String> groupA, List<String> groupB) {
        if (groupA == null || groupB == null)
            return ValidationResult.fail("AB 방식은 그룹A, 그룹B 모두 입력해야 합니다.");
        int sizeA = groupA.size(), sizeB = groupB.size();
        int total = sizeA + sizeB;
        if (!List.of(8, 10, 12, 14, 16).contains(total))
            return ValidationResult.fail("AB 방식은 8, 10, 12, 14, 16명만 가능합니다.");
        if (sizeA != sizeB)
            return ValidationResult.fail("AB 방식은 그룹A와 그룹B의 인원이 같아야 합니다.");
        return ValidationResult.success();
    }
    
    private ValidationResult validateSEED(List<String> userNames, List<String> seedUserNames) {
        if (userNames == null || seedUserNames == null)
            return ValidationResult.fail("일반 또는 시드 플레이어 명단이 입력되지 않았습니다.");
        if (userNames.stream().anyMatch(seedUserNames::contains))
            return ValidationResult.fail("일반/시드 플레이어 명단에 중복된 참가자가 있습니다.");
        Set<String> allPlayers = new HashSet<>();
        allPlayers.addAll(userNames);
        allPlayers.addAll(seedUserNames);
        int total = allPlayers.size();
        if (total < 5 || total > 16)
            return ValidationResult.fail("SEED 방식은 일반+시드 플레이어 합이 5~16명이어야 합니다.");
        int seedCount = getSeedCount(total);
        if (seedUserNames.size() != seedCount)
            return ValidationResult.fail(
                String.format("SEED 방식은 %d명일 때 시드 플레이어를 %d명 입력해야 합니다.", total, seedCount)
            );
        return ValidationResult.success();
    }

    // 인원수별 공식 시드 개수 반환
    private int getSeedCount(int totalPlayers) {
        switch (totalPlayers) {
            case 6: case 7: case 8:
                return 2;
            case 9: case 10: 
                return 3;
            case 11: case 12: case 13: case 14:
                return 4;
            case 15: 
                return 5;
            case 16:
                return 6;
            default:
                return 0;
        }
    }

    public String formatDrawForSharing(DrawResponse response) {
        StringBuilder sb = new StringBuilder();
        int prevRoundNo = -1;
        for (DrawResponse.Game game : response.getGames()) {
            // 라운드가 바뀔 때마다 줄 띄우기 & 라운드 헤더 출력
            if (game.getRoundNo() != prevRoundNo) {
                if (sb.length() > 0) sb.append("\n");  // 이전 라운드 끝나고 한 줄 띄우기
                sb.append("라운드 ").append(game.getRoundNo()).append("\n");
                prevRoundNo = game.getRoundNo();
            }
            sb.append("게임").append(game.getGameNo()).append(" ");
            sb.append(String.join(", ", game.getTeamA())).append(" : ");
            sb.append(String.join(", ", game.getTeamB())).append("\n");
        }
        return sb.toString();
    }
}
