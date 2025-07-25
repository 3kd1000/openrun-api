package com.example.openrunapi.common.model;

public class ValidationResult {
    private final boolean valid;
    private final String message;

    private ValidationResult(boolean valid, String message) {
        this.valid = valid;
        this.message = message;
    }
    public static ValidationResult success() {
        return new ValidationResult(true, "입력이 유효합니다.");
    }
    public static ValidationResult fail(String message) {
        return new ValidationResult(false, message);
    }
    public boolean isValid() { return valid; }
    public String getMessage() { return message; }
}