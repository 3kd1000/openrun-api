package com.example.openrunapi.domain.externalrequest.model.dto;

import com.example.openrunapi.domain.externalrequest.model.ExternalRequest;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.user.model.UserProfile;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class ExternalRequestResponse {
    private final Long id;
    private final Long clubId;
    private final Long scheduleId;
    private final Long postId;
    private final String type;
    private final String status;
    private final Long requesterUserId;
    private final String requesterName;
    private final LocalDateTime createdAt;
    private final LocalDateTime decidedAt;
    private final String decisionNote;

    // 일정 요약 (schedule 기반 요청일 때만)
    private final LocalDateTime scheduleAt;
    private final String courtName;
    private final Integer currentParticipants;
    private final Integer maxCapacity;
    private final String matchType;

    // 신청자 프로필 요약 (optional)
    private final LocalDate tennisStartedAt;
    private final String ntrp;
    private final Boolean formerPlayer;
    private final String tournamentHistory;

    public ExternalRequestResponse(ExternalRequest r) {
        this(r, null);
    }

    public ExternalRequestResponse(ExternalRequest r, UserProfile profile) {
        this.id = r.getId();
        this.clubId = r.getClub().getId();
        this.scheduleId = r.getSchedule() != null ? r.getSchedule().getId() : null;
        this.postId = r.getPost() != null ? r.getPost().getId() : null;
        this.type = r.getType().name();
        this.status = r.getStatus().name();
        this.requesterUserId = r.getRequester().getId();
        this.requesterName = r.getRequester().getName();
        this.createdAt = r.getCreatedAt();
        this.decidedAt = r.getDecidedAt();
        this.decisionNote = r.getDecisionNote();

        Schedule s = r.getSchedule();
        this.scheduleAt = s != null ? s.getScheduledAt() : null;
        this.courtName = s != null ? s.getCourtName() : null;
        this.currentParticipants = s != null ? s.getCurrentParticipants() : null;
        this.maxCapacity = s != null ? s.getMaxCapacity() : null;
        this.matchType = s != null && s.getMatchType() != null ? s.getMatchType().name() : null;

        this.tennisStartedAt = profile != null ? profile.getTennisStartedAt() : null;
        this.ntrp = profile != null ? profile.getNtrp() : null;
        this.formerPlayer = profile != null ? profile.isFormerPlayer() : null;
        this.tournamentHistory = profile != null ? profile.getTournamentHistory() : null;
    }
}

