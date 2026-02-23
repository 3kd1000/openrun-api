package com.example.openrunapi.domain.message.model.dto;

import com.example.openrunapi.domain.message.model.Message;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ConversationResponse {

    private Long partnerId;
    private String partnerName;
    private String lastMessage;        // content of the most recent message
    private LocalDateTime lastMessageAt;
    private long unreadCount;          // number of unread messages from this partner

    public static ConversationResponse from(Message latestMessage, Long currentUserId,
                                            String partnerName, long unreadCount) {
        Long partnerId = latestMessage.getSenderId().equals(currentUserId)
                ? latestMessage.getReceiverId()
                : latestMessage.getSenderId();

        return ConversationResponse.builder()
                .partnerId(partnerId)
                .partnerName(partnerName)
                .lastMessage(latestMessage.getContent())
                .lastMessageAt(latestMessage.getCreatedAt())
                .unreadCount(unreadCount)
                .build();
    }
}
