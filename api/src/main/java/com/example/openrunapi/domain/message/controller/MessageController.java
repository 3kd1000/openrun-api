package com.example.openrunapi.domain.message.controller;

import com.example.openrunapi.domain.message.model.dto.ConversationResponse;
import com.example.openrunapi.domain.message.model.dto.MessageResponse;
import com.example.openrunapi.domain.message.model.dto.ReportMessageRequest;
import com.example.openrunapi.domain.message.model.dto.SendMessageRequest;
import com.example.openrunapi.domain.message.service.MessageService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UserService userService;

    /**
     * 메시지 전송
     * POST /api/messages
     */
    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SendMessageRequest request
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        MessageResponse response = messageService.sendMessage(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 대화 목록 조회 (상대방별 최근 메시지)
     * GET /api/messages/conversations
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<ConversationResponse> conversations = messageService.getConversations(currentUser.getId());
        return ResponseEntity.ok(conversations);
    }

    /**
     * 특정 상대와의 대화 내역 조회
     * GET /api/messages/conversations/{partnerId}
     */
    @GetMapping("/conversations/{partnerId}")
    public ResponseEntity<List<MessageResponse>> getConversationWith(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long partnerId
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<MessageResponse> messages = messageService.getConversationWith(currentUser.getId(), partnerId);
        return ResponseEntity.ok(messages);
    }

    /**
     * 메시지 읽음 처리
     * PATCH /api/messages/{messageId}/read
     */
    @PatchMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        messageService.markAsRead(messageId, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * 읽지 않은 메시지 수 조회
     * GET /api/messages/unread-count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        long count = messageService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(count);
    }

    /**
     * 메시지 신고
     * POST /api/messages/report
     */
    @PostMapping("/report")
    public ResponseEntity<Void> reportMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReportMessageRequest request
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        messageService.reportMessage(currentUser.getId(), request);
        return ResponseEntity.ok().build();
    }
}
