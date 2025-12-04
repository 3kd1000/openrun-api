package com.example.openrunapi.domain.club.model.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class UpdateClubRequest {

    @Size(max = 100, message = "클럽 이름은 100자를 초과할 수 없습니다.")
    private String name;

    @Size(max = 5000, message = "클럽 설명은 5000자를 초과할 수 없습니다.")
    private String description;

    @Size(max = 255, message = "지역 이름은 255자를 초과할 수 없습니다.")
    private String region;

    private Long ownerUserId;
}
