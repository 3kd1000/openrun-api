import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import { clubService } from "../../../services/clubService";
import {
  awardService,
  type AwardPeriodOption,
  type AwardWinnerResponse,
  type SaveAwardWinnerRequest,
} from "../../../services/awardService";
import type { Club, UpdateAwardPolicyRequest, AwardRankingResponse, AwardType } from "../../../types/club";
import { ArrowLeftIcon, CheckIcon, Trash2Icon, EditIcon, XIcon } from "../../../components/common/Icons";
import { useToast } from "../../../contexts/ToastContext";
import "./ClubManageAwardPage.css";

type TabType = "policy" | "winners";

const ClubManageAwardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clubId } = useParams<{ clubId: string }>();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>("policy");

  // 정책 설정 상태
  const [policy, setPolicy] = useState<UpdateAwardPolicyRequest>({
    awardPeriod: "HALF_YEAR",
    awardAttendanceEnabled: true,
    awardPointsEnabled: true,
    awardBookingEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수상자 관리 상태
  const [periodOptions, setPeriodOptions] = useState<AwardPeriodOption[]>([]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [rankings, setRankings] = useState<AwardRankingResponse[]>([]);
  const [confirmedWinners, setConfirmedWinners] = useState<AwardWinnerResponse[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<Record<AwardType, number | null>>({
    ATTENDANCE: null,
    POINTS: null,
    BOOKING: null,
  });
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [confirmingSaving, setConfirmingSaving] = useState(false);
  const [editingType, setEditingType] = useState<AwardType | null>(null);

  // 클럽 정책 로드
  useEffect(() => {
    const load = async () => {
      if (!clubId) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get<Club>(`/clubs/${clubId}`);
        const newPolicy = {
          awardPeriod: res.data.awardPeriod ?? "HALF_YEAR",
          awardAttendanceEnabled: res.data.awardAttendanceEnabled ?? true,
          awardPointsEnabled: res.data.awardPointsEnabled ?? true,
          awardBookingEnabled: res.data.awardBookingEnabled ?? true,
        };
        setPolicy(newPolicy);

        // 기간 옵션 생성
        const options = awardService.generatePeriodOptions(
          newPolicy.awardPeriod as "HALF_YEAR" | "YEARLY",
          6
        );
        setPeriodOptions(options);
      } catch (e) {
        console.error(e);
        setError("어워드 정책을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clubId]);

  // 선택된 기간의 랭킹 및 확정된 수상자 로드
  const loadRankingsAndWinners = useCallback(async () => {
    if (!clubId || periodOptions.length === 0) return;

    const period = periodOptions[selectedPeriodIndex];
    if (!period) return;

    try {
      setLoadingRankings(true);
      setError(null);

      // Top 3 랭킹 조회
      const rankingsData = await awardService.getAwardRankings(
        Number(clubId),
        undefined, // 모든 타입
        period.startDate,
        period.endDate,
        3 // Top 3
      );
      setRankings(rankingsData);

      // 해당 기간 확정된 수상자 조회
      const winnersData = await awardService.getAwardWinners(
        Number(clubId),
        period.startDate,
        period.endDate
      );
      setConfirmedWinners(winnersData);

      // 이미 확정된 수상자가 있으면 선택 상태 초기화
      const newSelected: Record<AwardType, number | null> = {
        ATTENDANCE: null,
        POINTS: null,
        BOOKING: null,
      };
      winnersData.forEach((w) => {
        newSelected[w.awardType] = w.userId;
      });
      setSelectedWinners(newSelected);
    } catch (e) {
      console.error(e);
      setError("랭킹 정보를 불러오지 못했습니다.");
    } finally {
      setLoadingRankings(false);
    }
  }, [clubId, periodOptions, selectedPeriodIndex]);

  // 탭 변경 또는 기간 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === "winners") {
      loadRankingsAndWinners();
    }
  }, [activeTab, selectedPeriodIndex, loadRankingsAndWinners]);

  const handleBack = () => navigate(`/clubs/${clubId}/manage`);

  // 정책 저장
  const handleSavePolicy = async () => {
    if (!clubId) return;
    try {
      setSaving(true);
      setError(null);
      await clubService.updateAwardPolicy(Number(clubId), policy);
      showToast("저장되었습니다", "success");

      // 기간 옵션 재생성 (정책이 변경될 수 있으므로)
      const options = awardService.generatePeriodOptions(
        policy.awardPeriod as "HALF_YEAR" | "YEARLY",
        6
      );
      setPeriodOptions(options);
      setSelectedPeriodIndex(0);
    } catch (e) {
      console.error(e);
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAward = (key: keyof Omit<UpdateAwardPolicyRequest, "awardPeriod">) => {
    setPolicy((p) => ({ ...p, [key]: !p[key] }));
  };

  // 수상자 선택 핸들러
  const handleSelectWinner = (type: AwardType, userId: number) => {
    // 수정 모드가 아니고 이미 확정된 수상자는 선택 변경 불가
    const isConfirmed = confirmedWinners.some(
      (w) => w.awardType === type
    );
    if (isConfirmed && editingType !== type) return;

    setSelectedWinners((prev) => ({
      ...prev,
      [type]: prev[type] === userId ? null : userId,
    }));
  };

  // 수정 모드 진입
  const handleStartEdit = (type: AwardType) => {
    setEditingType(type);
    // 현재 확정된 수상자를 선택 상태로 설정
    const confirmed = confirmedWinners.find((w) => w.awardType === type);
    if (confirmed) {
      setSelectedWinners((prev) => ({
        ...prev,
        [type]: confirmed.userId,
      }));
    }
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingType(null);
  };

  // 수상자 수정 핸들러
  const handleUpdateWinner = async (type: AwardType) => {
    if (!clubId) return;
    const userId = selectedWinners[type];
    if (!userId) {
      showToast("수상자를 선택해주세요", "error");
      return;
    }

    const confirmed = confirmedWinners.find((w) => w.awardType === type);
    if (!confirmed) return;

    // 변경이 없으면 그냥 수정 모드 종료
    if (confirmed.userId === userId) {
      setEditingType(null);
      return;
    }

    // 해당 타입의 랭킹에서 선택된 userId의 value 찾기
    const ranking = rankings.find((r) => r.type === type);
    const entry = ranking?.rankings.find((e) => e.userId === userId);

    try {
      setConfirmingSaving(true);
      setError(null);

      await awardService.updateAwardWinner(Number(clubId), confirmed.id, {
        userId,
        value: entry?.value,
      });
      showToast(`${awardService.getAwardBadgeLabel(type)} 수상자가 수정되었습니다`, "success");

      // 수정 모드 종료 및 데이터 새로고침
      setEditingType(null);
      await loadRankingsAndWinners();
    } catch (e) {
      console.error(e);
      setError("수상자 수정에 실패했습니다.");
    } finally {
      setConfirmingSaving(false);
    }
  };

  // 수상자 확정 핸들러
  const handleConfirmWinner = async (type: AwardType) => {
    if (!clubId) return;
    const userId = selectedWinners[type];
    if (!userId) {
      showToast("수상자를 선택해주세요", "error");
      return;
    }

    const period = periodOptions[selectedPeriodIndex];
    if (!period) return;

    // 해당 타입의 랭킹에서 선택된 userId의 value 찾기
    const ranking = rankings.find((r) => r.type === type);
    const entry = ranking?.rankings.find((e) => e.userId === userId);

    try {
      setConfirmingSaving(true);
      setError(null);

      const request: SaveAwardWinnerRequest = {
        awardType: type,
        userId,
        periodStart: period.startDate,
        periodEnd: period.endDate,
        value: entry?.value,
      };

      await awardService.saveAwardWinner(Number(clubId), request);
      showToast(`${awardService.getAwardBadgeLabel(type)} 수상자가 확정되었습니다`, "success");

      // 데이터 새로고침
      await loadRankingsAndWinners();
    } catch (e) {
      console.error(e);
      setError("수상자 확정에 실패했습니다.");
    } finally {
      setConfirmingSaving(false);
    }
  };

  // 수상자 삭제 핸들러
  const handleDeleteWinner = async (winnerId: number, type: AwardType) => {
    if (!clubId) return;
    if (!window.confirm(`${awardService.getAwardBadgeLabel(type)} 수상자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setConfirmingSaving(true);
      await awardService.deleteAwardWinner(Number(clubId), winnerId);
      showToast("수상자가 삭제되었습니다", "success");
      await loadRankingsAndWinners();
    } catch (e) {
      console.error(e);
      setError("수상자 삭제에 실패했습니다.");
    } finally {
      setConfirmingSaving(false);
    }
  };

  // 특정 어워드 타입이 활성화되어 있는지 확인
  const isAwardEnabled = (type: AwardType): boolean => {
    switch (type) {
      case "ATTENDANCE":
        return policy.awardAttendanceEnabled;
      case "POINTS":
        return policy.awardPointsEnabled;
      case "BOOKING":
        return policy.awardBookingEnabled;
      default:
        return false;
    }
  };

  // 특정 타입이 이미 확정되었는지 확인
  const isTypeConfirmed = (type: AwardType): boolean => {
    return confirmedWinners.some((w) => w.awardType === type);
  };

  // 확정된 수상자 정보 가져오기
  const getConfirmedWinner = (type: AwardType): AwardWinnerResponse | undefined => {
    return confirmedWinners.find((w) => w.awardType === type);
  };

  if (loading) {
    return (
      <div className="club-manage-award-page">
        <div className="club-manage-award-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="club-manage-award-page">
      <div className="club-manage-award-page__header">
        <button
          className="club-manage-award-page__back-btn"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-manage-award-page__title">어워드 관리</h1>
        <div className="club-manage-award-page__header-spacer" />
      </div>

      {/* 탭 네비게이션 */}
      <div className="club-manage-award-page__tabs">
        <button
          className={`club-manage-award-page__tab ${activeTab === "policy" ? "active" : ""}`}
          onClick={() => setActiveTab("policy")}
        >
          정책 설정
        </button>
        <button
          className={`club-manage-award-page__tab ${activeTab === "winners" ? "active" : ""}`}
          onClick={() => setActiveTab("winners")}
        >
          수상자 관리
        </button>
      </div>

      {error && <div className="club-manage-award-page__error">{error}</div>}

      {/* 탭 1: 정책 설정 */}
      {activeTab === "policy" && (
        <>
          <div className="club-manage-award-page__hint">
            클럽의 어워드 정책을 설정합니다.
          </div>

          <div className="club-manage-award-page__section">
            <div className="club-manage-award-page__row">
              <div className="club-manage-award-page__row-title">정산 주기</div>
              <div className="club-manage-award-page__row-desc">
                어워드 랭킹을 집계하는 기간입니다. 기준일은 1월 1일 / 7월 1일입니다.
              </div>
              <div className="club-manage-award-page__seg">
                <button
                  type="button"
                  className={`club-manage-award-page__seg-btn ${
                    policy.awardPeriod === "HALF_YEAR" ? "active" : ""
                  }`}
                  onClick={() =>
                    setPolicy((p) => ({ ...p, awardPeriod: "HALF_YEAR" }))
                  }
                  disabled={saving}
                >
                  반기 (6개월)
                </button>
                <button
                  type="button"
                  className={`club-manage-award-page__seg-btn ${
                    policy.awardPeriod === "YEARLY" ? "active" : ""
                  }`}
                  onClick={() => setPolicy((p) => ({ ...p, awardPeriod: "YEARLY" }))}
                  disabled={saving}
                >
                  연간 (1년)
                </button>
              </div>
            </div>

            <div className="club-manage-award-page__divider" />

            <div className="club-manage-award-page__row">
              <div className="club-manage-award-page__row-title">어워드 타입 활성화</div>
              <div className="club-manage-award-page__row-desc">
                기록 탭과 클럽 메인 위젯에 표시할 어워드를 선택합니다.
              </div>
            </div>

            <div className="club-manage-award-page__toggle-row">
              <div className="club-manage-award-page__toggle-label">
                <span className="club-manage-award-page__toggle-title">다참</span>
                <span className="club-manage-award-page__toggle-desc">
                  가장 많이 참석한 멤버
                </span>
              </div>
              <button
                type="button"
                className={`club-manage-award-page__toggle ${
                  policy.awardAttendanceEnabled ? "active" : ""
                }`}
                onClick={() => toggleAward("awardAttendanceEnabled")}
                disabled={saving}
              />
            </div>

            <div className="club-manage-award-page__toggle-row">
              <div className="club-manage-award-page__toggle-label">
                <span className="club-manage-award-page__toggle-title">다승점</span>
                <span className="club-manage-award-page__toggle-desc">
                  가장 높은 승점을 기록한 멤버
                </span>
              </div>
              <button
                type="button"
                className={`club-manage-award-page__toggle ${
                  policy.awardPointsEnabled ? "active" : ""
                }`}
                onClick={() => toggleAward("awardPointsEnabled")}
                disabled={saving}
              />
            </div>

            <div className="club-manage-award-page__toggle-row">
              <div className="club-manage-award-page__toggle-label">
                <span className="club-manage-award-page__toggle-title">예약왕</span>
                <span className="club-manage-award-page__toggle-desc">
                  가장 많이 예약을 등록한 멤버
                </span>
              </div>
              <button
                type="button"
                className={`club-manage-award-page__toggle ${
                  policy.awardBookingEnabled ? "active" : ""
                }`}
                onClick={() => toggleAward("awardBookingEnabled")}
                disabled={saving}
              />
            </div>
          </div>

          <button
            className="club-manage-award-page__save"
            type="button"
            onClick={handleSavePolicy}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </>
      )}

      {/* 탭 2: 수상자 관리 */}
      {activeTab === "winners" && (
        <>
          <div className="club-manage-award-page__hint">
            기간별 수상자를 선정하고 확정합니다.
          </div>

          {/* 기간 선택 */}
          <div className="club-manage-award-page__period-selector">
            <label>기간 선택</label>
            <select
              value={selectedPeriodIndex}
              onChange={(e) => setSelectedPeriodIndex(Number(e.target.value))}
              disabled={loadingRankings}
            >
              {periodOptions.map((option, index) => (
                <option key={index} value={index}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {loadingRankings ? (
            <div className="club-manage-award-page__loading">랭킹 로딩 중...</div>
          ) : (
            <div className="club-manage-award-page__winners-section">
              {/* 각 어워드 타입별 후보 */}
              {(["ATTENDANCE", "POINTS", "BOOKING"] as AwardType[]).map((type) => {
                if (!isAwardEnabled(type)) return null;

                const ranking = rankings.find((r) => r.type === type);
                const confirmed = getConfirmedWinner(type);
                const isConfirmed = !!confirmed;

                return (
                  <div key={type} className="club-manage-award-page__award-card">
                    <div className="club-manage-award-page__award-header">
                      <span className={`club-manage-award-page__award-badge award-badge--${type.toLowerCase()}`}>
                        {awardService.getAwardBadgeLabel(type)}
                      </span>
                      <span className="club-manage-award-page__award-name">
                        {awardService.getAwardTypeName(type)}
                      </span>
                      {isConfirmed && (
                        <span className="club-manage-award-page__confirmed-badge">확정됨</span>
                      )}
                    </div>

                    {isConfirmed && editingType !== type ? (
                      /* 확정된 수상자 표시 */
                      <div className="club-manage-award-page__confirmed-winner">
                        <div className="club-manage-award-page__winner-info">
                          <span className="club-manage-award-page__winner-name">
                            {confirmed.userName}
                          </span>
                          {confirmed.value != null && (
                            <span className="club-manage-award-page__winner-value">
                              {confirmed.value}{awardService.getAwardTypeUnit(type)}
                            </span>
                          )}
                        </div>
                        <div className="club-manage-award-page__winner-actions">
                          <button
                            className="club-manage-award-page__edit-btn"
                            onClick={() => handleStartEdit(type)}
                            disabled={confirmingSaving || editingType !== null}
                            title="수상자 수정"
                          >
                            <EditIcon size={16} />
                          </button>
                          <button
                            className="club-manage-award-page__delete-btn"
                            onClick={() => handleDeleteWinner(confirmed.id, type)}
                            disabled={confirmingSaving || editingType !== null}
                            title="수상자 삭제"
                          >
                            <Trash2Icon size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 후보 목록 (라디오 버튼) */
                      <>
                        {ranking && ranking.rankings.length > 0 ? (
                          <div className="club-manage-award-page__candidates">
                            {ranking.rankings.map((entry, idx) => (
                              <label
                                key={entry.userId}
                                className={`club-manage-award-page__candidate ${
                                  selectedWinners[type] === entry.userId ? "selected" : ""
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`winner-${type}`}
                                  checked={selectedWinners[type] === entry.userId}
                                  onChange={() => handleSelectWinner(type, entry.userId)}
                                />
                                <span className="club-manage-award-page__candidate-rank">
                                  {idx + 1}
                                </span>
                                <span className="club-manage-award-page__candidate-name">
                                  {entry.userName}
                                </span>
                                <span className="club-manage-award-page__candidate-value">
                                  {entry.value}{awardService.getAwardTypeUnit(type)}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="club-manage-award-page__no-data">
                            해당 기간에 데이터가 없습니다.
                          </div>
                        )}

                        {/* 확정/수정 버튼 */}
                        {ranking && ranking.rankings.length > 0 && (
                          editingType === type ? (
                            /* 수정 모드: 저장/취소 버튼 */
                            <div className="club-manage-award-page__edit-actions">
                              <button
                                className="club-manage-award-page__cancel-btn"
                                onClick={handleCancelEdit}
                                disabled={confirmingSaving}
                              >
                                <XIcon size={16} />
                                취소
                              </button>
                              <button
                                className="club-manage-award-page__confirm-btn"
                                onClick={() => handleUpdateWinner(type)}
                                disabled={!selectedWinners[type] || confirmingSaving}
                              >
                                <CheckIcon size={16} />
                                {confirmingSaving ? "저장 중..." : "저장"}
                              </button>
                            </div>
                          ) : (
                            /* 신규 확정 모드 */
                            <button
                              className="club-manage-award-page__confirm-btn"
                              onClick={() => handleConfirmWinner(type)}
                              disabled={!selectedWinners[type] || confirmingSaving}
                            >
                              <CheckIcon size={16} />
                              {confirmingSaving ? "저장 중..." : "확정"}
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClubManageAwardPage;
