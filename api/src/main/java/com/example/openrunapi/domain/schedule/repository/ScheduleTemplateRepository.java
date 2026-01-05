package com.example.openrunapi.domain.schedule.repository;

import com.example.openrunapi.domain.schedule.model.ScheduleTemplate;
import com.example.openrunapi.domain.schedule.model.TemplateType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScheduleTemplateRepository extends JpaRepository<ScheduleTemplate, Long> {

    /**
     * 특정 사용자의 모든 템플릿 조회 (생성일 기준 내림차순)
     */
    List<ScheduleTemplate> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 특정 사용자의 템플릿 개수 조회
     */
    long countByUserId(Long userId);

    /**
     * 특정 사용자의 특정 템플릿 조회
     */
    Optional<ScheduleTemplate> findByIdAndUserId(Long id, Long userId);

    /**
     * 특정 사용자가 동일 이름의 템플릿을 보유하고 있는지 확인
     */
    boolean existsByUserIdAndTemplateName(Long userId, String templateName);

    // ========== 타입별 쿼리 메소드 ==========

    /**
     * 특정 사용자의 특정 타입 템플릿 조회 (생성일 기준 내림차순)
     */
    List<ScheduleTemplate> findByUserIdAndTemplateTypeOrderByCreatedAtDesc(Long userId, TemplateType templateType);

    /**
     * 특정 사용자의 특정 타입 템플릿 개수 조회
     */
    long countByUserIdAndTemplateType(Long userId, TemplateType templateType);

    /**
     * 특정 사용자가 특정 타입에서 동일 이름의 템플릿을 보유하고 있는지 확인
     */
    boolean existsByUserIdAndTemplateTypeAndTemplateName(Long userId, TemplateType templateType, String templateName);
}
