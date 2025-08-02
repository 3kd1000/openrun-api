import React, { useState, useEffect } from "react";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../services/api/axiosInstance";

import "./DrawGenerationPage.css"; // 꼭 추가해 주세요!

// API 응답 타입 정의 (CreateDrawResponse에 따라 수정 필요)
interface Game {
  gameNumber: number;
  players: string[];
}

interface CreateDrawResponse {
  games: Game[];
  // 기타 필드
}

const DrawGenerationPage: React.FC = () => {
  const [drawType, setDrawType] = useState<"AA" | "AB" | "SEED">("AA");
  const [numberOfTotalPlayer, setNumberOfTotalPlayer] = useState<number | "">(
    ""
  );
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [seedUserNames, setSeedUserNames] = useState<string[]>([]);
  const [groupAUserNames, setGroupAUserNames] = useState<string[]>([]);
  const [groupBUserNames, setGroupBUserNames] = useState<string[]>([]);
  const [drawResult, setDrawResult] = useState<CreateDrawResponse | null>(null);
  const [shareFormat, setShareFormat] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");

  // 대진 타입별 총 인원수 범위
  const totalPlayerRange = {
    AA: { min: 6, max: 16 },
    AB: { min: 8, max: 16 },
    SEED: { min: 6, max: 16 },
  };

  // SEED 타입의 총 인원에 따른 일반/시드 플레이어 수
  const getSeedPlayerCounts = (totalPlayers: number) => {
    if (totalPlayers >= 6 && totalPlayers <= 8)
      return { general: totalPlayers - 2, seed: 2 };
    if (totalPlayers > 8 && totalPlayers <= 10)
      return { general: totalPlayers - 3, seed: 3 };
    if (totalPlayers > 10 && totalPlayers <= 14)
      return { general: totalPlayers - 4, seed: 4 };
    if (totalPlayers == 15) return { general: totalPlayers - 5, seed: 5 };
    if (totalPlayers == 16) return { general: totalPlayers - 6, seed: 6 };
    return { general: totalPlayers, seed: 0 }; // 기본값
  };

  useEffect(() => {
    if (typeof numberOfTotalPlayer === "number" && numberOfTotalPlayer > 0) {
      if (drawType === "SEED") {
        const { general, seed } = getSeedPlayerCounts(numberOfTotalPlayer);
        setParticipantNames(Array(general).fill(""));
        setSeedUserNames(Array(seed).fill(""));
      } else {
        setParticipantNames(Array(numberOfTotalPlayer).fill(""));
        setSeedUserNames([]);
      }

      if (drawType === "AB") {
        setGroupAUserNames(Array(Math.ceil(numberOfTotalPlayer / 2)).fill(""));
        setGroupBUserNames(Array(Math.floor(numberOfTotalPlayer / 2)).fill(""));
      } else {
        setGroupAUserNames([]);
        setGroupBUserNames([]);
      }
    } else {
      setParticipantNames([]);
      setSeedUserNames([]);
      setGroupAUserNames([]);
      setGroupBUserNames([]);
    }
  }, [numberOfTotalPlayer, drawType]);

  const handleNumberOfTotalPlayerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) {
      setNumberOfTotalPlayer("");
      return;
    }

    const { min, max } = totalPlayerRange[drawType];
    if (value < min || value > max) {
      setToastMessage(`총 인원수는 ${min}명에서 ${max}명 사이여야 합니다.`);
      setNumberOfTotalPlayer(""); // 유효하지 않은 값은 초기화
    } else {
      setNumberOfTotalPlayer(value);
    }
  };

  const handleParticipantNameChange = (index: number, value: string) => {
    const newNames = [...participantNames];
    newNames[index] = value;
    setParticipantNames(newNames);
  };

  const handleSeedUserNameChange = (index: number, value: string) => {
    const newNames = [...seedUserNames];
    newNames[index] = value;
    setSeedUserNames(newNames);
  };

  const handleGroupAUserNameChange = (index: number, value: string) => {
    const newNames = [...groupAUserNames];
    newNames[index] = value;
    setGroupAUserNames(newNames);
  };

  const handleGroupBUserNameChange = (index: number, value: string) => {
    const newNames = [...groupBUserNames];
    newNames[index] = value;
    setGroupBUserNames(newNames);
  };

  const generateDraw = async () => {
    try {
      const requestBody = {
        userNames: participantNames.filter((name) => name.trim() !== ""),
        seedUserNames:
          drawType === "SEED"
            ? seedUserNames.filter((name) => name.trim() !== "")
            : [],
        drawType: drawType, // API의 DrawType enum에 맞게 매핑
        groupAUserNames:
          drawType === "AB"
            ? groupAUserNames.filter((name) => name.trim() !== "")
            : [],
        groupBUserNames:
          drawType === "AB"
            ? groupBUserNames.filter((name) => name.trim() !== "")
            : [],
        numberOfTotalPlayer:
          typeof numberOfTotalPlayer === "number" ? numberOfTotalPlayer : 0,
      };

      const shareResponse = await axiosInstance.post<string>(
        "/draw/share-format",
        requestBody
      );
      setShareFormat(shareResponse.data);
      setDrawResult(null); // drawResult는 사용하지 않으므로 null로 설정
    } catch (error) {
      console.error("Error generating draw:", error);
      setDrawResult(null);
      setShareFormat("");
      setToastMessage("대진 생성에 실패했습니다. 콘솔을 확인해주세요.");
    }
  };

  const resetForm = () => {
    setDrawType("AA"); // 초기화 시 AA로 설정
    setNumberOfTotalPlayer("");
    setParticipantNames([]);
    setSeedUserNames([]);
    setGroupAUserNames([]);
    setGroupBUserNames([]);
    setDrawResult(null);
    setShareFormat("");
  };

  const copyToClipboard = () => {
    if (shareFormat) {
      navigator.clipboard
        .writeText(shareFormat)
        .then(() => setToastMessage("클립보드에 복사되었습니다!"))
        .catch((err) => console.error("클립보드 복사 실패:", err));
    } else {
      setToastMessage("복사할 내용이 없습니다.");
    }
  };

  return (
    <>
      <div className="page-container">
        <div className="logo-wrapper">
          <img src="/openrun_logo.jpeg" alt="logo" className="logo-img" />
        </div>
        <div className="sticky-header">
          <h1>대진 생성</h1>

          <div className="input-row">
            <span className="input-label">대진 타입</span>
            <div className="radio-row">
              <label className="radio-label">
                <input
                  type="radio"
                  value="SEED"
                  checked={drawType === "SEED"}
                  onChange={(e) =>
                    setDrawType(e.target.value as "AA" | "AB" | "SEED")
                  }
                />
                Seed (시드)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="AA"
                  checked={drawType === "AA"}
                  onChange={(e) =>
                    setDrawType(e.target.value as "AA" | "AB" | "SEED")
                  }
                />
                AA
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="AB"
                  checked={drawType === "AB"}
                  onChange={(e) =>
                    setDrawType(e.target.value as "AA" | "AB" | "SEED")
                  }
                />
                AB
              </label>
            </div>
          </div>

          <div className="input-row">
            <label htmlFor="numberOfTotalPlayer" className="input-label">
              총 인원수
            </label>
            <input
              id="numberOfTotalPlayer"
              className="input-number"
              type="number"
              value={numberOfTotalPlayer}
              onChange={handleNumberOfTotalPlayerChange}
              min={drawType ? totalPlayerRange[drawType].min : 0}
              max={drawType ? totalPlayerRange[drawType].max : 100}
            />
          </div>
        </div>

        <div className="section">
          {typeof numberOfTotalPlayer === "number" &&
            numberOfTotalPlayer > 0 && (
              <div>
                <div className="section-title">참여자 정보 입력</div>
                {drawType === "AB" ? (
                  <div className="groups-row">
                    <div className="group-box">
                      <div className="group-title">
                        그룹 A ({Math.ceil(numberOfTotalPlayer / 2)}명)
                      </div>
                      <div className="input-list">
                        {groupAUserNames.map((name, index) => (
                          <input
                            key={`groupA-${index}`}
                            className="input-text"
                            type="text"
                            placeholder={`그룹 A 참가자 ${index + 1}`}
                            value={name}
                            onChange={(e) =>
                              handleGroupAUserNameChange(index, e.target.value)
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div className="group-box">
                      <div className="group-title">
                        그룹 B ({Math.floor(numberOfTotalPlayer / 2)}명)
                      </div>
                      <div className="input-list">
                        {groupBUserNames.map((name, index) => (
                          <input
                            key={`groupB-${index}`}
                            className="input-text"
                            type="text"
                            placeholder={`그룹 B 참가자 ${index + 1}`}
                            value={name}
                            onChange={(e) =>
                              handleGroupBUserNameChange(index, e.target.value)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="input-list">
                      {participantNames.map((name, index) => (
                        <input
                          key={`participant-${index}`}
                          className="input-text"
                          type="text"
                          placeholder={`참가자 ${index + 1}`}
                          value={name}
                          onChange={(e) =>
                            handleParticipantNameChange(index, e.target.value)
                          }
                        />
                      ))}
                    </div>
                    {drawType === "SEED" && (
                      <div id="seed-section">
                        <div className="group-title">
                          시드 플레이어 (
                          {getSeedPlayerCounts(numberOfTotalPlayer).seed}명)
                        </div>
                        <div className="input-list">
                          {seedUserNames.map((name, index) => (
                            <input
                              key={`seed-${index}`}
                              className="input-text"
                              type="text"
                              placeholder={`시드 ${index + 1}`}
                              value={name}
                              onChange={(e) =>
                                handleSeedUserNameChange(index, e.target.value)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
        </div>

        <div className="button-row">
          <button className="btn" onClick={generateDraw}>
            대진 생성
          </button>
          <button className="btn btn-secondary" onClick={resetForm}>
            초기화
          </button>
          <button className="btn btn-outline" onClick={copyToClipboard}>
            클립보드에 복사
          </button>
        </div>

        {drawResult && (
          <div className="result-section">
            <div className="result-title">생성된 대진 결과</div>
            {drawResult.games.map((game) => (
              <p key={game.gameNumber}>
                <strong>게임 {game.gameNumber}:</strong>{" "}
                {game.players.join(" vs ")}
              </p>
            ))}
          </div>
        )}

        {shareFormat && (
          <div className="share-section">
            <div className="result-title">공유 형식</div>
            <pre className="share-format-box">{shareFormat}</pre>
          </div>
        )}
      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </>
  );
};

export default DrawGenerationPage;
