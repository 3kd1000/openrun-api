package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.ClubRole;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

@Getter
public class UpdateClubMemberRolesRequest {

    @NotEmpty
    private List<Item> items;

    @Getter
    public static class Item {
        @NotNull
        private Long userId;

        @NotNull
        private ClubRole role;
    }
}

