package com.example.openrunapi.domain.user.model;

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
@SQLDelete(sql = "UPDATE users SET deleted = true, email = CONCAT('deleted_', id, '_', email), uid = CONCAT('deleted_', id, '_', uid), social_id = CONCAT('deleted_', id, '_', social_id) WHERE id = ?")
@SQLRestriction("deleted = false")
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uid", unique = true, nullable = false)
    private String firebaseUid; // Firebase UID

    @Column(unique = true)
    private String socialId; // 소셜 로그인 제공자별 고유 ID (예: 카카오 ID)

    @Column
    private String email;

    @Column(nullable = false)
    private String name; // 사용자 이름 또는 닉네임

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    private boolean deleted = false;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public User(String firebaseUid, String socialId, String email, String name, String imageUrl) {
        this.firebaseUid = firebaseUid;
        this.socialId = socialId;
        this.email = email;
        this.name = name;
        this.imageUrl = imageUrl;
    }

    public void updateProfile(String name, String imageUrl) {
        if (name != null) {
            this.name = name;
        }
        this.imageUrl = imageUrl; // null이 들어와도 업데이트 가능
    }
}
