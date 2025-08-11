package com.example.openrunapi.config;

import com.example.openrunapi.config.auth.FirebaseTokenFilter;
import com.example.openrunapi.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserService userService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CSRF 보호 비활성화 (Stateless API)
                .csrf(csrf -> csrf.disable())

                // 세션 관리 정책을 Stateless로 설정
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // HTTP 요청에 대한 인가 설정
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**").permitAll() // 소셜 로그인 API는 누구나 접근 가능
                        .requestMatchers("/api/draw/**").permitAll() // 대진 생성 API는 누구나 접근 가능
                        .requestMatchers("/api/clubs").permitAll()     // 클럽 목록 조회 API는 누구나 접근 가능
                        .anyRequest().authenticated() // 그 외 모든 요청은 인증 필요
                )

                // Firebase 토큰 검증 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
                .addFilterBefore(new FirebaseTokenFilter(userService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
