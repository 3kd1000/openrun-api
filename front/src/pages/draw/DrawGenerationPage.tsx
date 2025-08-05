import React, { useState, useEffect, useRef } from "react";
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
  const [openFaq, setOpenFaq] = useState<string>("");
  const resultRef = useRef<HTMLDivElement>(null);

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

  // participantNames / seedUserNames 배열을 2명씩 한 줄로 묶는 함수
  const groupByTwo = (arr: string[]) => {
    const result: [string, string | ""][] = [];
    for (let i = 0; i < arr.length; i += 2) {
      result.push([arr[i], arr[i + 1] ?? ""]);
    }
    return result;
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
      if (drawType === "AB" && newVal % 2 !== 0) {
        newVal -= 1;
      }
      return newVal;
    });
  };

  useEffect(() => {
    const { min, max } = totalPlayerRange[drawType];
    if (typeof numberOfTotalPlayer === "number") {
      let currentVal = numberOfTotalPlayer;
      if (currentVal < min) {
        currentVal = min;
      } else if (currentVal > max) {
        currentVal = max;
      }
      if (drawType === "AB" && currentVal % 2 !== 0) {
        currentVal = Math.max(min, currentVal - 1);
      }
      setNumberOfTotalPlayer(currentVal);
    } else {
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
        drawType: drawType,
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

      //remove share format for new draw
      const shareResponse = await axiosInstance.post<string>(
        "/draw/share-format",
        requestBody
      );
      setShareFormat(shareResponse.data);
      setDrawResult(null);
      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error generating draw:", error);
      setDrawResult(null);
      setShareFormat("");
      setToastMessage("대진 생성에 실패했습니다. 콘솔을 확인해주세요.");
    }
  };

  const resetForm = () => {
    setDrawType("AA");
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
          <h1>한울방식 대진 생성</h1>
          <div className="input-row radio-type-row">
            <span className="input-label">대진 타입</span>
            <div className="radio-row">
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
                  value="SEED"
                  checked={drawType === "SEED"}
                  onChange={(e) =>
                    setDrawType(e.target.value as "AA" | "AB" | "SEED")
                  }
                />
                시드
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
                  <div className="input-list-2col">
                    {groupAUserNames.map((nameA, idx) => (
                      <div className="participant-row" key={idx}>
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {idx === 0 && (
                            <div
                              className="group-title"
                              style={{ marginBottom: 4, fontSize: "0.92rem" }}
                            >
                              그룹 A
                            </div>
                          )}
                          <input
                            className="input-text"
                            type="text"
                            placeholder={`그룹 A 참가자 ${idx + 1}`}
                            value={nameA}
                            onChange={(e) =>
                              handleGroupAUserNameChange(idx, e.target.value)
                            }
                          />
                        </div>
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {idx === 0 && (
                            <div
                              className="group-title"
                              style={{ marginBottom: 4, fontSize: "0.92rem" }}
                            >
                              그룹 B
                            </div>
                          )}
                          <input
                            className="input-text"
                            type="text"
                            placeholder={`그룹 B 참가자 ${idx + 1}`}
                            value={groupBUserNames[idx]}
                            onChange={(e) =>
                              handleGroupBUserNameChange(idx, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* 참가자명 2명씩 한 줄에 배치 */}
                    <div className="input-list-2col">
                      {groupByTwo(participantNames).map(
                        ([name1, name2], idx) => (
                          <div className="participant-row" key={idx}>
                            <input
                              className="input-text"
                              type="text"
                              placeholder={`참가자 ${idx * 2 + 1}`}
                              value={name1}
                              onChange={(e) =>
                                handleParticipantNameChange(
                                  idx * 2,
                                  e.target.value
                                )
                              }
                            />
                            {participantNames[idx * 2 + 1] !== undefined && (
                              <input
                                className="input-text"
                                type="text"
                                placeholder={`참가자 ${idx * 2 + 2}`}
                                value={name2}
                                onChange={(e) =>
                                  handleParticipantNameChange(
                                    idx * 2 + 1,
                                    e.target.value
                                  )
                                }
                              />
                            )}
                          </div>
                        )
                      )}
                    </div>
                    {/* 시드 플레이어명도 2명씩 한 줄에 배치 */}
                    {drawType === "SEED" && (
                      <div id="seed-section">
                        <div className="group-title">
                          시드 플레이어 (
                          {getSeedPlayerCounts(numberOfTotalPlayer).seed}명)
                        </div>
                        <div className="input-list-2col">
                          {groupByTwo(seedUserNames).map(
                            ([name1, name2], idx) => (
                              <div className="participant-row" key={idx}>
                                <input
                                  className="input-text"
                                  type="text"
                                  placeholder={`참가자 ${idx * 2 + 1}`}
                                  value={name1}
                                  onChange={(e) =>
                                    handleSeedUserNameChange(
                                      idx * 2,
                                      e.target.value
                                    )
                                  }
                                />
                                {seedUserNames[idx * 2 + 1] !== undefined && (
                                  <input
                                    className="input-text"
                                    type="text"
                                    placeholder={`참가자 ${idx * 2 + 2}`}
                                    value={name2}
                                    onChange={(e) =>
                                      handleSeedUserNameChange(
                                        idx * 2 + 1,
                                        e.target.value
                                      )
                                    }
                                  />
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
        </div>

        <div className="explain-btns-row">
          <button className="btn-guide" onClick={() => setOpenFaq("about")}>
            서비스 안내
          </button>
          <button className="btn-type" onClick={() => setOpenFaq("types")}>
            대진 타입 설명
          </button>
        </div>
        {openFaq === "about" && (
          <div className="accordion-card" style={{ position: "relative" }}>
            {/* 페이지 소개 텍스트 */}
            <button className="close-btn" onClick={() => setOpenFaq("")}>
              x
            </button>
            <div style={{ paddingTop: 8, paddingRight: 14 }}>
              <br />
              테니스 대진 생성 방식 중 하나인 한울타리 방식으로 대진을 생성하는
              서비스입니다. Openrun 테니스 클럽에서 제공합니다. <br />
              <br />
              대진 생성을 누를 때마다 랜덤요소가 적용하여 매번 다른 대진이
              생성됩니다. AA / 시드 / AB 모두 동일합니다. <br />
              <br />
              누구든지 무료로 자유롭게 이용 가능하며, 방문자 통계를 위한 수집
              이외에는 그 어떤 정보도 수집하지 않습니다. <br />
              (서버에 부하가 많이 걸려서 제가 비용을 내지 않는다면 말이죠..){" "}
              <br />
              <br />
              <span style={{ color: "#555", fontWeight: 500 }}>
                서비스 문의/개선/버그 신고:{" "}
                <a
                  href="mailto:dev.openrun@gmail.com"
                  style={{ color: "#396fda", textDecoration: "underline" }}
                >
                  dev.openrun@gmail.com
                </a>
              </span>
            </div>
          </div>
        )}
        {openFaq === "types" && (
          <div className="accordion-card" style={{ position: "relative" }}>
            <button className="close-btn" onClick={() => setOpenFaq("")}>
              x
            </button>
            {/* 타입 설명 텍스트 */}
            <div style={{ paddingTop: 8, paddingRight: 14 }}>
              <br />
              AA: 실력이 비슷한 선수끼리 복식 게임을 진행합니다. 게임마다
              파트너가 바뀌며, 상대편도 같은 사람은 최소한 적게 만나도록 합니다.
              <br />
              <br />
              시드: AA 방식을 기반으로 몇명의 실력이 출중하거나 반대의 경우
              시드로 지정하면 시드 플레이어는 같은 팀으로 만날 수 없도록 합니다.
              (상대편은 가능) <br />
              <br />
              AB: 두 그룹을 구분하여 함께 파트너가 될 수 있도록 합니다. 우승자 /
              비우승자 그룹 등으로 나눈 뒤 혼합복식 대진을 생성합니다.
            </div>
          </div>
        )}

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
          <div className="share-section" ref={resultRef}>
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
