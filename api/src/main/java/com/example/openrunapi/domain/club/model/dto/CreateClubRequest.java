package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.Club;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class CreateClubRequest {

    @NotBlank(message = "클럽 이름은 필수입니다.")
    @Size(max = 100, message = "클럽 이름은 100자를 초과할 수 없습니다.")
    private String name;

    @Size(max = 5000, message = "클럽 설명은 5000자를 초과할 수 없습니다.")
    private String description;

    @Size(max = 255, message = "지역 이름은 255자를 초과할 수 없습니다.")
    private String region;

    /**
     * Club 엔티티로 변환하는 메소드.
     * @param ownerUserId 클럽 생성자의 ID (인증된 사용자 정보로부터 얻어옴)
     * @return Club 엔티티
     */
    public Club toEntity(Long ownerUserId) {
        return Club.builder()
                .name(this.name)
                .description(this.description)
                .region(this.region)
                .ownerUserId(ownerUserId)
                .build();
    }
}
