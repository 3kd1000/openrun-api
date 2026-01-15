import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 레거시 진입 경로(/club, /club/posts 등) 호환을 위한 리다이렉트 페이지
 */
type Props = { to: "home" | "posts" };

const ClubEntryRedirectPage = ({ to }: Props) => {
  const navigate = useNavigate();

  useEffect(() => {
    const clubId = localStorage.getItem("current_club_id");
    if (clubId) {
      navigate(to === "posts" ? `/clubs/${clubId}/posts` : `/clubs/${clubId}`, {
        replace: true,
      });
      return;
    }
    // clubId가 없으면 탐색으로 보냄
    navigate("/clubs/explore", { replace: true });
  }, [navigate, to]);

  return null;
};

export default ClubEntryRedirectPage;

