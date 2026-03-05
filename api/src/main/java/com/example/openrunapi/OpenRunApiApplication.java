package com.example.openrunapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableAsync // 비동기 실행 활성화 (캘린더 동기화 등)
@EnableJpaAuditing // JPA Auditing 활성화
@EnableScheduling // 스케줄링 활성화 (배치 작업)
@SpringBootApplication
public class OpenRunApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(OpenRunApiApplication.class, args);
    }

}