package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.schedule.model.dto.CreateScheduleTemplateRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleTemplateRequest;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleTemplateResponse;
import com.example.openrunapi.domain.schedule.service.ScheduleTemplateService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule-templates")
@RequiredArgsConstructor
public class ScheduleTemplateController {

    private final ScheduleTemplateService templateService;
    private final UserService userService;

    /**
     * 템플릿 생성
     */
    @PostMapping
    public ResponseEntity<ScheduleTemplateResponse> createTemplate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateScheduleTemplateRequest request) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ScheduleTemplateResponse response = templateService.createTemplate(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 사용자의 모든 템플릿 조회
     */
    @GetMapping
    public ResponseEntity<List<ScheduleTemplateResponse>> getUserTemplates(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<ScheduleTemplateResponse> responses = templateService.getUserTemplates(currentUser.getId());
        return ResponseEntity.ok(responses);
    }

    /**
     * 특정 템플릿 조회
     */
    @GetMapping("/{templateId}")
    public ResponseEntity<ScheduleTemplateResponse> getTemplate(
            @PathVariable Long templateId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ScheduleTemplateResponse response = templateService.getTemplate(currentUser.getId(), templateId);
        return ResponseEntity.ok(response);
    }

    /**
     * 템플릿 수정
     */
    @PutMapping("/{templateId}")
    public ResponseEntity<ScheduleTemplateResponse> updateTemplate(
            @PathVariable Long templateId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateScheduleTemplateRequest request) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ScheduleTemplateResponse response = templateService.updateTemplate(currentUser.getId(), templateId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 템플릿 삭제
     */
    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable Long templateId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        templateService.deleteTemplate(currentUser.getId(), templateId);
        return ResponseEntity.noContent().build();
    }
}
