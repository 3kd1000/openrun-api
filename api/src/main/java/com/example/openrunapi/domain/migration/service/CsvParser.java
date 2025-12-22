package com.example.openrunapi.domain.migration.service;

import com.example.openrunapi.domain.migration.model.dto.CsvMatchRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class CsvParser {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * CSV 파일을 파싱하여 경기 기록 목록 반환
     *
     * CSV 형식 (셀 병합 포함):
     * A: 날짜/장소 (병합), B: 선수1, C: 선수2, D: 결과, E: 점수, F: 점수, G: 결과, H: 선수3, I: 선수4
     */
    public List<CsvMatchRecord> parseMatches(MultipartFile file) throws IOException {
        List<CsvMatchRecord> matches = new ArrayList<>();

        // 셀 병합 처리를 위한 이전 값 저장
        String lastDate = null;
        String lastLocation = null;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;

                // 빈 줄 스킵
                if (line.trim().isEmpty()) {
                    continue;
                }

                // CSV 파싱 (콤마 구분, 따옴표 처리)
                String[] columns = parseCSVLine(line);

                // 최소 9개 컬럼 필요 (A~I)
                if (columns.length < 9) {
                    log.warn("라인 {}: 컬럼 수 부족 ({}개) - 스킵", lineNumber, columns.length);
                    continue;
                }

                try {
                    // A컬럼: 날짜/장소 파싱 (셀 병합 처리)
                    String dateLocationCell = columns[0].trim();
                    if (!dateLocationCell.isEmpty()) {
                        // "20250906\n편편" 또는 "20250906 편편" 형식
                        String[] parts = dateLocationCell.split("[\\n\\s]+");
                        if (parts.length >= 1) {
                            lastDate = parts[0];
                        }
                        if (parts.length >= 2) {
                            lastLocation = parts[1];
                        }
                    }

                    // 날짜/장소가 없으면 스킵
                    if (lastDate == null || lastLocation == null) {
                        continue;
                    }

                    // 날짜 파싱: 20250906 → 2025-09-06
                    LocalDate date = LocalDate.parse(lastDate, DATE_FORMATTER);

                    // CsvMatchRecord 생성
                    CsvMatchRecord match = CsvMatchRecord.builder()
                            .date(date)
                            .location(lastLocation)
                            .teamAPlayer1(columns[1].trim())
                            .teamAPlayer2(columns[2].trim())
                            .teamAResult(columns[3].trim())
                            .teamAScore(parseInteger(columns[4]))
                            .teamBScore(parseInteger(columns[5]))
                            .teamBResult(columns[6].trim())
                            .teamBPlayer1(columns[7].trim())
                            .teamBPlayer2(columns[8].trim())
                            .build();

                    matches.add(match);
                    log.debug("파싱 성공: {} {} vs {} - {}:{}",
                            date, match.getTeamAPlayer1(), match.getTeamBPlayer1(),
                            match.getTeamAScore(), match.getTeamBScore());

                } catch (Exception e) {
                    log.error("라인 {} 파싱 실패: {}", lineNumber, e.getMessage());
                }
            }
        }

        log.info("CSV 파싱 완료: 총 {} 경기", matches.size());
        return matches;
    }

    /**
     * CSV에서 모든 선수 이름 추출 (중복 제거)
     */
    public Set<String> extractAllPlayerNames(List<CsvMatchRecord> matches) {
        Set<String> names = new HashSet<>();

        for (CsvMatchRecord match : matches) {
            if (match.getTeamAPlayer1() != null && !match.getTeamAPlayer1().isEmpty()) {
                names.add(match.getTeamAPlayer1());
            }
            if (match.getTeamAPlayer2() != null && !match.getTeamAPlayer2().isEmpty()) {
                names.add(match.getTeamAPlayer2());
            }
            if (match.getTeamBPlayer1() != null && !match.getTeamBPlayer1().isEmpty()) {
                names.add(match.getTeamBPlayer1());
            }
            if (match.getTeamBPlayer2() != null && !match.getTeamBPlayer2().isEmpty()) {
                names.add(match.getTeamBPlayer2());
            }
        }

        log.info("추출된 선수 수: {}", names.size());
        return names;
    }

    /**
     * CSV 라인 파싱 (따옴표, 콤마 처리)
     */
    private String[] parseCSVLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }

        tokens.add(current.toString());
        return tokens.toArray(new String[0]);
    }

    /**
     * 문자열을 Integer로 변환 (실패 시 null)
     */
    private Integer parseInteger(String value) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
