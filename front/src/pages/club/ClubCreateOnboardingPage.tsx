import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  SettingsIcon,
  EditIcon,
  ChevronRightIcon,
} from "../../components/common/Icons";
import "./ClubCreateOnboardingPage.css";

const ClubCreateOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const id = clubId ? Number(clubId) : null;

  const handleBack = () => {
    if (!clubId) {
      navigate("/clubs/explore");
      return;
    }
    navigate(`/clubs/${clubId}`);
  };

  if (!id || !Number.isFinite(id)) {
    return (
      <div className="club-create-onboarding-page">
        <div className="club-create-onboarding-page__header">
          <button
            className="club-create-onboarding-page__back-btn"
            onClick={() => navigate("/clubs/explore")}
          >
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="club-create-onboarding-page__title">클럽 생성 완료</h1>
          <div className="club-create-onboarding-page__header-spacer" />
        </div>
        <div className="club-create-onboarding-page__error">
          클럽 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="club-create-onboarding-page">
      <div className="club-create-onboarding-page__header">
        <button
          className="club-create-onboarding-page__back-btn"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-create-onboarding-page__title">클럽 생성 완료</h1>
        <div className="club-create-onboarding-page__header-spacer" />
      </div>

      <div className="club-create-onboarding-page__card">
        <div className="club-create-onboarding-page__headline">
          다음 작업을 이어서 진행해보세요
        </div>
        <div className="club-create-onboarding-page__sub">
          가입 승인 방식은 <b>승인 필요</b>, 교류전 모집 상태는 <b>CLOSED</b>로
          시작합니다.
        </div>

        <button
          className="club-create-onboarding-page__cta"
          onClick={() => navigate(`/clubs/${clubId}/manage/policy`)}
        >
          <span className="club-create-onboarding-page__cta-left">
            <SettingsIcon size={18} />
            운영 정책 설정
          </span>
          <ChevronRightIcon size={18} />
        </button>

        <button
          className="club-create-onboarding-page__cta"
          onClick={() => navigate(`/clubs/${clubId}/manage/info`)}
        >
          <span className="club-create-onboarding-page__cta-left">
            <EditIcon size={18} />
            클럽 정보 수정
          </span>
          <ChevronRightIcon size={18} />
        </button>

        <button
          className="club-create-onboarding-page__cta club-create-onboarding-page__cta--secondary"
          onClick={() => navigate(`/clubs/${clubId}`)}
        >
          <span className="club-create-onboarding-page__cta-left">
            클럽 홈으로 이동
          </span>
          <ChevronRightIcon size={18} />
        </button>
      </div>
    </div>
  );
};

export default ClubCreateOnboardingPage;
