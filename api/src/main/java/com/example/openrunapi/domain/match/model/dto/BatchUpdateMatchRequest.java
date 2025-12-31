package com.example.openrunapi.domain.match.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateMatchRequest {
    
    @NotNull(message = "업데이트할 경기 목록은 필수입니다")
    @Valid
    private List<BatchUpdateMatchItem> matches;
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchUpdateMatchItem {
        @NotNull(message = "경기 ID는 필수입니다")
        private Long matchId;
        
        @NotNull(message = "업데이트 요청은 필수입니다")
        @Valid
        private UpdateMatchRequest request;
    }
}

