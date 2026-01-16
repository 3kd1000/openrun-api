package com.example.openrunapi.domain.externalrequest.repository;

import com.example.openrunapi.domain.externalrequest.model.ExternalRequest;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequestStatus;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequestType;
import org.springframework.data.jpa.repository.JpaRepository;

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
}

