package com.example.openrunapi.domain.externalrequest.model;

import com.example.openrunapi.common.exception.PermissionDeniedException;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.post.model.Post;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.user.model.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "external_request", indexes = {
        @Index(name = "idx_external_request_club_status", columnList = "club_id,status"),
        @Index(name = "idx_external_request_club_type", columnList = "club_id,type"),
        @Index(name = "idx_external_request_requester", columnList = "requester_user_id"),
        @Index(name = "idx_external_request_post", columnList = "post_id"),
        @Index(name = "idx_external_request_schedule", columnList = "schedule_id")
})
public class ExternalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_user_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ExternalRequestType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ExternalRequestStatus status = ExternalRequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by_user_id")
    private User decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "decision_note", columnDefinition = "TEXT")
    private String decisionNote;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ExternalRequest(Club club, Schedule schedule, User requester, ExternalRequestType type) {
        this.club = club;
        this.schedule = schedule;
        this.requester = requester;
        this.type = type;
        this.status = ExternalRequestStatus.PENDING;
    }

    public void linkPost(Post post) {
        this.post = post;
    }

    public void approve(User decidedBy, String note) {
        this.status = ExternalRequestStatus.APPROVED;
        this.decidedBy = decidedBy;
        this.decidedAt = LocalDateTime.now();
        this.decisionNote = note;
    }

    public void reject(User decidedBy, String note) {
        this.status = ExternalRequestStatus.REJECTED;
        this.decidedBy = decidedBy;
        this.decidedAt = LocalDateTime.now();
        this.decisionNote = note;
    }

    public void cancel(User requester) {
        if (this.requester != null && requester != null && !this.requester.getId().equals(requester.getId())) {
            throw new PermissionDeniedException("요청자만 취소할 수 있습니다.");
        }
        this.status = ExternalRequestStatus.CANCELLED;
    }

    public void reopen() {
        this.status = ExternalRequestStatus.PENDING;
        this.decidedBy = null;
        this.decidedAt = null;
        this.decisionNote = null;
    }
}

