package com.example.openrunapi.domain.post.model;

public enum PostType {
    NOTICE("공지사항"),
    GENERAL("자유게시판"),
    INQUIRY("문의게시판");

    private final String description;

    PostType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
