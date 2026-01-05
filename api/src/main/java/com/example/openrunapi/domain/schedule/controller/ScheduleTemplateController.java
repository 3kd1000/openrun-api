package com.example.openrunapi.domain.schedule.controller;

import com.example.openrunapi.domain.schedule.model.dto.CreateScheduleTemplateRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleTemplateRequest;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleTemplateResponse;
import com.example.openrunapi.domain.schedule.service.ScheduleTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule-templates")
@RequiredArgsConstructor
public class ScheduleTemplateController {

    private final ScheduleTemplateService templateService;

    /**
     * 템플릿 생성
     */
    @PostMapping
    public ResponseEntity<ScheduleTemplateResponse> createTemplate(
            @RequestParam Long userId,
            @Valid @RequestBody CreateScheduleTemplateRequest request) {
        ScheduleTemplateResponse response = templateService.createTemplate(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 사용자의 모든 템플릿 조회
     */
    @GetMapping
    public ResponseEntity<List<ScheduleTemplateResponse>> getUserTemplates(
            @RequestParam Long userId) {
        List<ScheduleTemplateResponse> responses = templateService.getUserTemplates(userId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 특정 템플릿 조회
     */
    @GetMapping("/{templateId}")
    public ResponseEntity<ScheduleTemplateResponse> getTemplate(
            @PathVariable Long templateId,
            @RequestParam Long userId) {
        ScheduleTemplateResponse response = templateService.getTemplate(userId, templateId);
        return ResponseEntity.ok(response);
    }

    /**
     * 템플릿 수정
     */
    @PutMapping("/{templateId}")
    public ResponseEntity<ScheduleTemplateResponse> updateTemplate(
            @PathVariable Long templateId,
            @RequestParam Long userId,
            @Valid @RequestBody UpdateScheduleTemplateRequest request) {
        ScheduleTemplateResponse response = templateService.updateTemplate(userId, templateId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 템플릿 삭제
     */
    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable Long templateId,
            @RequestParam Long userId) {
        templateService.deleteTemplate(userId, templateId);
        return ResponseEntity.noContent().build();
    }
}
