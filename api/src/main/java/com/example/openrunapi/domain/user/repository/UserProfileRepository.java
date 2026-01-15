package com.example.openrunapi.domain.user.repository;

import com.example.openrunapi.domain.user.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    List<UserProfile> findByUserIdIn(List<Long> userIds);
}

