package com.example.openrunapi.domain.calendar.service;

import com.example.openrunapi.domain.calendar.model.CalendarConnection;
import com.example.openrunapi.domain.calendar.model.CalendarProvider;
import com.example.openrunapi.domain.calendar.model.dto.CalendarConnectionResponse;
import com.example.openrunapi.domain.calendar.model.dto.CalendarStatusResponse;
import com.example.openrunapi.domain.calendar.repository.CalendarConnectionRepository;
import com.example.openrunapi.domain.calendar.repository.CalendarEventRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarConnectionRepository connectionRepository;
    private final CalendarEventRepository eventRepository;

    /**
     * 사용자의 캘린더 연동 상태 조회
     */
    public CalendarStatusResponse getStatus(Long userId) {
        List<CalendarConnectionResponse> connections = connectionRepository.findByUserId(userId).stream()
                .map(CalendarConnectionResponse::new)
                .toList();
        return new CalendarStatusResponse(connections);
    }

    /**
     * OAuth 인증 완료 후 CalendarConnection 저장/갱신
     */
    @Transactional
    public CalendarConnectionResponse connect(Long userId, CalendarProvider provider,
                                               String accessToken, String refreshToken,
                                               String externalEmail, long expiresInSeconds,
                                               String externalCalendarId) {
        var expiresAt = java.time.LocalDateTime.now().plusSeconds(expiresInSeconds);

        CalendarConnection connection = connectionRepository
                .findByUserIdAndProvider(userId, provider)
                .map(existing -> {
                    existing.updateTokens(accessToken, refreshToken, expiresAt);
                    if (externalCalendarId != null) {
                        existing.setExternalCalendarId(externalCalendarId);
                    }
                    if (externalEmail != null) {
                        existing.setExternalEmail(externalEmail);
                    }
                    return existing;
                })
                .orElseGet(() -> CalendarConnection.builder()
                        .userId(userId)
                        .provider(provider)
                        .externalEmail(externalEmail)
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .tokenExpiresAt(expiresAt)
                        .externalCalendarId(externalCalendarId)
                        .build());

        CalendarConnection saved = connectionRepository.save(connection);
        log.info("캘린더 연동 완료: userId={}, provider={}, email={}", userId, provider, externalEmail);
        return new CalendarConnectionResponse(saved);
    }

    /**
     * 캘린더 연동 해제
     */
    /**
     * 캘린더 연동 해제 (CalendarConnection 반환 → 호출자가 외부 캘린더 정리)
     */
    @Transactional
    public CalendarConnection disconnect(Long userId, CalendarProvider provider) {
        CalendarConnection connection = connectionRepository
                .findByUserIdAndProviderAndActiveTrue(userId, provider)
                .orElseThrow(() -> new EntityNotFoundException("연동된 캘린더를 찾을 수 없습니다."));

        // 연동된 이벤트 삭제
        eventRepository.deleteByCalendarConnectionId(connection.getId());
        connection.deactivate();
        log.info("캘린더 연동 해제: userId={}, provider={}", userId, provider);
        return connection;
    }

    /**
     * 사용자의 모든 활성 캘린더 연동 해제 (회원 탈퇴용)
     */
    @Transactional
    public List<CalendarConnection> disconnectAll(Long userId) {
        List<CalendarConnection> connections = connectionRepository.findByUserIdAndActiveTrue(userId);
        for (CalendarConnection connection : connections) {
            eventRepository.deleteByCalendarConnectionId(connection.getId());
            connection.deactivate();
        }
        if (!connections.isEmpty()) {
            log.info("캘린더 전체 연동 해제: userId={}, {}건", userId, connections.size());
        }
        return connections;
    }

    /**
     * 활성화된 연결 조회
     */
    public CalendarConnection getActiveConnection(Long userId, CalendarProvider provider) {
        return connectionRepository.findByUserIdAndProviderAndActiveTrue(userId, provider)
                .orElse(null);
    }
}
