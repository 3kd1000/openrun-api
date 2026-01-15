package com.example.openrunapi.domain.externalrequest.service;

import com.example.openrunapi.common.service.PermissionService;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequest;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequestStatus;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequestType;
import com.example.openrunapi.domain.externalrequest.model.dto.CreateInquiryForExternalRequestRequest;
import com.example.openrunapi.domain.externalrequest.model.dto.ExternalRequestResponse;
import com.example.openrunapi.domain.externalrequest.repository.ExternalRequestRepository;
import com.example.openrunapi.domain.post.model.Post;
import com.example.openrunapi.domain.post.model.PostType;
import com.example.openrunapi.domain.post.model.dto.PostResponse;
import com.example.openrunapi.domain.post.repository.PostRepository;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.schedule.service.ScheduleParticipantService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserProfile;
import com.example.openrunapi.domain.user.repository.UserProfileRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExternalRequestService {

    private final ExternalRequestRepository externalRequestRepository;
    private final ClubRepository clubRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PostRepository postRepository;
    private final PermissionService permissionService;
    private final ScheduleParticipantService scheduleParticipantService;

    public List<ExternalRequestResponse> listForClub(Long clubId, ExternalRequestType type, ExternalRequestStatus status, Long postId, Long adminUserId) {
        permissionService.requireScheduleManagePermission(adminUserId, clubId);

        List<ExternalRequest> list;
        if (postId != null) {
            list = externalRequestRepository.findByClubIdAndPostIdOrderByCreatedAtDesc(clubId, postId);
            return toResponsesWithProfiles(list);
        }
        if (type != null && status != null) {
            list = externalRequestRepository.findByClubIdAndTypeAndStatusOrderByCreatedAtDesc(clubId, type, status);
        } else if (type != null) {
            list = externalRequestRepository.findByClubIdAndTypeOrderByCreatedAtDesc(clubId, type);
        } else if (status != null) {
            list = externalRequestRepository.findByClubIdAndStatusOrderByCreatedAtDesc(clubId, status);
        } else {
            list = externalRequestRepository.findByClubIdOrderByCreatedAtDesc(clubId);
        }
        return toResponsesWithProfiles(list);
    }

    private List<ExternalRequestResponse> toResponsesWithProfiles(List<ExternalRequest> list) {
        if (list == null || list.isEmpty()) return List.of();
        List<Long> requesterIds = list.stream()
                .map(r -> r.getRequester() != null ? r.getRequester().getId() : null)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, UserProfile> profileMap = userProfileRepository.findByUserIdIn(requesterIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));
        return list.stream()
                .map(r -> new ExternalRequestResponse(r, profileMap.get(r.getRequester().getId())))
                .collect(Collectors.toList());
    }

    private ExternalRequestResponse toResponseWithProfile(ExternalRequest r) {
        if (r == null) return null;
        Long requesterId = r.getRequester() != null ? r.getRequester().getId() : null;
        UserProfile profile = (requesterId != null) ? userProfileRepository.findById(requesterId).orElse(null) : null;
        return new ExternalRequestResponse(r, profile);
    }

    /**
     * 게스트 모집 참가 신청 (일정 기반)
     */
    @Transactional
    public ExternalRequestResponse applyGuestRecruit(Long clubId, Long scheduleId, Long requesterUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        if (!schedule.getClubId().equals(clubId)) {
            throw new IllegalArgumentException("클럽/일정 정보가 일치하지 않습니다.");
        }
        if (!Boolean.TRUE.equals(schedule.getGuestRecruitOpen())) {
            throw new IllegalStateException("현재 이 일정은 게스트 모집이 열려있지 않습니다.");
        }

        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + requesterUserId));

        Optional<ExternalRequest> existing = externalRequestRepository
                .findByClubIdAndScheduleIdAndTypeAndRequesterId(clubId, scheduleId, ExternalRequestType.GUEST, requesterUserId);

        if (existing.isPresent()) {
            ExternalRequest req = existing.get();
            // 취소/반려 후 재신청 허용 (유니크 제약 때문에 같은 row를 재사용)
            if (req.getStatus() == ExternalRequestStatus.CANCELLED || req.getStatus() == ExternalRequestStatus.REJECTED) {
                req.reopen();
            }
            return toResponseWithProfile(req);
        }

        ExternalRequest req = new ExternalRequest(club, schedule, requester, ExternalRequestType.GUEST);
        ExternalRequest saved = externalRequestRepository.save(req);
        return toResponseWithProfile(saved);
    }

    @Transactional
    public ExternalRequestResponse cancelGuestRecruit(Long clubId, Long scheduleId, Long requesterUserId) {
        ExternalRequest req = externalRequestRepository
                .findByClubIdAndScheduleIdAndTypeAndRequesterId(clubId, scheduleId, ExternalRequestType.GUEST, requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("신청 내역을 찾을 수 없습니다."));

        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + requesterUserId));

        req.cancel(requester);
        // 승인된 외부 게스트가 취소하면 참가자에서도 제거되어야 함
        scheduleParticipantService.removeApprovedExternalGuest(scheduleId, requesterUserId);
        return toResponseWithProfile(req);
    }

    public ExternalRequestResponse getMyGuestRecruit(Long clubId, Long scheduleId, Long requesterUserId) {
        ExternalRequest req = externalRequestRepository
                .findByClubIdAndScheduleIdAndTypeAndRequesterId(clubId, scheduleId, ExternalRequestType.GUEST, requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("신청 내역을 찾을 수 없습니다."));
        return toResponseWithProfile(req);
    }

    /**
     * 교류전 모집 참가 신청 (일정 기반)
     */
    @Transactional
    public ExternalRequestResponse applyInterclubRecruit(Long clubId, Long scheduleId, Long requesterUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        if (!schedule.getClubId().equals(clubId)) {
            throw new IllegalArgumentException("클럽/일정 정보가 일치하지 않습니다.");
        }
        if (!Boolean.TRUE.equals(schedule.getInterclubRecruitOpen())) {
            throw new IllegalStateException("현재 이 일정은 교류전 모집이 열려있지 않습니다.");
        }

        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + requesterUserId));

        Optional<ExternalRequest> existing = externalRequestRepository
                .findByClubIdAndScheduleIdAndTypeAndRequesterId(clubId, scheduleId, ExternalRequestType.INTERCLUB, requesterUserId);

        if (existing.isPresent()) {
            ExternalRequest req = existing.get();
            if (req.getStatus() == ExternalRequestStatus.CANCELLED || req.getStatus() == ExternalRequestStatus.REJECTED) {
                req.reopen();
            }
            return toResponseWithProfile(req);
        }

        ExternalRequest req = new ExternalRequest(club, schedule, requester, ExternalRequestType.INTERCLUB);
        ExternalRequest saved = externalRequestRepository.save(req);
        return toResponseWithProfile(saved);
    }

    @Transactional
    public ExternalRequestResponse cancelInterclubRecruit(Long clubId, Long scheduleId, Long requesterUserId) {
        ExternalRequest req = externalRequestRepository
                .findByClubIdAndScheduleIdAndTypeAndRequesterId(clubId, scheduleId, ExternalRequestType.INTERCLUB, requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("신청 내역을 찾을 수 없습니다."));

        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + requesterUserId));

        req.cancel(requester);
        return toResponseWithProfile(req);
    }

    public ExternalRequestResponse getMyInterclubRecruit(Long clubId, Long scheduleId, Long requesterUserId) {
        ExternalRequest req = externalRequestRepository
                .findByClubIdAndScheduleIdAndTypeAndRequesterId(clubId, scheduleId, ExternalRequestType.INTERCLUB, requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("신청 내역을 찾을 수 없습니다."));
        return toResponseWithProfile(req);
    }

    /**
     * 게스트 모집 문의글 생성 (게시판 INQUIRY) + external_request에 post 연결
     */
    @Transactional
    public PostResponse createGuestRecruitInquiry(Long clubId, Long scheduleId, CreateInquiryForExternalRequestRequest request, Long requesterUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));
        if (!schedule.getClubId().equals(clubId)) {
            throw new IllegalArgumentException("클럽/일정 정보가 일치하지 않습니다.");
        }

        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + requesterUserId));

        // 문의글은 신청과 독립적인 이벤트: 없으면 external_request를 생성해 인박스에 남긴다.
        ExternalRequest ext = externalRequestRepository
                .findByClubIdAndScheduleIdAndTypeAndRequesterId(clubId, scheduleId, ExternalRequestType.GUEST, requesterUserId)
                .orElseGet(() -> externalRequestRepository.save(new ExternalRequest(club, schedule, requester, ExternalRequestType.GUEST)));

        // 취소/반려 상태에서 문의를 남길 경우, 다시 대기중으로 열어준다.
        if (ext.getStatus() == ExternalRequestStatus.CANCELLED || ext.getStatus() == ExternalRequestStatus.REJECTED) {
            ext.reopen();
        }

        // 이미 문의글이 연결되어 있다면 같은 스레드를 재사용 (중복 post 생성 방지)
        if (ext.getPost() != null) {
            Post existingPost = postRepository.findById(ext.getPost().getId())
                    .orElse(ext.getPost());
            return PostResponse.from(existingPost, false, true, true);
        }

        // 공유 링크는 UI(링크복사 버튼)에서 제공: 본문에 URL을 노출하지 않음
        String prefix = "[게스트 모집]\n";
        String content = (prefix + request.getContent()).trim();
        if (content.length() > 500) {
            // prefix가 필수라 뒤에서 자르기
            content = content.substring(0, 500);
        }

        Post post = new Post(club, requester, PostType.INQUIRY, content);
        Post savedPost = postRepository.save(post);

        ext.linkPost(savedPost);
        // ext는 transactional dirty checking으로 update

        return PostResponse.from(savedPost, false, true, true);
    }

    /**
     * 교류전 모집 문의글 생성 (게시판 INQUIRY) + external_request에 post 연결
     */
    @Transactional
    public PostResponse createInterclubRecruitInquiry(Long clubId, Long scheduleId, CreateInquiryForExternalRequestRequest request, Long requesterUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));
        if (!schedule.getClubId().equals(clubId)) {
            throw new IllegalArgumentException("클럽/일정 정보가 일치하지 않습니다.");
        }

        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + requesterUserId));

        // 문의글은 신청과 독립적인 이벤트: 없으면 external_request를 생성해 인박스에 남긴다.
        ExternalRequest ext = externalRequestRepository
                .findByClubIdAndScheduleIdAndTypeAndRequesterId(clubId, scheduleId, ExternalRequestType.INTERCLUB, requesterUserId)
                .orElseGet(() -> externalRequestRepository.save(new ExternalRequest(club, schedule, requester, ExternalRequestType.INTERCLUB)));

        // 취소/반려 상태에서 문의를 남길 경우, 다시 대기중으로 열어준다.
        if (ext.getStatus() == ExternalRequestStatus.CANCELLED || ext.getStatus() == ExternalRequestStatus.REJECTED) {
            ext.reopen();
        }

        // 이미 문의글이 연결되어 있다면 같은 스레드를 재사용 (중복 post 생성 방지)
        if (ext.getPost() != null) {
            Post existingPost = postRepository.findById(ext.getPost().getId())
                    .orElse(ext.getPost());
            return PostResponse.from(existingPost, false, true, true);
        }

        String prefix = "[교류전 모집]\n";
        String content = (prefix + request.getContent()).trim();
        if (content.length() > 500) {
            content = content.substring(0, 500);
        }

        Post post = new Post(club, requester, PostType.INQUIRY, content);
        Post savedPost = postRepository.save(post);

        ext.linkPost(savedPost);
        return PostResponse.from(savedPost, false, true, true);
    }

    /**
     * 가입 문의글 생성 (클럽 단위, 1 사용자 1 스레드)
     * - external_request(type=JOIN, schedule=NULL)에 post를 연결해 운영진 인박스에서 처리 가능
     */
    @Transactional
    public PostResponse createJoinInquiry(Long clubId, CreateInquiryForExternalRequestRequest request, Long requesterUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + requesterUserId));

        ExternalRequest ext = externalRequestRepository
                .findByClubIdAndScheduleIsNullAndTypeAndRequesterId(clubId, ExternalRequestType.JOIN, requesterUserId)
                .orElseGet(() -> externalRequestRepository.save(new ExternalRequest(club, null, requester, ExternalRequestType.JOIN)));

        if (ext.getStatus() == ExternalRequestStatus.CANCELLED || ext.getStatus() == ExternalRequestStatus.REJECTED) {
            ext.reopen();
        }

        // 이미 스레드가 있다면 재사용
        if (ext.getPost() != null) {
            Post existingPost = postRepository.findById(ext.getPost().getId())
                    .orElse(ext.getPost());
            return PostResponse.from(existingPost, false, true, true);
        }

        String prefix = "[가입 문의]\n";
        String content = (prefix + request.getContent()).trim();
        if (content.length() > 500) {
            content = content.substring(0, 500);
        }

        Post post = new Post(club, requester, PostType.INQUIRY, content);
        Post savedPost = postRepository.save(post);
        ext.linkPost(savedPost);

        return PostResponse.from(savedPost, false, true, true);
    }

    public ExternalRequestResponse getMyJoinRequest(Long clubId, Long requesterUserId) {
        ExternalRequest req = externalRequestRepository
                .findByClubIdAndScheduleIsNullAndTypeAndRequesterId(clubId, ExternalRequestType.JOIN, requesterUserId)
                .orElse(null);
        return req != null ? new ExternalRequestResponse(req) : null;
    }

    @Transactional
    public ExternalRequestResponse approve(Long clubId, Long requestId, Long adminUserId, String note) {
        permissionService.requireScheduleManagePermission(adminUserId, clubId);
        ExternalRequest req = externalRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("요청을 찾을 수 없습니다."));
        if (!req.getClub().getId().equals(clubId)) {
            throw new IllegalArgumentException("클럽 정보가 일치하지 않습니다.");
        }
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + adminUserId));
        req.approve(admin, note);
        if (req.getType() == ExternalRequestType.GUEST && req.getSchedule() != null) {
            scheduleParticipantService.addApprovedExternalGuest(req.getSchedule().getId(), req.getRequester().getId());
        }
        return toResponseWithProfile(req);
    }

    @Transactional
    public ExternalRequestResponse reject(Long clubId, Long requestId, Long adminUserId, String note) {
        permissionService.requireScheduleManagePermission(adminUserId, clubId);
        ExternalRequest req = externalRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("요청을 찾을 수 없습니다."));
        if (!req.getClub().getId().equals(clubId)) {
            throw new IllegalArgumentException("클럽 정보가 일치하지 않습니다.");
        }
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + adminUserId));
        req.reject(admin, note);
        if (req.getType() == ExternalRequestType.GUEST && req.getSchedule() != null) {
            scheduleParticipantService.removeApprovedExternalGuest(req.getSchedule().getId(), req.getRequester().getId());
        }
        return toResponseWithProfile(req);
    }
}

