import React, { useState, useEffect } from "react";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../services/api/axiosInstance";

import "./DrawGenerationPage.css"; // 꼭 추가해 주세요!
import Tooltip from "../../components/common/Tooltip";

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
  const [drawType, setDrawType] = useState<"AA" | "AB" | "SEED">("SEED");
  const [numberOfTotalPlayer, setNumberOfTotalPlayer] = useState<number | "">(
    8
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
    if (!isNaN(value)) {
      setNumberOfTotalPlayer(value);
    }
  };

  const handleIncrement = () => {
    setNumberOfTotalPlayer((prev) => {
      const currentVal = typeof prev === "number" ? prev : 8; // 기본값 8
      const { max } = totalPlayerRange[drawType];
      const step = drawType === "AB" ? 2 : 1;
      let newVal = currentVal + step;
      if (newVal > max) newVal = max;
      // AB 타입일 때 홀수에서 +1 하면 짝수가 되도록 보정
      if (drawType === "AB" && newVal % 2 !== 0) {
        newVal += 1;
      }
      return newVal;
    });
  };

  const handleDecrement = () => {
    setNumberOfTotalPlayer((prev) => {
      const currentVal = typeof prev === "number" ? prev : 8; // 기본값 8
      const { min } = totalPlayerRange[drawType];
      const step = drawType === "AB" ? 2 : 1;
      let newVal = currentVal - step;
      if (newVal < min) newVal = min;
      // AB 타입일 때 홀수에서 -1 하면 짝수가 되도록 보정
      if (drawType === "AB" && newVal % 2 !== 0) {
        newVal -= 1;
      }
      return newVal;
    });
  };

  // drawType이 변경될 때마다 numberOfTotalPlayer를 유효한 범위 내로 조정
  useEffect(() => {
    const { min, max } = totalPlayerRange[drawType];
    if (typeof numberOfTotalPlayer === "number") {
      let currentVal = numberOfTotalPlayer;
      if (currentVal < min) {
        currentVal = min;
      } else if (currentVal > max) {
        currentVal = max;
      }
      // AB 타입일 때 짝수 강제
      if (drawType === "AB" && currentVal % 2 !== 0) {
        currentVal = Math.max(min, currentVal - 1); // 가장 가까운 짝수로 (min보다 작아지지 않게)
      }
      setNumberOfTotalPlayer(currentVal);
    } else {
      // 초기 로드 시 또는 유효하지 않은 값일 때 기본값 8로 설정
      setNumberOfTotalPlayer(8);
    }
  }, [drawType]);

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
    <div className="body-bg">
      <div className="page-container">
        <div className="logo-wrapper">
          <img src="/openrun_logo.jpeg" alt="logo" className="logo-img" />
        </div>
        <div className="sticky-header">
          <h1>대진 생성</h1>

          <div className="input-row">
            <span className="input-label">
              대진 타입
              <Tooltip
                label="(?)"
                content={
                  `AA: 단식 (1대1 경기)\n` +
                  `AB: 복식 (2대2 경기)\n` +
                  `SEED: 시드 방식 적용 대진`
                }
              />
            </span>
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

          <div className="input-row player-count-input">
            <label htmlFor="numberOfTotalPlayer" className="input-label">
              총 인원수
            </label>
            <div className="player-count-control">
              <button className="btn-stepper" onClick={handleDecrement}>
                -
              </button>
              <input
                id="numberOfTotalPlayer"
                className="input-range"
                type="range"
                value={numberOfTotalPlayer === "" ? 8 : numberOfTotalPlayer}
                onChange={handleNumberOfTotalPlayerChange}
                min={totalPlayerRange[drawType].min}
                max={totalPlayerRange[drawType].max}
                step={drawType === "AB" ? 2 : 1}
              />
              <button className="btn-stepper" onClick={handleIncrement}>
                +
              </button>
              <span className="current-player-count">
                {numberOfTotalPlayer === "" ? 8 : numberOfTotalPlayer}명
              </span>
            </div>
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
    </div>
  );
};

export default DrawGenerationPage;
