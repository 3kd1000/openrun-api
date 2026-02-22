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
    <div className="page-container px-3 py-2 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-foreground">
          {club?.name ? `${club.name} 공지/회칙` : "공지/회칙"}
        </span>
        <div className="w-9 h-9" />
      </div>

      {/* 콘텐츠 */}
      <div className="bg-white rounded-xl border border-gray-200 px-3 py-2">
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-gray-400">
            회칙을 불러오는 중...
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 공지사항 섹션 */}
            <div className="mb-3">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white cursor-pointer"
                onClick={() => setNoticesExpanded((p) => !p)}
                type="button"
              >
                <span className="text-sm font-semibold text-gray-800">
                  공지사항
                </span>
                <span className="ml-auto inline-flex items-center justify-center bg-primary text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[24px]">
                  {notices.length}
                </span>
                <span className="text-gray-400">
                  {noticesExpanded ? (
                    <ChevronUpIcon size={18} />
                  ) : (
                    <ChevronDownIcon size={18} />
                  )}
                </span>
              </button>
              {noticesExpanded && (
                <div className="mt-2">
                  {notices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[120px] text-center text-gray-400">
                      <p className="text-2xl mb-2">📣</p>
                      <p className="text-xs">등록된 공지사항이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {notices.map((notice, index) => (
                        <div
                          key={notice.id}
                          className="flex gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-xs font-bold text-primary min-w-[20px]">
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-800 mb-0.5">
                              {notice.title}
                            </div>
                            <div className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
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
            <div className="mb-3">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white cursor-pointer"
                onClick={() => setRulesExpanded((p) => !p)}
                type="button"
              >
                <span className="text-sm font-semibold text-gray-800">회칙</span>
                <span className="ml-auto inline-flex items-center justify-center bg-primary text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[24px]">
                  {rules.length}
                </span>
                <span className="text-gray-400">
                  {rulesExpanded ? (
                    <ChevronUpIcon size={18} />
                  ) : (
                    <ChevronDownIcon size={18} />
                  )}
                </span>
              </button>
              {rulesExpanded && (
                <div className="mt-2">
                  {rules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[120px] text-center text-gray-400">
                      <p className="text-2xl mb-2">📜</p>
                      <p className="text-xs">등록된 회칙이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="flex px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-800 mb-0.5">
                              {rule.title}
                            </div>
                            <div className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
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
