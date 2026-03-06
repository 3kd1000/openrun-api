import { Users, Link2, ExternalLink, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";

interface MemberInviteGuideProps {
  clubId: string;
  onDismiss: () => void;
}

export default function MemberInviteGuide({ clubId, onDismiss }: MemberInviteGuideProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/clubs/${clubId}/recruiting`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("초대링크가 복사되었습니다", "success");
    } catch {
      prompt("아래 링크를 복사하세요:", url);
    }
  };

  return (
    <div className="relative mx-0 my-2 rounded-lg border-l-4 border-l-primary border border-border bg-card p-4">
      <button
        type="button"
        className="absolute top-2 right-2 p-1 bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
        onClick={onDismiss}
        aria-label="닫기"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <Users className="mt-0.5 h-8 w-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            클럽원을 초대해보세요!
          </h3>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            클럽 초대 페이지를 공유하여 멤버를 모집할 수 있습니다.
            카카오톡이나 SNS로 링크를 보내보세요.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-white text-xs font-medium text-foreground cursor-pointer transition-colors hover:bg-muted"
              onClick={() => navigate(`/clubs/${clubId}/recruiting`)}
            >
              <ExternalLink size={12} />
              클럽소개 보기
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border-none bg-primary text-xs font-medium text-white cursor-pointer transition-colors hover:bg-primary/90"
              onClick={handleCopyLink}
            >
              <Link2 size={12} />
              링크복사
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
