package com.example.openrunapi.domain.club.service;

import com.example.openrunapi.common.service.PermissionService;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.model.ClubRole;
import com.example.openrunapi.domain.club.model.ClubJoinPolicy;
import com.example.openrunapi.domain.club.model.MemberRecruitmentStatus;
import com.example.openrunapi.domain.club.model.dto.ClubMembershipResponse;
import com.example.openrunapi.domain.club.model.dto.ClubResponse;
import com.example.openrunapi.domain.club.model.dto.MemberProfileResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubMemberRolesRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubPolicyRequest;
import com.example.openrunapi.domain.club.model.dto.TransferOwnershipRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubRequest;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequest;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequestType;
import com.example.openrunapi.domain.externalrequest.repository.ExternalRequestRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserProfile;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.repository.UserProfileRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ExternalRequestRepository externalRequestRepository;
    private final PermissionService permissionService;

    @Transactional
    public ClubResponse createClub(CreateClubRequest request, Long ownerUserId) {
        // ownerUserId가 실제 존재하는 사용자인지 확인
        User owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + ownerUserId));

        Club newClub = request.toEntity(ownerUserId);
        Club savedClub = clubRepository.save(newClub);

        // 클럽 생성자를 자동으로 멤버로 추가 (OWNER 역할, ACTIVE 상태)
        ClubMember clubMember = ClubMember.builder()
                .club(savedClub)
                .user(owner)
                .role(ClubRole.OWNER)
                .status(ClubMemberStatus.ACTIVE)
                .build();
        clubMemberRepository.save(clubMember);

        // 멤버 수 초기화 (OWNER 1명)
        savedClub.updateMemberCount(1);

        return new ClubResponse(savedClub);
    }

    public ClubResponse findClub(Long clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));
        return new ClubResponse(club);
    }

    public Page<ClubResponse> findClubs(String keyword, String region, MemberRecruitmentStatus memberRecruitmentStatus, Pageable pageable) {
        Specification<Club> spec = Specification.where(search(keyword))
                .and(filterRegion(region))
                .and(filterMemberRecruitmentStatus(memberRecruitmentStatus));
        Page<Club> clubs = clubRepository.findAll(spec, pageable);
        return clubs.map(ClubResponse::new);
    }

    @Transactional
    public ClubResponse updateClub(Long clubId, UpdateClubRequest request, Long currentUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        // 운영진 이상만 수정 가능
        permissionService.requireScheduleManagePermission(currentUserId, clubId);

        club.update(request.getName(), request.getDescription(), request.getRegion());

        // 소유자 변경은 별도의 권한 체크가 필요할 수 있으므로 분리
        if (request.getOwnerUserId() != null) {
            // TODO: 소유자 변경 권한이 있는지 추가 확인 필요
            // TODO: 새로운 ownerUserId가 실제 존재하는 사용자인지 확인 필요
            club.changeOwner(request.getOwnerUserId());
        }

        return new ClubResponse(club);
    }

    /**
     * 클럽 운영 정책 수정 - 운영진 이상
     */
    @Transactional
    public ClubResponse updateClubPolicy(Long clubId, UpdateClubPolicyRequest request, Long currentUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        permissionService.requireScheduleManagePermission(currentUserId, clubId);
        club.updatePolicies(request.getJoinPolicy(), request.getInterclubRecruitmentStatus(), request.getMemberRecruitmentStatus(), request.getMemberRecruitmentNote());
        return new ClubResponse(club);
    }

    @Transactional
    public void deleteClub(Long clubId, Long currentUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        // TODO: 추후 인증 기능 구현 시, currentUserId가 클럽의 소유자(또는 관리자)인지 확인하는 권한 검증 로직 필요
        if (!club.getOwnerUserId().equals(currentUserId)) {
            throw new SecurityException("클럽을 삭제할 권한이 없습니다.");
        }

        clubRepository.deleteById(clubId);
    }

    @Transactional
    public void joinRequest(Long clubId, Long userId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));

        if (clubMemberRepository.existsByClubIdAndUserId(clubId, userId)) {
            throw new IllegalStateException("이미 가입 신청했거나 가입된 클럽입니다.");
        }

        // 이미 가입신청(external_request)이 존재하는지 확인
        boolean alreadyRequested = externalRequestRepository
                .existsByClubIdAndRequesterIdAndType(clubId, userId, ExternalRequestType.JOIN);
        if (alreadyRequested) {
            throw new IllegalStateException("이미 가입 신청이 존재합니다.");
        }

        ClubMemberStatus status =
                club.getJoinPolicy() == ClubJoinPolicy.AUTO ? ClubMemberStatus.ACTIVE : ClubMemberStatus.PENDING;

        ClubMember clubMember = ClubMember.builder()
                .club(club)
                .user(user)
                .role(ClubRole.REGULAR)
                .status(status)
                .build();
        clubMemberRepository.save(clubMember);

        // AUTO 정책으로 바로 ACTIVE가 된 경우 멤버 수 증가
        if (status == ClubMemberStatus.ACTIVE) {
            club.updateMemberCount((club.getMemberCount() != null ? club.getMemberCount() : 0) + 1);
        }

        // external_request에 JOIN 타입으로 INSERT (운영진 인박스에서 조회 가능)
        ExternalRequest externalRequest = new ExternalRequest(club, null, user, ExternalRequestType.JOIN);
        externalRequestRepository.save(externalRequest);
    }

    @Transactional
    public void approveMember(Long clubId, Long adminId, Long targetUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        // 권한 체크: 요청자가 클럽 소유자인지 확인
        if (!club.getOwnerUserId().equals(adminId)) {
            throw new SecurityException("승인 권한이 없습니다.");
        }

        ClubMember member = clubMemberRepository.findByClubIdAndUserId(clubId, targetUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 멤버를 찾을 수 없습니다."));

        // PENDING → ACTIVE 변경 시 멤버 수 증가
        if (member.getStatus() == ClubMemberStatus.PENDING) {
            club.updateMemberCount((club.getMemberCount() != null ? club.getMemberCount() : 0) + 1);
        }

        member.updateStatus(ClubMemberStatus.ACTIVE);
    }

    @Transactional
    public void rejectMember(Long clubId, Long adminId, Long targetUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        // 권한 체크: 요청자가 클럽 소유자인지 확인
        if (!club.getOwnerUserId().equals(adminId)) {
            throw new SecurityException("거절 권한이 없습니다.");
        }

        ClubMember member = clubMemberRepository.findByClubIdAndUserId(clubId, targetUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 멤버를 찾을 수 없습니다."));

        // 거절 시 삭제 또는 REJECTED 상태로 변경. 여기서는 삭제로 처리.
        clubMemberRepository.delete(member);
    }

    public List<UserResponse> getClubMembers(Long clubId, ClubMemberStatus status) {
        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }

        List<ClubMember> members;
        if (status != null) {
            members = clubMemberRepository.findAllByClubIdAndStatus(clubId, status);
        } else {
            members = clubMemberRepository.findAllByClubId(clubId);
        }

        return members.stream()
                .map(clubMember -> new UserResponse(clubMember.getUser()))
                .collect(Collectors.toList());
    }

    /**
     * 사용자가 가입한 클럽 목록 조회
     */
    public List<ClubResponse> getMyClubs(Long userId) {
        List<ClubMember> clubMembers = clubMemberRepository.findAllByUserIdAndStatus(userId, ClubMemberStatus.ACTIVE);

        return clubMembers.stream()
                .map(clubMember -> new ClubResponse(clubMember.getClub()))
                .collect(Collectors.toList());
    }

    /**
     * 클럽 탈퇴 (사용자가 자신이 가입한 클럽에서 탈퇴)
     */
    @Transactional
    public void leaveClub(Long clubId, Long userId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        ClubMember member = clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 클럽의 멤버가 아닙니다."));

        // 클럽 소유자(OWNER 역할)는 탈퇴 불가
        if (member.isOwner()) {
            throw new IllegalStateException("클럽 소유자는 탈퇴할 수 없습니다. 클럽을 삭제하거나 소유권을 이전하세요.");
        }

        // ACTIVE 멤버가 탈퇴하면 멤버 수 감소
        if (member.getStatus() == ClubMemberStatus.ACTIVE) {
            int currentCount = club.getMemberCount() != null ? club.getMemberCount() : 0;
            club.updateMemberCount(Math.max(0, currentCount - 1));
        }

        clubMemberRepository.delete(member);
    }

    /**
     * 클럽원 제명 (OWNER만 가능)
     * - OWNER 권한 필요
     * - OWNER 본인은 제명 불가
     */
    @Transactional
    public void kickMember(Long clubId, Long adminUserId, Long targetMemberId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        // OWNER 권한 확인
        ClubMember adminMember = clubMemberRepository.findByClubIdAndUserId(clubId, adminUserId)
                .orElseThrow(() -> new EntityNotFoundException("클럽 멤버가 아닙니다."));

        if (!adminMember.isOwner()) {
            throw new IllegalStateException("클럽원 제명은 클럽장만 가능합니다.");
        }

        // memberId로 직접 조회
        ClubMember targetMember = clubMemberRepository.findById(targetMemberId)
                .orElseThrow(() -> new EntityNotFoundException("해당 멤버를 찾을 수 없습니다."));

        // 클럽이 일치하는지 확인
        if (!targetMember.getClub().getId().equals(clubId)) {
            throw new IllegalStateException("해당 멤버는 이 클럽에 속하지 않습니다.");
        }

        // 자기 자신은 제명 불가 (탈퇴 사용)
        if (targetMember.getUser().getId().equals(adminUserId)) {
            throw new IllegalStateException("자기 자신을 제명할 수 없습니다. 탈퇴 기능을 사용하세요.");
        }

        // OWNER는 제명 불가
        if (targetMember.isOwner()) {
            throw new IllegalStateException("클럽 소유자는 제명할 수 없습니다. 소유권을 먼저 이전하세요.");
        }

        // ACTIVE 멤버가 제명되면 멤버 수 감소
        if (targetMember.getStatus() == ClubMemberStatus.ACTIVE) {
            int currentCount = club.getMemberCount() != null ? club.getMemberCount() : 0;
            club.updateMemberCount(Math.max(0, currentCount - 1));
        }

        clubMemberRepository.delete(targetMember);
    }

    /**
     * 클럽원 상세 정보 조회 (명단 조회용)
     * - ClubMember 정보 + User 연락처 정보 + UserProfile 테니스 시작시기 포함
     * - status 파라미터로 필터링 가능 (기본: ACTIVE)
     */
    public List<ClubMembershipResponse> getClubMembership(Long clubId, ClubMemberStatus status) {
        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }

        ClubMemberStatus targetStatus = (status != null) ? status : ClubMemberStatus.ACTIVE;
        List<ClubMember> members = clubMemberRepository.findAllByClubIdAndStatus(clubId, targetStatus);

        // UserProfile 정보를 한 번에 조회 (N+1 방지)
        List<Long> userIds = members.stream()
                .map(m -> m.getUser().getId())
                .collect(Collectors.toList());
        java.util.Map<Long, UserProfile> profileMap = userProfileRepository.findByUserIdIn(userIds)
                .stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p));

        return members.stream()
                .map(m -> new ClubMembershipResponse(m, profileMap.get(m.getUser().getId())))
                .collect(Collectors.toList());
    }

    /**
     * 클럽 멤버 프로필 조회 (User + UserProfile + ClubMember 통합)
     * - 연락처 정보는 ContactVisibility에 따라 필터링됨
     * - PUBLIC: 같은 클럽 멤버에게만 공개
     *
     * @param clubId 클럽 ID
     * @param userId 조회할 사용자 ID
     * @param currentUserId 현재 로그인한 사용자 ID
     * @return MemberProfileResponse
     */
    public MemberProfileResponse getMemberProfile(Long clubId, Long userId, Long currentUserId) {
        // 클럽 존재 여부 확인
        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }

        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));

        // 클럽 멤버십 조회
        ClubMember clubMember = clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 사용자는 클럽 멤버가 아닙니다. userId=" + userId + ", clubId=" + clubId));

        // UserProfile 조회 (없을 수도 있음)
        UserProfile userProfile = userProfileRepository.findById(userId).orElse(null);

        // 현재 사용자가 같은 클럽 멤버인지 확인
        boolean isSameClub = clubMemberRepository.findByClubIdAndUserId(clubId, currentUserId).isPresent();

        return new MemberProfileResponse(user, userProfile, clubMember, isSameClub);
    }

    /**
     * 클럽원 역할 배치 변경 - OWNER(또는 System Admin)
     * - OWNER 역할 변경/소유권 이전은 별도 기능으로 분리 (여기서는 금지)
     */
    @Transactional
    public List<ClubMembershipResponse> updateMemberRoles(Long clubId, Long currentUserId, UpdateClubMemberRolesRequest request) {
        permissionService.requireMemberManagePermission(currentUserId, clubId);

        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("변경할 대상이 없습니다.");
        }

        for (UpdateClubMemberRolesRequest.Item item : request.getItems()) {
            if (item == null) continue;
            Long userId = item.getUserId();
            if (userId == null) continue;

            ClubMember member = clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                    .orElseThrow(() -> new EntityNotFoundException("해당 멤버를 찾을 수 없습니다. userId=" + userId));

            // 소유자 역할 변경은 금지 (소유권 이전은 별도 플로우)
            if (member.getRole() != null && member.getRole().isOwner()) {
                throw new IllegalStateException("클럽장의 역할은 변경할 수 없습니다. (소유권 이전 기능으로 처리)");
            }

            if (item.getRole() != null && item.getRole().isOwner()) {
                throw new IllegalArgumentException("OWNER 역할로 변경할 수 없습니다. (소유권 이전 기능으로 처리)");
            }

            if (item.getRole() != null) {
                member.updateRole(item.getRole());
            }
        }

        // 최신 상태 반환
        return getClubMembership(clubId, ClubMemberStatus.ACTIVE);
    }

    /**
     * 클럽장 권한 양도 - OWNER만 가능
     * - 현재 OWNER가 ADMIN에게 클럽장 권한을 양도
     * - 기존 OWNER → ADMIN, 새 OWNER → OWNER로 역할 변경
     * - Club.ownerUserId도 함께 변경
     */
    @Transactional
    public void transferOwnership(Long clubId, Long currentUserId, TransferOwnershipRequest request) {
        // 1. 현재 사용자가 OWNER인지 확인
        ClubMember currentOwner = clubMemberRepository.findByClubIdAndUserId(clubId, currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("클럽 멤버를 찾을 수 없습니다."));

        if (!currentOwner.isOwner()) {
            throw new SecurityException("클럽장만 권한을 양도할 수 있습니다.");
        }

        // 2. 대상자가 ADMIN인지 확인
        ClubMember newOwner = clubMemberRepository.findByClubIdAndUserId(clubId, request.getNewOwnerUserId())
                .orElseThrow(() -> new EntityNotFoundException("대상 멤버를 찾을 수 없습니다."));

        if (newOwner.getRole() != ClubRole.ADMIN) {
            throw new IllegalArgumentException("운영진(ADMIN)에게만 클럽장 권한을 양도할 수 있습니다.");
        }

        // 3. Club.ownerUserId 변경
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("클럽을 찾을 수 없습니다."));
        club.changeOwner(request.getNewOwnerUserId());

        // 4. 역할 변경: 기존 OWNER → ADMIN, 새 OWNER → OWNER
        currentOwner.updateRole(ClubRole.ADMIN);
        newOwner.updateRole(ClubRole.OWNER);
    }

    private Specification<Club> search(String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return criteriaBuilder.conjunction(); // 항상 true를 반환하여 모든 결과를 포함
            }
            // name LIKE '%keyword%' OR region LIKE '%keyword%'
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("region")), "%" + keyword.toLowerCase() + "%"));
        };
    }

    private Specification<Club> filterRegion(String region) {
        return (root, query, cb) -> {
            if (region == null || region.trim().isEmpty()) {
                return cb.conjunction();
            }
            return cb.equal(root.get("region"), region);
        };
    }

    private Specification<Club> filterMemberRecruitmentStatus(MemberRecruitmentStatus status) {
        return (root, query, cb) -> {
            if (status == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("memberRecruitmentStatus"), status);
        };
    }
}
