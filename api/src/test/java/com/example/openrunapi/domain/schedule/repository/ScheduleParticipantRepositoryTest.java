package com.example.openrunapi.domain.schedule.repository;

import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("ScheduleParticipantRepository 통합 테스트")
class ScheduleParticipantRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ScheduleParticipantRepository participantRepository;

    private Schedule schedule;
    private static final Long USER_ID_1 = 100L;
    private static final Long USER_ID_2 = 101L;
    private static final Long USER_ID_3 = 102L;

    @BeforeEach
    void setUp() {
        // 테스트용 일정 생성
        schedule = Schedule.builder()
                .clubId(1L)
                .courtName("테스트 코트")
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .maxCapacity(4)
                .cost(BigDecimal.valueOf(25000))
                .description("테스트 일정")
                .build();
        schedule = entityManager.persist(schedule);
        entityManager.flush();
    }

    @Test
    @DisplayName("일정별 참가자 목록 조회 - position 순으로 정렬")
    void findByScheduleIdOrderByPositionAsc_shouldReturnOrderedList() {
        // given
        ScheduleParticipant p1 = createParticipant(schedule.getId(), USER_ID_1, ParticipantStatus.CONFIRMED, 1);
        ScheduleParticipant p2 = createParticipant(schedule.getId(), USER_ID_2, ParticipantStatus.CONFIRMED, 2);
        ScheduleParticipant p3 = createParticipant(schedule.getId(), USER_ID_3, ParticipantStatus.WAITING, 5);

        entityManager.persist(p3);
        entityManager.persist(p1);
        entityManager.persist(p2);
        entityManager.flush();

        // when
        List<ScheduleParticipant> participants = participantRepository
                .findByScheduleIdOrderByPositionAsc(schedule.getId());

        // then
        assertThat(participants).hasSize(3);
        assertThat(participants).extracting("position").containsExactly(1, 2, 5);
    }

    @Test
    @DisplayName("활성 참가자 조회 - CANCELLED 제외")
    void findActiveParticipantsByScheduleId_shouldExcludeCancelled() {
        // given
        ScheduleParticipant confirmed = createParticipant(schedule.getId(), USER_ID_1, ParticipantStatus.CONFIRMED, 1);
        ScheduleParticipant waiting = createParticipant(schedule.getId(), USER_ID_2, ParticipantStatus.WAITING, 5);
        ScheduleParticipant cancelled = createParticipant(schedule.getId(), USER_ID_3, ParticipantStatus.CANCELLED, 3);

        entityManager.persist(confirmed);
        entityManager.persist(waiting);
        entityManager.persist(cancelled);
        entityManager.flush();

        // when
        List<ScheduleParticipant> activeParticipants = participantRepository
                .findActiveParticipantsByScheduleId(schedule.getId(), ParticipantStatus.CANCELLED);

        // then
        assertThat(activeParticipants).hasSize(2);
        assertThat(activeParticipants).extracting("status")
                .containsExactlyInAnyOrder(ParticipantStatus.CONFIRMED, ParticipantStatus.WAITING);
        assertThat(activeParticipants).extracting("userId")
                .containsExactlyInAnyOrder(USER_ID_1, USER_ID_2);
    }

    @Test
    @DisplayName("활성 참가자 수 카운트 - CANCELLED 제외")
    void countActiveParticipants_shouldExcludeCancelled() {
        // given
        entityManager.persist(createParticipant(schedule.getId(), USER_ID_1, ParticipantStatus.CONFIRMED, 1));
        entityManager.persist(createParticipant(schedule.getId(), USER_ID_2, ParticipantStatus.CONFIRMED, 2));
        entityManager.persist(createParticipant(schedule.getId(), USER_ID_3, ParticipantStatus.CANCELLED, 3));
        entityManager.flush();

        // when
        Long count = participantRepository.countActiveParticipants(schedule.getId(), ParticipantStatus.CANCELLED);

        // then
        assertThat(count).isEqualTo(2);
    }

    @Test
    @DisplayName("사용자의 활성 참가 내역 조회 성공")
    void findActiveParticipation_whenExists_shouldReturnParticipant() {
        // given
        ScheduleParticipant participant = createParticipant(schedule.getId(), USER_ID_1, ParticipantStatus.CONFIRMED, 1);
        entityManager.persist(participant);
        entityManager.flush();

        // when
        Optional<ScheduleParticipant> found = participantRepository
                .findActiveParticipation(schedule.getId(), USER_ID_1, ParticipantStatus.CANCELLED);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getUserId()).isEqualTo(USER_ID_1);
        assertThat(found.get().getStatus()).isEqualTo(ParticipantStatus.CONFIRMED);
    }

    @Test
    @DisplayName("사용자의 활성 참가 내역 조회 - 취소된 경우 조회되지 않음")
    void findActiveParticipation_whenCancelled_shouldReturnEmpty() {
        // given
        ScheduleParticipant cancelledParticipant = createParticipant(
                schedule.getId(), USER_ID_1, ParticipantStatus.CANCELLED, 1);
        entityManager.persist(cancelledParticipant);
        entityManager.flush();

        // when
        Optional<ScheduleParticipant> found = participantRepository
                .findActiveParticipation(schedule.getId(), USER_ID_1, ParticipantStatus.CANCELLED);

        // then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("다음 position 번호 생성 - 첫 참가자는 1")
    void getNextPosition_whenNoParticipants_shouldReturnOne() {
        // when
        Integer nextPosition = participantRepository.getNextPosition(schedule.getId());

        // then
        assertThat(nextPosition).isEqualTo(1);
    }

    @Test
    @DisplayName("다음 position 번호 생성 - 기존 최대값 + 1")
    void getNextPosition_whenParticipantsExist_shouldReturnMaxPlusOne() {
        // given
        entityManager.persist(createParticipant(schedule.getId(), USER_ID_1, ParticipantStatus.CONFIRMED, 1));
        entityManager.persist(createParticipant(schedule.getId(), USER_ID_2, ParticipantStatus.CONFIRMED, 2));
        entityManager.persist(createParticipant(schedule.getId(), USER_ID_3, ParticipantStatus.CANCELLED, 3));
        entityManager.flush();

        // when
        Integer nextPosition = participantRepository.getNextPosition(schedule.getId());

        // then
        assertThat(nextPosition).isEqualTo(4); // MAX(3) + 1
    }

    @Test
    @DisplayName("일정과 사용자로 참가 여부 확인")
    void existsByScheduleIdAndUserId_shouldReturnTrue() {
        // given
        ScheduleParticipant participant = createParticipant(schedule.getId(), USER_ID_1, ParticipantStatus.CONFIRMED, 1);
        entityManager.persist(participant);
        entityManager.flush();

        // when
        boolean exists = participantRepository.existsByScheduleIdAndUserId(schedule.getId(), USER_ID_1);

        // then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("일정과 사용자로 참가 여부 확인 - 존재하지 않음")
    void existsByScheduleIdAndUserId_whenNotExists_shouldReturnFalse() {
        // when
        boolean exists = participantRepository.existsByScheduleIdAndUserId(schedule.getId(), 999L);

        // then
        assertThat(exists).isFalse();
    }

    // Helper method
    private ScheduleParticipant createParticipant(Long scheduleId, Long userId, ParticipantStatus status, Integer position) {
        return ScheduleParticipant.builder()
                .scheduleId(scheduleId)
                .userId(userId)
                .status(status)
                .position(position)
                .build();
    }
}
