// src/pages/AuthTestPage.tsx
import React, { useState } from 'react';
import { signInWithGooglePopup } from '../services/firebase';

const AuthTestPage: React.FC = () => {
    const [idToken, setIdToken] = useState<string | null>(null);

    const handleSignIn = async () => {
        const token = await signInWithGooglePopup();
        if (token) {
            setIdToken(token);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Firebase ID Token Extractor</h1>
            <button onClick={handleSignIn}>Sign in with Google</button>
            <hr style={{ margin: '20px 0' }} />
            <h3>Your ID Token:</h3>
            <textarea 
                value={idToken || ''} 
                readOnly 
                rows={10} 
                style={{ width: '100%', boxSizing: 'border-box' }} 
            />
        </div>
    );
};

export default AuthTestPage;
