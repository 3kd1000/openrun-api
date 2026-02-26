package com.example.openrunapi.domain.message.model.dto;

import com.example.openrunapi.domain.message.model.Message;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MessageResponse {

    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private String content;
    private boolean isRead;
    private String referenceType;
    private Long referenceId;
    private LocalDateTime createdAt;

    public static MessageResponse from(Message message, String senderName, String receiverName) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .senderName(senderName)
                .receiverId(message.getReceiverId())
                .receiverName(receiverName)
                .content(message.getContent())
                .isRead(message.isRead())
                .referenceType(message.getReferenceType())
                .referenceId(message.getReferenceId())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
