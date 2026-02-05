package com.example.openrunapi.domain.notification.repository;

import com.example.openrunapi.domain.notification.model.DeviceType;
import com.example.openrunapi.domain.notification.model.FcmDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FcmDeviceTokenRepository extends JpaRepository<FcmDeviceToken, Long> {
    List<FcmDeviceToken> findByUserId(Long userId);
    Optional<FcmDeviceToken> findByUserIdAndToken(Long userId, String token);
    void deleteByUserIdAndToken(Long userId, String token);
    void deleteByToken(String token);
    void deleteByUserId(Long userId);
    void deleteByUserIdAndDeviceType(Long userId, DeviceType deviceType);
    List<FcmDeviceToken> findByUserIdIn(List<Long> userIds);
}
