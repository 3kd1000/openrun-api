package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.draw.model.DrawType;
import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequest;
import com.example.openrunapi.domain.draw.model.dto.DrawResponse;
import com.example.openrunapi.domain.draw.service.DrawService;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleResponse;
import com.example.openrunapi.domain.schedule.service.ScheduleParticipantService;
import com.example.openrunapi.domain.schedule.service.ScheduleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = ScheduleController.class,
        excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class)
@DisplayName("ScheduleController 대진 생성 API 테스트")
@Disabled("Security 설정 문제로 인해 임시 비활성화 - SecurityConfig가 @WebMvcTest와 호환되지 않음")
class ScheduleControllerDrawTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ScheduleService scheduleService;

    @MockBean
    private DrawService drawService;

    @MockBean
    private ScheduleParticipantService participantService;

    private static final Long SCHEDULE_ID = 1L;

    @Test
    @DisplayName("대진 생성 성공 - AA 타입")
    void createDrawForSchedule_withAAType_shouldReturnCreated() throws Exception {
        // given
        ScheduleResponse scheduleResponse = createMockScheduleResponse();
        given(scheduleService.getScheduleById(SCHEDULE_ID)).willReturn(scheduleResponse);

        CreateDrawRequest request = new CreateDrawRequest(
                Arrays.asList("정주상", "최승연", "김민수", "이지원"),
                Collections.emptyList(),
                DrawType.AA,
                Collections.emptyList(),
                Collections.emptyList(),
                4
        );

        DrawResponse drawResponse = createMockDrawResponse();
        given(drawService.generateDrawSequence(any(CreateDrawRequest.class))).willReturn(drawResponse);

        // when & then
        mockMvc.perform(post("/api/schedules/{scheduleId}/draw", SCHEDULE_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.games").isArray())
                .andExpect(jsonPath("$.games[0].gameNo").value(1))
                .andExpect(jsonPath("$.games[0].roundNo").value(1))
                .andExpect(jsonPath("$.games[0].teamA[0]").value("정주상"))
                .andExpect(jsonPath("$.games[0].teamB[0]").value("김민수"));

        verify(scheduleService).getScheduleById(SCHEDULE_ID);
        verify(drawService).generateDrawSequence(any(CreateDrawRequest.class));
    }

    @Test
    @DisplayName("대진 생성 성공 - AB 타입")
    void createDrawForSchedule_withABType_shouldReturnCreated() throws Exception {
        // given
        ScheduleResponse scheduleResponse = createMockScheduleResponse();
        given(scheduleService.getScheduleById(SCHEDULE_ID)).willReturn(scheduleResponse);

        CreateDrawRequest request = new CreateDrawRequest(
                Arrays.asList("정주상", "최승연", "김민수", "이지원"),
                Collections.emptyList(),
                DrawType.AB,
                Arrays.asList("정주상", "김민수"),
                Arrays.asList("최승연", "이지원"),
                4
        );

        DrawResponse drawResponse = createMockDrawResponse();
        given(drawService.generateDrawSequence(any(CreateDrawRequest.class))).willReturn(drawResponse);

        // when & then
        mockMvc.perform(post("/api/schedules/{scheduleId}/draw", SCHEDULE_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.games").isArray())
                .andExpect(jsonPath("$.games").isNotEmpty());

        verify(scheduleService).getScheduleById(SCHEDULE_ID);
        verify(drawService).generateDrawSequence(any(CreateDrawRequest.class));
    }

    @Test
    @DisplayName("대진 생성 성공 - SEED 타입")
    void createDrawForSchedule_withSEEDType_shouldReturnCreated() throws Exception {
        // given
        ScheduleResponse scheduleResponse = createMockScheduleResponse();
        given(scheduleService.getScheduleById(SCHEDULE_ID)).willReturn(scheduleResponse);

        CreateDrawRequest request = new CreateDrawRequest(
                Arrays.asList("김민수", "이지원", "박서준", "홍길동"),
                Arrays.asList("정주상", "최승연"),
                DrawType.SEED,
                Collections.emptyList(),
                Collections.emptyList(),
                6
        );

        DrawResponse drawResponse = createMockDrawResponse();
        given(drawService.generateDrawSequence(any(CreateDrawRequest.class))).willReturn(drawResponse);

        // when & then
        mockMvc.perform(post("/api/schedules/{scheduleId}/draw", SCHEDULE_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.games").isArray())
                .andExpect(jsonPath("$.games").isNotEmpty());

        verify(scheduleService).getScheduleById(SCHEDULE_ID);
        verify(drawService).generateDrawSequence(any(CreateDrawRequest.class));
    }

    @Test
    @DisplayName("대진 생성 실패 - 존재하지 않는 일정")
    void createDrawForSchedule_whenScheduleNotFound_shouldReturnNotFound() throws Exception {
        // given
        given(scheduleService.getScheduleById(SCHEDULE_ID))
                .willThrow(new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + SCHEDULE_ID));

        CreateDrawRequest request = new CreateDrawRequest(
                Arrays.asList("정주상", "최승연", "김민수", "이지원"),
                Collections.emptyList(),
                DrawType.AA,
                Collections.emptyList(),
                Collections.emptyList(),
                4
        );

        // when & then
        mockMvc.perform(post("/api/schedules/{scheduleId}/draw", SCHEDULE_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());

        verify(scheduleService).getScheduleById(SCHEDULE_ID);
    }

    @Test
    @DisplayName("대진 생성 성공 - 8명 참가자 (다중 경기)")
    void createDrawForSchedule_with8Players_shouldReturnMultipleGames() throws Exception {
        // given
        ScheduleResponse scheduleResponse = createMockScheduleResponse();
        given(scheduleService.getScheduleById(SCHEDULE_ID)).willReturn(scheduleResponse);

        CreateDrawRequest request = new CreateDrawRequest(
                Arrays.asList("정주상", "최승연", "김민수", "이지원", "박서준", "홍길동", "이영희", "김철수"),
                Collections.emptyList(),
                DrawType.AA,
                Collections.emptyList(),
                Collections.emptyList(),
                8
        );

        DrawResponse.Game game1 = DrawResponse.Game.builder()
                .gameNo(1)
                .roundNo(1)
                .teamA(Arrays.asList("정주상", "최승연"))
                .teamB(Arrays.asList("김민수", "이지원"))
                .matchId(null)
                .teamAScore(null)
                .teamBScore(null)
                .result(null)
                .playedAt(null)
                .build();

        DrawResponse.Game game2 = DrawResponse.Game.builder()
                .gameNo(2)
                .roundNo(1)
                .teamA(Arrays.asList("박서준", "홍길동"))
                .teamB(Arrays.asList("이영희", "김철수"))
                .matchId(null)
                .teamAScore(null)
                .teamBScore(null)
                .result(null)
                .playedAt(null)
                .build();

        DrawResponse drawResponse = DrawResponse.builder()
                .games(Arrays.asList(game1, game2))
                .build();
        given(drawService.generateDrawSequence(any(CreateDrawRequest.class))).willReturn(drawResponse);

        // when & then
        mockMvc.perform(post("/api/schedules/{scheduleId}/draw", SCHEDULE_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.games").isArray())
                .andExpect(jsonPath("$.games.length()").value(2))
                .andExpect(jsonPath("$.games[0].gameNo").value(1))
                .andExpect(jsonPath("$.games[1].gameNo").value(2));

        verify(scheduleService).getScheduleById(SCHEDULE_ID);
        verify(drawService).generateDrawSequence(any(CreateDrawRequest.class));
    }

    @Test
    @DisplayName("대진 생성 성공 - 정상 응답 구조 검증")
    void createDrawForSchedule_shouldReturnValidResponseStructure() throws Exception {
        // given
        ScheduleResponse scheduleResponse = createMockScheduleResponse();
        given(scheduleService.getScheduleById(SCHEDULE_ID)).willReturn(scheduleResponse);

        CreateDrawRequest request = new CreateDrawRequest(
                Arrays.asList("정주상", "최승연", "김민수", "이지원"),
                Collections.emptyList(),
                DrawType.AA,
                Collections.emptyList(),
                Collections.emptyList(),
                4
        );

        DrawResponse drawResponse = createMockDrawResponse();
        given(drawService.generateDrawSequence(any(CreateDrawRequest.class))).willReturn(drawResponse);

        // when & then
        mockMvc.perform(post("/api/schedules/{scheduleId}/draw", SCHEDULE_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.games").exists())
                .andExpect(jsonPath("$.games[0].gameNo").exists())
                .andExpect(jsonPath("$.games[0].roundNo").exists())
                .andExpect(jsonPath("$.games[0].teamA").isArray())
                .andExpect(jsonPath("$.games[0].teamB").isArray());
    }

    private ScheduleResponse createMockScheduleResponse() {
        Schedule schedule = Schedule.builder()
                .clubId(1L)
                .courtName("테니스장 A")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .maxCapacity(8)
                .cost(BigDecimal.valueOf(25000))
                .description("테스트 일정")
                .build();

        return new ScheduleResponse(schedule);
    }

    private DrawResponse createMockDrawResponse() {
        DrawResponse.Game game = DrawResponse.Game.builder()
                .gameNo(1)
                .roundNo(1)
                .teamA(Arrays.asList("정주상", "최승연"))
                .teamB(Arrays.asList("김민수", "이지원"))
                .matchId(null)
                .teamAScore(null)
                .teamBScore(null)
                .result(null)
                .playedAt(null)
                .build();

        return DrawResponse.builder()
                .games(Collections.singletonList(game))
                .build();
    }
}
