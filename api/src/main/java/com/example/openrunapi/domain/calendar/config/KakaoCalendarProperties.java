package com.example.openrunapi.domain.calendar.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "kakao.calendar")
public class KakaoCalendarProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
}
