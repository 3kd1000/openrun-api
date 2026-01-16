package com.example.openrunapi.config;

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
                        // CORS preflight 요청 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Actuator health 엔드포인트는 무조건 허용 (K8s liveness/readiness probe용)
                        .requestMatchers("/actuator/health/**").permitAll()
                        // 인증 불필요한 API 엔드포인트
                        .requestMatchers("/api/auth/**").permitAll() // 소셜 로그인 API
                        .requestMatchers("/api/webauthn/login").permitAll() // WebAuthn 로그인 API
                        .requestMatchers("/api/draw/**").permitAll() // 대진 생성 API
                        .requestMatchers("/api/batch/**").permitAll() // 배치 작업 API (테스트/관리용)
                        // 클럽 조회 API (미로그인 유저 포함) - 목록/상세만 허용
                        .requestMatchers(HttpMethod.GET, "/api/clubs", "/api/clubs/*").permitAll()
                        .requestMatchers("/api/schedules/**").permitAll() // 일정 관리 API (개발 단계)
                        .requestMatchers("/api/clubs/*/posts/**").authenticated() // 게시판 API (로그인 필요)
                        .requestMatchers("/api/clubs/*/rules/**").authenticated() // 회칙 관리 API (로그인 필요)
                        .requestMatchers("/api/clubs/*/notices/**").authenticated() // 공지사항 API (로그인 필요)
                        .requestMatchers("/api/clubs/*/members/**").authenticated() // 클럽 멤버/가입 관리 API (로그인 필요)
                        .requestMatchers("/api/clubs/*/membership/**").authenticated() // 클럽원 상세(권한/상태) API (로그인 필요)
                        .requestMatchers("/api/users/guests").permitAll() // 게스트 목록 조회
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
                .addFilterBefore(new FirebaseTokenFilter(userService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
