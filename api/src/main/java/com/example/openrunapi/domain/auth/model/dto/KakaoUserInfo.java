package com.example.openrunapi.domain.auth.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.Optional;

@Getter
@JsonIgnoreProperties(ignoreUnknown = true) // 응답의 모든 필드를 매핑하지 않으므로, 모르는 필드는 무시하도록 설정
public class KakaoUserInfo {

    @JsonProperty("id")
    private Long socialId;

    @JsonProperty("kakao_account")
    private KakaoAccount kakaoAccount;

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class KakaoAccount {

        @JsonProperty("profile")
        private Profile profile;

        @JsonProperty("email")
        private String email;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Profile {

        @JsonProperty("nickname")
        private String nickname;

        @JsonProperty("profile_image_url")
        private String profileImageUrl;
    }

    // AuthService에서 User 엔티티를 생성하거나 업데이트할 때 사용할 편의 메서드
    public String getName() {
        return Optional.ofNullable(this.kakaoAccount)
                .map(KakaoAccount::getProfile)
                .map(Profile::getNickname)
                .orElse(null);
    }

    public String getEmail() {
        return Optional.ofNullable(this.kakaoAccount)
                .map(KakaoAccount::getEmail)
                .orElse(null);
    }

    public String getImageUrl() {
        return Optional.ofNullable(this.kakaoAccount)
                .map(KakaoAccount::getProfile)
                .map(Profile::getProfileImageUrl)
                .orElse(null);
    }
}
