package com.example.openrunapi.common.utils;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * AES-256-CBC 암호화/복호화 유틸리티
 * 개인정보(이메일, 전화번호) 보호용
 */
public class AESCipher {
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String KEY_ALGORITHM = "AES";
    private static final int KEY_SIZE = 32; // 256 bits
    private static final int IV_SIZE = 16; // 128 bits

    private final SecretKeySpec secretKey;

    public AESCipher(String encryptionKey) {
        if (encryptionKey == null || encryptionKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Encryption key must not be null or empty");
        }
        this.secretKey = generateKey(encryptionKey);
    }

    /**
     * 평문을 암호화하여 Base64 인코딩된 문자열 반환
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return null;
        }

        try {
            // 랜덤 IV 생성
            byte[] iv = generateIV();
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // IV + 암호문을 합쳐서 Base64 인코딩
            byte[] combined = new byte[IV_SIZE + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_SIZE);
            System.arraycopy(encrypted, 0, combined, IV_SIZE, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Base64 인코딩된 암호문을 복호화하여 평문 반환
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return null;
        }

        try {
            byte[] combined = Base64.getDecoder().decode(encryptedText);

            // IV 추출
            byte[] iv = new byte[IV_SIZE];
            System.arraycopy(combined, 0, iv, 0, IV_SIZE);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            // 암호문 추출
            byte[] encrypted = new byte[combined.length - IV_SIZE];
            System.arraycopy(combined, IV_SIZE, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);
            byte[] decrypted = cipher.doFinal(encrypted);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }

    /**
     * 암호화 키 생성 (SHA-256 해시 사용)
     */
    private SecretKeySpec generateKey(String key) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha.digest(key.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, KEY_ALGORITHM);
        } catch (Exception e) {
            throw new RuntimeException("Key generation failed", e);
        }
    }

    /**
     * 랜덤 IV 생성
     */
    private byte[] generateIV() {
        byte[] iv = new byte[IV_SIZE];
        new java.security.SecureRandom().nextBytes(iv);
        return iv;
    }
}
