import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { OAuthProvider } from "../../services/api/userApi";
import { getOAuthProviders } from "../../services/api/userApi";
import { GoogleIcon, KakaoIcon, LinkIcon, NaverIcon } from "../../components/common/Icons";
import { AppHeader } from "../../components/common/AppHeader";

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

  const renderProviderIcon = (provider: string) => {
    const p = provider.toUpperCase();
    if (p === "GOOGLE") return <GoogleIcon size={24} />;
    if (p === "KAKAO") return <KakaoIcon size={24} />;
    if (p === "NAVER") return <NaverIcon size={24} />;
    return <LinkIcon size={24} color="currentColor" />;
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
    <div className="min-h-[calc(100vh-140px)]">
      <AppHeader title="연동된 계정" onBack={() => navigate(-1)} />
      <div className="max-w-[600px] mx-auto p-4">

        {isLoading ? (
          <div className="text-center py-8 text-base text-muted-foreground">로딩 중...</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-8">
            <p className="mb-4 flex items-center justify-center text-muted-foreground">
              <LinkIcon size={64} />
            </p>
            <p className="text-base text-muted-foreground m-0">연동된 계정이 없습니다.</p>
          </div>
        ) : (
          <div className="mb-8">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center gap-4 max-[425px]:gap-3 max-[359px]:gap-3 p-4 max-[768px]:p-3 max-[425px]:p-3 max-[359px]:p-3 bg-card border border-border rounded-sm mb-2 transition-all duration-200 min-h-[72px] max-[768px]:min-h-[68px] max-[425px]:min-h-[64px] max-[359px]:min-h-[60px] hover:bg-muted hover:border-primary hover:-translate-y-px hover:shadow-sm"
              >
                <div className="shrink-0 w-12 h-12 max-[768px]:w-11 max-[768px]:h-11 max-[425px]:w-10 max-[425px]:h-10 max-[359px]:w-9 max-[359px]:h-9 flex items-center justify-center bg-muted rounded-full text-muted-foreground">
                  {renderProviderIcon(provider.provider)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-semibold text-foreground mb-1">
                    {getProviderDisplayName(provider.provider)}
                  </div>
                  <div className="text-sm max-[425px]:text-sm max-[359px]:text-sm text-muted-foreground">
                    연동일: {formatDate(provider.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-muted rounded-md p-6 max-[768px]:p-4 max-[425px]:p-3 max-[359px]:p-3">
          <h2 className="text-lg max-[768px]:text-base max-[425px]:text-sm max-[359px]:text-sm font-bold text-foreground mt-0 mb-4">계정 연동 안내</h2>
          <p className="text-base max-[768px]:text-sm max-[425px]:text-sm max-[359px]:text-sm text-muted-foreground leading-relaxed mt-0 mb-2">
            여러 소셜 계정을 연동하여 하나의 OpenRun 계정으로 로그인할 수 있습니다.
          </p>
          <p className="text-base max-[768px]:text-sm max-[425px]:text-sm max-[359px]:text-sm text-muted-foreground leading-relaxed mt-0 mb-0">
            동일한 이메일을 사용하는 소셜 계정은 자동으로 하나의 계정으로 통합됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OAuthProvidersPage;
