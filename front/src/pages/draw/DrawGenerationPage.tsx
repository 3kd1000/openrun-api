import React, { useState, useEffect, useRef } from "react";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../services/api/axiosInstance";

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

  useEffect(() => {
    if (shareFormat && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [shareFormat]);

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

  /* shared input class */
  const inputTextClass =
    "bg-background text-foreground border-[1.5px] border-border rounded-md text-base w-full outline-none transition-[border] h-[46px] px-4 py-2.5 mb-4 box-border placeholder:text-muted-foreground focus:border-[1.7px] focus:border-primary max-md:h-[42px] last:mb-0";

  return (
    <div className="w-full min-h-screen flex justify-center items-start bg-background box-border">
      <div className="px-6 py-8 max-w-[480px] w-full mx-auto my-9 bg-muted rounded-[24px] shadow-[0_2px_12px_0_rgba(60,60,100,0.06)] font-sans max-md:w-[99vw] max-md:max-w-[99vw] max-md:px-[1vw] max-md:py-6 max-md:m-0 max-md:rounded-none max-md:shadow-none">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/openrun_logo.jpeg"
            alt="logo"
            className="w-[120px] rounded-xl max-md:w-[78px]"
          />
        </div>

        {/* Sticky Header */}
        <div className="sticky top-auto bg-background z-auto px-6 pt-6 pb-4 border-b border-border mb-4 rounded-t-[24px] max-md:px-[6vw] max-md:pt-4 max-md:pb-3">
          <span className="block text-2xl text-center mb-6 text-foreground font-bold tracking-[-0.5px]">
            한울방식 대진 생성
          </span>

          {/* Draw type radio row - flex-row on mobile too */}
          <div className="flex flex-row items-center gap-6 my-[17px] min-h-[48px] max-md:flex-row max-md:items-center max-md:gap-6">
            <span className="font-semibold text-foreground/70 min-w-[82px] text-right">
              대진 타입
            </span>
            <div className="flex items-center gap-6 min-h-[40px]">
              <label className="flex items-center gap-[5px] text-base font-medium cursor-pointer text-foreground bg-none">
                <input
                  type="radio"
                  value="AA"
                  checked={drawType === "AA"}
                  onChange={(e) =>
                    setDrawType(e.target.value as "AA" | "AB" | "SEED")
                  }
                  className="m-0 accent-primary align-middle"
                />
                AA
              </label>
              <label className="flex items-center gap-[5px] text-base font-medium cursor-pointer text-foreground bg-none">
                <input
                  type="radio"
                  value="SEED"
                  checked={drawType === "SEED"}
                  onChange={(e) =>
                    setDrawType(e.target.value as "AA" | "AB" | "SEED")
                  }
                  className="m-0 accent-primary align-middle"
                />
                시드
              </label>
              <label className="flex items-center gap-[5px] text-base font-medium cursor-pointer text-foreground bg-none">
                <input
                  type="radio"
                  value="AB"
                  checked={drawType === "AB"}
                  onChange={(e) =>
                    setDrawType(e.target.value as "AA" | "AB" | "SEED")
                  }
                  className="m-0 accent-primary align-middle"
                />
                AB
              </label>
            </div>
          </div>

          {/* Player count row */}
          <div className="flex items-center gap-6 my-[17px] min-h-[48px] max-md:flex-col max-md:items-stretch max-md:gap-[7px] max-md:min-h-0">
            <label
              htmlFor="numberOfTotalPlayer"
              className="font-semibold text-foreground/70 min-w-[82px] text-right"
            >
              총 인원수
            </label>
            <div className="flex items-center gap-3 h-[44px] min-w-0 w-full flex-nowrap max-md:h-[42px] max-md:gap-2 max-md:w-full">
              <button
                className="flex-shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-md border-[1.5px] border-primary bg-background text-primary text-[2.4rem] leading-none font-bold flex justify-center items-center cursor-pointer p-0 box-border align-middle active:bg-primary active:text-white"
                onClick={handleDecrement}
              >
                -
              </button>
              <input
                id="numberOfTotalPlayer"
                className="flex-1 min-w-[80px] max-w-[150px] h-[7px] m-0 bg-muted rounded cursor-pointer max-md:min-w-0 max-md:w-full"
                type="range"
                value={numberOfTotalPlayer === "" ? 8 : numberOfTotalPlayer}
                onChange={handleNumberOfTotalPlayerChange}
                min={totalPlayerRange[drawType].min}
                max={totalPlayerRange[drawType].max}
                step={drawType === "AB" ? 2 : 1}
              />
              <button
                className="flex-shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-md border-[1.5px] border-primary bg-background text-primary text-[2.4rem] leading-none font-bold flex justify-center items-center cursor-pointer p-0 box-border align-middle active:bg-primary active:text-white"
                onClick={handleIncrement}
              >
                +
              </button>
              <span className="font-semibold text-primary min-w-[45px] flex-shrink-0 text-right text-base whitespace-nowrap max-md:ml-auto max-md:static max-md:transform-none">
                {numberOfTotalPlayer === "" ? 8 : numberOfTotalPlayer}명
              </span>
            </div>
          </div>
        </div>

        {/* Participant inputs section */}
        <div className="mt-7 mb-6">
          {typeof numberOfTotalPlayer === "number" &&
            numberOfTotalPlayer > 0 && (
              <div>
                <div className="text-base text-foreground font-bold mb-3">
                  참여자 정보 입력
                </div>
                {drawType === "AB" ? (
                  <div className="flex flex-col gap-[10px] max-md:gap-2">
                    {groupAUserNames.map((nameA, idx) => (
                      <div className="flex gap-4" key={idx}>
                        <div className="flex-1 flex flex-col">
                          {idx === 0 && (
                            <div
                              className="text-base font-semibold mb-1 text-foreground/70"
                              style={{ marginBottom: 4, fontSize: "0.92rem" }}
                            >
                              그룹 A
                            </div>
                          )}
                          <input
                            className={inputTextClass}
                            type="text"
                            placeholder={`그룹 A 참가자 ${idx + 1}`}
                            value={nameA}
                            onChange={(e) =>
                              handleGroupAUserNameChange(idx, e.target.value)
                            }
                          />
                        </div>
                        <div className="flex-1 flex flex-col">
                          {idx === 0 && (
                            <div
                              className="text-base font-semibold mb-1 text-foreground/70"
                              style={{ marginBottom: 4, fontSize: "0.92rem" }}
                            >
                              그룹 B
                            </div>
                          )}
                          <input
                            className={inputTextClass}
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
                    <div className="flex flex-col gap-[10px] max-md:gap-2">
                      {groupByTwo(participantNames).map(
                        ([name1, name2], idx) => (
                          <div className="flex gap-4" key={idx}>
                            <input
                              className={inputTextClass}
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
                                className={inputTextClass}
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
                      <div className="mt-4 pt-3 border-t border-dashed border-border">
                        <div className="text-base font-semibold mb-3 text-foreground/70">
                          시드 플레이어 (
                          {getSeedPlayerCounts(numberOfTotalPlayer).seed}명)
                        </div>
                        <div className="flex flex-col gap-[10px] max-md:gap-2">
                          {groupByTwo(seedUserNames).map(
                            ([name1, name2], idx) => (
                              <div className="flex gap-4" key={idx}>
                                <input
                                  className={inputTextClass}
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
                                    className={inputTextClass}
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

        {/* Explain buttons row */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            className="bg-[#dae754] text-[#25201b] border-none rounded-md font-bold text-base py-[9px] px-[22px] cursor-pointer transition-colors active:bg-[#e1b801]"
            onClick={() => setOpenFaq("about")}
          >
            서비스 안내
          </button>
          <button
            className="bg-[#4cad90] text-white border-none rounded-md font-bold text-base py-[9px] px-[22px] cursor-pointer transition-colors active:bg-[#294994]"
            onClick={() => setOpenFaq("types")}
          >
            대진 타입 설명
          </button>
        </div>

        {openFaq === "about" && (
          <div className="bg-background border-[1.5px] border-primary rounded-xl shadow-[0_4px_16px_0_rgba(60,60,100,0.06)] mb-4 -mt-2 relative animate-[fadeIn_0.2s_ease] p-6 text-foreground text-base leading-relaxed">
            <button
              className="absolute top-[10px] right-4"
              onClick={() => setOpenFaq("")}
            >
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
          <div className="bg-background border-[1.5px] border-primary rounded-xl shadow-[0_4px_16px_0_rgba(60,60,100,0.06)] mb-4 -mt-2 relative animate-[fadeIn_0.2s_ease] p-6 text-foreground text-base leading-relaxed">
            <button
              className="absolute top-[10px] right-4"
              onClick={() => setOpenFaq("")}
            >
              x
            </button>
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

        {/* Button row */}
        <div className="my-[30px] mb-3 flex gap-4 justify-center flex-wrap max-md:flex-col max-md:gap-3">
          <button
            className="py-2.5 px-6 bg-primary text-white border-none rounded-md text-base font-semibold cursor-pointer transition-colors min-w-[116px] active:bg-primary/90"
            onClick={generateDraw}
          >
            대진 생성
          </button>
          <button
            className="py-2.5 px-6 bg-foreground/60 text-white border-none rounded-md text-base font-semibold cursor-pointer transition-colors min-w-[116px] active:bg-foreground/70"
            onClick={resetForm}
          >
            초기화
          </button>
          <button
            className="py-2.5 px-6 bg-background text-primary border-[1.5px] border-primary rounded-md text-base font-semibold cursor-pointer transition-colors min-w-[116px]"
            onClick={copyToClipboard}
          >
            클립보드에 복사
          </button>
        </div>

        {drawResult && (
          <div className="mt-9 border-t border-border pt-6 bg-background text-foreground rounded-lg shadow-[0_2px_8px_0_rgba(60,60,100,0.06)]">
            <div className="text-lg font-bold text-foreground mb-4">
              생성된 대진 결과
            </div>
            {drawResult.games.map((game) => (
              <p key={game.gameNumber}>
                <strong>게임 {game.gameNumber}:</strong>{" "}
                {game.players.join(" vs ")}
              </p>
            ))}
          </div>
        )}

        {shareFormat && (
          <div
            className="mt-9 border-t border-border pt-6 bg-background text-foreground rounded-lg shadow-[0_2px_8px_0_rgba(60,60,100,0.06)]"
            ref={resultRef}
          >
            <div className="text-lg font-bold text-foreground mb-4">
              공유 형식
            </div>
            <pre className="p-4 bg-muted rounded-md font-mono text-base whitespace-pre-wrap break-words overflow-wrap-anywhere overflow-x-auto mt-[7px] text-foreground max-w-full box-border max-md:text-sm">
              {shareFormat}
            </pre>
          </div>
        )}
      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default DrawGenerationPage;
