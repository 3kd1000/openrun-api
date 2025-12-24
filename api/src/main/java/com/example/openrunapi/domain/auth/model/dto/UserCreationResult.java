package com.example.openrunapi.domain.auth.model.dto;

import com.example.openrunapi.domain.user.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserCreationResult {
    private User user;
    private boolean isNewUser;
}
