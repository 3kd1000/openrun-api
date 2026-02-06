package com.example.openrunapi.domain.externalrequest.repository;

import com.example.openrunapi.domain.externalrequest.model.ExternalRequest;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequestStatus;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExternalRequestRepository extends JpaRepository<ExternalRequest, Long> {

    List<ExternalRequest> findByClubIdOrderByCreatedAtDesc(Long clubId);

    List<ExternalRequest> findByClubIdAndStatusOrderByCreatedAtDesc(Long clubId, ExternalRequestStatus status);

    List<ExternalRequest> findByClubIdAndTypeOrderByCreatedAtDesc(Long clubId, ExternalRequestType type);

    List<ExternalRequest> findByClubIdAndTypeAndStatusOrderByCreatedAtDesc(
            Long clubId,
            ExternalRequestType type,
            ExternalRequestStatus status
    );

    Optional<ExternalRequest> findByClubIdAndScheduleIdAndTypeAndRequesterId(
            Long clubId,
            Long scheduleId,
            ExternalRequestType type,
            Long requesterId
    );

    List<ExternalRequest> findByClubIdAndPostIdOrderByCreatedAtDesc(Long clubId, Long postId);

    Optional<ExternalRequest> findByClubIdAndScheduleIsNullAndTypeAndRequesterId(
            Long clubId,
            ExternalRequestType type,
            Long requesterId
    );

    Optional<ExternalRequest> findByPostIdAndRequesterId(Long postId, Long requesterId);

    // 특정 사용자가 신청한 외부 요청 목록 조회 (스케줄이 있는 것만)
    List<ExternalRequest> findByRequesterIdAndScheduleIsNotNullOrderByCreatedAtDesc(Long requesterId);

    // 클럽 가입신청 중복 체크 (JOIN 타입, schedule은 null)
    boolean existsByClubIdAndRequesterIdAndType(Long clubId, Long requesterId, ExternalRequestType type);

    // 클럽 가입신청 중복 체크 - PENDING 상태만 (재가입 허용을 위해)
    boolean existsByClubIdAndRequesterIdAndTypeAndStatus(
            Long clubId,
            Long requesterId,
            ExternalRequestType type,
            ExternalRequestStatus status
    );

    // 재가입 시 기존 요청 삭제를 위한 조회 (schedule이 null인 JOIN 요청)
    Optional<ExternalRequest> findByClubIdAndRequesterIdAndTypeAndScheduleIsNull(
            Long clubId,
            Long requesterId,
            ExternalRequestType type
    );

    /**
     * 탈퇴한 사용자의 외부 요청 익명화 (requester_user_id를 null로 설정)
     */
    @Modifying
    @Query("UPDATE ExternalRequest er SET er.requester = null WHERE er.requester.id = :userId")
    void anonymizeByRequesterId(@Param("userId") Long userId);
}

