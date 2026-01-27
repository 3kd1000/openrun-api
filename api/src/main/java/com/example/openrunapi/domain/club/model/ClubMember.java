package com.example.openrunapi.domain.club.model;

import com.example.openrunapi.domain.user.model.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "club_member", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "club_id", "user_id" })
})
public class ClubMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClubMemberStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClubRole role = ClubRole.REGULAR;

    @Column(nullable = false)
    private Boolean isBallKeeper = false;

    @Column(nullable = false)
    private Integer ballQuantity = 0;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime joinedAt;

    @Builder
    public ClubMember(Club club, User user, ClubMemberStatus status, ClubRole role) {
        this.club = club;
        this.user = user;
        this.status = status;
        this.role = role; // 기본값
    }

    public void updateStatus(ClubMemberStatus status) {
        this.status = status;
    }

    public void updateRole(ClubRole role) {
        this.role = role;
    }

    /**
     * 일정 관리 권한 확인 (ADMIN 이상)
     */
    public boolean canManageSchedule() {
        return this.role.canManageSchedule();
    }

    /**
     * 클럽 소유자 여부 확인
     */
    public boolean isOwner() {
        return this.role.isOwner();
    }

    /**
     * 회원 관리 권한 확인 (OWNER만 가능)
     */
    public boolean canManageMembers() {
        return this.role.canManageMembers();
    }

    /**
     * 공용구 보유자 지정
     */
    public void updateBallKeeper(boolean isBallKeeper) {
        this.isBallKeeper = isBallKeeper;
        if (!isBallKeeper) {
            this.ballQuantity = 0;
        }
    }

    /**
     * 공용구 수량 증가
     */
    public void addBalls(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("수량은 0보다 커야 합니다");
        }
        this.ballQuantity += quantity;
    }

    /**
     * 공용구 수량 감소
     */
    public void useBalls(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("수량은 0보다 커야 합니다");
        }
        if (this.ballQuantity < quantity) {
            throw new IllegalStateException("보유 수량이 부족합니다");
        }
        this.ballQuantity -= quantity;
    }

    /**
     * 공용구 수량 직접 설정 (조정용)
     */
    public void setBallQuantity(int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException("수량은 0 이상이어야 합니다");
        }
        this.ballQuantity = quantity;
    }
}
