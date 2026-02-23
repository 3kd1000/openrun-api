package com.example.openrunapi.domain.message.service;

import com.example.openrunapi.domain.message.model.Message;
import com.example.openrunapi.domain.message.model.MessageReport;
import com.example.openrunapi.domain.message.model.dto.ConversationResponse;
import com.example.openrunapi.domain.message.model.dto.MessageResponse;
import com.example.openrunapi.domain.message.model.dto.ReportMessageRequest;
import com.example.openrunapi.domain.message.model.dto.SendMessageRequest;
import com.example.openrunapi.domain.message.repository.MessageReportRepository;
import com.example.openrunapi.domain.message.repository.MessageRepository;
import com.example.openrunapi.domain.notification.model.NotificationType;
import com.example.openrunapi.domain.notification.service.NotificationService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final MessageReportRepository messageReportRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * 메시지 전송
     */
    @Transactional
    public MessageResponse sendMessage(Long senderId, SendMessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new UsernameNotFoundException("Sender not found: " + senderId));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found: " + request.getReceiverId()));

        if (senderId.equals(request.getReceiverId())) {
            throw new IllegalArgumentException("자기 자신에게 메시지를 보낼 수 없습니다.");
        }

        Message message = Message.builder()
                .senderId(senderId)
                .receiverId(request.getReceiverId())
                .content(request.getContent())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .build();

        messageRepository.save(message);

        // FCM 알림 전송
        try {
            notificationService.sendNotification(
                    null,
                    request.getReceiverId(),
                    sender.getPublicDisplayName() + "님의 메시지",
                    request.getContent().length() > 100
                            ? request.getContent().substring(0, 100) + "..."
                            : request.getContent(),
                    NotificationType.MESSAGE,
                    message.getId(),
                    "MESSAGE"
            );
        } catch (Exception e) {
            log.warn("Failed to send FCM for message {}: {}", message.getId(), e.getMessage());
        }

        log.info("Message sent: {} -> {} (id={})", senderId, request.getReceiverId(), message.getId());

        return MessageResponse.from(message, sender.getPublicDisplayName(), receiver.getPublicDisplayName());
    }

    /**
     * 대화 목록 조회 (상대방별 최근 메시지)
     */
    public List<ConversationResponse> getConversations(Long userId) {
        List<Message> latestMessages = messageRepository.findLatestMessagePerConversation(userId);

        return latestMessages.stream().map(msg -> {
            Long partnerId = msg.getSenderId().equals(userId) ? msg.getReceiverId() : msg.getSenderId();
            String partnerName = userRepository.findById(partnerId)
                    .map(User::getPublicDisplayName)
                    .orElse("알 수 없음");
            long unreadCount = messageRepository.countByReceiverIdAndSenderIdAndIsReadFalse(userId, partnerId);

            return ConversationResponse.from(msg, userId, partnerName, unreadCount);
        }).collect(Collectors.toList());
    }

    /**
     * 특정 상대와의 대화 내역 조회 + 읽음 처리
     */
    @Transactional
    public List<MessageResponse> getConversationWith(Long userId, Long partnerId) {
        // 상대방이 보낸 읽지 않은 메시지를 읽음 처리
        messageRepository.markAllAsReadFrom(userId, partnerId);

        List<Message> messages = messageRepository.findConversation(userId, partnerId);

        return messages.stream().map(msg -> {
            String senderName = userRepository.findById(msg.getSenderId())
                    .map(User::getPublicDisplayName)
                    .orElse("알 수 없음");
            String receiverName = userRepository.findById(msg.getReceiverId())
                    .map(User::getPublicDisplayName)
                    .orElse("알 수 없음");
            return MessageResponse.from(msg, senderName, receiverName);
        }).collect(Collectors.toList());
    }

    /**
     * 메시지 읽음 처리
     */
    @Transactional
    public void markAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found: " + messageId));

        if (!message.getReceiverId().equals(userId)) {
            throw new IllegalArgumentException("수신자만 읽음 처리할 수 있습니다.");
        }

        message.markAsRead();
    }

    /**
     * 읽지 않은 메시지 수 조회
     */
    public long getUnreadCount(Long userId) {
        return messageRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    /**
     * 메시지 신고
     */
    @Transactional
    public void reportMessage(Long reporterId, ReportMessageRequest request) {
        Message message = messageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new IllegalArgumentException("Message not found: " + request.getMessageId()));

        if (message.getSenderId().equals(reporterId)) {
            throw new IllegalArgumentException("자신이 보낸 메시지는 신고할 수 없습니다.");
        }

        if (messageReportRepository.existsByMessageIdAndReporterId(request.getMessageId(), reporterId)) {
            throw new IllegalStateException("이미 신고한 메시지입니다.");
        }

        MessageReport report = MessageReport.builder()
                .messageId(request.getMessageId())
                .reporterId(reporterId)
                .reason(request.getReason())
                .description(request.getDescription())
                .build();

        messageReportRepository.save(report);
        log.info("Message reported: messageId={}, reporterId={}, reason={}", request.getMessageId(), reporterId, request.getReason());
    }
}
