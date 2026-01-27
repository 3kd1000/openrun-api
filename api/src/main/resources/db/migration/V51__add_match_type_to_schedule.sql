-- V51: 일정에 모임 타입(match_type) 컬럼 추가
-- 작성일: 2026-01-19
-- 목적: 남복/여복/혼복/단식 구분을 위한 필드 추가

ALTER TABLE schedule ADD COLUMN match_type VARCHAR(20) NULL;

-- 참고: NULL 허용으로 기존 일정에 영향 없음
-- 가능한 값: 'MEN_DOUBLES', 'WOMEN_DOUBLES', 'MIXED_DOUBLES', 'SINGLES'
