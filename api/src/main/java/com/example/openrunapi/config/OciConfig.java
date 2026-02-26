package com.example.openrunapi.config;

import com.oracle.bmc.auth.ConfigFileAuthenticationDetailsProvider;
import com.oracle.bmc.auth.InstancePrincipalsAuthenticationDetailsProvider;
import com.oracle.bmc.objectstorage.ObjectStorageClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.io.IOException;

@Slf4j
@Configuration
public class OciConfig {

    /**
     * 프로덕션/개발 환경 (K8s Instance Principal 인증)
     * - OCI 인스턴스 위에서 실행 시 API Key 없이 인증
     * - Dynamic Group + IAM Policy 설정 필요
     */
    @Bean
    @Profile("!local")
    public ObjectStorageClient objectStorageClient() {
        InstancePrincipalsAuthenticationDetailsProvider provider =
                InstancePrincipalsAuthenticationDetailsProvider.builder().build();
        return ObjectStorageClient.builder().build(provider);
    }

    /**
     * 로컬 개발 환경 (OCI CLI config 파일 기반 인증)
     * - OCI CLI 설치 후 `oci setup config`로 ~/.oci/config 생성 필요
     * - SPRING_PROFILES_ACTIVE=local 설정 필요
     */
    @Bean
    @Profile("local")
    public ObjectStorageClient objectStorageClientLocal() throws IOException {
        log.info("OCI: 로컬 개발 환경 - ConfigFile 인증 사용 (~/.oci/config)");
        ConfigFileAuthenticationDetailsProvider provider =
                new ConfigFileAuthenticationDetailsProvider("~/.oci/config", "DEFAULT");
        return ObjectStorageClient.builder().build(provider);
    }
}
