package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.domain.schedule.model.ScheduleTemplate;
import com.example.openrunapi.domain.schedule.model.TemplateType;
import com.example.openrunapi.domain.schedule.model.dto.CreateScheduleTemplateRequest;
import com.example.openrunapi.domain.schedule.model.dto.UpdateScheduleTemplateRequest;
import com.example.openrunapi.domain.schedule.model.dto.ScheduleTemplateResponse;
import com.example.openrunapi.domain.schedule.repository.ScheduleTemplateRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ScheduleTemplateService {

    private static final int MAX_TEMPLATES_PER_TYPE = 3;
    private static final Pattern PATTERN_REGEX = Pattern.compile(
            "^매달 ([1-9]|[12][0-9]|3[01])일 ([01][0-9]|2[0-3]):([0-5][0-9])$"
    );

    private final ScheduleTemplateRepository templateRepository;

    /**
     * 템플릿 생성
     */
    @Transactional
    public ScheduleTemplateResponse createTemplate(Long userId, CreateScheduleTemplateRequest request) {
        // 타입별 필수 필드 검증
        validateTemplateFields(request.getTemplateType(), request.getCourtName(),
                request.getMaxCapacity(), request.getParticipationStartPattern());

        // 타입별 최대 5개 제한 검증
        long currentCount = templateRepository.countByUserIdAndTemplateType(userId, request.getTemplateType());
        if (currentCount >= MAX_TEMPLATES_PER_TYPE) {
            throw new IllegalStateException(
                    String.format("%s 즐겨찾기는 최대 %d개까지 생성 가능합니다.",
                            getTemplateTypeDisplayName(request.getTemplateType()), MAX_TEMPLATES_PER_TYPE)
            );
        }

        // 타입별 중복 이름 검증
        if (templateRepository.existsByUserIdAndTemplateTypeAndTemplateName(
                userId, request.getTemplateType(), request.getTemplateName())) {
            throw new IllegalStateException(
                    String.format("이미 존재하는 템플릿 이름입니다: %s", request.getTemplateName())
            );
        }

        ScheduleTemplate template = request.toEntity(userId);
        ScheduleTemplate savedTemplate = templateRepository.save(template);

        log.info("템플릿 생성 완료 - userId: {}, templateType: {}, templateName: {}",
                userId, request.getTemplateType(), request.getTemplateName());
        return new ScheduleTemplateResponse(savedTemplate);
    }

    /**
     * 사용자의 모든 템플릿 조회
     */
    public List<ScheduleTemplateResponse> getUserTemplates(Long userId) {
        return templateRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(ScheduleTemplateResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 특정 템플릿 조회
     */
    public ScheduleTemplateResponse getTemplate(Long userId, Long templateId) {
        ScheduleTemplate template = templateRepository.findByIdAndUserId(templateId, userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("템플릿을 찾을 수 없습니다. templateId: %d", templateId)
                ));
        return new ScheduleTemplateResponse(template);
    }

    /**
     * 템플릿 수정
     */
    @Transactional
    public ScheduleTemplateResponse updateTemplate(Long userId, Long templateId,
                                                    UpdateScheduleTemplateRequest request) {
        ScheduleTemplate template = templateRepository.findByIdAndUserId(templateId, userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("템플릿을 찾을 수 없습니다. templateId: %d", templateId)
                ));

        // 타입별 필수 필드 검증
        validateTemplateFields(template.getTemplateType(), request.getCourtName(),
                request.getMaxCapacity(), request.getParticipationStartPattern());

        // 템플릿 이름이 변경되는 경우 중복 체크 (같은 타입 내에서)
        if (!template.getTemplateName().equals(request.getTemplateName())) {
            if (templateRepository.existsByUserIdAndTemplateTypeAndTemplateName(
                    userId, template.getTemplateType(), request.getTemplateName())) {
                throw new IllegalStateException(
                        String.format("이미 존재하는 템플릿 이름입니다: %s", request.getTemplateName())
                );
            }
        }

        template.update(
                request.getTemplateName(),
                request.getCourtName(),
                request.getMaxCapacity(),
                request.getCost(),
                request.getCourtAddress(),
                request.getRegion(),
                request.getMatchType(),
                request.getNumberOfCourts(),
                request.getParticipationStartPattern()
        );

        log.info("템플릿 수정 완료 - userId: {}, templateId: {}, templateName: {}",
                userId, templateId, request.getTemplateName());
        return new ScheduleTemplateResponse(template);
    }

    /**
     * 템플릿 삭제
     */
    @Transactional
    public void deleteTemplate(Long userId, Long templateId) {
        ScheduleTemplate template = templateRepository.findByIdAndUserId(templateId, userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("템플릿을 찾을 수 없습니다. templateId: %d", templateId)
                ));

        templateRepository.delete(template);
        log.info("템플릿 삭제 완료 - userId: {}, templateId: {}", userId, templateId);
    }

    /**
     * 참가신청 시작시간 패턴을 실제 LocalDateTime으로 변환
     *
     * @param pattern "매달 1일 00:00" 형식의 문자열
     * @param scheduledAt 일정 날짜
     * @return 계산된 참가신청 시작시간 (패턴이 null이면 null 반환)
     */
    public LocalDateTime calculateParticipationStartAt(String pattern, LocalDateTime scheduledAt) {
        if (pattern == null || pattern.trim().isEmpty()) {
            return null;
        }

        Matcher matcher = PATTERN_REGEX.matcher(pattern);
        if (!matcher.matches()) {
            throw new IllegalArgumentException(
                    "참가신청 시작시간 패턴 형식이 올바르지 않습니다: " + pattern
            );
        }

        int dayOfMonth = Integer.parseInt(matcher.group(1));
        int hour = Integer.parseInt(matcher.group(2));
        int minute = Integer.parseInt(matcher.group(3));

        // scheduledAt의 년/월을 기준으로 참가신청 시작시간 계산
        YearMonth yearMonth = YearMonth.from(scheduledAt);

        // 해당 월의 마지막 날보다 큰 날짜는 마지막 날로 조정
        int actualDay = Math.min(dayOfMonth, yearMonth.lengthOfMonth());

        LocalDate startDate = LocalDate.of(scheduledAt.getYear(), scheduledAt.getMonthValue(), actualDay);
        LocalDateTime participationStartAt = startDate.atTime(hour, minute);

        log.debug("참가신청 시작시간 계산 - pattern: {}, scheduledAt: {}, result: {}",
                pattern, scheduledAt, participationStartAt);

        return participationStartAt;
    }

    /**
     * 템플릿 타입별 필수 필드 검증
     */
    private void validateTemplateFields(TemplateType templateType, String courtName,
                                        Integer maxCapacity, String participationStartPattern) {
        if (templateType == TemplateType.SCHEDULE) {
            // SCHEDULE 타입: courtName, maxCapacity 필수
            if (courtName == null || courtName.trim().isEmpty()) {
                throw new IllegalArgumentException("일정 템플릿은 코트명이 필수입니다.");
            }
            if (maxCapacity == null || maxCapacity < 1) {
                throw new IllegalArgumentException("일정 템플릿은 최대 정원이 필수입니다. (최소 1명 이상)");
            }
        } else if (templateType == TemplateType.PARTICIPATION_START) {
            // PARTICIPATION_START 타입: participationStartPattern 필수
            if (participationStartPattern == null || participationStartPattern.trim().isEmpty()) {
                throw new IllegalArgumentException("참가신청 시작시간 템플릿은 시작시간 패턴이 필수입니다.");
            }
            // 패턴 형식 검증
            if (!PATTERN_REGEX.matcher(participationStartPattern).matches()) {
                throw new IllegalArgumentException(
                        "참가신청 시작시간 패턴 형식이 올바르지 않습니다. (예: 매달 1일 00:00)"
                );
            }
        }
    }

    /**
     * 템플릿 타입의 한글 표시명 반환
     */
    private String getTemplateTypeDisplayName(TemplateType templateType) {
        return switch (templateType) {
            case SCHEDULE -> "일정";
            case PARTICIPATION_START -> "참가신청 시작시간";
        };
    }
}
