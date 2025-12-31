import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../services/api/axiosInstance';

interface LocationState {
  token: string;
  userInfo: {
    id: number;
    name: string;
    email: string | null;
    imageUrl: string | null;
  };
}

const SetupProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OAuth에서 받은 기본 이름 표시
  const defaultName = state?.userInfo?.name || localStorage.getItem('user_name') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // state 또는 localStorage에서 token 가져오기
      const token = state?.token || localStorage.getItem('firebase_token');

      if (!token) {
        setError('인증 정보가 없습니다. 다시 로그인해주세요.');
        navigate('/login');
        return;
      }

      console.log('🔍 token 존재 확인:', token ? `${token.substring(0, 20)}...` : 'NULL');

      // PUT /api/users/me - 이름 업데이트 (명시적으로 헤더 전달)
      const response = await axiosInstance.put('/users/me',
        {
          name: name.trim(),
          imageUrl: localStorage.getItem('user_image_url') || null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // localStorage 업데이트
      localStorage.setItem('user_name', response.data.name);

      console.log('✅ 프로필 설정 완료:', response.data);

      // 메인 화면으로 이동
      navigate('/schedules');
    } catch (err: unknown) {
      console.error('❌ 프로필 설정 실패:', err);
      if (err instanceof Error) {
        setError(`프로필 설정 실패: ${err.message}`);
      } else {
        setError('프로필 설정 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '24px' }}>
          환영합니다! 🎾
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          OpenRun에서 사용할 이름을 설정해주세요.<br/>
          대진표 및 스코어보드에 표시되는 이름입니다.
        </p>

        {defaultName && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
          }}>
            <span style={{ color: '#666' }}>현재 이름: </span>
            <span style={{ fontWeight: '500' }}>{defaultName}</span>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333',
            }}>
              실명 입력 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading || !name.trim() ? '#ccc' : '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '저장 중...' : '저장하고 시작하기'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '12px',
          color: '#999',
        }}>
          나중에 프로필 설정에서 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default SetupProfilePage;
