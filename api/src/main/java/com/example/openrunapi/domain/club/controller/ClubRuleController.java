package com.example.openrunapi.domain.club.controller;

import com.example.openrunapi.domain.club.model.dto.ClubRuleResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubRuleRequest;
import com.example.openrunapi.domain.club.model.dto.ReorderClubRulesRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubRuleRequest;
import com.example.openrunapi.domain.club.service.ClubRuleService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs/{clubId}/rules")
@RequiredArgsConstructor
public class ClubRuleController {

    private final ClubRuleService clubRuleService;
    private final UserService userService;

    /**
     * 클럽 회칙 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<ClubRuleResponse>> getClubRules(
            @PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<ClubRuleResponse> rules = clubRuleService.getClubRules(clubId, currentUser.getId());
        return ResponseEntity.ok(rules);
    }

    /**
     * 클럽 회칙 생성
     */
    @PostMapping
    public ResponseEntity<ClubRuleResponse> createClubRule(
            @PathVariable Long clubId,
            @Valid @RequestBody CreateClubRuleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ClubRuleResponse response = clubRuleService.createClubRule(clubId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 클럽 회칙 수정
     */
    @PutMapping("/{ruleId}")
    public ResponseEntity<ClubRuleResponse> updateClubRule(
            @PathVariable Long clubId,
            @PathVariable Long ruleId,
            @Valid @RequestBody UpdateClubRuleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ClubRuleResponse response = clubRuleService.updateClubRule(ruleId, request, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 클럽 회칙 삭제
     */
    @DeleteMapping("/{ruleId}")
    public ResponseEntity<Void> deleteClubRule(
            @PathVariable Long clubId,
            @PathVariable Long ruleId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        clubRuleService.deleteClubRule(ruleId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * 클럽 회칙 순서 변경
     */
    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorderClubRules(
            @PathVariable Long clubId,
            @Valid @RequestBody ReorderClubRulesRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        clubRuleService.reorderClubRules(clubId, request.getOrders(), currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
