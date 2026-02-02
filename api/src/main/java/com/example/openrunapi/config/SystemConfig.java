package com.example.openrunapi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * 시스템 설정
 */
@Configuration
public class SystemConfig {

    /**
     * 시스템 문의용 클럽 이름
     * 마이그레이션 V65에서 생성됨
     */
    @Value("${openrun.system.inquiry-club-name:OpenRun 운영팀}")
    private String inquiryClubName;

    public String getInquiryClubName() {
        return inquiryClubName;
    }
}
