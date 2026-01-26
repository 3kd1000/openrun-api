import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOpenRunSession } from "../../../utils/openrunSession";

/**
 * 레거시 진입 경로(/club) 호환을 위한 리다이렉트 페이지
 */
const ClubEntryRedirectPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getOpenRunSession();
    const clubId = session.currentClubId;
    if (clubId) {
      navigate(`/clubs/${clubId}`, { replace: true });
      return;
    }
    // clubId가 없으면 탐색으로 보냄
    navigate("/clubs/explore", { replace: true });
  }, [navigate]);

  return null;
};

export default ClubEntryRedirectPage;

