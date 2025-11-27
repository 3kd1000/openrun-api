import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../services/api/axiosInstance";

const DevAuthPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.post('/v1/dev/login', {
                email,
                name
            });

            const user = response.data;
            // 로컬 스토리지에 개발용 사용자 ID 저장
            localStorage.setItem('devUserId', user.id);
            localStorage.setItem('devUserName', user.name);

            alert(`로그인 성공! ${user.name}님 환영합니다.`);
            navigate('/'); // 홈으로 이동

        } catch (error) {
            console.error('Login failed:', error);
            alert('로그인 실패');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h1>개발용 로그인</h1>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>이메일:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>이름:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    로그인
                </button>
            </form>
        </div>
    );
};

export default DevAuthPage;
