import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOpenRunSession } from "../../utils/openrunSession";

/**
 * 레거시 진입 경로(/club, /club/posts 등) 호환을 위한 리다이렉트 페이지
 */
type Props = { to: "home" | "posts" };

const ClubEntryRedirectPage = ({ to }: Props) => {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getOpenRunSession();
    const clubId = session.currentClubId;
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

