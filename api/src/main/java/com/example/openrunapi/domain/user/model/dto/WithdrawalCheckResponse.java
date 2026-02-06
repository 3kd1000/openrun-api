package com.example.openrunapi.domain.user.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 회원 탈퇴 가능 여부 체크 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalCheckResponse {

    /**
     * 탈퇴 가능 여부
     */
    private boolean canWithdraw;

    /**
     * 탈퇴 불가 시 사유
     */
    private String reason;

    /**
     * 소유한 클럽 목록 (다른 멤버가 있어서 양도가 필요한 클럽)
     */
    private List<OwnedClubInfo> ownedClubsWithMembers;

    /**
     * 본인만 있어서 탈퇴 시 삭제될 클럽 목록
     */
    private List<OwnedClubInfo> ownedClubsToDelete;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OwnedClubInfo {
        private Long clubId;
        private String clubName;
        private int memberCount;
    }

    /**
     * 탈퇴 가능
     */
    public static WithdrawalCheckResponse canWithdraw(List<OwnedClubInfo> clubsToDelete) {
        return WithdrawalCheckResponse.builder()
                .canWithdraw(true)
                .ownedClubsToDelete(clubsToDelete)
                .build();
    }

    /**
     * 탈퇴 불가 (양도 필요한 클럽 있음)
     */
    public static WithdrawalCheckResponse cannotWithdraw(String reason, List<OwnedClubInfo> clubsWithMembers) {
        return WithdrawalCheckResponse.builder()
                .canWithdraw(false)
                .reason(reason)
                .ownedClubsWithMembers(clubsWithMembers)
                .build();
    }
}
