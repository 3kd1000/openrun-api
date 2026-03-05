package com.example.openrunapi.domain.calendar.controller;

import com.example.openrunapi.domain.calendar.model.CalendarProvider;
import com.example.openrunapi.domain.calendar.model.dto.CalendarConnectionResponse;
import com.example.openrunapi.domain.calendar.model.dto.CalendarStatusResponse;
import com.example.openrunapi.domain.calendar.model.CalendarConnection;
import com.example.openrunapi.domain.calendar.service.CalendarService;
import com.example.openrunapi.domain.calendar.service.CalendarSyncService;
import com.example.openrunapi.domain.calendar.service.GoogleCalendarClient;
import com.example.openrunapi.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@Slf4j
@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;
    private final CalendarSyncService calendarSyncService;
    private final GoogleCalendarClient googleCalendarClient;
    private final UserService userService;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    /**
     * 캘린더 연동 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<CalendarStatusResponse> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getCurrentUser(userDetails.getUsername()).getId();
        return ResponseEntity.ok(calendarService.getStatus(userId));
    }

    /**
     * Google OAuth 인증 URL 생성
     */
    @GetMapping("/google/auth-url")
    public ResponseEntity<String> getGoogleAuthUrl(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getCurrentUser(userDetails.getUsername()).getId();
        String authUrl = googleCalendarClient.buildAuthUrl(userId);
        return ResponseEntity.ok(authUrl);
    }

    /**
     * Google OAuth callback (Google 리다이렉트로 호출됨 → 프론트로 리다이렉트)
     */
    @GetMapping("/google/callback")
    public ResponseEntity<Void> handleGoogleCallback(
            @RequestParam String code,
            @RequestParam String state) {
        String redirectUrl;
        try {
            Long userId = Long.parseLong(state);
            googleCalendarClient.handleCallback(userId, code);
            // 초기 동기화: 이미 확정된 미래 일정을 캘린더에 추가 (@Async로 비동기 실행)
            CalendarConnection connection = calendarService.getActiveConnection(userId, CalendarProvider.GOOGLE);
            if (connection != null) {
                calendarSyncService.syncExistingSchedules(userId, connection);
            }
            redirectUrl = frontendUrl + "/more/calendar-settings?connected=true";
        } catch (Exception e) {
            log.error("Google Calendar 연동 실패", e);
            redirectUrl = frontendUrl + "/more/calendar-settings?error=true";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(redirectUrl));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    /**
     * 캘린더 연동 해제
     */
    @DeleteMapping("/{provider}")
    public ResponseEntity<Void> disconnect(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable CalendarProvider provider) {
        Long userId = userService.getCurrentUser(userDetails.getUsername()).getId();
        // 외부 서브 캘린더 삭제 (deactivate 전에 token이 살아있을 때 실행)
        CalendarConnection connection = calendarService.getActiveConnection(userId, provider);
        if (connection != null && provider == CalendarProvider.GOOGLE) {
            googleCalendarClient.deleteSubCalendar(connection);
        }
        calendarService.disconnect(userId, provider);
        return ResponseEntity.noContent().build();
    }
}
