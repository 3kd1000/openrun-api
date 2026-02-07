package com.example.openrunapi.domain.user.service;

import com.example.openrunapi.domain.auth.service.OAuthService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserOAuthProvider;
import com.example.openrunapi.domain.user.model.UserProfile;
import com.example.openrunapi.domain.user.model.dto.OAuthProviderResponse;
import com.example.openrunapi.domain.user.model.dto.UpdateUserProfileRequest;
import com.example.openrunapi.domain.user.model.dto.UpdateUserRequest;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.model.dto.UserProfileResponse;
import com.example.openrunapi.domain.user.repository.UserOAuthProviderRepository;
import com.example.openrunapi.domain.user.repository.UserProfileRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.dto.MyScheduleResponse;
import com.example.openrunapi.domain.schedule.model.dto.MyParticipationInfo;
import com.example.openrunapi.domain.schedule.model.dto.MyExternalRequestInfo;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleResponse;
import com.example.openrunapi.domain.externalrequest.repository.ExternalRequestRepository;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequest;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.match.repository.MatchRepository;
import com.example.openrunapi.domain.user.model.dto.MyRecentMatchResponse;
import com.example.openrunapi.domain.user.model.dto.UserTotalStatsResponse;
import com.example.openrunapi.domain.user.model.dto.MyAllMatchResponse;
import com.example.openrunapi.domain.user.model.dto.MyAllMatchPageResponse;
import com.example.openrunapi.domain.user.model.dto.WithdrawalCheckResponse;
import com.example.openrunapi.domain.user.repository.UserStatisticsRepository;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.service.ClubService;
import com.example.openrunapi.domain.award.repository.AwardWinnerRepository;
import com.example.openrunapi.domain.post.repository.PostRepository;
import com.example.openrunapi.domain.post.repository.CommentRepository;
import com.example.openrunapi.domain.notification.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserOAuthProviderRepository userOAuthProviderRepository;
    private final UserProfileRepository userProfileRepository;
    private final OAuthService oauthService;
    private final ScheduleParticipantRepository participantRepository;
    private final ExternalRequestRepository externalRequestRepository;
    private final ScheduleRepository scheduleRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final MatchRepository matchRepository;
    private final UserStatisticsRepository userStatisticsRepository;
    private final AwardWinnerRepository awardWinnerRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final ClubService clubService;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String uid) throws UsernameNotFoundException {
        // Provider 구분 없이 provider_uid로 검색
        oauthService.findUserByProviderUid(uid)
                .orElseGet(() -> {
                    // Firebase에서 정보 가져와서 신규 생성
                    try {
                        UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
                        return getOrCreateUser(userRecord);
                    } catch (FirebaseAuthException e) {
                        throw new UsernameNotFoundException("Failed to fetch user data from Firebase.", e);
                    }
                });

        return new org.springframework.security.core.userdetails.User(
                uid,
                "",
                new ArrayList<>());
    }

    @Transactional
    public UserDetails loadUserById(Long id) throws UsernameNotFoundException {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        return new org.springframework.security.core.userdetails.User(
                user.getId().toString(),
                "",
                new ArrayList<>());
    }

    @Transactional
    public User getOrCreateUser(UserRecord userRecord) {
        // OAuthService를 사용하여 email 기반 통합 계정 관리
        return oauthService.getOrCreateUser(
                UserOAuthProvider.OAuthProviderType.GOOGLE,
                userRecord.getUid(),
                userRecord.getEmail(),
                userRecord.getDisplayName() != null ? userRecord.getDisplayName() : "New User",
                userRecord.getPhotoUrl()
        ).getUser(); // UserCreationResult에서 User만 추출
    }

    public UserResponse getCurrentUser(String uid) {
        // Firebase uid로 사용자 조회
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        return new UserResponse(user);
    }

    /**
     * 사용자 활동 시각 업데이트 (앱 활성화, 토큰 갱신 시 호출)
     * DAU 집계에 사용됨
     */
    @Transactional
    public void updateActivity(String uid) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        user.updateLastActive(java.time.LocalDateTime.now());
    }

    @Transactional
    public UserResponse updateUser(String uid, UpdateUserRequest request) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));

        user.updateProfile(request.getName(), request.getImageUrl());
        user.updateContactInfo(request.getPhoneNumber(), request.getPhoneVisibility(), request.getEmailVisibility());
        user.updateGender(request.getGender());
        user.updateBirthDateInfo(request.getBirthDate(), request.getBirthDateVisibility());
        user.updateRegion(request.getRegionDepth1(), request.getRegionDepth2());

        return new UserResponse(user);
    }

    @Transactional
    public void deleteUser(String uid) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        userRepository.delete(user);
    }

    /**
     * 게스트 사용자 목록 조회 (is_guest=true)
     * - 게스트1~16 반환
     */
    public java.util.List<UserResponse> getGuestUsers() {
        java.util.List<User> guests = userRepository.findByIsGuestOrderByIdAsc(true);
        return guests.stream()
                .map(UserResponse::new)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * 현재 사용자의 OAuth 제공자 목록 조회
     */
    public java.util.List<OAuthProviderResponse> getUserOAuthProviders(String uid) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));

        java.util.List<UserOAuthProvider> providers = userOAuthProviderRepository.findByUserId(user.getId());
        return providers.stream()
                .map(OAuthProviderResponse::new)
                .collect(java.util.stream.Collectors.toList());
    }

    public UserProfileResponse getMyProfile(String uid) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseGet(() -> userProfileRepository.save(new UserProfile(user)));
        return new UserProfileResponse(profile);
    }

    @Transactional
    public UserProfileResponse updateMyProfile(String uid, UpdateUserProfileRequest request) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));
        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseGet(() -> userProfileRepository.save(new UserProfile(user)));
        profile.update(
                request != null ? request.getTennisStartedAt() : null,
                request != null ? request.getNtrp() : null,
                request != null ? request.getTournamentHistory() : null,
                request != null ? request.getFormerPlayer() : null
        );
        return new UserProfileResponse(profile);
    }

    /**
     * 내가 참가한 모든 일정 조회
     * - ScheduleParticipant + ExternalRequest 조합
     * - 미래 일정만 조회 가능
     */
    public java.util.List<MyScheduleResponse> getMySchedules(Long userId, Boolean upcoming) {
        // 1. ScheduleParticipant에서 내 참가 목록 조회 (CANCELLED 제외)
        java.util.List<ScheduleParticipant> participants = participantRepository.findByUserIdAndStatusNot(
                userId,
                ScheduleParticipant.ParticipantStatus.CANCELLED
        );

        // 2. ExternalRequest에서 내가 신청한 목록 조회
        java.util.List<ExternalRequest> externalRequests = externalRequestRepository
                .findByRequesterIdAndScheduleIsNotNullOrderByCreatedAtDesc(userId);

        // 3. scheduleId 기준으로 그룹핑
        java.util.Map<Long, ScheduleParticipant> participantMap = participants.stream()
                .collect(java.util.stream.Collectors.toMap(
                        ScheduleParticipant::getScheduleId,
                        p -> p,
                        (p1, p2) -> p1  // 중복 시 첫 번째 유지
                ));

        java.util.Map<Long, ExternalRequest> externalRequestMap = externalRequests.stream()
                .filter(req -> req.getSchedule() != null)
                .collect(java.util.stream.Collectors.toMap(
                        req -> req.getSchedule().getId(),
                        req -> req,
                        (r1, r2) -> r1  // 중복 시 첫 번째 유지
                ));

        // 4. 모든 scheduleId 수집
        java.util.Set<Long> scheduleIds = new java.util.HashSet<>();
        scheduleIds.addAll(participantMap.keySet());
        scheduleIds.addAll(externalRequestMap.keySet());

        // 5. Schedule 정보 조회
        java.util.List<Schedule> schedules = scheduleRepository.findAllById(scheduleIds);

        // 6. MyScheduleResponse 생성
        java.util.List<MyScheduleResponse> responses = new java.util.ArrayList<>();
        for (Schedule schedule : schedules) {
            // upcoming 필터링
            if (Boolean.TRUE.equals(upcoming) && schedule.getScheduledAt().isBefore(java.time.LocalDateTime.now())) {
                continue;
            }

            ScheduleParticipant participant = participantMap.get(schedule.getId());
            ExternalRequest externalRequest = externalRequestMap.get(schedule.getId());

            // MyParticipationInfo 생성
            MyParticipationInfo participationInfo = null;
            if (participant != null) {
                Long waitingNumber = null;
                if (participant.getStatus() == ScheduleParticipant.ParticipantStatus.WAITING) {
                    waitingNumber = participantRepository.calculateWaitingNumber(
                            schedule.getId(),
                            participant.getJoinedAt()
                    );
                }

                participationInfo = MyParticipationInfo.builder()
                        .status(participant.getStatus().name())
                        .waitingNumber(waitingNumber != null ? waitingNumber.intValue() : null)
                        .asGuest(participant.isAsGuest())
                        .build();
            }

            // MyExternalRequestInfo 생성
            MyExternalRequestInfo externalRequestInfo = null;
            if (externalRequest != null) {
                externalRequestInfo = MyExternalRequestInfo.builder()
                        .requestId(externalRequest.getId())
                        .status(externalRequest.getStatus().name())
                        .type(externalRequest.getType().name())
                        .createdAt(externalRequest.getCreatedAt())
                        .build();
            }

            // ScheduleResponse 생성 (생성자 사용)
            ScheduleResponse scheduleResponse = new ScheduleResponse(schedule, clubRepository, userRepository);

            responses.add(MyScheduleResponse.builder()
                    .schedule(scheduleResponse)
                    .myParticipation(participationInfo)
                    .myExternalRequest(externalRequestInfo)
                    .build());
        }

        // 7. 날짜순 정렬
        responses.sort(java.util.Comparator.comparing(
                r -> r.getSchedule().getScheduledAt()
        ));

        return responses;
    }

    /**
     * 특정 클럽에서의 내 최근 전적 조회
     *
     * @param userId 사용자 ID
     * @param clubId 클럽 ID
     * @param limit  조회할 경기 수 (기본 5)
     * @return 최근 전적 목록
     */
    public java.util.List<MyRecentMatchResponse> getMyRecentMatches(Long userId, Long clubId, Integer limit) {
        // 클럽에서 내가 참여한 경기 조회 (결과가 있는 경기만)
        java.util.List<Match> matches = matchRepository.findByClubIdAndPlayerId(clubId, userId);

        // 결과가 있는 경기만 필터링하고, limit 적용
        int maxResults = limit != null ? limit : 5;

        return matches.stream()
                .filter(match -> match.getResult() != null)  // 결과가 있는 경기만
                .limit(maxResults)
                .map(match -> toMyRecentMatchResponse(match, userId))
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Match -> MyRecentMatchResponse 변환 (내 관점)
     */
    private MyRecentMatchResponse toMyRecentMatchResponse(Match match, Long userId) {
        // 내가 Team A인지 Team B인지 판단
        boolean isTeamA = userId.equals(match.getTeamAPlayer1Id()) ||
                          userId.equals(match.getTeamAPlayer2Id());

        // 내 파트너 이름
        String myPartnerName = null;
        if (isTeamA) {
            Long partnerId = userId.equals(match.getTeamAPlayer1Id())
                    ? match.getTeamAPlayer2Id()
                    : match.getTeamAPlayer1Id();
            if (partnerId != null) {
                myPartnerName = getUserName(partnerId);
            }
        } else {
            Long partnerId = userId.equals(match.getTeamBPlayer1Id())
                    ? match.getTeamBPlayer2Id()
                    : match.getTeamBPlayer1Id();
            if (partnerId != null) {
                myPartnerName = getUserName(partnerId);
            }
        }

        // 상대팀 정보
        String opponent1Name;
        String opponent2Name = null;
        Integer myTeamScore;
        Integer opponentTeamScore;

        if (isTeamA) {
            opponent1Name = getUserName(match.getTeamBPlayer1Id());
            if (match.getTeamBPlayer2Id() != null) {
                opponent2Name = getUserName(match.getTeamBPlayer2Id());
            }
            myTeamScore = match.getTeamAScore();
            opponentTeamScore = match.getTeamBScore();
        } else {
            opponent1Name = getUserName(match.getTeamAPlayer1Id());
            if (match.getTeamAPlayer2Id() != null) {
                opponent2Name = getUserName(match.getTeamAPlayer2Id());
            }
            myTeamScore = match.getTeamBScore();
            opponentTeamScore = match.getTeamAScore();
        }

        // 내 관점에서의 결과 판정
        String myResult;
        if (match.getResult() == Match.MatchResult.DRAW) {
            myResult = "DRAW";
        } else if ((isTeamA && match.getResult() == Match.MatchResult.TEAM_A_WIN) ||
                   (!isTeamA && match.getResult() == Match.MatchResult.TEAM_B_WIN)) {
            myResult = "WIN";
        } else {
            myResult = "LOSE";
        }

        return MyRecentMatchResponse.builder()
                .matchId(match.getId())
                .scheduleId(match.getScheduleId())
                .playedAt(match.getPlayedAt())
                .myPartnerName(myPartnerName)
                .opponent1Name(opponent1Name)
                .opponent2Name(opponent2Name)
                .myTeamScore(myTeamScore)
                .opponentTeamScore(opponentTeamScore)
                .result(myResult)
                .build();
    }

    /**
     * 사용자의 전체 클럽 통계 합산 조회
     */
    public UserTotalStatsResponse getMyTotalStats(Long userId) {
        UserTotalStatsResponse stats = userStatisticsRepository.findTotalStatsByUserId(userId);
        return stats != null ? stats : UserTotalStatsResponse.empty();
    }

    /**
     * 사용자의 모든 경기 기록 조회 (클럽 무관, 페이징)
     */
    public MyAllMatchPageResponse getMyAllMatches(Long userId, int page, int size) {
        Page<Match> matchPage = matchRepository.findAllByPlayerIdWithResult(
                userId,
                PageRequest.of(page, size)
        );

        java.util.List<MyAllMatchResponse> content = matchPage.getContent().stream()
                .map(this::toMyAllMatchResponse)
                .collect(java.util.stream.Collectors.toList());

        return MyAllMatchPageResponse.builder()
                .content(content)
                .page(matchPage.getNumber())
                .size(matchPage.getSize())
                .totalElements(matchPage.getTotalElements())
                .totalPages(matchPage.getTotalPages())
                .hasMore(matchPage.hasNext())
                .build();
    }

    /**
     * Match -> MyAllMatchResponse 변환 (클럽명 포함)
     */
    private MyAllMatchResponse toMyAllMatchResponse(Match match) {
        String clubName = clubRepository.findById(match.getClubId())
                .map(Club::getName)
                .orElse("알 수 없음");

        return MyAllMatchResponse.builder()
                .matchId(match.getId())
                .clubId(match.getClubId())
                .clubName(clubName)
                .playedAt(match.getPlayedAt())
                .teamAPlayer1Name(getUserName(match.getTeamAPlayer1Id()))
                .teamAPlayer2Name(match.getTeamAPlayer2Id() != null ? getUserName(match.getTeamAPlayer2Id()) : null)
                .teamAScore(match.getTeamAScore())
                .teamBPlayer1Name(getUserName(match.getTeamBPlayer1Id()))
                .teamBPlayer2Name(match.getTeamBPlayer2Id() != null ? getUserName(match.getTeamBPlayer2Id()) : null)
                .teamBScore(match.getTeamBScore())
                .result(match.getResult() != null ? match.getResult().name() : null)
                .build();
    }

    /**
     * 사용자 ID로 이름 조회
     */
    private String getUserName(Long userId) {
        if (userId == null) {
            return "탈퇴한 사용자";
        }
        return userRepository.findById(userId)
                .map(User::getName)
                .orElse("알 수 없음");
    }

    // ==================== 회원 탈퇴 관련 메서드 ====================

    /**
     * 회원 탈퇴 가능 여부 체크
     * - 클럽 소유자인 경우: 다른 멤버가 있으면 탈퇴 불가 (양도 필요)
     * - 클럽 소유자이면서 본인만 있는 경우: 탈퇴 가능 (클럽 삭제됨)
     */
    public WithdrawalCheckResponse checkWithdrawal(Long userId) {
        // 소유한 클럽 목록 조회
        java.util.List<Club> ownedClubs = clubRepository.findByOwnerUserId(userId);

        java.util.List<WithdrawalCheckResponse.OwnedClubInfo> clubsWithMembers = new java.util.ArrayList<>();
        java.util.List<WithdrawalCheckResponse.OwnedClubInfo> clubsToDelete = new java.util.ArrayList<>();

        for (Club club : ownedClubs) {
            int memberCount = clubMemberRepository.countActiveByClubId(club.getId());

            WithdrawalCheckResponse.OwnedClubInfo clubInfo = WithdrawalCheckResponse.OwnedClubInfo.builder()
                    .clubId(club.getId())
                    .clubName(club.getName())
                    .memberCount(memberCount)
                    .build();

            if (memberCount > 1) {
                // 다른 멤버가 있는 클럽 → 양도 필요
                clubsWithMembers.add(clubInfo);
            } else {
                // 본인만 있는 클럽 → 삭제 예정
                clubsToDelete.add(clubInfo);
            }
        }

        if (!clubsWithMembers.isEmpty()) {
            return WithdrawalCheckResponse.cannotWithdraw(
                    "클럽 소유권을 다른 멤버에게 양도한 후 탈퇴할 수 있습니다.",
                    clubsWithMembers
            );
        }

        return WithdrawalCheckResponse.canWithdraw(clubsToDelete);
    }

    /**
     * 회원 탈퇴 실행
     * - 소유한 클럽 중 본인만 있는 클럽 삭제
     * - 모든 클럽 멤버십 삭제
     * - 관련 데이터 익명화 (경기 기록, 일정 참가, 게시글/댓글, 수상 기록, 외부 요청)
     * - 알림 삭제
     * - 사용자 삭제
     */
    @Transactional
    public void withdrawUser(String uid) {
        User user = oauthService.findUserByProviderUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + uid));

        Long userId = user.getId();

        // 1. 탈퇴 가능 여부 재확인
        WithdrawalCheckResponse checkResult = checkWithdrawal(userId);
        if (!checkResult.isCanWithdraw()) {
            throw new IllegalStateException(checkResult.getReason());
        }

        // 2. 본인만 있는 클럽 삭제 (soft delete)
        if (checkResult.getOwnedClubsToDelete() != null) {
            for (WithdrawalCheckResponse.OwnedClubInfo clubInfo : checkResult.getOwnedClubsToDelete()) {
                clubService.deleteClub(clubInfo.getClubId(), userId);
            }
        }

        // 3. 모든 클럽 멤버십 삭제
        clubMemberRepository.deleteAllByUserId(userId);

        // 4. 경기 기록 익명화 (4개 포지션 모두)
        matchRepository.anonymizeTeamAPlayer1(userId);
        matchRepository.anonymizeTeamAPlayer2(userId);
        matchRepository.anonymizeTeamBPlayer1(userId);
        matchRepository.anonymizeTeamBPlayer2(userId);

        // 5. 일정 참가 기록 익명화
        participantRepository.anonymizeByUserId(userId);

        // 6. 외부 요청 익명화
        externalRequestRepository.anonymizeByRequesterId(userId);

        // 7. 수상 기록 익명화
        awardWinnerRepository.anonymizeByUserId(userId);

        // 8. 게시글/댓글 익명화
        postRepository.anonymizeByAuthorId(userId);
        commentRepository.anonymizeByAuthorId(userId);

        // 9. 알림 삭제 (개인정보)
        notificationRepository.deleteAllByUserId(userId);

        // 10. OAuth 제공자 정보 삭제
        userOAuthProviderRepository.deleteByUserId(userId);

        // 11. 사용자 프로필 삭제
        userProfileRepository.deleteById(userId);

        // 12. 사용자 삭제
        userRepository.delete(user);
    }
}
