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
// 뱃지 스타일은 UserNameWithBadge 컴포넌트 내 Tailwind로 처리

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

  // 확정된 수상자 정보 가져오기
  const getConfirmedWinner = (type: AwardType): AwardWinnerResponse | undefined => {
    return confirmedWinners.find((w) => w.awardType === type);
  };

  // 순위별 배경색 (금/은/동)
  const getRankBg = (idx: number): string => {
    if (idx === 0) return "bg-gradient-to-br from-[#FFD700] to-[#FFA500]";
    if (idx === 1) return "bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0]";
    if (idx === 2) return "bg-gradient-to-br from-[#CD7F32] to-[#A0522D]";
    return "bg-gray-400";
  };

  if (loading) {
    return (
      <div className="page-container px-3 py-2 min-h-screen">
        <div className="text-center py-10 text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="page-container px-3 py-2 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-foreground">어워드 관리</span>
        <div className="w-9 h-9" />
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 bg-muted/50 p-0.5 rounded mb-3">
        <button
          className={[
            "flex-1 py-1.5 rounded text-sm font-medium transition-all",
            activeTab === "policy"
              ? "bg-white text-primary font-semibold shadow-sm"
              : "text-muted-foreground",
          ].join(" ")}
          onClick={() => setActiveTab("policy")}
        >
          정책 설정
        </button>
        <button
          className={[
            "flex-1 py-1.5 rounded text-sm font-medium transition-all",
            activeTab === "winners"
              ? "bg-white text-primary font-semibold shadow-sm"
              : "text-muted-foreground",
          ].join(" ")}
          onClick={() => setActiveTab("winners")}
        >
          수상자 관리
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 mb-3 border border-red-400 bg-red-50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 탭 1: 정책 설정 */}
      {activeTab === "policy" && (
        <>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-3">
            클럽의 어워드 정책을 설정합니다.
          </div>

          <div className="bg-white border border-border rounded-xl p-4">
            {/* 정산 주기 */}
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-900">정산 주기</span>
              <span className="text-xs text-gray-400 leading-snug">
                어워드 랭킹을 집계하는 기간입니다. 기준일은 1월 1일 / 7월 1일입니다.
              </span>
              {/* 세그먼트 버튼 (반기/연간) */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className={[
                    "flex-1 py-2 px-3 rounded-lg border text-sm font-semibold cursor-pointer transition-all",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    policy.awardPeriod === "HALF_YEAR"
                      ? "bg-primary border-primary text-white"
                      : "bg-gray-50 border-border text-gray-900 hover:bg-gray-100",
                  ].join(" ")}
                  onClick={() => setPolicy((p) => ({ ...p, awardPeriod: "HALF_YEAR" }))}
                  disabled={saving}
                >
                  반기 (6개월)
                </button>
                <button
                  type="button"
                  className={[
                    "flex-1 py-2 px-3 rounded-lg border text-sm font-semibold cursor-pointer transition-all",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    policy.awardPeriod === "YEARLY"
                      ? "bg-primary border-primary text-white"
                      : "bg-gray-50 border-border text-gray-900 hover:bg-gray-100",
                  ].join(" ")}
                  onClick={() => setPolicy((p) => ({ ...p, awardPeriod: "YEARLY" }))}
                  disabled={saving}
                >
                  연간 (1년)
                </button>
              </div>
            </div>

            <div className="h-px bg-border my-4" />

            {/* 어워드 타입 활성화 헤더 */}
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-sm font-semibold text-gray-900">어워드 타입 활성화</span>
              <span className="text-xs text-gray-400 leading-snug">
                기록 탭과 클럽 메인 위젯에 표시할 어워드를 선택합니다.
              </span>
            </div>

            {/* 다참 토글 */}
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900">다참</span>
                <span className="text-xs text-gray-400 leading-snug">가장 많이 참석한 멤버</span>
              </div>
              <button
                type="button"
                onClick={() => toggleAward("awardAttendanceEnabled")}
                disabled={saving}
                aria-label="다참 어워드 토글"
                className={[
                  "relative w-[52px] h-8 rounded-full border-none cursor-pointer transition-colors duration-300 flex-shrink-0 ml-3",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  policy.awardAttendanceEnabled
                    ? "bg-gradient-to-br from-[#4CAF50] to-[#45a049]"
                    : "bg-gray-300 hover:bg-gray-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300",
                    policy.awardAttendanceEnabled ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            {/* 다승점 토글 */}
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900">다승점</span>
                <span className="text-xs text-gray-400 leading-snug">가장 높은 승점을 기록한 멤버</span>
              </div>
              <button
                type="button"
                onClick={() => toggleAward("awardPointsEnabled")}
                disabled={saving}
                aria-label="다승점 어워드 토글"
                className={[
                  "relative w-[52px] h-8 rounded-full border-none cursor-pointer transition-colors duration-300 flex-shrink-0 ml-3",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  policy.awardPointsEnabled
                    ? "bg-gradient-to-br from-[#4CAF50] to-[#45a049]"
                    : "bg-gray-300 hover:bg-gray-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300",
                    policy.awardPointsEnabled ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            {/* 예약왕 토글 */}
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900">예약왕</span>
                <span className="text-xs text-gray-400 leading-snug">가장 많이 예약을 등록한 멤버</span>
              </div>
              <button
                type="button"
                onClick={() => toggleAward("awardBookingEnabled")}
                disabled={saving}
                aria-label="예약왕 어워드 토글"
                className={[
                  "relative w-[52px] h-8 rounded-full border-none cursor-pointer transition-colors duration-300 flex-shrink-0 ml-3",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  policy.awardBookingEnabled
                    ? "bg-gradient-to-br from-[#4CAF50] to-[#45a049]"
                    : "bg-gray-300 hover:bg-gray-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300",
                    policy.awardBookingEnabled ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            type="button"
            onClick={handleSavePolicy}
            disabled={saving}
            className="w-full mt-3 py-3 bg-primary text-white rounded-lg font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </>
      )}

      {/* 탭 2: 수상자 관리 */}
      {activeTab === "winners" && (
        <>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-3">
            기간별 수상자를 선정하고 확정합니다.
          </div>

          {/* 기간 선택 */}
          <div className="flex items-center gap-3 mb-4 px-3 py-2 bg-gray-50 rounded-lg">
            <label className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              기간 선택
            </label>
            <select
              value={selectedPeriodIndex}
              onChange={(e) => setSelectedPeriodIndex(Number(e.target.value))}
              disabled={loadingRankings}
              className="flex-1 py-1.5 px-3 border border-border rounded-lg bg-white text-sm text-gray-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {periodOptions.map((option, index) => (
                <option key={index} value={index}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {loadingRankings ? (
            <div className="text-center py-10 text-gray-400">랭킹 로딩 중...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* 각 어워드 타입별 후보 */}
              {(["ATTENDANCE", "POINTS", "BOOKING"] as AwardType[]).map((type) => {
                if (!isAwardEnabled(type)) return null;

                const ranking = rankings.find((r) => r.type === type);
                const confirmed = getConfirmedWinner(type);
                const isConfirmed = !!confirmed;

                return (
                  <div key={type} className="bg-white rounded-xl border border-border p-4">
                    {/* 어워드 카드 헤더 */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border flex-wrap">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-secondary text-white text-xs font-semibold">
                        {awardService.getAwardBadgeLabel(type)}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {awardService.getAwardTypeName(type)}
                      </span>
                      {isConfirmed && (
                        <span className="ml-auto px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold">
                          확정됨
                        </span>
                      )}
                    </div>

                    {isConfirmed && editingType !== type ? (
                      /* 확정된 수상자 표시 */
                      <div className="flex items-center justify-between px-3 py-3 bg-gradient-to-br from-green-50 to-green-100/60 border border-green-400 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-gray-900">
                            {confirmed.userName}
                          </span>
                          {confirmed.value != null && (
                            <span className="text-sm font-semibold text-green-600">
                              {confirmed.value}{awardService.getAwardTypeUnit(type)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            className="flex items-center justify-center w-8 h-8 bg-transparent border border-primary rounded-lg text-primary cursor-pointer transition-all hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleStartEdit(type)}
                            disabled={confirmingSaving || editingType !== null}
                            title="수상자 수정"
                          >
                            <EditIcon size={16} />
                          </button>
                          <button
                            className="flex items-center justify-center w-8 h-8 bg-transparent border border-red-400 rounded-lg text-red-400 cursor-pointer transition-all hover:bg-red-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <div className="flex flex-col gap-1.5">
                            {ranking.rankings.map((entry, idx) => (
                              <label
                                key={entry.userId}
                                className={[
                                  "flex items-center gap-2 py-2 px-3 rounded-lg border-2 cursor-pointer transition-all",
                                  selectedWinners[type] === entry.userId
                                    ? "bg-primary/10 border-primary"
                                    : "bg-gray-50 border-transparent hover:bg-gray-100",
                                ].join(" ")}
                              >
                                <input
                                  type="radio"
                                  name={`winner-${type}`}
                                  checked={selectedWinners[type] === entry.userId}
                                  onChange={() => handleSelectWinner(type, entry.userId)}
                                  className="w-[18px] h-[18px] accent-primary cursor-pointer"
                                />
                                <span
                                  className={[
                                    "flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0",
                                    getRankBg(idx),
                                  ].join(" ")}
                                >
                                  {idx + 1}
                                </span>
                                <span className="flex-1 text-sm font-medium text-gray-900">
                                  {entry.userName}
                                </span>
                                <span className="text-sm font-semibold text-primary">
                                  {entry.value}{awardService.getAwardTypeUnit(type)}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-sm text-gray-400">
                            해당 기간에 데이터가 없습니다.
                          </div>
                        )}

                        {/* 확정/수정 버튼 */}
                        {ranking && ranking.rankings.length > 0 && (
                          editingType === type ? (
                            /* 수정 모드: 저장/취소 버튼 */
                            <div className="flex gap-2 mt-3">
                              <button
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 text-gray-900 border border-border rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleCancelEdit}
                                disabled={confirmingSaving}
                              >
                                <XIcon size={16} />
                                취소
                              </button>
                              <button
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-green-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 px-3 bg-green-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
