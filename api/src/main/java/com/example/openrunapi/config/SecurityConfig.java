package com.example.openrunapi.config;

import com.example.openrunapi.config.auth.DevAuthenticationFilter;
import com.example.openrunapi.config.auth.FirebaseTokenFilter;
import com.example.openrunapi.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
                        // Actuator health 엔드포인트는 무조건 허용 (K8s liveness/readiness probe용)
                        .requestMatchers("/actuator/health/**").permitAll()
                        // 인증 불필요한 API 엔드포인트
                        .requestMatchers("/api/v1/auth/**").permitAll() // 소셜 로그인 API
                        .requestMatchers("/api/v1/dev/**").permitAll() // 개발용 로그인 API
                        .requestMatchers("/api/draw/**").permitAll() // 대진 생성 API
                        .requestMatchers(HttpMethod.GET, "/api/clubs", "/api/clubs/**").permitAll() // 클럽 목록 조회 API
                        .requestMatchers("/api/schedules/**").permitAll() // 일정 관리 API (개발 단계)
                        // 그 외 모든 API 요청은 인증 필요
                        .requestMatchers("/api/**").authenticated()
                        // 그 외 요청은 거부 (API 서버이므로 정적 리소스나 SPA 라우팅 불필요)
                        .anyRequest().denyAll()
                )

                // 기본 예외 처리
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.sendError(401, "Unauthorized");
                        })
                )

                // Firebase 토큰 검증 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
                .addFilterBefore(new FirebaseTokenFilter(userService), UsernamePasswordAuthenticationFilter.class)
                // 로컬 개발용 인증 필터 추가
                .addFilterBefore(new DevAuthenticationFilter(userService), FirebaseTokenFilter.class);

        return http.build();
    }
}
