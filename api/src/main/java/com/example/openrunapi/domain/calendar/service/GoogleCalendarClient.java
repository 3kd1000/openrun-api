package com.example.openrunapi.domain.calendar.service;

import com.example.openrunapi.domain.calendar.config.GoogleCalendarProperties;
import com.example.openrunapi.domain.calendar.model.CalendarConnection;
import com.example.openrunapi.domain.calendar.model.CalendarProvider;
import com.example.openrunapi.domain.calendar.model.dto.CalendarConnectionResponse;
import com.example.openrunapi.domain.calendar.repository.CalendarConnectionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarClient {

    private static final String AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
    private static final String USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
    private static final String SCOPE = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email";

    private final GoogleCalendarProperties properties;
    private final CalendarService calendarService;
    private final CalendarConnectionRepository connectionRepository;
    private final WebClient webClient = WebClient.builder().build();

    /**
     * Google OAuth 인증 URL 생성
     */
    public String buildAuthUrl(Long userId) {
        return UriComponentsBuilder.fromHttpUrl(AUTH_URL)
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", properties.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope", SCOPE)
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("state", userId.toString())
                .build()
                .toUriString();
    }

    /**
     * OAuth callback 처리: authorization code → token exchange → CalendarConnection 저장
     */
    public CalendarConnectionResponse handleCallback(Long userId, String code) {
        // 1. Authorization code → Access Token + Refresh Token
        JsonNode tokenResponse = webClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue("code=" + code
                        + "&client_id=" + properties.getClientId()
                        + "&client_secret=" + properties.getClientSecret()
                        + "&redirect_uri=" + properties.getRedirectUri()
                        + "&grant_type=authorization_code")
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        String accessToken = tokenResponse.get("access_token").asText();
        String refreshToken = tokenResponse.has("refresh_token")
                ? tokenResponse.get("refresh_token").asText() : null;
        long expiresIn = tokenResponse.get("expires_in").asLong();

        // 2. 사용자 이메일 조회
        String email = fetchUserEmail(accessToken);

        // 3. "OpenRun" 서브 캘린더 생성 (또는 기존 것 재사용)
        String calendarId = findOrCreateSubCalendar(accessToken);

        // 4. CalendarConnection 저장
        return calendarService.connect(userId, CalendarProvider.GOOGLE,
                accessToken, refreshToken, email, expiresIn, calendarId);
    }

    /**
     * Access Token 갱신 (refresh token 사용)
     */
    public String refreshAccessToken(CalendarConnection connection) {
        if (connection.getRefreshToken() == null) {
            log.warn("Refresh token 없음: connectionId={}", connection.getId());
            return null;
        }

        JsonNode tokenResponse = webClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue("refresh_token=" + connection.getRefreshToken()
                        + "&client_id=" + properties.getClientId()
                        + "&client_secret=" + properties.getClientSecret()
                        + "&grant_type=refresh_token")
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        String newAccessToken = tokenResponse.get("access_token").asText();
        long expiresIn = tokenResponse.get("expires_in").asLong();

        connection.updateTokens(newAccessToken, null, LocalDateTime.now().plusSeconds(expiresIn));
        connectionRepository.save(connection);

        return newAccessToken;
    }

    /**
     * 유효한 Access Token 획득 (만료 시 자동 갱신)
     */
    public String getValidAccessToken(CalendarConnection connection) {
        if (connection.isTokenExpired()) {
            return refreshAccessToken(connection);
        }
        return connection.getAccessToken();
    }

    /**
     * Google Calendar에 이벤트 생성
     */
    public String createEvent(CalendarConnection connection, String title, String description,
                               LocalDateTime startTime, int durationMinutes, String location) {
        String accessToken = getValidAccessToken(connection);
        if (accessToken == null) return null;

        Map<String, Object> event = buildEventBody(title, description, startTime, durationMinutes, location);

        JsonNode response = webClient.post()
                .uri(CALENDAR_API_BASE + "/calendars/" + connection.getCalendarIdOrPrimary() + "/events")
                .headers(h -> h.setBearerAuth(accessToken))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(event)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        String eventId = response.get("id").asText();
        log.info("Google Calendar 이벤트 생성: eventId={}", eventId);
        return eventId;
    }

    /**
     * Google Calendar 이벤트 수정
     */
    public void updateEvent(CalendarConnection connection, String externalEventId,
                            String title, String description,
                            LocalDateTime startTime, int durationMinutes, String location) {
        String accessToken = getValidAccessToken(connection);
        if (accessToken == null) return;

        Map<String, Object> event = buildEventBody(title, description, startTime, durationMinutes, location);

        webClient.put()
                .uri(CALENDAR_API_BASE + "/calendars/" + connection.getCalendarIdOrPrimary() + "/events/" + externalEventId)
                .headers(h -> h.setBearerAuth(accessToken))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(event)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        log.info("Google Calendar 이벤트 수정: eventId={}", externalEventId);
    }

    /**
     * Google Calendar 이벤트 삭제
     */
    public void deleteEvent(CalendarConnection connection, String externalEventId) {
        String accessToken = getValidAccessToken(connection);
        if (accessToken == null) return;

        webClient.delete()
                .uri(CALENDAR_API_BASE + "/calendars/" + connection.getCalendarIdOrPrimary() + "/events/" + externalEventId)
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .toBodilessEntity()
                .block();

        log.info("Google Calendar 이벤트 삭제: eventId={}", externalEventId);
    }

    /**
     * Google Calendar 서브 캘린더 삭제
     */
    public void deleteSubCalendar(CalendarConnection connection) {
        String calendarId = connection.getExternalCalendarId();
        if (calendarId == null) return;

        String accessToken = getValidAccessToken(connection);
        if (accessToken == null) return;

        try {
            webClient.delete()
                    .uri(CALENDAR_API_BASE + "/calendars/" + calendarId)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("OpenRun 서브 캘린더 삭제: calendarId={}", calendarId);
        } catch (Exception e) {
            log.warn("서브 캘린더 삭제 실패 (무시): calendarId={}, error={}", calendarId, e.getMessage());
        }
    }

    /**
     * "OpenRun" 서브 캘린더를 찾거나 없으면 새로 생성
     */
    private String findOrCreateSubCalendar(String accessToken) {
        // 1. 기존 캘린더 목록에서 "OpenRun" 찾기
        JsonNode calendarList = webClient.get()
                .uri(CALENDAR_API_BASE + "/users/me/calendarList")
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        if (calendarList != null && calendarList.has("items")) {
            for (JsonNode item : calendarList.get("items")) {
                if ("OpenRun".equals(item.path("summary").asText())) {
                    String existingId = item.get("id").asText();
                    log.info("기존 OpenRun 서브 캘린더 발견: {}", existingId);
                    return existingId;
                }
            }
        }

        // 2. 없으면 새로 생성 (에메랄드 색상: #10B981)
        JsonNode created = webClient.post()
                .uri(CALENDAR_API_BASE + "/calendars")
                .headers(h -> h.setBearerAuth(accessToken))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("summary", "OpenRun", "timeZone", "Asia/Seoul"))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        String newCalendarId = created.get("id").asText();

        // 3. calendarList에서 색상 설정 (Google Calendar API는 calendars.insert로 색상 지정 불가)
        try {
            webClient.put()
                    .uri(CALENDAR_API_BASE + "/users/me/calendarList/" + newCalendarId)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("backgroundColor", "#10B981", "foregroundColor", "#ffffff"))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
        } catch (Exception e) {
            log.warn("서브 캘린더 색상 설정 실패 (무시): {}", e.getMessage());
        }

        log.info("OpenRun 서브 캘린더 생성: {}", newCalendarId);
        return newCalendarId;
    }

    private String fetchUserEmail(String accessToken) {
        JsonNode userInfo = webClient.get()
                .uri(USERINFO_URL)
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        return userInfo.has("email") ? userInfo.get("email").asText() : null;
    }

    private Map<String, Object> buildEventBody(String title, String description,
                                                LocalDateTime startTime, int durationMinutes,
                                                String location) {
        LocalDateTime endTime = startTime.plusMinutes(durationMinutes);
        String timeZone = "Asia/Seoul";

        // LocalDateTime은 JVM 기본 시간대로 읽힘 (TIMESTAMPTZ → JVM TZ → LocalDateTime)
        // JVM 시간대가 UTC/KST 어디든 정확히 KST로 변환
        ZonedDateTime kstStart = startTime.atZone(ZoneId.systemDefault())
                .withZoneSameInstant(ZoneId.of(timeZone));
        ZonedDateTime kstEnd = endTime.atZone(ZoneId.systemDefault())
                .withZoneSameInstant(ZoneId.of(timeZone));

        log.info("캘린더 이벤트 시간 변환: startTime={}, JVM TZ={}, kstStart={}",
                startTime, ZoneId.systemDefault(), kstStart);

        return Map.of(
                "summary", title,
                "description", description != null ? description : "",
                "location", location != null ? location : "",
                "start", Map.of(
                        "dateTime", kstStart.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
                        "timeZone", timeZone
                ),
                "end", Map.of(
                        "dateTime", kstEnd.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
                        "timeZone", timeZone
                )
        );
    }
}
