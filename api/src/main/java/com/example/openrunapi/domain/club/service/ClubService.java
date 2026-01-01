package com.example.openrunapi.domain.club.service;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.model.dto.ClubResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubRequest;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
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
    private final ClubMemberRepository clubMemberRepository;

    @Transactional
    public ClubResponse createClub(CreateClubRequest request, Long ownerUserId) {
        // ownerUserId가 실제 존재하는 사용자인지 확인
        User owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + ownerUserId));

        Club newClub = request.toEntity(ownerUserId);
        Club savedClub = clubRepository.save(newClub);

        // 클럽 생성자를 자동으로 멤버로 추가 (ACTIVE 상태)
        ClubMember clubMember = ClubMember.builder()
                .club(savedClub)
                .user(owner)
                .status(ClubMemberStatus.ACTIVE)
                .build();
        clubMemberRepository.save(clubMember);

        return new ClubResponse(savedClub);
    }

    public ClubResponse findClub(Long clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));
        return new ClubResponse(club);
    }

    public Page<ClubResponse> findClubs(String keyword, Pageable pageable) {
        Specification<Club> spec = search(keyword);
        Page<Club> clubs = clubRepository.findAll(spec, pageable);
        return clubs.map(ClubResponse::new);
    }

    @Transactional
    public ClubResponse updateClub(Long clubId, UpdateClubRequest request, Long currentUserId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        // TODO: 추후 인증 기능 구현 시, currentUserId가 클럽의 소유자(또는 관리자)인지 확인하는 권한 검증 로직 필요
        if (!club.getOwnerUserId().equals(currentUserId)) {
            throw new SecurityException("클럽 정보를 수정할 권한이 없습니다.");
        }

        club.update(request.getName(), request.getDescription(), request.getRegion());

        // 소유자 변경은 별도의 권한 체크가 필요할 수 있으므로 분리
        if (request.getOwnerUserId() != null) {
            // TODO: 소유자 변경 권한이 있는지 추가 확인 필요
            // TODO: 새로운 ownerUserId가 실제 존재하는 사용자인지 확인 필요
            club.changeOwner(request.getOwnerUserId());
        }

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

        ClubMember clubMember = ClubMember.builder()
                .club(club)
                .user(user)
                .status(ClubMemberStatus.PENDING)
                .build();
        clubMemberRepository.save(clubMember);
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

        // 클럽 소유자는 탈퇴 불가
        if (club.getOwnerUserId().equals(userId)) {
            throw new IllegalStateException("클럽 소유자는 탈퇴할 수 없습니다. 클럽을 삭제하거나 소유권을 이전하세요.");
        }

        ClubMember member = clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 클럽의 멤버가 아닙니다."));

        clubMemberRepository.delete(member);
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
}
