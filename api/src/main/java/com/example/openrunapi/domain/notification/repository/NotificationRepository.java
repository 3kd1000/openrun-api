package com.example.openrunapi.domain.notification.repository;

import com.example.openrunapi.domain.notification.model.Notification;
import com.example.openrunapi.domain.notification.model.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
    long countByUserIdAndIsReadFalseAndTypeNot(Long userId, NotificationType type);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);

    // Admin: 전체 이력 조회 (페이징)
    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Notification> findByClubIdOrderByCreatedAtDesc(Long clubId, Pageable pageable);
    Page<Notification> findByTypeOrderByCreatedAtDesc(NotificationType type, Pageable pageable);
    Page<Notification> findByClubIdAndTypeOrderByCreatedAtDesc(Long clubId, NotificationType type, Pageable pageable);

    // 선택 삭제 (ID 목록 + 소유권 검증)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId AND n.id IN :ids")
    int deleteByUserIdAndIdIn(@Param("userId") Long userId, @Param("ids") List<Long> ids);

    // 읽은 알림 전체 삭제
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId AND n.isRead = true")
    int deleteReadByUserId(@Param("userId") Long userId);

    /**
     * 탈퇴한 사용자의 알림 삭제 (개인정보 삭제) / 전체 삭제
     */
    void deleteAllByUserId(Long userId);
}
