package com.example.openrunapi.domain.calendar.model.dto;

import com.example.openrunapi.domain.calendar.model.CalendarConnection;
import com.example.openrunapi.domain.calendar.model.CalendarProvider;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CalendarConnectionResponse {

    private final Long id;
    private final CalendarProvider provider;
    private final String externalEmail;
    private final boolean active;
    private final boolean tokenExpired;
    private final LocalDateTime createdAt;

    public CalendarConnectionResponse(CalendarConnection connection) {
        this.id = connection.getId();
        this.provider = connection.getProvider();
        this.externalEmail = connection.getExternalEmail();
        this.active = connection.isActive();
        this.tokenExpired = connection.isTokenExpired();
        this.createdAt = connection.getCreatedAt();
    }
}
