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

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime joinedAt;

    @Builder
    public ClubMember(Club club, User user, ClubMemberStatus status) {
        this.club = club;
        this.user = user;
        this.status = status;
    }

    public void updateStatus(ClubMemberStatus status) {
        this.status = status;
    }
}
