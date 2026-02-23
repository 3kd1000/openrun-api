package com.example.openrunapi.domain.schedule.model;

import com.example.openrunapi.domain.draw.model.DrawType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "schedule", indexes = {
    @Index(name = "idx_schedule_club_id", columnList = "club_id"),
    @Index(name = "idx_schedule_scheduled_at", columnList = "scheduled_at"),
    @Index(name = "idx_schedule_club_id_scheduled_at", columnList = "club_id, scheduled_at")
})
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "club_id")
    private Long clubId;

    @Column(name = "court_name", length = 100, nullable = false)
    private String courtName;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "max_capacity", nullable = false)
    private Integer maxCapacity;

    @Column(name = "current_participants", nullable = false)
    private Integer currentParticipants = 0;

    @Column(name = "cost", precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "reserved_by_user_id")
    private Long reservedByUserId;

    @Column(name = "participation_start_at")
    private LocalDateTime participationStartAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "draw_type", length = 10)
    private DrawType drawType;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", length = 20)
    private MatchType matchType;

    @Column(name = "is_draw_valid")
    private Boolean isDrawValid = false;

    @Column(name = "draw_created_at")
    private LocalDateTime drawCreatedAt;

    @Column(name = "pinned", nullable = false)
    private Boolean pinned = false;

    @Column(name = "guest_recruit_open", nullable = false)
    private Boolean guestRecruitOpen = false;

    @Column(name = "guest_recruit_note", columnDefinition = "TEXT")
    private String guestRecruitNote;

    @Column(name = "interclub_recruit_open", nullable = false)
    private Boolean interclubRecruitOpen = false;

    @Column(name = "interclub_recruit_note", columnDefinition = "TEXT")
    private String interclubRecruitNote;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 120;

    @Column(name = "number_of_courts")
    private Integer numberOfCourts;

    @Column(name = "court_address", length = 200)
    private String courtAddress;

    @Column(name = "region", length = 50)
    private String region;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Schedule(Long clubId, String courtName, LocalDateTime scheduledAt,
                    Integer maxCapacity, BigDecimal cost, String description, Long reservedByUserId,
                    LocalDateTime participationStartAt, MatchType matchType, Integer durationMinutes,
                    Integer numberOfCourts, String courtAddress, String region, Long createdByUserId) {
        this.clubId = clubId;
        this.courtName = courtName;
        this.scheduledAt = scheduledAt;
        this.maxCapacity = maxCapacity;
        this.cost = cost;
        this.description = description;
        this.reservedByUserId = reservedByUserId;
        this.participationStartAt = participationStartAt;
        this.matchType = matchType;
        this.durationMinutes = durationMinutes != null ? durationMinutes : 120;
        this.numberOfCourts = numberOfCourts;
        this.courtAddress = courtAddress;
        this.region = region;
        this.createdByUserId = createdByUserId;
    }

    public void update(String courtName, LocalDateTime scheduledAt,
                       Integer maxCapacity, BigDecimal cost, String description, Long reservedByUserId,
                       LocalDateTime participationStartAt, MatchType matchType, Integer durationMinutes,
                       Integer numberOfCourts) {
        this.courtName = courtName;
        this.scheduledAt = scheduledAt;
        this.maxCapacity = maxCapacity;
        this.cost = cost;
        this.description = description;
        this.reservedByUserId = reservedByUserId;
        this.participationStartAt = participationStartAt;
        this.matchType = matchType;
        this.durationMinutes = durationMinutes != null ? durationMinutes : 120;
        this.numberOfCourts = numberOfCourts;
    }

    public void incrementParticipants() {
        this.currentParticipants++;
    }

    public void decrementParticipants() {
        if (this.currentParticipants > 0) {
            this.currentParticipants--;
        }
    }

    public boolean isFull() {
        return this.currentParticipants >= this.maxCapacity;
    }

    public boolean hasAvailableSlot() {
        return this.currentParticipants < this.maxCapacity;
    }

    // === Draw 관련 비즈니스 메서드 ===

    /**
     * 대진 생성 시 호출
     */
    public void createDraw(DrawType drawType) {
        this.drawType = drawType;
        this.isDrawValid = true;
        this.drawCreatedAt = LocalDateTime.now();
    }

    /**
     * 참가자 변경으로 대진 무효화
     */
    public void invalidateDraw() {
        if (this.drawType != null) {
            this.isDrawValid = false;
        }
    }

    /**
     * 대진 존재 여부
     */
    public boolean hasDraw() {
        return this.drawType != null;
    }

    /**
     * 유효한 대진 존재 여부
     */
    public boolean hasValidDraw() {
        return this.drawType != null && Boolean.TRUE.equals(this.isDrawValid);
    }

    /**
     * 대진 삭제
     */
    public void deleteDraw() {
        this.drawType = null;
        this.isDrawValid = false;
        this.drawCreatedAt = null;
    }

    public void updatePinned(boolean pinned) {
        this.pinned = pinned;
    }

    public void updateGuestRecruit(Boolean open, String note) {
        if (open != null) this.guestRecruitOpen = open;
        if (note != null) this.guestRecruitNote = note;
    }

    public void updateInterclubRecruit(Boolean open, String note) {
        if (open != null) this.interclubRecruitOpen = open;
        if (note != null) this.interclubRecruitNote = note;
    }

    public void updatePublicFields(String courtAddress, String region) {
        this.courtAddress = courtAddress;
        this.region = region;
    }

    public boolean isPublicSchedule() {
        return this.clubId == null;
    }

    public boolean isClubSchedule() {
        return this.clubId != null;
    }
}
