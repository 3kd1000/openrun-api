package com.example.openrunapi.domain.calendar.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "google.calendar")
public class GoogleCalendarProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
}
