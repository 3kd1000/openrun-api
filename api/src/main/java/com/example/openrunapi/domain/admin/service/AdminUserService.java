package com.example.openrunapi.domain.admin.service;

import com.example.openrunapi.domain.admin.model.dto.UserStatsResponse;
import com.example.openrunapi.domain.auth.service.OAuthService;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.SystemAdminRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Admin 사용자 관리 서비스
 * - 운영용 기능 (화면 미노출)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
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

    /**
     * 사용자 통계 조회
     * - 전체 사용자 수
     * - DAU (일간 활성 사용자)
     * - WAU (주간 활성 사용자)
     * - MAU (월간 활성 사용자)
     * - 신규 가입자 수 (오늘/이번 주/이번 달)
     *
     * @return 사용자 통계 응답
     */
    @Transactional(readOnly = true)
    public UserStatsResponse getUserStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.minusDays(7);
        LocalDateTime startOfMonth = now.minusDays(30);

        // 전체 사용자 수 (게스트 제외)
        long totalUsers = userRepository.countNonGuestUsers();

        // 전체 클럽 수
        long totalClubs = clubRepository.count();

        // DAU: 오늘 로그인한 사용자 수
        long dau = userRepository.countActiveUsersSince(startOfToday);

        // WAU: 최근 7일 내 로그인한 사용자 수
        long wau = userRepository.countActiveUsersSince(startOfWeek);

        // MAU: 최근 30일 내 로그인한 사용자 수
        long mau = userRepository.countActiveUsersSince(startOfMonth);

        // 신규 가입자 수
        long newUsersToday = userRepository.countNewUsersSince(startOfToday);
        long newUsersThisWeek = userRepository.countNewUsersSince(startOfWeek);
        long newUsersThisMonth = userRepository.countNewUsersSince(startOfMonth);

        log.info("User stats - Total: {}, Clubs: {}, DAU: {}, WAU: {}, MAU: {}", totalUsers, totalClubs, dau, wau, mau);

        return UserStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalClubs(totalClubs)
                .dau(dau)
                .wau(wau)
                .mau(mau)
                .newUsersToday(newUsersToday)
                .newUsersThisWeek(newUsersThisWeek)
                .newUsersThisMonth(newUsersThisMonth)
                .build();
    }
}
