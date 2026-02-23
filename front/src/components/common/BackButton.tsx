import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function BackButton({ onClick, ariaLabel = "뒤로 가기", className }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = onClick ?? (() => navigate(-1));

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} aria-label={ariaLabel} className={className}>
      <ArrowLeft size={18} />
    </Button>
  );
}
