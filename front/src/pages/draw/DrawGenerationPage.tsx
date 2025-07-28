import React, { useState, useEffect } from 'react';
import Toast from '../../components/common/Toast';
import axiosInstance from '../../services/api/axiosInstance';

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
  const [drawType, setDrawType] = useState<'AA' | 'AB' | 'SEED'>('AA');
  const [numberOfTotalPlayer, setNumberOfTotalPlayer] = useState<number | ''>('');
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [seedUserNames, setSeedUserNames] = useState<string[]>([]);
  const [groupAUserNames, setGroupAUserNames] = useState<string[]>([]);
  const [groupBUserNames, setGroupBUserNames] = useState<string[]>([]);
  const [drawResult, setDrawResult] = useState<CreateDrawResponse | null>(null);
  const [shareFormat, setShareFormat] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // 대진 타입별 총 인원수 범위
  const totalPlayerRange = {
    AA: { min: 6, max: 16 },
    AB: { min: 8, max: 16 },
    SEED: { min: 6, max: 16 },
  };

  // SEED 타입의 총 인원에 따른 일반/시드 플레이어 수
  const getSeedPlayerCounts = (totalPlayers: number) => {
    if (totalPlayers >= 6 && totalPlayers <= 8) return { general: totalPlayers - 2, seed: 2 };
    if (totalPlayers > 8 && totalPlayers <= 10) return { general: totalPlayers - 3, seed: 3 };
    if (totalPlayers > 10 && totalPlayers <= 14) return { general: totalPlayers - 4, seed: 4 };
    if (totalPlayers == 15) return { general: totalPlayers -5, seed: 5};
    if (totalPlayers == 16) return { general: totalPlayers -6, seed: 6};
    return { general: totalPlayers, seed: 0 }; // 기본값
  };

  useEffect(() => {
    if (typeof numberOfTotalPlayer === 'number' && numberOfTotalPlayer > 0) {
      if (drawType === 'SEED') {
        const { general, seed } = getSeedPlayerCounts(numberOfTotalPlayer);
        setParticipantNames(Array(general).fill(''));
        setSeedUserNames(Array(seed).fill(''));
      } else {
        setParticipantNames(Array(numberOfTotalPlayer).fill(''));
        setSeedUserNames([]);
      }

      if (drawType === 'AB') {
        setGroupAUserNames(Array(Math.ceil(numberOfTotalPlayer / 2)).fill(''));
        setGroupBUserNames(Array(Math.floor(numberOfTotalPlayer / 2)).fill(''));
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

  const handleNumberOfTotalPlayerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) {
      setNumberOfTotalPlayer('');
      return;
    }

    const { min, max } = totalPlayerRange[drawType];
    if (value < min || value > max) {
      setToastMessage(`총 인원수는 ${min}명에서 ${max}명 사이여야 합니다.`);
      setNumberOfTotalPlayer(''); // 유효하지 않은 값은 초기화
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
        userNames: participantNames.filter(name => name.trim() !== ''),
        seedUserNames: drawType === 'SEED' ? seedUserNames.filter(name => name.trim() !== '') : [],
        drawType: drawType, // API의 DrawType enum에 맞게 매핑
        groupAUserNames: drawType === 'AB' ? groupAUserNames.filter(name => name.trim() !== '') : [],
        groupBUserNames: drawType === 'AB' ? groupBUserNames.filter(name => name.trim() !== '') : [],
        numberOfTotalPlayer: typeof numberOfTotalPlayer === 'number' ? numberOfTotalPlayer : 0,
      };

      const shareResponse = await axiosInstance.post<string>('/draw/share-format', requestBody);
      setShareFormat(shareResponse.data);
      setDrawResult(null); // drawResult는 사용하지 않으므로 null로 설정

    } catch (error) {
      console.error('Error generating draw:', error);
      setDrawResult(null);
      setShareFormat('');
      setToastMessage('대진 생성에 실패했습니다. 콘솔을 확인해주세요.');
    }
  };

  const resetForm = () => {
    setDrawType('AA'); // 초기화 시 AA로 설정
    setNumberOfTotalPlayer('');
    setParticipantNames([]);
    setSeedUserNames([]);
    setGroupAUserNames([]);
    setGroupBUserNames([]);
    setDrawResult(null);
    setShareFormat('');
  };

  const copyToClipboard = () => {
    if (shareFormat) {
      navigator.clipboard.writeText(shareFormat)
        .then(() => setToastMessage('클립보드에 복사되었습니다!'))
        .catch(err => console.error('클립보드 복사 실패:', err));
    } else {
      setToastMessage('복사할 내용이 없습니다.');
    }
  };

  return (
    <>
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <img src="/openrun_logo.jpeg" alt="logo" style={{ width: '150px' }} />
        </div>
        <div style={{ position: 'sticky', top: '0', backgroundColor: 'white', zIndex: 1, padding: '10px 0' }}>
          <h1>대진 생성</h1>

          <div>
            <label>대진 타입:</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <label>
                <input
                  type="radio"
                  value="AA"
                  checked={drawType === 'AA'}
                  onChange={(e) => setDrawType(e.target.value as 'AA' | 'AB' | 'SEED')}
                />
                AA (단식)
              </label>
              <label>
                <input
                  type="radio"
                  value="AB"
                  checked={drawType === 'AB'}
                  onChange={(e) => setDrawType(e.target.value as 'AA' | 'AB' | 'SEED')}
                />
                AB (복식)
              </label>
              <label>
                <input
                  type="radio"
                  value="SEED"
                  checked={drawType === 'SEED'}
                  onChange={(e) => setDrawType(e.target.value as 'AA' | 'AB' | 'SEED')}
                />
                Seed (시드)
              </label>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label htmlFor="numberOfTotalPlayer">총 인원수:</label>
            <input
              id="numberOfTotalPlayer"
              type="number"
              value={numberOfTotalPlayer}
              onChange={handleNumberOfTotalPlayerChange}
              min={drawType ? totalPlayerRange[drawType].min : 0}
              max={drawType ? totalPlayerRange[drawType].max : 100}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </div>
        </div>

        <div style={{ minHeight: '300px', overflowY: 'auto', marginTop: '20px' }}>
          {typeof numberOfTotalPlayer === 'number' && numberOfTotalPlayer > 0 && (
            <div>
              <h2>참여자 정보 입력</h2>
              {drawType === 'AB' ? (
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                    <h3>그룹 A ({Math.ceil(numberOfTotalPlayer / 2)}명)</h3>
                    {groupAUserNames.map((name, index) => (
                      <input
                        key={`groupA-${index}`}
                        type="text"
                        placeholder={`그룹 A 참가자 ${index + 1}`}
                        value={name}
                        onChange={(e) => handleGroupAUserNameChange(index, e.target.value)}
                        style={{ display: 'block', marginBottom: '5px', padding: '5px' }}
                      />
                    ))}
                  </div>
                  <div>
                    <h3>그룹 B ({Math.floor(numberOfTotalPlayer / 2)}명)</h3>
                    {groupBUserNames.map((name, index) => (
                      <input
                        key={`groupB-${index}`}
                        type="text"
                        placeholder={`그룹 B 참가자 ${index + 1}`}
                        value={name}
                        onChange={(e) => handleGroupBUserNameChange(index, e.target.value)}
                        style={{ display: 'block', marginBottom: '5px', padding: '5px' }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {participantNames.map((name, index) => (
                    <input
                      key={`participant-${index}`}
                      type="text"
                      placeholder={`참가자 ${index + 1}`}
                      value={name}
                      onChange={(e) => handleParticipantNameChange(index, e.target.value)}
                      style={{ display: 'block', marginBottom: '5px', padding: '5px' }}
                    />
                  ))}
                  {drawType === 'SEED' && (
                    <div style={{ marginTop: '15px' }}>
                      <h3>시드 플레이어 ({getSeedPlayerCounts(numberOfTotalPlayer).seed}명)</h3>
                      {seedUserNames.map((name, index) => (
                        <input
                          key={`seed-${index}`}
                          type="text"
                          placeholder={`시드 ${index + 1}`}
                          value={name}
                          onChange={(e) => handleSeedUserNameChange(index, e.target.value)}
                          style={{ display: 'block', marginBottom: '5px', padding: '5px' }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          <button onClick={generateDraw} style={{ padding: '10px 20px', marginRight: '10px' }}>
            대진 생성
          </button>
          <button onClick={resetForm} style={{ padding: '10px 20px', marginRight: '10px' }}>
            초기화
          </button>
          <button onClick={copyToClipboard} style={{ padding: '10px 20px' }}>
            클립보드에 복사
          </button>
        </div>

        {drawResult && (
          <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h2>생성된 대진 결과</h2>
            {drawResult.games.map((game) => (
              <p key={game.gameNumber}>
                <strong>게임 {game.gameNumber}:</strong> {game.players.join(' vs ')}
              </p>
            ))}
          </div>
        )}

        {shareFormat && (
          <div style={{ marginTop: '20px' }}>
            <h3>공유 형식</h3>
            <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
              {shareFormat}
            </pre>
          </div>
        )}
      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </>
  );
};

export default DrawGenerationPage;
