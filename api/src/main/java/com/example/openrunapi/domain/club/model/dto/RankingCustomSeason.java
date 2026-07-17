package com.example.openrunapi.domain.club.model.dto;

/**
 * 클럽 커스텀 랭킹 시즌 정의 (ClubPolicy.rankingCustomSeasons JSON 배열의 원소)
 */
public record RankingCustomSeason(String name, int startMonth, int endMonth) {
}
