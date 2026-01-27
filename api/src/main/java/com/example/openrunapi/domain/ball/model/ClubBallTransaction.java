package com.example.openrunapi.domain.ball.model;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.schedule.model.Schedule;
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
@Table(name = "club_ball_transaction")
public class ClubBallTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private BallTransactionType transactionType;

    @Column(nullable = false)
    private Integer quantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_member_id")
    private ClubMember fromMember;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_member_id")
    private ClubMember toMember;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public ClubBallTransaction(
            Club club,
            BallTransactionType transactionType,
            Integer quantity,
            ClubMember fromMember,
            ClubMember toMember,
            Schedule schedule,
            String description,
            User createdBy
    ) {
        this.club = club;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.fromMember = fromMember;
        this.toMember = toMember;
        this.schedule = schedule;
        this.description = description;
        this.createdBy = createdBy;
    }

    /**
     * 입고 거래 생성
     */
    public static ClubBallTransaction createAddTransaction(
            Club club,
            ClubMember toMember,
            int quantity,
            String description,
            User createdBy
    ) {
        return ClubBallTransaction.builder()
                .club(club)
                .transactionType(BallTransactionType.ADD)
                .toMember(toMember)
                .quantity(quantity)
                .description(description)
                .createdBy(createdBy)
                .build();
    }

    /**
     * 배분 거래 생성
     */
    public static ClubBallTransaction createDistributeTransaction(
            Club club,
            ClubMember fromMember,
            ClubMember toMember,
            int quantity,
            String description,
            User createdBy
    ) {
        return ClubBallTransaction.builder()
                .club(club)
                .transactionType(BallTransactionType.DISTRIBUTE)
                .fromMember(fromMember)
                .toMember(toMember)
                .quantity(quantity)
                .description(description)
                .createdBy(createdBy)
                .build();
    }

    /**
     * 사용 거래 생성
     */
    public static ClubBallTransaction createUseTransaction(
            Club club,
            ClubMember fromMember,
            Schedule schedule,
            int quantity,
            String description,
            User createdBy
    ) {
        return ClubBallTransaction.builder()
                .club(club)
                .transactionType(BallTransactionType.USE)
                .fromMember(fromMember)
                .schedule(schedule)
                .quantity(quantity)
                .description(description)
                .createdBy(createdBy)
                .build();
    }

    /**
     * 조정 거래 생성
     */
    public static ClubBallTransaction createAdjustTransaction(
            Club club,
            ClubMember member,
            int quantity,
            String description,
            User createdBy
    ) {
        return ClubBallTransaction.builder()
                .club(club)
                .transactionType(BallTransactionType.ADJUST)
                .fromMember(member)
                .quantity(quantity)
                .description(description)
                .createdBy(createdBy)
                .build();
    }
}
