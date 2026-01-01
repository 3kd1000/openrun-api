import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { OAuthProvider } from "../services/api/userApi";
import { getOAuthProviders } from "../services/api/userApi";
import "./OAuthProvidersPage.css";

const OAuthProvidersPage: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await getOAuthProviders();
      setProviders(data);
    } catch (error) {
      console.error("OAuth 제공자 목록 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderDisplayName = (provider: string): string => {
    switch (provider.toUpperCase()) {
      case "GOOGLE":
        return "Google";
      case "KAKAO":
        return "카카오";
      case "NAVER":
        return "네이버";
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: string): string => {
    switch (provider.toUpperCase()) {
      case "GOOGLE":
        return "🔵";
      case "KAKAO":
        return "🟡";
      case "NAVER":
        return "🟢";
      default:
        return "🔗";
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="oauth-providers-page">
      <div className="oauth-providers-content">
        <div className="oauth-providers-header">
          <button className="back-btn" onClick={() => navigate("/more")}>
            ← 뒤로
          </button>
          <h1>연동된 계정</h1>
        </div>

        {isLoading ? (
          <div className="loading">로딩 중...</div>
        ) : providers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">🔗</p>
            <p className="empty-message">연동된 계정이 없습니다.</p>
          </div>
        ) : (
          <div className="providers-list">
            {providers.map((provider) => (
              <div key={provider.id} className="provider-item">
                <div className="provider-icon">
                  {getProviderIcon(provider.provider)}
                </div>
                <div className="provider-info">
                  <div className="provider-name">
                    {getProviderDisplayName(provider.provider)}
                  </div>
                  <div className="provider-date">
                    연동일: {formatDate(provider.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="oauth-notice">
          <h2>계정 연동 안내</h2>
          <p>
            여러 소셜 계정을 연동하여 하나의 OpenRun 계정으로 로그인할 수 있습니다.
          </p>
          <p>
            동일한 이메일을 사용하는 소셜 계정은 자동으로 하나의 계정으로 통합됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OAuthProvidersPage;
