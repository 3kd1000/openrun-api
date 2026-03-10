package com.example.openrunapi.domain.calendar.service;

import com.example.openrunapi.domain.calendar.config.KakaoCalendarProperties;
import com.example.openrunapi.domain.calendar.model.CalendarConnection;
import com.example.openrunapi.domain.calendar.model.CalendarProvider;
import com.example.openrunapi.domain.calendar.model.dto.CalendarConnectionResponse;
import com.example.openrunapi.domain.calendar.repository.CalendarConnectionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoCalendarClient {

    private static final String AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
    private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String API_BASE = "https://kapi.kakao.com";
    private static final String USERINFO_URL = "https://kapi.kakao.com/v2/user/me";
    private static final String SCOPE = "talk_calendar";

    private final KakaoCalendarProperties properties;
    private final CalendarService calendarService;
    private final CalendarConnectionRepository connectionRepository;
    private final WebClient webClient = WebClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 카카오 OAuth 인증 URL 생성
     */
    public String buildAuthUrl(Long userId) {
        return UriComponentsBuilder.fromHttpUrl(AUTH_URL)
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", properties.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope", SCOPE)
                .queryParam("state", userId.toString())
                .build()
                .toUriString();
    }

    /**
     * OAuth callback 처리: authorization code -> token exchange -> CalendarConnection 저장
     */
    public CalendarConnectionResponse handleCallback(Long userId, String code) {
        // 1. Authorization code -> Access Token + Refresh Token
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

        // 2. 사용자 닉네임 조회 (카카오는 email 대신 닉네임)
        String nickname = fetchUserNickname(accessToken);

        // 3. CalendarConnection 저장 (카카오는 서브 캘린더 없음)
        return calendarService.connect(userId, CalendarProvider.KAKAO,
                accessToken, refreshToken, nickname, expiresIn, null);
    }

    /**
     * Access Token 갱신 (refresh token 사용)
     */
    public String refreshAccessToken(CalendarConnection connection) {
        if (connection.getRefreshToken() == null) {
            log.warn("Kakao Refresh token 없음: connectionId={}", connection.getId());
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

        // 카카오는 refresh token도 갱신될 수 있음
        String newRefreshToken = tokenResponse.has("refresh_token")
                ? tokenResponse.get("refresh_token").asText() : null;

        connection.updateTokens(newAccessToken, newRefreshToken,
                LocalDateTime.now().plusSeconds(expiresIn));
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
     * 카카오 톡캘린더에 이벤트 생성
     */
    public String createEvent(CalendarConnection connection, String title, String description,
                               LocalDateTime startTime, int durationMinutes, String location) {
        String accessToken = getValidAccessToken(connection);
        if (accessToken == null) return null;

        try {
            String eventJson = buildEventJson(title, description, startTime, durationMinutes, location);

            JsonNode response = webClient.post()
                    .uri(API_BASE + "/v2/api/calendar/create/event")
                    .headers(h -> h.setBearerAuth(accessToken))
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue("event=" + URLEncoder.encode(eventJson, StandardCharsets.UTF_8))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            log.info("카카오 톡캘린더 이벤트 생성 응답: {}", response);
            String eventId = response.get("event_id").asText();
            log.info("카카오 톡캘린더 이벤트 생성: eventId={}", eventId);
            return eventId;
        } catch (Exception e) {
            log.error("카카오 톡캘린더 이벤트 생성 실패", e);
            return null;
        }
    }

    /**
     * 카카오 톡캘린더 이벤트 수정
     */
    public void updateEvent(CalendarConnection connection, String externalEventId,
                            String title, String description,
                            LocalDateTime startTime, int durationMinutes, String location) {
        String accessToken = getValidAccessToken(connection);
        if (accessToken == null) return;

        try {
            String eventJson = buildEventJson(title, description, startTime, durationMinutes, location);
            String requestBody = "event_id=" + URLEncoder.encode(externalEventId, StandardCharsets.UTF_8)
                    + "&event=" + URLEncoder.encode(eventJson, StandardCharsets.UTF_8);
            log.info("카카오 톡캘린더 이벤트 수정 요청: eventId={}, body={}", externalEventId, requestBody);

            JsonNode response = webClient.post()
                    .uri(API_BASE + "/v2/api/calendar/update/event/host")
                    .headers(h -> h.setBearerAuth(accessToken))
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            log.info("카카오 톡캘린더 이벤트 수정 성공: eventId={}, response={}", externalEventId, response);
        } catch (Exception e) {
            log.error("카카오 톡캘린더 이벤트 수정 실패: eventId={}", externalEventId, e);
        }
    }

    /**
     * 카카오 톡캘린더 이벤트 삭제
     */
    public void deleteEvent(CalendarConnection connection, String externalEventId) {
        String accessToken = getValidAccessToken(connection);
        if (accessToken == null) return;

        try {
            webClient.delete()
                    .uri(API_BASE + "/v2/api/calendar/delete/event?event_id=" + externalEventId)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("카카오 톡캘린더 이벤트 삭제: eventId={}", externalEventId);
        } catch (Exception e) {
            log.error("카카오 톡캘린더 이벤트 삭제 실패: eventId={}", externalEventId, e);
        }
    }

    private String fetchUserNickname(String accessToken) {
        try {
            JsonNode userInfo = webClient.get()
                    .uri(USERINFO_URL)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            return userInfo.path("kakao_account").path("profile").path("nickname").asText(null);
        } catch (Exception e) {
            log.warn("카카오 사용자 정보 조회 실패", e);
            return null;
        }
    }

    private String buildEventJson(String title, String description,
                                   LocalDateTime startTime, int durationMinutes,
                                   String location) throws Exception {
        LocalDateTime endTime = startTime.plusMinutes(durationMinutes);
        String timeZone = "Asia/Seoul";

        ZonedDateTime kstStart = startTime.atZone(ZoneId.of(timeZone));
        ZonedDateTime kstEnd = endTime.atZone(ZoneId.of(timeZone));

        Map<String, Object> time = new LinkedHashMap<>();
        time.put("start_at", kstStart.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        time.put("end_at", kstEnd.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        time.put("time_zone", timeZone);
        time.put("all_day", false);

        Map<String, Object> event = new LinkedHashMap<>();
        event.put("title", title);
        event.put("time", time);
        if (description != null && !description.isEmpty()) {
            event.put("description", description);
        }
        if (location != null && !location.isEmpty()) {
            event.put("location", Map.of("name", location));
        }
        event.put("color", "MINT");

        return objectMapper.writeValueAsString(event);
    }
}
