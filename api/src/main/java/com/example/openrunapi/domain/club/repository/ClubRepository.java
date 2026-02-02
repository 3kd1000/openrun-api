package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long>, JpaSpecificationExecutor<Club> {

    /**
     * 클럽 이름으로 조회 (시스템 클럽 조회용)
     */
    Optional<Club> findByName(String name);
}
