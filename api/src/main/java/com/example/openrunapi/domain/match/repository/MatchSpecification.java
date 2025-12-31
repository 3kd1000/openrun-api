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
     * @param playerId 선수 ID (optional)
     * @param startDate 시작일 (optional)
     * @param endDate 종료일 (optional)
     * @return Specification
     */
    public static Specification<Match> search(Long clubId, Long playerId, LocalDateTime startDate, LocalDateTime endDate) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // clubId는 필수
            predicates.add(criteriaBuilder.equal(root.get("clubId"), clubId));

            // 선수 ID가 있으면 4개 컬럼 중 하나에 포함되는지 확인
            if (playerId != null) {
                Predicate playerPredicate = criteriaBuilder.or(
                        criteriaBuilder.equal(root.get("teamAPlayer1Id"), playerId),
                        criteriaBuilder.equal(root.get("teamAPlayer2Id"), playerId),
                        criteriaBuilder.equal(root.get("teamBPlayer1Id"), playerId),
                        criteriaBuilder.equal(root.get("teamBPlayer2Id"), playerId)
                );
                predicates.add(playerPredicate);
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
}
