package com.example.openrunapi.common.converter;

import com.example.openrunapi.common.utils.AESCipher;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * JPA Attribute Converter for automatic encryption/decryption
 * DB 저장 시 자동 암호화, 조회 시 자동 복호화
 */
@Component
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private final AESCipher cipher;

    public EncryptedStringConverter(@Value("${encryption.key:default-encryption-key-change-in-production}") String encryptionKey) {
        this.cipher = new AESCipher(encryptionKey);
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.trim().isEmpty()) {
            return null;
        }
        return cipher.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }

        try {
            // 암호화된 데이터 복호화 시도
            return cipher.decrypt(dbData);
        } catch (Exception e) {
            // 복호화 실패 시 plain-text로 간주 (기존 데이터 호환성)
            // 다음 저장 시 자동으로 암호화됨
            return dbData;
        }
    }
}
