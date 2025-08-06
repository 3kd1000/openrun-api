package com.example.openrunapi.domain.draw.repository;

import com.example.openrunapi.domain.draw.model.DrawStatistics;
import com.example.openrunapi.domain.draw.model.DrawType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DrawStatisticsRepository extends JpaRepository<DrawStatistics, Long> {
    Optional<DrawStatistics> findByDrawType(DrawType drawType);
}