import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { auth, onAuthChange, getIdToken, logout } from "../services/firebase";
import api from "../services/api";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  isSystemAdmin: boolean;
}

interface AuthContextType {
  isLoading: boolean;
  firebaseUser: User | null;
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Firebase 인증 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);

      if (user) {
        // Firebase 토큰으로 Admin API 호출하여 System Admin 여부 확인
        try {
          const token = await getIdToken();
          if (token) {
            const response = await api.get("/admin/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            setAdminUser(response.data);
          }
        } catch (error) {
          console.error("Admin 권한 확인 실패:", error);
          setAdminUser(null);
          // System Admin이 아니면 자동 로그아웃
          await logout();
        }
      } else {
        setAdminUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // API 요청에 자동으로 토큰 추가
  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      if (auth.currentUser) {
        const token = await getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

  const handleSignOut = async () => {
    await logout();
    setAdminUser(null);
  };

  const isAuthenticated = !!firebaseUser && !!adminUser;

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        firebaseUser,
        adminUser,
        isAuthenticated,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
