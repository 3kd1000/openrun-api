package com.example.openrunapi.domain.calendar.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class CalendarStatusResponse {
    private final List<CalendarConnectionResponse> connections;
}
