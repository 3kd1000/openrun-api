package com.example.openrunapi.domain.club.controller;

import com.example.openrunapi.domain.club.model.dto.ClubResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubRequest;
import com.example.openrunapi.domain.club.service.ClubService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;

    @PostMapping
    public ResponseEntity<ClubResponse> createClub(@Valid @RequestBody CreateClubRequest request) {
        // TODO: 추후 인증(Authentication) 기능 구현 시, 실제 인증된 사용자 ID를 가져와야 함
        Long currentUserId = 1L; // 임시 사용자 ID

        ClubResponse response = clubService.createClub(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{clubId}")
    public ResponseEntity<ClubResponse> findClub(@PathVariable Long clubId) {
        ClubResponse response = clubService.findClub(clubId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<ClubResponse>> findClubs(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ClubResponse> responses = clubService.findClubs(keyword, pageable);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{clubId}")
    public ResponseEntity<ClubResponse> updateClub(@PathVariable Long clubId,
                                                 @Valid @RequestBody UpdateClubRequest request) {
        // TODO: 추후 인증(Authentication) 기능 구현 시, 실제 인증된 사용자 ID를 가져와야 함
        Long currentUserId = 1L; // 임시 사용자 ID

        ClubResponse response = clubService.updateClub(clubId, request, currentUserId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{clubId}")
    public ResponseEntity<Void> deleteClub(@PathVariable Long clubId) {
        // TODO: 추후 인증(Authentication) 기능 구현 시, 실제 인증된 사용자 ID를 가져와야 함
        Long currentUserId = 1L; // 임시 사용자 ID

        clubService.deleteClub(clubId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
