// src/pages/AuthTestPage.tsx
import React, { useState, useEffect } from 'react';
import { signInWithGooglePopup, auth } from '../services/firebase'; // auth 객체 import
import { signInWithCustomToken } from 'firebase/auth'; // signInWithCustomToken import
import axios from 'axios';

const AuthTestPage: React.FC = () => {
    const [idToken, setIdToken] = useState<string | null>(null);
    const [kakaoAuthCode, setKakaoAuthCode] = useState<string | null>(null);
    const [kakaoFirebaseCustomToken, setKakaoFirebaseCustomToken] = useState<string | null>(null);

    // Kakao SDK 초기화
    useEffect(() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(import.meta.env.VITE_KAKAO_APP_KEY);
            console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
        }

        // URL에서 인가 코드 추출 (카카오 로그인 리다이렉트 후)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            setKakaoAuthCode(code);
            // 인가 코드를 사용했으니 URL에서 제거
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // 인가 코드가 있으면 백엔드로 전송하여 Firebase Custom Token 받기
    useEffect(() => {
        const getFirebaseCustomTokenFromKakao = async () => {
            if (kakaoAuthCode) {
                try {
                    const response = await axios.post(
                        `http://localhost:8080/api/auth/login/kakao?code=${kakaoAuthCode}`
                    );
                    setKakaoFirebaseCustomToken(response.data.firebaseCustomToken);
                    alert("카카오 로그인 성공! Firebase Custom Token을 받았습니다.");
                } catch (error) {
                    console.error("Failed to get Firebase Custom Token from Kakao auth code:", error);
                    alert("카카오 로그인 실패: " + (error as Error).message);
                }
            }
        };
        getFirebaseCustomTokenFromKakao();
    }, [kakaoAuthCode]);

    // Firebase Custom Token이 있으면 Firebase에 로그인하고 ID Token 받기
    useEffect(() => {
        const signInWithFirebaseCustomToken = async () => {
            if (kakaoFirebaseCustomToken) {
                try {
                    const userCredential = await signInWithCustomToken(auth, kakaoFirebaseCustomToken);
                    const idToken = await userCredential.user.getIdToken();
                    setIdToken(idToken);
                    alert("Firebase Custom Token으로 로그인 성공! ID Token을 받았습니다.");
                } catch (error) {
                    console.error("Failed to sign in with Firebase Custom Token:", error);
                    alert("Firebase Custom Token 로그인 실패: " + (error as Error).message);
                }
            }
        };
        signInWithFirebaseCustomToken();
    }, [kakaoFirebaseCustomToken]);

    const handleGoogleSignIn = async () => {
        const token = await signInWithGooglePopup();
        if (token) {
            setIdToken(token);
        }
    };

    const handleKakaoSignIn = () => {
        if (window.Kakao) {
            window.Kakao.Auth.authorize({
                redirectUri: import.meta.env.VITE_KAKAO_REDIRECT_URI,
            });
        } else {
            alert('Kakao SDK가 로드되지 않았습니다.');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Firebase ID Token Extractor</h1>
            
            <h2>Google Login</h2>
            <button onClick={handleGoogleSignIn}>Sign in with Google</button>
            <hr style={{ margin: '20px 0' }} />

            <h2>Kakao Login</h2>
            <button onClick={handleKakaoSignIn}>Sign in with Kakao</button>
            {kakaoAuthCode && <p>Kakao Auth Code: {kakaoAuthCode}</p>}
            <hr style={{ margin: '20px 0' }} />

            <h3>Firebase ID Token (Google or Kakao):</h3>
            <textarea 
                value={idToken || ''} 
                readOnly 
                rows={10} 
                style={{ width: '100%', boxSizing: 'border-box' }} 
            />
            {/* Custom Token은 이제 직접 사용하지 않으므로 숨기거나 제거할 수 있습니다. */}
            {/* <h3>Kakao Firebase Custom Token:</h3>
            <textarea 
                value={kakaoFirebaseCustomToken || ''} 
                readOnly 
                rows={10} 
                style={{ width: '100%', boxSizing: 'border-box' }} 
            /> */}
        </div>
    );
};

export default AuthTestPage;
