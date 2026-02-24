package com.example.openrunapi.infrastructure.objectstorage;

import com.oracle.bmc.objectstorage.ObjectStorageClient;
import com.oracle.bmc.objectstorage.requests.DeleteObjectRequest;
import com.oracle.bmc.objectstorage.requests.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ObjectStorageService {

    private final ObjectStorageClient objectStorageClient;

    @Value("${oci.bucket-name}")
    private String bucketName;

    @Value("${oci.region}")
    private String region;

    @Value("${oci.namespace}")
    private String namespace;

    /**
     * 클럽 로고 업로드
     * - 512x512 (상세용)와 128x128 (썸네일용) 두 사이즈로 저장
     * - 원본 비율 유지, PNG 변환
     *
     * @param clubId      클럽 ID
     * @param inputStream 원본 이미지 스트림
     * @return 두 사이즈의 공개 URL
     */
    public ClubLogoUrls uploadClubLogo(Long clubId, InputStream inputStream) throws IOException {
        byte[] originalBytes = inputStream.readAllBytes();

        uploadResized(clubId, originalBytes, 512);
        uploadResized(clubId, originalBytes, 128);

        return new ClubLogoUrls(buildPublicUrl(clubId, 512), buildPublicUrl(clubId, 128));
    }

    /**
     * 클럽 로고 삭제 (두 사이즈 모두 삭제)
     */
    public void deleteClubLogo(Long clubId) {
        for (int size : new int[]{512, 128}) {
            String objectName = buildObjectName(clubId, size);
            try {
                objectStorageClient.deleteObject(DeleteObjectRequest.builder()
                        .namespaceName(namespace)
                        .bucketName(bucketName)
                        .objectName(objectName)
                        .build());
                log.debug("OCI 로고 삭제 완료: {}", objectName);
            } catch (Exception e) {
                log.warn("OCI 로고 삭제 실패 (무시): objectName={}, error={}", objectName, e.getMessage());
            }
        }
    }

    private void uploadResized(Long clubId, byte[] originalBytes, int size) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Thumbnails.of(new ByteArrayInputStream(originalBytes))
                .size(size, size)
                .keepAspectRatio(true)
                .outputFormat("png")
                .toOutputStream(out);

        byte[] resized = out.toByteArray();
        String objectName = buildObjectName(clubId, size);

        objectStorageClient.putObject(PutObjectRequest.builder()
                .namespaceName(namespace)
                .bucketName(bucketName)
                .objectName(objectName)
                .contentLength((long) resized.length)
                .contentType("image/png")
                .putObjectBody(new ByteArrayInputStream(resized))
                .build());

        log.debug("OCI 로고 업로드 완료: {}", objectName);
    }

    private String buildObjectName(Long clubId, int size) {
        return String.format("clubs/%d/logo_%d.png", clubId, size);
    }

    private String buildPublicUrl(Long clubId, int size) {
        return String.format(
                "https://objectstorage.%s.oraclecloud.com/n/%s/b/%s/o/clubs/%d/logo_%d.png",
                region, namespace, bucketName, clubId, size
        );
    }
}
