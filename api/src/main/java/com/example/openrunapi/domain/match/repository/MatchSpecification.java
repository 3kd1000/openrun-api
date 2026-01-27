package com.example.openrunapi.domain.match.repository;

import com.example.openrunapi.domain.match.model.Match;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification을 사용한 동적 쿼리 빌더
 * 실무에서 복잡한 검색 조건을 처리할 때 많이 사용하는 패턴
 */
public class MatchSpecification {

    /**
     * clubId, 선수 ID, 기간으로 동적 검색
     *
     * @param clubId 클럽 ID (필수)
     * @param playerIds 선수 ID 목록 (optional, 여러 선수 중 하나라도 포함되면 검색 - OR 조건)
     * @param startDate 시작일 (optional)
     * @param endDate 종료일 (optional)
     * @return Specification
     */
    public static Specification<Match> search(Long clubId, List<Long> playerIds, LocalDateTime startDate, LocalDateTime endDate) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // clubId는 필수
            predicates.add(criteriaBuilder.equal(root.get("clubId"), clubId));

            // 선수 ID 목록이 있으면 4개 컬럼 중 하나에 포함되는지 확인 (OR 조건)
            if (playerIds != null && !playerIds.isEmpty()) {
                List<Predicate> playerPredicates = new ArrayList<>();
                for (Long playerId : playerIds) {
                    Predicate playerPredicate = criteriaBuilder.or(
                            criteriaBuilder.equal(root.get("teamAPlayer1Id"), playerId),
                            criteriaBuilder.equal(root.get("teamAPlayer2Id"), playerId),
                            criteriaBuilder.equal(root.get("teamBPlayer1Id"), playerId),
                            criteriaBuilder.equal(root.get("teamBPlayer2Id"), playerId)
                    );
                    playerPredicates.add(playerPredicate);
                }
                // 여러 선수 중 하나라도 포함되면 검색 (OR)
                predicates.add(criteriaBuilder.or(playerPredicates.toArray(new Predicate[0])));
            }

            // 시작일 필터
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("playedAt"), startDate));
            }

            // 종료일 필터
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("playedAt"), endDate));
            }

            // 정렬: playedAt DESC
            query.orderBy(criteriaBuilder.desc(root.get("playedAt")));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * 페이징용 검색 (정렬 없음 - Pageable에서 처리)
     */
    public static Specification<Match> searchWithoutSort(Long clubId, List<Long> playerIds, LocalDateTime startDate, LocalDateTime endDate) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // clubId는 필수
            predicates.add(criteriaBuilder.equal(root.get("clubId"), clubId));

            // 선수 ID 목록이 있으면 4개 컬럼 중 하나에 포함되는지 확인 (OR 조건)
            if (playerIds != null && !playerIds.isEmpty()) {
                List<Predicate> playerPredicates = new ArrayList<>();
                for (Long playerId : playerIds) {
                    Predicate playerPredicate = criteriaBuilder.or(
                            criteriaBuilder.equal(root.get("teamAPlayer1Id"), playerId),
                            criteriaBuilder.equal(root.get("teamAPlayer2Id"), playerId),
                            criteriaBuilder.equal(root.get("teamBPlayer1Id"), playerId),
                            criteriaBuilder.equal(root.get("teamBPlayer2Id"), playerId)
                    );
                    playerPredicates.add(playerPredicate);
                }
                predicates.add(criteriaBuilder.or(playerPredicates.toArray(new Predicate[0])));
            }

            // 시작일 필터
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("playedAt"), startDate));
            }

            // 종료일 필터
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("playedAt"), endDate));
            }

            // 정렬은 Pageable에서 처리하므로 여기서는 생략

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
