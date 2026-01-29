package com.example.openrunapi.domain.club.model;

import com.example.openrunapi.domain.user.model.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "club_rule_read",
        uniqueConstraints = @UniqueConstraint(columnNames = { "rule_id", "user_id" }))
public class ClubRuleRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private ClubRule rule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreatedDate
    @Column(name = "read_at", updatable = false, nullable = false)
    private LocalDateTime readAt;

    public ClubRuleRead(Club club, ClubRule rule, User user) {
        this.club = club;
        this.rule = rule;
        this.user = user;
    }
}
