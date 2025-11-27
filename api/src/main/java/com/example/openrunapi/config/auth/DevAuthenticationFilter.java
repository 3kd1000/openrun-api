package com.example.openrunapi.config.auth;

import com.example.openrunapi.domain.user.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class DevAuthenticationFilter extends OncePerRequestFilter {

    private final UserService userService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String devUserId = request.getHeader("X-DEV-USER-ID");

        if (devUserId != null) {
            try {
                Long userId = Long.parseLong(devUserId);
                UserDetails userDetails = userService.loadUserById(userId);

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.info("Dev Auth Filter: Authenticated user with ID: {}", userId);

            } catch (NumberFormatException e) {
                log.warn("Invalid X-DEV-USER-ID header format: {}", devUserId);
            } catch (Exception e) {
                log.warn("Failed to authenticate with X-DEV-USER-ID: {}", devUserId, e);
            }
        }

        filterChain.doFilter(request, response);
    }
}
