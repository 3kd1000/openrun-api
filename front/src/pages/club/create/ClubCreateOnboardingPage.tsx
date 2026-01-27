import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  SettingsIcon,
  EditIcon,
  ChevronRightIcon,
} from "../../../components/common/Icons";
import { clubService } from "../../../services/clubService";
import axiosInstance from "../../../services/api/axiosInstance";
import type { Club } from "../../../types/club";
import { useToast } from "../../../contexts/ToastContext";
import "./ClubCreateOnboardingPage.css";

const ClubCreateOnboardingPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  const id = clubId ? Number(clubId) : null;

  const [recruitmentNote, setRecruitmentNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClubPolicy = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get<Club>(`/clubs/${id}`);
      setRecruitmentNote(res.data.memberRecruitmentNote ?? "");
    } catch (e) {
      console.error("Failed to fetch club policy:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClubPolicy();
  }, [fetchClubPolicy]);

  const handleBack = () => {
    if (!clubId) {
      navigate("/clubs/explore");
      return;
    }
    navigate(`/clubs/${clubId}`);
  };

  const handleSaveRecruitmentNote = async () => {
    if (!id) return;
    try {
      setSaving(true);
      // 신규 생성된 클럽의 기본값 + 작성된 모집글로 저장
      await clubService.updateClubPolicy(id, {
        joinPolicy: "APPROVAL",
        interclubRecruitmentStatus: "CLOSED",
        memberRecruitmentStatus: "OPEN",
        memberRecruitmentNote: recruitmentNote.trim() || null,
      });
      setSaved(true);
    } catch (e) {
      console.error("Failed to save recruitment note:", e);
      showToast("모집글 저장에 실패했습니다", "error");
    } finally {
      setSaving(false);
    }
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

  if (loading) {
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
        <div className="club-create-onboarding-page__loading">로딩 중...</div>
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

      {/* 모집글 작성 섹션 */}
      <div className="club-create-onboarding-page__card">
        <div className="club-create-onboarding-page__headline">
          회원 모집글 작성
        </div>
        <div className="club-create-onboarding-page__sub">
          가입 희망자에게 보여줄 모집 안내문을 작성해주세요.
          <br />
          가입 조건, 회비, 활동 일정 등을 안내하면 좋습니다.
        </div>

        <textarea
          className="club-create-onboarding-page__textarea"
          placeholder="예: 매주 토요일 오전 8시 정기 모임, 월 회비 3만원, 실력 무관 누구나 환영합니다!"
          value={recruitmentNote}
          onChange={(e) => {
            setRecruitmentNote(e.target.value);
            setSaved(false);
          }}
          disabled={saving}
          rows={5}
        />

        <button
          className="club-create-onboarding-page__save-btn"
          onClick={handleSaveRecruitmentNote}
          disabled={saving}
        >
          {saving ? "저장 중..." : saved ? "저장 완료" : "모집글 저장"}
        </button>
      </div>

      {/* 추가 설정 CTA */}
      <div className="club-create-onboarding-page__card club-create-onboarding-page__card--mt">
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
