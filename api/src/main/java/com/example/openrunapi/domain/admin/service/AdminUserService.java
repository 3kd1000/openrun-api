package com.example.openrunapi.domain.admin.service;

import com.example.openrunapi.domain.auth.service.OAuthService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.SystemAdminRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin 사용자 관리 서비스
 * - 운영용 기능 (화면 미노출)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final SystemAdminRepository systemAdminRepository;
    private final OAuthService oauthService;

    /**
     * System Admin 권한 검증
     *
     * @param firebaseUid Firebase UID
     * @throws AccessDeniedException 권한이 없는 경우
     */
    public void validateAdminAccess(String firebaseUid) {
        User adminUser = oauthService.findUserByProviderUid(firebaseUid)
                .orElseThrow(() -> new AccessDeniedException("사용자를 찾을 수 없습니다."));

        if (!systemAdminRepository.existsByUserId(adminUser.getId())) {
            throw new AccessDeniedException("System Admin 권한이 없습니다.");
        }
    }

    /**
     * 사용자 연락처 업데이트 (이름으로 검색)
     *
     * @param userName    사용자 이름
     * @param phoneNumber 연락처
     * @return 업데이트된 사용자
     */
    @Transactional
    public User updatePhoneByName(String userName, String phoneNumber) {
        User user = userRepository.findByName(userName)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userName));

        user.updateContactInfo(phoneNumber, null, null);

        log.info("Admin updated phone number for user: {} (id: {})", user.getName(), user.getId());

        return user;
    }

    /**
     * 사용자 생년월일 업데이트 (이름으로 검색)
     *
     * @param userName  사용자 이름
     * @param birthDate 생년월일 (YYMMDD 형식)
     * @return 업데이트된 사용자
     */
    @Transactional
    public User updateBirthDateByName(String userName, String birthDate) {
        User user = userRepository.findByName(userName)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userName));

        user.updateBirthDateInfo(birthDate, null);

        log.info("Admin updated birth date for user: {} (id: {})", user.getName(), user.getId());

        return user;
    }
}
