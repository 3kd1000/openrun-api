package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.ContactVisibility;
import com.example.openrunapi.domain.user.model.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class UpdateUserRequest {

    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 100, message = "이름은 100자를 초과할 수 없습니다.")
    private String name;

    private String imageUrl;

    @Pattern(regexp = "^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$", message = "올바른 전화번호 형식이 아닙니다.")
    private String phoneNumber;

    private ContactVisibility phoneVisibility;

    private ContactVisibility emailVisibility;

    private Gender gender;

    @Pattern(regexp = "^[0-9]{6}$", message = "생년월일은 YYMMDD 형식이어야 합니다.")
    private String birthDate;

    private ContactVisibility birthDateVisibility;

    @Size(max = 20, message = "시/도는 20자를 초과할 수 없습니다.")
    private String regionDepth1;

    @Size(max = 20, message = "시/군/구는 20자를 초과할 수 없습니다.")
    private String regionDepth2;
}
