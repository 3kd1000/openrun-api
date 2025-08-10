package com.example.openrunapi.domain.draw.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.openrunapi.domain.draw.model.dto.CreateDrawRequest;
import com.example.openrunapi.domain.draw.model.dto.DrawResponse;
import com.example.openrunapi.domain.draw.service.DrawService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/draw")
public class DrawController {
    private final DrawService drawService;

    @PostMapping
    public ResponseEntity<DrawResponse> createDraw(@RequestBody CreateDrawRequest createDrawRequest) {
        DrawResponse response = drawService.generateDrawSequence(createDrawRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/share-format")
    public ResponseEntity<String> getDrawShareFormat(@RequestBody CreateDrawRequest request) {
        String shareText = drawService.formatDrawForSharing(drawService.generateDrawSequence(request));
        return ResponseEntity.ok(shareText);
    }
}
