import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import { clubService } from "../../../services/clubService";
import type { Club, ClubNotice, ClubRule } from "../../../types/club";
import { getClubSettings, setClubSettings } from "../../../utils/openrunClubSettings";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "../../../components/common/Icons";
import { getErrorMessage, logError } from "../../../utils/errorHandler";
import "./ClubRulesPage.css";

const ClubRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const [rules, setRules] = useState<ClubRule[]>([]);
  const [notices, setNotices] = useState<ClubNotice[]>([]);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noticesExpanded, setNoticesExpanded] = useState(true);
  const [rulesExpanded, setRulesExpanded] = useState(true);

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [clubResponse, rulesData, noticesData] = await Promise.all([
        axiosInstance.get(`/clubs/${clubId}`),
        clubService.getClubRules(Number(clubId)),
        clubService.getClubNotices(Number(clubId)),
      ]);

      setClub(clubResponse.data);
      setRules(rulesData.sort((a, b) => a.displayOrder - b.displayOrder));
      setNotices(noticesData.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (error: unknown) {
      logError("공지/회칙 조회", error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // 공지/회칙 진입 시 최신 공지+회칙까지 읽음 처리
  useEffect(() => {
    if (!clubId) return;
    Promise.all([
      clubService.markClubNoticesRead(Number(clubId)),
      clubService.markClubRulesRead(Number(clubId)),
    ]).catch(() => {});
  }, [clubId]);

  const handleBack = () => {
    navigate(`/clubs/${clubId}`);
  };

  // expand 상태 복원 (club settings)
  useEffect(() => {
    try {
      if (!clubId) return;
      const s = getClubSettings(String(clubId));
      if (typeof s.rulesPage?.noticesExpanded === "boolean") {
        setNoticesExpanded(s.rulesPage.noticesExpanded);
      }
      if (typeof s.rulesPage?.rulesExpanded === "boolean") {
        setRulesExpanded(s.rulesPage.rulesExpanded);
      }
    } catch {
      // ignore
    }
  }, [clubId]);

  // expand 상태 저장 (club settings)
  useEffect(() => {
    if (!clubId) return;
    setClubSettings(String(clubId), {
      rulesPage: { noticesExpanded, rulesExpanded },
    });
  }, [clubId, noticesExpanded, rulesExpanded]);

  return (
    <div className="club-rules-page">
      {/* 헤더 */}
      <div className="club-rules-page__header">
        <button className="club-rules-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-rules-page__title">
          {club?.name ? `${club.name} 공지/회칙` : "공지/회칙"}
        </h1>
        <div className="club-rules-page__header-spacer" />
      </div>

      {/* 콘텐츠 */}
      <div className="club-rules-page__content">
        {loading && (
          <div className="club-rules-page__loading">회칙을 불러오는 중...</div>
        )}

        {error && (
          <div className="club-rules-page__error">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* 공지사항 섹션 */}
            <div className="club-rules-page__section">
              <button
                className="club-rules-page__section-header"
                onClick={() => setNoticesExpanded((p) => !p)}
                type="button"
              >
                <span className="club-rules-page__section-title">
                  공지사항
                </span>
                <span className="club-rules-page__section-meta">
                  {notices.length}개
                </span>
                {noticesExpanded ? (
                  <ChevronUpIcon size={18} />
                ) : (
                  <ChevronDownIcon size={18} />
                )}
              </button>
              {noticesExpanded && (
                <div className="club-rules-page__section-body">
                  {notices.length === 0 ? (
                    <div className="club-rules-page__empty">
                      <p className="club-rules-page__empty-icon">📣</p>
                      <p className="club-rules-page__empty-message">
                        등록된 공지사항이 없습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="club-rules-page__list">
                      {notices.map((notice, index) => (
                        <div key={notice.id} className="club-rules-page__item">
                          <span className="club-rules-page__item-number">
                            {index + 1}.
                          </span>
                          <div className="club-rules-page__item-content">
                            <div className="club-rules-page__item-title">
                              {notice.title}
                            </div>
                            <div className="club-rules-page__item-body">
                              {notice.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 회칙 섹션 */}
            <div className="club-rules-page__section">
              <button
                className="club-rules-page__section-header"
                onClick={() => setRulesExpanded((p) => !p)}
                type="button"
              >
                <span className="club-rules-page__section-title">회칙</span>
                <span className="club-rules-page__section-meta">
                  {rules.length}개
                </span>
                {rulesExpanded ? (
                  <ChevronUpIcon size={18} />
                ) : (
                  <ChevronDownIcon size={18} />
                )}
              </button>
              {rulesExpanded && (
                <div className="club-rules-page__section-body">
                  {rules.length === 0 ? (
                    <div className="club-rules-page__empty">
                      <p className="club-rules-page__empty-icon">📜</p>
                      <p className="club-rules-page__empty-message">
                        등록된 회칙이 없습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="club-rules-page__list">
                      {rules.map((rule) => (
                        <div key={rule.id} className="club-rules-page__item club-rules-page__item--no-number">
                          <div className="club-rules-page__item-content">
                            <div className="club-rules-page__item-title">
                              {rule.title}
                            </div>
                            <div className="club-rules-page__item-body">
                              {rule.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClubRulesPage;
