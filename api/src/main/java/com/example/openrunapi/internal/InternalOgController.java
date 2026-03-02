package com.example.openrunapi.internal;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * OG 태그 생성용 내부 API
 * - og-server (프론트엔드 컨테이너)에서 호출
 * - X-Internal-Key 헤더로 인증 (배치 API와 동일 키)
 * - 인증/멤버십 체크 없이 기본 정보만 반환
 */
@Slf4j
@RestController
@RequestMapping("/internal/og")
@RequiredArgsConstructor
public class InternalOgController {

    private final ScheduleRepository scheduleRepository;
    private final ClubRepository clubRepository;

    @Value("${openrun.internal.batch-key:}")
    private String internalKey;

    @GetMapping("/schedules/{scheduleId}")
    public ResponseEntity<?> getScheduleForOg(
            @PathVariable Long scheduleId,
            @RequestHeader(value = "X-Internal-Key", required = false) String key) {

        if (!validateKey(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        return scheduleRepository.findById(scheduleId)
                .map(schedule -> {
                    String clubName = null;
                    if (schedule.getClubId() != null) {
                        clubName = clubRepository.findById(schedule.getClubId())
                                .map(Club::getName)
                                .orElse(null);
                    }
                    return ResponseEntity.ok(Map.of(
                            "id", schedule.getId(),
                            "courtName", nullSafe(schedule.getCourtName()),
                            "scheduledAt", nullSafe(schedule.getScheduledAt()),
                            "currentParticipants", schedule.getCurrentParticipants() != null ? schedule.getCurrentParticipants() : 0,
                            "maxCapacity", schedule.getMaxCapacity() != null ? schedule.getMaxCapacity() : 0,
                            "clubName", nullSafe(clubName)
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/clubs/{clubId}")
    public ResponseEntity<?> getClubForOg(
            @PathVariable Long clubId,
            @RequestHeader(value = "X-Internal-Key", required = false) String key) {

        if (!validateKey(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        return clubRepository.findById(clubId)
                .map(club -> ResponseEntity.ok(Map.of(
                        "id", club.getId(),
                        "name", nullSafe(club.getName()),
                        "region", nullSafe(club.getRegion()),
                        "description", nullSafe(club.getDescription()),
                        "memberCount", club.getMemberCount() != null ? club.getMemberCount() : 0,
                        "logoUrl", nullSafe(club.getLogoUrl())
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    private boolean validateKey(String key) {
        if (internalKey == null || internalKey.isBlank()) {
            log.warn("[Internal OG] INTERNAL_BATCH_KEY 환경변수가 설정되지 않음");
            return false;
        }
        return internalKey.equals(key);
    }

    private Object nullSafe(Object value) {
        return value != null ? value : "";
    }
}
