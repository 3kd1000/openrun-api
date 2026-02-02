import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import "./AwardWinnerPage.css";

interface Club {
  id: number;
  name: string;
  awardPeriod?: "HALF_YEAR" | "YEARLY";
  awardAttendanceEnabled?: boolean;
  awardPointsEnabled?: boolean;
  awardBookingEnabled?: boolean;
}

interface ClubMember {
  id: number;
  name: string;
  role: string;
}

interface PeriodOption {
  label: string;
  periodStart: string;
  periodEnd: string;
}

interface AwardWinner {
  id: number;
  clubId: number;
  userId: number;
  userName: string;
  awardType: "ATTENDANCE" | "POINTS" | "BOOKING";
  periodStart: string;
  periodEnd: string;
  value: number | null;
  isManual: boolean;
  createdAt: string;
}

type AwardType = "ATTENDANCE" | "POINTS" | "BOOKING";

const AWARD_TYPE_LABELS: Record<AwardType, string> = {
  ATTENDANCE: "최다 참석",
  POINTS: "최다 승점",
  BOOKING: "최다 예약",
};

function AwardWinnerPage() {
  // 클럽 선택
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubsLoading, setClubsLoading] = useState(false);

  // 기간 선택
  const [periodOptions, setPeriodOptions] = useState<PeriodOption[]>([]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);

  // 클럽 회원
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // 현재 기간 수상자
  const [winners, setWinners] = useState<AwardWinner[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(false);

  // 수상자 입력 폼
  const [selectedWinners, setSelectedWinners] = useState<Record<AwardType, number | null>>({
    ATTENDANCE: null,
    POINTS: null,
    BOOKING: null,
  });
  const [selectedValues, setSelectedValues] = useState<Record<AwardType, string>>({
    ATTENDANCE: "",
    POINTS: "",
    BOOKING: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 클럽 목록 조회
  useEffect(() => {
    const fetchClubs = async () => {
      setClubsLoading(true);
      try {
        // API returns Page<ClubResponse> with { content: [...], ... }
        const response = await api.get<{ content: Club[] }>("/clubs", {
          params: { size: 100 }  // 충분히 큰 사이즈로 전체 조회
        });
        setClubs(response.data.content || []);
      } catch (error) {
        console.error("Failed to fetch clubs:", error);
        setClubs([]);
      } finally {
        setClubsLoading(false);
      }
    };
    fetchClubs();
  }, []);

  // 클럽 선택 시 기간 옵션 및 회원 조회
  useEffect(() => {
    if (!selectedClubId) {
      setPeriodOptions([]);
      setMembers([]);
      setWinners([]);
      setSelectedClub(null);
      return;
    }

    const club = clubs.find((c) => c.id === selectedClubId);
    setSelectedClub(club || null);

    const fetchData = async () => {
      // 기간 옵션 조회
      try {
        const period = club?.awardPeriod || "HALF_YEAR";
        const periodResponse = await api.get<PeriodOption[]>(
          `/clubs/${selectedClubId}/awards/periods`,
          { params: { period, count: 10 } }
        );
        setPeriodOptions(periodResponse.data);
        setSelectedPeriodIndex(0);
      } catch (error) {
        console.error("Failed to fetch period options:", error);
      }

      // 회원 목록 조회
      setMembersLoading(true);
      try {
        const membersResponse = await api.get<ClubMember[]>(
          `/clubs/${selectedClubId}/members`
        );
        setMembers(membersResponse.data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchData();
  }, [selectedClubId, clubs]);

  // 기간 선택 시 수상자 조회
  const fetchWinners = useCallback(async () => {
    if (!selectedClubId || periodOptions.length === 0) return;

    const period = periodOptions[selectedPeriodIndex];
    if (!period) return;

    setWinnersLoading(true);
    try {
      const response = await api.get<AwardWinner[]>(
        `/clubs/${selectedClubId}/awards/manage`,
        {
          params: {
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
          },
        }
      );
      setWinners(response.data);

      // 기존 수상자로 폼 초기화
      const newSelectedWinners: Record<AwardType, number | null> = {
        ATTENDANCE: null,
        POINTS: null,
        BOOKING: null,
      };
      const newSelectedValues: Record<AwardType, string> = {
        ATTENDANCE: "",
        POINTS: "",
        BOOKING: "",
      };

      response.data?.forEach((winner) => {
        newSelectedWinners[winner.awardType] = winner.userId;
        newSelectedValues[winner.awardType] = winner.value?.toString() || "";
      });

      setSelectedWinners(newSelectedWinners);
      setSelectedValues(newSelectedValues);
    } catch (error) {
      console.error("Failed to fetch winners:", error);
    } finally {
      setWinnersLoading(false);
    }
  }, [selectedClubId, periodOptions, selectedPeriodIndex]);

  useEffect(() => {
    fetchWinners();
  }, [fetchWinners]);

  // 수상자 저장
  const handleSave = async (awardType: AwardType) => {
    if (!selectedClubId || periodOptions.length === 0) return;

    const userId = selectedWinners[awardType];
    if (!userId) {
      setMessage({ type: "error", text: "수상자를 선택해주세요." });
      return;
    }

    const period = periodOptions[selectedPeriodIndex];
    if (!period) return;

    setSaving(true);
    setMessage(null);

    try {
      await api.post(`/clubs/${selectedClubId}/awards/manage`, {
        awardType,
        userId,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        value: selectedValues[awardType] ? parseInt(selectedValues[awardType]) : null,
      });

      setMessage({ type: "success", text: `${AWARD_TYPE_LABELS[awardType]} 수상자가 저장되었습니다.` });
      fetchWinners();
    } catch (error) {
      console.error("Failed to save winner:", error);
      setMessage({ type: "error", text: "저장에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  // 수상자 삭제
  const handleDelete = async (winner: AwardWinner) => {
    if (!confirm(`${winner.userName}의 ${AWARD_TYPE_LABELS[winner.awardType]} 수상 기록을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await api.delete(`/clubs/${selectedClubId}/awards/manage/${winner.id}`);
      setMessage({ type: "success", text: "삭제되었습니다." });
      fetchWinners();
    } catch (error) {
      console.error("Failed to delete winner:", error);
      setMessage({ type: "error", text: "삭제에 실패했습니다." });
    }
  };

  return (
    <div className="award-winner-page">
      <h1>어워드 수상자 관리</h1>
      <p className="page-description">
        과거 기간의 어워드 수상자를 수동으로 입력합니다.
        서비스 개설 전의 수상 기록을 보정하는 용도로 사용합니다.
      </p>

      {message && (
        <div className={`message message--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 클럽 선택 */}
      <div className="form-section">
        <label>클럽 선택</label>
        <select
          value={selectedClubId || ""}
          onChange={(e) => setSelectedClubId(e.target.value ? parseInt(e.target.value) : null)}
          disabled={clubsLoading}
        >
          <option value="">클럽을 선택하세요</option>
          {clubs?.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClubId && (
        <>
          {/* 기간 선택 */}
          <div className="form-section">
            <label>기간 선택</label>
            <select
              value={selectedPeriodIndex}
              onChange={(e) => setSelectedPeriodIndex(parseInt(e.target.value))}
            >
              {periodOptions?.map((option, index) => (
                <option key={index} value={index}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedClub && (
              <span className="period-info">
                정산 주기: {selectedClub.awardPeriod === "YEARLY" ? "연간" : "반기"}
              </span>
            )}
          </div>

          {/* 수상자 입력 폼 */}
          {winnersLoading || membersLoading ? (
            <div className="loading">로딩 중...</div>
          ) : (
            <div className="award-forms">
              {(["ATTENDANCE", "POINTS", "BOOKING"] as AwardType[])
                .filter((awardType) => {
                  if (!selectedClub) return true;
                  switch (awardType) {
                    case "ATTENDANCE": return selectedClub.awardAttendanceEnabled !== false;
                    case "POINTS": return selectedClub.awardPointsEnabled !== false;
                    case "BOOKING": return selectedClub.awardBookingEnabled !== false;
                  }
                })
                .map((awardType) => (
                <div key={awardType} className="award-form">
                  <h3>{AWARD_TYPE_LABELS[awardType]}</h3>
                  <div className="award-form__row">
                    <select
                      value={selectedWinners[awardType] || ""}
                      onChange={(e) =>
                        setSelectedWinners({
                          ...selectedWinners,
                          [awardType]: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    >
                      <option value="">수상자 선택</option>
                      {members?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="기록값 (선택)"
                      value={selectedValues[awardType]}
                      onChange={(e) =>
                        setSelectedValues({
                          ...selectedValues,
                          [awardType]: e.target.value,
                        })
                      }
                    />
                    <button
                      onClick={() => handleSave(awardType)}
                      disabled={saving || !selectedWinners[awardType]}
                    >
                      저장
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 현재 기간 수상자 목록 */}
          {winners?.length > 0 && (
            <div className="winners-list">
              <h3>현재 기간 수상자</h3>
              <table>
                <thead>
                  <tr>
                    <th>어워드</th>
                    <th>수상자</th>
                    <th>기록</th>
                    <th>입력 방식</th>
                    <th>등록일</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {winners?.map((winner) => (
                    <tr key={winner.id}>
                      <td>{AWARD_TYPE_LABELS[winner.awardType]}</td>
                      <td>{winner.userName}</td>
                      <td>{winner.value ?? "-"}</td>
                      <td>{winner.isManual ? "수동" : "자동"}</td>
                      <td>{new Date(winner.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(winner)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AwardWinnerPage;
