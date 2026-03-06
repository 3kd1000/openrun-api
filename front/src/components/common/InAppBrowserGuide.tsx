import { ExternalLink, Copy } from "lucide-react";
import { isAndroid } from "../../utils/platformDetection";

interface InAppBrowserGuideProps {
  message: string;
  onClose: () => void;
}

export default function InAppBrowserGuide({ message, onClose }: InAppBrowserGuideProps) {
  const currentUrl = window.location.href;

  const handleOpenExternal = () => {
    if (isAndroid()) {
      // Android: intent 스킴으로 Chrome에서 열기
      const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
    } else {
      // iOS: Safari에서 열기 시도 (제한적)
      window.open(currentUrl, "_system");
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert("URL이 복사되었습니다.\n브라우저를 열고 주소창에 붙여넣기 해주세요.");
    } catch {
      prompt("아래 URL을 복사하세요:", currentUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg">
        <h3 className="text-base font-semibold text-foreground mb-2">
          외부 브라우저가 필요합니다
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col gap-2.5">
          {isAndroid() && (
            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-white text-sm font-medium cursor-pointer transition-colors hover:bg-primary/90"
              onClick={handleOpenExternal}
            >
              <ExternalLink size={16} />
              Chrome으로 열기
            </button>
          )}

          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-border bg-background text-foreground text-sm font-medium cursor-pointer transition-colors hover:bg-muted"
            onClick={handleCopyUrl}
          >
            <Copy size={16} />
            URL 복사하기
          </button>

          <button
            type="button"
            className="w-full py-2 text-xs text-muted-foreground bg-transparent border-none cursor-pointer hover:text-foreground transition-colors"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground/70 text-center leading-relaxed">
          카카오톡 등 앱 내부 브라우저에서는{"\n"}
          Google 인증이 차단됩니다
        </p>
      </div>
    </div>
  );
}
