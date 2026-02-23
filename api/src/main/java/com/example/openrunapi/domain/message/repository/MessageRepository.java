package com.example.openrunapi.domain.message.repository;

import com.example.openrunapi.domain.message.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // 두 사용자 간의 메시지 조회 (시간순 오름차순)
    @Query("SELECT m FROM Message m WHERE (m.senderId = :userId1 AND m.receiverId = :userId2) OR (m.senderId = :userId2 AND m.receiverId = :userId1) ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // 사용자의 대화 상대 목록 (각 상대와의 최신 메시지)
    @Query(value = """
            SELECT DISTINCT ON (partner_id) *
            FROM (
                SELECT m.*, CASE WHEN m.sender_id = :userId THEN m.receiver_id ELSE m.sender_id END AS partner_id
                FROM messages m
                WHERE m.sender_id = :userId OR m.receiver_id = :userId
            ) sub
            ORDER BY partner_id, created_at DESC
            """, nativeQuery = true)
    List<Message> findLatestMessagePerConversation(@Param("userId") Long userId);

    // 읽지 않은 메시지 총 수
    long countByReceiverIdAndIsReadFalse(Long receiverId);

    // 특정 상대로부터 읽지 않은 메시지 수
    long countByReceiverIdAndSenderIdAndIsReadFalse(Long receiverId, Long senderId);

    // 특정 상대로부터 읽지 않은 메시지를 모두 읽음 처리
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.receiverId = :receiverId AND m.senderId = :senderId AND m.isRead = false")
    void markAllAsReadFrom(@Param("receiverId") Long receiverId, @Param("senderId") Long senderId);
}
