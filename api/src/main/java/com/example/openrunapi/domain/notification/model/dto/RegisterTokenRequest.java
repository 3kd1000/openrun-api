package com.example.openrunapi.domain.notification.model.dto;

import com.example.openrunapi.domain.notification.model.DeviceType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterTokenRequest {
    @NotBlank
    private String token;
    private String deviceInfo;
    private DeviceType deviceType;

    /**
     * deviceType이 null인 경우 deviceInfo에서 추정
     */
    public DeviceType getResolvedDeviceType() {
        if (deviceType != null) {
            return deviceType;
        }
        if (deviceInfo == null) {
            return DeviceType.UNKNOWN;
        }
        String info = deviceInfo.toLowerCase();
        if (info.contains("iphone") || info.contains("ipad")
                || info.contains("android") || info.contains("mobile")) {
            return DeviceType.MOBILE;
        }
        return DeviceType.DESKTOP;
    }
}
