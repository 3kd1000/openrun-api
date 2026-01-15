import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../services/api/axiosInstance';
import type { Club } from '../../types/club';
import {
  ArrowLeftIcon,
  InboxIcon,
  FileTextIcon,
  ChevronRightIcon,
  EditIcon,
  SettingsIcon
} from '../../components/common/Icons';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import './ClubManagePage.css';

const ClubManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();

  // 클럽 정보
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NOTE: 클럽 관리 화면은 딥링크(상세 페이지) 중심으로 통일합니다.

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [clubResponse] = await Promise.all([
        axiosInstance.get(`/clubs/${clubId}`),
      ]);

      setClub(clubResponse.data);
    } catch (error: unknown) {
      logError('클럽 관리 데이터 조회', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/clubs/${clubId}`);
  };

  if (loading) {
    return (
      <div className="club-manage-page">
        <div className="club-manage-page__loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="club-manage-page">
        <div className="club-manage-page__header">
          <button className="club-manage-page__back-btn" onClick={handleBack}>
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="club-manage-page__title">클럽 관리</h1>
          <div className="club-manage-page__header-spacer" />
        </div>
        <div className="club-manage-page__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="club-manage-page">
      {/* 헤더 */}
      <div className="club-manage-page__header">
        <button className="club-manage-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-manage-page__title">
          {club?.name ? `${club.name} 관리` : '클럽 관리'}
        </h1>
        <div className="club-manage-page__header-spacer" />
      </div>

      {/* 운영 설정 바로가기 */}
      <div className="club-manage-page__section">
        <button
          className="club-manage-page__menu-item"
          onClick={() => navigate(`/clubs/${clubId}/manage/info`)}
        >
          <div className="club-manage-page__menu-left">
            <EditIcon size={18} />
            <span>클럽 정보</span>
          </div>
          <ChevronRightIcon size={18} />
        </button>
        <button
          className="club-manage-page__menu-item"
          onClick={() => navigate(`/clubs/${clubId}/manage/policy`)}
        >
          <div className="club-manage-page__menu-left">
            <SettingsIcon size={18} />
            <span>운영 정책</span>
          </div>
          <ChevronRightIcon size={18} />
        </button>
        <button
          className="club-manage-page__menu-item"
          onClick={() => navigate(`/clubs/${clubId}/manage/external-requests`)}
        >
          <div className="club-manage-page__menu-left">
            <InboxIcon size={18} />
            <span>외부 요청</span>
          </div>
          <ChevronRightIcon size={18} />
        </button>
        <button
          className="club-manage-page__menu-item"
          onClick={() => navigate(`/clubs/${clubId}/manage/content`)}
        >
          <div className="club-manage-page__menu-left">
            <FileTextIcon size={18} />
            <span>공지/회칙 관리</span>
          </div>
          <ChevronRightIcon size={18} />
        </button>
      </div>
    </div>
  );
};

export default ClubManagePage;
