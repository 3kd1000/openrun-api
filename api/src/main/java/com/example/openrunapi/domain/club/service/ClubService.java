package com.example.openrunapi.domain.club.service;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.dto.ClubResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubRequest;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;

    @Transactional
    public ClubResponse createClub(CreateClubRequest request, Long ownerUserId) {
        // TODO: 추후 User 기능 구현 시, ownerUserId가 실제 존재하는 사용자인지 확인하는 로직 필요
        Club newClub = request.toEntity(ownerUserId);
        Club savedClub = clubRepository.save(newClub);
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

    private Specification<Club> search(String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return criteriaBuilder.conjunction(); // 항상 true를 반환하여 모든 결과를 포함
            }
            // name LIKE '%keyword%' OR region LIKE '%keyword%'
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("region")), "%" + keyword.toLowerCase() + "%")
            );
        };
    }
}
