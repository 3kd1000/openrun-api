package com.example.openrunapi.infrastructure.objectstorage;

/**
 * 클럽 로고 업로드 결과
 * @param url512 상세 표시용 512x512 이미지 URL
 * @param url128 썸네일용 128x128 이미지 URL
 */
public record ClubLogoUrls(String url512, String url128) {}
