package com.example.openrunapi.domain.migration.controller;

import com.example.openrunapi.domain.migration.service.MigrationService;
import com.example.openrunapi.domain.migration.service.MigrationService.MigrationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/migration")
@RequiredArgsConstructor
public class MigrationController {

    private final MigrationService migrationService;

    /**
     * 전체 데이터 마이그레이션 (개발/테스트용)
     * POST /api/migration/all
     *
     * @param csvFile CSV 파일 (multipart/form-data)
     * @return 마이그레이션 결과 (생성된 사용자 수, 경기 수)
     */
    @PostMapping("/all")
    public ResponseEntity<MigrationResponse> migrateAll(
            @RequestParam("file") MultipartFile csvFile
    ) {
        log.info("=== 전체 데이터 마이그레이션 요청 ===");
        log.info("파일명: {}, 크기: {} bytes", csvFile.getOriginalFilename(), csvFile.getSize());

        try {
            MigrationResult result = migrationService.migrateAll(csvFile);

            MigrationResponse response = MigrationResponse.builder()
                    .success(true)
                    .createdUsers(result.createdUsers())
                    .createdMatches(result.createdMatches())
                    .message("전체 데이터 마이그레이션 성공")
                    .build();

            log.info("마이그레이션 성공: 사용자 {} 명, 경기 {} 건", result.createdUsers(), result.createdMatches());
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("CSV 파일 읽기 실패", e);
            return ResponseEntity.badRequest().body(
                    MigrationResponse.error("CSV 파일 읽기 실패: " + e.getMessage())
            );
        } catch (Exception e) {
            log.error("마이그레이션 실패", e);
            return ResponseEntity.internalServerError().body(
                    MigrationResponse.error("마이그레이션 실패: " + e.getMessage())
            );
        }
    }

    /**
     * 특정 선수 경기 마이그레이션 (운영용)
     * POST /api/migration/player/{playerName}
     *
     * @param playerName 선수 이름
     * @param csvFile CSV 파일 (multipart/form-data)
     * @return 마이그레이션 결과
     */
    @PostMapping("/player/{playerName}")
    public ResponseEntity<MigrationResponse> migrateForPlayer(
            @PathVariable String playerName,
            @RequestParam("file") MultipartFile csvFile
    ) {
        log.info("=== {} 선수 경기 마이그레이션 요청 ===", playerName);
        log.info("파일명: {}, 크기: {} bytes", csvFile.getOriginalFilename(), csvFile.getSize());

        try {
            MigrationResult result = migrationService.migrateForPlayer(playerName, csvFile);

            MigrationResponse response = MigrationResponse.builder()
                    .success(true)
                    .createdUsers(result.createdUsers())
                    .createdMatches(result.createdMatches())
                    .message(String.format("%s 선수 경기 마이그레이션 성공", playerName))
                    .build();

            log.info("{} 마이그레이션 성공: 사용자 {} 명, 경기 {} 건",
                    playerName, result.createdUsers(), result.createdMatches());
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("CSV 파일 읽기 실패", e);
            return ResponseEntity.badRequest().body(
                    MigrationResponse.error("CSV 파일 읽기 실패: " + e.getMessage())
            );
        } catch (Exception e) {
            log.error("{} 마이그레이션 실패", playerName, e);
            return ResponseEntity.internalServerError().body(
                    MigrationResponse.error("마이그레이션 실패: " + e.getMessage())
            );
        }
    }

    /**
     * 마이그레이션 응답 DTO
     */
    @lombok.Getter
    @lombok.Builder
    public static class MigrationResponse {
        private boolean success;
        private Integer createdUsers;
        private Integer createdMatches;
        private String message;

        public static MigrationResponse error(String message) {
            return MigrationResponse.builder()
                    .success(false)
                    .createdUsers(0)
                    .createdMatches(0)
                    .message(message)
                    .build();
        }
    }
}
