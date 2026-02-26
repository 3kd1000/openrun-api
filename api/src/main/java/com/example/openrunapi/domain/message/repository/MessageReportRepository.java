package com.example.openrunapi.domain.message.repository;

import com.example.openrunapi.domain.message.model.MessageReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageReportRepository extends JpaRepository<MessageReport, Long> {
    boolean existsByMessageIdAndReporterId(Long messageId, Long reporterId);
}
