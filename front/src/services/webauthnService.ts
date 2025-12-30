import axiosInstance from "./api/axiosInstance";

export interface WebAuthnChallengeResponse {
  challenge: string;
  rpId: string;
  rpName: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  timeout: number;
}

export interface WebAuthnCredentialResponse {
  id: number;
  deviceName: string;
  transports: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface WebAuthnLoginResponse {
  customToken: string;
  userId: number;
  userName: string;
  email: string;
}

/**
 * Base64URL 디코딩
 */
function base64URLToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * ArrayBuffer를 Base64URL 인코딩
 */
function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

class WebAuthnService {
  /**
   * WebAuthn 브라우저 지원 여부 확인
   */
  isSupported(): boolean {
    return (
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined
    );
  }

  /**
   * 생체인증 등록 시작
   */
  async  registerStart(): Promise<WebAuthnChallengeResponse> {
    const response = await axiosInstance.post<WebAuthnChallengeResponse>(
      "/webauthn/register/options"
    );
    return response.data;
  }

  /**
   * 생체인증 등록 완료
   */
  async registerFinish(
    challenge: WebAuthnChallengeResponse,
    deviceName: string
  ): Promise<WebAuthnCredentialResponse> {
    try {
      // PublicKeyCredentialCreationOptions 생성
      const credentialCreationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: base64URLToBuffer(challenge.challenge),
          rp: {
            name: challenge.rpName,
            id: challenge.rpId,
          },
          user: {
            id: base64URLToBuffer(challenge.userId),
            name: challenge.userName,
            displayName: challenge.userDisplayName,
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // 플랫폼 인증기 (Face ID, Touch ID)
            userVerification: "required",
            residentKey: "required", // discoverable credentials 강제 (Android 호환성)
          },
          timeout: challenge.timeout,
          attestation: "none",
        },
      };

      // 브라우저의 WebAuthn API 호출
      const credential = (await navigator.credentials.create(
        credentialCreationOptions
      )) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("Credential creation failed");
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const transports = response.getTransports?.() || [];

      // 서버에 등록 요청
      const result = await axiosInstance.post<WebAuthnCredentialResponse>(
        "/webauthn/register",
        {
          credentialId: bufferToBase64URL(credential.rawId),
          publicKey: bufferToBase64URL(response.getPublicKey()!),
          attestationObject: bufferToBase64URL(response.attestationObject),
          clientDataJSON: bufferToBase64URL(response.clientDataJSON),
          transports,
          deviceName,
        }
      );

      return result.data;
    } catch (error) {
      console.error("WebAuthn registration error:", error);
      throw error;
    }
  }

  /**
   * 생체인증 인증 시작
   */
  async authenticateStart(): Promise<WebAuthnChallengeResponse> {
    const response = await axiosInstance.post<WebAuthnChallengeResponse>(
      "/webauthn/authenticate/options"
    );
    return response.data;
  }

  /**
   * 생체인증 인증 완료
   */
  async authenticateFinish(
    challenge: WebAuthnChallengeResponse
  ): Promise<boolean> {
    try {
      // PublicKeyCredentialRequestOptions 생성
      const credentialRequestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: base64URLToBuffer(challenge.challenge),
          rpId: challenge.rpId,
          timeout: challenge.timeout,
          userVerification: "required",
        },
      };

      // 브라우저의 WebAuthn API 호출
      const credential = (await navigator.credentials.get(
        credentialRequestOptions
      )) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("Authentication failed");
      }

      const response = credential.response as AuthenticatorAssertionResponse;

      // 서버에 인증 요청
      const result = await axiosInstance.post<{ success: boolean }>(
        "/webauthn/authenticate",
        {
          credentialId: bufferToBase64URL(credential.rawId),
          authenticatorData: bufferToBase64URL(response.authenticatorData),
          clientDataJSON: bufferToBase64URL(response.clientDataJSON),
          signature: bufferToBase64URL(response.signature),
          userHandle: response.userHandle
            ? bufferToBase64URL(response.userHandle)
            : null,
        }
      );

      return result.data.success;
    } catch (error) {
      console.error("WebAuthn authentication error:", error);
      throw error;
    }
  }

  /**
   * 등록된 인증기 목록 조회
   */
  async getCredentials(): Promise<WebAuthnCredentialResponse[]> {
    const response = await axiosInstance.get<WebAuthnCredentialResponse[]>(
      "/webauthn/credentials"
    );
    return response.data;
  }

  /**
   * 인증기 삭제
   */
  async deleteCredential(credentialId: number): Promise<void> {
    await axiosInstance.delete(`/webauthn/credentials/${credentialId}`);
  }

  /**
   * WebAuthn 등록 여부 확인
   */
  async hasWebAuthn(): Promise<boolean> {
    const response = await axiosInstance.get<{ hasWebAuthn: boolean }>(
      "/webauthn/status"
    );
    return response.data.hasWebAuthn;
  }

  /**
   * WebAuthn 단독 로그인 (OAuth 없이 생체인증만으로 로그인)
   * 등록된 Credential을 사용하여 로그인하고 Firebase Custom Token을 받음
   */
  async loginWithWebAuthn(): Promise<WebAuthnLoginResponse> {
    try {
      // 브라우저의 WebAuthn API 호출 (사전 인증 없이 바로 호출)
      // rpId는 현재 도메인에서 자동으로 가져옴
      const credentialRequestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: new Uint8Array(32), // 임시 challenge (서버에서 검증 안 함)
          timeout: 60000,
          userVerification: "required",
          // allowCredentials를 비워두면 등록된 모든 credential을 사용할 수 있음 (discoverable credentials)
        },
      };

      // 브라우저의 WebAuthn API 호출
      const credential = (await navigator.credentials.get(
        credentialRequestOptions
      )) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("생체인증에 실패했습니다.");
      }

      const response = credential.response as AuthenticatorAssertionResponse;

      // 서버에 로그인 요청 (public endpoint)
      const result = await axiosInstance.post<WebAuthnLoginResponse>(
        "/webauthn/login",
        {
          credentialId: bufferToBase64URL(credential.rawId),
          authenticatorData: bufferToBase64URL(response.authenticatorData),
          clientDataJSON: bufferToBase64URL(response.clientDataJSON),
          signature: bufferToBase64URL(response.signature),
          userHandle: response.userHandle
            ? bufferToBase64URL(response.userHandle)
            : null,
        }
      );

      return result.data;
    } catch (error) {
      console.error("WebAuthn login error:", error);
      throw error;
    }
  }
}

export const webauthnService = new WebAuthnService();
