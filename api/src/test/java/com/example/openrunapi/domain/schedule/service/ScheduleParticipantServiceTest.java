package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.common.service.PermissionService;
import com.example.openrunapi.domain.audit.service.AuditLogService;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus;
import com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleParticipantService 테스트")
class ScheduleParticipantServiceTest {

    @Mock
    private ScheduleParticipantRepository participantRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PermissionService permissionService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ScheduleParticipantService participantService;

    private Schedule schedule;
    private User user;
    private static final Long SCHEDULE_ID = 1L;
    private static final Long USER_ID = 100L;
    private static final Integer MAX_CAPACITY = 4;
    private static final String USER_NAME = "테스트사용자";

    @BeforeEach
    void setUp() {
        schedule = Schedule.builder()
                .clubId(1L)
                .courtName("코트 A")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .maxCapacity(MAX_CAPACITY)
                .cost(BigDecimal.valueOf(25000))
                .description("테스트 일정")
                .build();

        user = User.builder()
                .name(USER_NAME)
                .email("test@example.com")
                .build();
    }

    @Test
    @DisplayName("참가 신청 성공 - 정원 미만일 때 CONFIRMED 상태로 생성")
    void joinSchedule_whenSlotsAvailable_shouldCreateConfirmed() {
        // given
        given(scheduleRepository.findById(SCHEDULE_ID)).willReturn(Optional.of(schedule));
        given(participantRepository.findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED))
                .willReturn(Optional.empty());
        given(participantRepository.countActiveParticipants(SCHEDULE_ID, ParticipantStatus.CANCELLED))
                .willReturn(2L); // 현재 2명, maxCapacity 4명
        given(participantRepository.getNextPosition(SCHEDULE_ID)).willReturn(3);

        ScheduleParticipant savedParticipant = ScheduleParticipant.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(USER_ID)
                .status(ParticipantStatus.CONFIRMED)
                .position(3)
                .build();
        given(participantRepository.save(any(ScheduleParticipant.class))).willReturn(savedParticipant);
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));

        // when
        ParticipantResponse response = participantService.joinSchedule(SCHEDULE_ID, USER_ID);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("CONFIRMED");
        assertThat(response.getPosition()).isEqualTo(3);
        assertThat(response.getUserName()).isEqualTo(USER_NAME);
        verify(participantRepository).save(any(ScheduleParticipant.class));
        verify(userRepository).findById(USER_ID);
    }

    @Test
    @DisplayName("참가 신청 성공 - 정원 초과일 때 WAITING 상태로 생성")
    void joinSchedule_whenFull_shouldCreateWaiting() {
        // given
        given(scheduleRepository.findById(SCHEDULE_ID)).willReturn(Optional.of(schedule));
        given(participantRepository.findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED))
                .willReturn(Optional.empty());
        given(participantRepository.countActiveParticipants(SCHEDULE_ID, ParticipantStatus.CANCELLED))
                .willReturn(4L); // 현재 4명, maxCapacity 4명 (정원 초과)
        given(participantRepository.getNextPosition(SCHEDULE_ID)).willReturn(5);

        ScheduleParticipant savedParticipant = ScheduleParticipant.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(USER_ID)
                .status(ParticipantStatus.WAITING)
                .position(5)
                .build();
        given(participantRepository.save(any(ScheduleParticipant.class))).willReturn(savedParticipant);
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));

        // when
        ParticipantResponse response = participantService.joinSchedule(SCHEDULE_ID, USER_ID);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("WAITING");
        assertThat(response.getPosition()).isEqualTo(5);
        assertThat(response.getUserName()).isEqualTo(USER_NAME);
        verify(participantRepository).save(any(ScheduleParticipant.class));
        verify(userRepository).findById(USER_ID);
    }

    @Test
    @DisplayName("참가 신청 실패 - 존재하지 않는 일정")
    void joinSchedule_whenScheduleNotFound_shouldThrowException() {
        // given
        given(scheduleRepository.findById(SCHEDULE_ID)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> participantService.joinSchedule(SCHEDULE_ID, USER_ID))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("해당 ID의 일정을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("참가 신청 실패 - 이미 참가 신청한 경우")
    void joinSchedule_whenAlreadyJoined_shouldThrowException() {
        // given
        given(scheduleRepository.findById(SCHEDULE_ID)).willReturn(Optional.of(schedule));

        ScheduleParticipant existingParticipant = ScheduleParticipant.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(USER_ID)
                .status(ParticipantStatus.CONFIRMED)
                .position(1)
                .build();
        given(participantRepository.findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED))
                .willReturn(Optional.of(existingParticipant));

        // when & then
        assertThatThrownBy(() -> participantService.joinSchedule(SCHEDULE_ID, USER_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 참가 신청한 일정입니다");
    }

    @Test
    @DisplayName("참가 취소 성공 - CONFIRMED 상태 취소 (대기자 없음)")
    void cancelParticipation_whenConfirmed_noWaitingList_shouldCancel() {
        // given
        given(scheduleRepository.findById(SCHEDULE_ID)).willReturn(Optional.of(schedule));

        ScheduleParticipant participant = ScheduleParticipant.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(USER_ID)
                .status(ParticipantStatus.CONFIRMED)
                .position(1)
                .build();
        given(participantRepository.findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED))
                .willReturn(Optional.of(participant));

        given(participantRepository.findActiveParticipantsByScheduleId(SCHEDULE_ID, ParticipantStatus.CANCELLED))
                .willReturn(Arrays.asList(participant)); // 대기자 없음

        // when
        participantService.cancelParticipation(SCHEDULE_ID, USER_ID);

        // then
        verify(participantRepository).delete(participant);
        verify(participantRepository).findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED);
    }

    @Test
    @DisplayName("참가 취소 성공 - CONFIRMED 취소 시 대기자 자동 확정")
    void cancelParticipation_whenConfirmed_withWaitingList_shouldPromoteFirst() {
        // given
        given(scheduleRepository.findById(SCHEDULE_ID)).willReturn(Optional.of(schedule));

        ScheduleParticipant confirmedParticipant = ScheduleParticipant.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(USER_ID)
                .status(ParticipantStatus.CONFIRMED)
                .position(1)
                .build();

        ScheduleParticipant waitingParticipant = ScheduleParticipant.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(200L)
                .status(ParticipantStatus.WAITING)
                .position(5)
                .build();

        given(participantRepository.findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED))
                .willReturn(Optional.of(confirmedParticipant));

        given(participantRepository.findActiveParticipantsByScheduleId(SCHEDULE_ID, ParticipantStatus.CANCELLED))
                .willReturn(Arrays.asList(confirmedParticipant, waitingParticipant));

        // when
        participantService.cancelParticipation(SCHEDULE_ID, USER_ID);

        // then
        verify(participantRepository).delete(confirmedParticipant);
        assertThat(waitingParticipant.getStatus()).isEqualTo(ParticipantStatus.CONFIRMED);
        verify(participantRepository).findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED);
    }

    @Test
    @DisplayName("참가 취소 성공 - WAITING 상태 취소 (대기열에서 제거)")
    void cancelParticipation_whenWaiting_shouldCancel() {
        // given
        given(scheduleRepository.findById(SCHEDULE_ID)).willReturn(Optional.of(schedule));

        ScheduleParticipant waitingParticipant = ScheduleParticipant.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(USER_ID)
                .status(ParticipantStatus.WAITING)
                .position(5)
                .build();

        given(participantRepository.findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED))
                .willReturn(Optional.of(waitingParticipant));

        // when
        participantService.cancelParticipation(SCHEDULE_ID, USER_ID);

        // then
        verify(participantRepository).delete(waitingParticipant);
        verify(participantRepository).findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED);
        verify(participantRepository, never()).findActiveParticipantsByScheduleId(anyLong(), any());
    }

    @Test
    @DisplayName("참가 취소 실패 - 존재하지 않는 일정")
    void cancelParticipation_whenScheduleNotFound_shouldThrowException() {
        // given
        given(scheduleRepository.findById(SCHEDULE_ID)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> participantService.cancelParticipation(SCHEDULE_ID, USER_ID))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("해당 ID의 일정을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("참가 취소 실패 - 참가 신청 내역이 없음")
    void cancelParticipation_whenParticipationNotFound_shouldThrowException() {
        // given
        given(scheduleRepository.findById(SCHEDULE_ID)).willReturn(Optional.of(schedule));
        given(participantRepository.findActiveParticipation(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED))
                .willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> participantService.cancelParticipation(SCHEDULE_ID, USER_ID))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("참가 신청 내역을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("참가자 목록 조회 성공 - 취소된 참가자 제외")
    void getParticipants_shouldReturnActiveParticipantsOnly() {
        // given
        ParticipantResponse response1 = ParticipantResponse.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(100L)
                .userName("사용자1")
                .status("CONFIRMED")
                .position(1)
                .build();

        ParticipantResponse response2 = ParticipantResponse.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(101L)
                .userName("사용자2")
                .status("CONFIRMED")
                .position(2)
                .build();

        ParticipantResponse response3 = ParticipantResponse.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(102L)
                .userName("사용자3")
                .status("WAITING")
                .position(5)
                .build();

        given(participantRepository.findActiveParticipantsWithUserName(SCHEDULE_ID, ParticipantStatus.CANCELLED))
                .willReturn(Arrays.asList(response1, response2, response3));

        // when
        List<ParticipantResponse> responses = participantService.getParticipants(SCHEDULE_ID);

        // then
        assertThat(responses).hasSize(3);
        assertThat(responses).extracting("status")
                .containsExactly("CONFIRMED", "CONFIRMED", "WAITING");
    }

    @Test
    @DisplayName("내 참가 내역 조회 성공 - 참가 중인 경우")
    void getMyParticipation_whenExists_shouldReturnResponse() {
        // given
        ParticipantResponse participantResponse = ParticipantResponse.builder()
                .scheduleId(SCHEDULE_ID)
                .userId(USER_ID)
                .userName(USER_NAME)
                .status("CONFIRMED")
                .position(1)
                .build();

        given(participantRepository.findActiveParticipationWithUserName(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED))
                .willReturn(Optional.of(participantResponse));

        // when
        ParticipantResponse response = participantService.getMyParticipation(SCHEDULE_ID, USER_ID);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(USER_ID);
        assertThat(response.getStatus()).isEqualTo("CONFIRMED");
        assertThat(response.getUserName()).isEqualTo(USER_NAME);
    }

    @Test
    @DisplayName("내 참가 내역 조회 성공 - 참가하지 않은 경우 null 반환")
    void getMyParticipation_whenNotExists_shouldReturnNull() {
        // given
        given(participantRepository.findActiveParticipationWithUserName(SCHEDULE_ID, USER_ID, ParticipantStatus.CANCELLED))
                .willReturn(Optional.empty());

        // when
        ParticipantResponse response = participantService.getMyParticipation(SCHEDULE_ID, USER_ID);

        // then
        assertThat(response).isNull();
    }
}
