package com.example.openrunapi.domain.user.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * System Admin (Super User) 엔티티
 * 모든 클럽에 대한 관리 권한을 가진 사용자
 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "system_admins")
public class SystemAdmin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt;

    @Column(name = "granted_by_user_id")
    private Long grantedByUserId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public SystemAdmin(Long userId, LocalDateTime grantedAt, Long grantedByUserId, String notes) {
        this.userId = userId;
        this.grantedAt = grantedAt != null ? grantedAt : LocalDateTime.now();
        this.grantedByUserId = grantedByUserId;
        this.notes = notes;
    }

    public void updateNotes(String notes) {
        this.notes = notes;
    }
}
