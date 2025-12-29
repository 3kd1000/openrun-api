package com.example.openrunapi.domain.club.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE club SET deleted = true WHERE id = ?") // Soft delete 처리
@SQLRestriction("deleted = false") // 항상 deleted = false 인 데이터만 조회
@Table(name = "club")
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    private String region;

    @Column(nullable = false)
    private Long ownerUserId;

    private boolean deleted = false;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Club(String name, String description, String region, Long ownerUserId) {
        this.name = name;
        this.description = description;
        this.region = region;
        this.ownerUserId = ownerUserId;
    }

    public void update(String name, String description, String region) {
        this.name = name;
        this.description = description;
        this.region = region;
    }

    public void changeOwner(Long newOwnerUserId) {
        this.ownerUserId = newOwnerUserId;
    }
}
