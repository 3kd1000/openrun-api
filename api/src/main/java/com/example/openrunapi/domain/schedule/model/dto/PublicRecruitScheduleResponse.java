package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.schedule.model.Schedule;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class PublicRecruitScheduleResponse {
    private final Long scheduleId;
    private final Long clubId;
    private final String clubName;
    private final String clubRegion;
    private final String recruitType; // GUEST / INTERCLUB
    private final String matchType; // MENS_DOUBLES, WOMENS_DOUBLES, MIXED_DOUBLES, NONE

    private final LocalDateTime scheduledAt;
    private final Integer durationMinutes;
    private final String courtName;
    private final Integer currentParticipants;
    private final Integer maxCapacity;
    private final BigDecimal cost;
    private final String note;

    public PublicRecruitScheduleResponse(Schedule s, Club c, String recruitType, String note) {
        this.scheduleId = s.getId();
        this.clubId = s.getClubId();
        this.clubName = c.getName();
        this.clubRegion = c.getRegion();
        this.recruitType = recruitType;
        this.matchType = s.getMatchType() != null ? s.getMatchType().name() : null;
        this.scheduledAt = s.getScheduledAt();
        this.durationMinutes = s.getDurationMinutes() != null ? s.getDurationMinutes() : 120;
        this.courtName = s.getCourtName();
        this.currentParticipants = s.getCurrentParticipants();
        this.maxCapacity = s.getMaxCapacity();
        this.cost = s.getCost();
        this.note = note;
    }
}

