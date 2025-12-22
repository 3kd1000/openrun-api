package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequest;
import com.example.openrunapi.domain.draw.model.dto.DrawResponse;
import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.match.repository.MatchRepository;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.dto.CreateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleRequest;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleParticipantRepository participantRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

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

    /**
     * 대진 생성 후 Match 테이블에 저장
     * 동일 schedule_id의 기존 대진이 있으면 삭제 후 새로 생성
     */
    @Transactional
    public void saveMatchesFromDraw(Long scheduleId, ScheduleResponse scheduleResponse,
                                     DrawResponse drawResponse, CreateDrawRequest request) {
        log.info("=== Match 저장 시작 ===");
        log.info("scheduleId: {}, clubId: {}, games: {}",
                scheduleId, scheduleResponse.getClubId(), drawResponse.getGames().size());

        // 일정 조회
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        // 기존 대진이 있으면 삭제 (재생성 대응)
        List<Match> existingMatches = matchRepository.findByScheduleId(scheduleId);
        if (!existingMatches.isEmpty()) {
            log.info("기존 대진 {} 건 삭제 후 재생성", existingMatches.size());
            matchRepository.deleteAll(existingMatches);
        }

        // Schedule에 대진 정보 저장
        schedule.createDraw(request.getDrawType());
        log.info("Schedule에 대진 정보 저장: drawType={}, isDrawValid=true", request.getDrawType());

        // 선수 이름 -> userId 매핑 생성
        Map<String, Long> nameToUserId = buildNameToUserIdMap(request);

        Long clubId = scheduleResponse.getClubId();
        LocalDateTime playedAt = scheduleResponse.getScheduledAt();

        // 각 게임을 Match 엔티티로 변환하여 저장
        List<Match> matches = new ArrayList<>();
        for (DrawResponse.Game game : drawResponse.getGames()) {
            try {
                Match match = buildMatchFromGame(game, clubId, scheduleId, playedAt, nameToUserId);
                matches.add(match);
            } catch (IllegalArgumentException e) {
                log.error("게임 {} Match 생성 실패: {}", game.getGameNo(), e.getMessage());
                throw e;
            }
        }

        matchRepository.saveAll(matches);
        log.info("Match 저장 완료: {} 건", matches.size());
    }

    /**
     * 선수 이름 -> userId 매핑 생성
     */
    private Map<String, Long> buildNameToUserIdMap(CreateDrawRequest request) {
        Set<String> allPlayerNames = new HashSet<>();

        if (request.getUserNames() != null) {
            allPlayerNames.addAll(request.getUserNames());
        }
        if (request.getSeedUserNames() != null) {
            allPlayerNames.addAll(request.getSeedUserNames());
        }
        if (request.getGroupAUserNames() != null) {
            allPlayerNames.addAll(request.getGroupAUserNames());
        }
        if (request.getGroupBUserNames() != null) {
            allPlayerNames.addAll(request.getGroupBUserNames());
        }

        Map<String, Long> nameToUserId = new HashMap<>();
        for (String name : allPlayerNames) {
            User user = userRepository.findByName(name)
                    .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + name));
            nameToUserId.put(name, user.getId());
        }

        return nameToUserId;
    }

    /**
     * DrawResponse.Game -> Match 엔티티 변환
     */
    private Match buildMatchFromGame(DrawResponse.Game game, Long clubId, Long scheduleId,
                                      LocalDateTime playedAt, Map<String, Long> nameToUserId) {
        List<String> teamA = game.getTeamA();
        List<String> teamB = game.getTeamB();

        if (teamA.size() < 1 || teamB.size() < 1) {
            throw new IllegalArgumentException("팀은 최소 1명 이상이어야 합니다.");
        }

        Long teamAPlayer1Id = nameToUserId.get(teamA.get(0));
        Long teamAPlayer2Id = teamA.size() > 1 ? nameToUserId.get(teamA.get(1)) : null;
        Long teamBPlayer1Id = nameToUserId.get(teamB.get(0));
        Long teamBPlayer2Id = teamB.size() > 1 ? nameToUserId.get(teamB.get(1)) : null;

        if (teamAPlayer1Id == null || teamBPlayer1Id == null) {
            throw new IllegalArgumentException("선수 ID를 찾을 수 없습니다.");
        }

        return Match.builder()
                .clubId(clubId)
                .scheduleId(scheduleId)
                .matchNumber(game.getGameNo())
                .teamAPlayer1Id(teamAPlayer1Id)
                .teamAPlayer2Id(teamAPlayer2Id)
                .teamBPlayer1Id(teamBPlayer1Id)
                .teamBPlayer2Id(teamBPlayer2Id)
                .playedAt(playedAt)
                .isMigrated(false)
                .build();
    }
}
