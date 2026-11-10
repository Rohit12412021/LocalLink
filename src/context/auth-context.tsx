"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ApiError,
  getGoogleAuthUrl,
  getMe,
  login as apiLogin,
  register as apiRegister,
  updateProfile as apiUpdateProfile,
  uploadUserAvatar as apiUploadUserAvatar,
  verifyEmail as apiVerifyEmail,
} from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth-storage";
import { refreshSocketToken, disconnectSocket } from "@/lib/socket";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from "@/types";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  updateMe: (payload: {
    name?: string;
    phone?: string;
    location?: string;
  }) => Promise<AuthUser>;
  uploadAvatar: (file: File) => Promise<AuthUser>;
  verifyEmailWithToken: (token: string) => Promise<void>;
  googleSignIn: () => void;
  bootstrapWithToken: (token: string) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const stored = getToken();
    if (!stored) {
      setUser(null);
      setTokenState(null);
      return;
    }

    try {
      const me = await getMe();
      setUser(me);
      setTokenState(stored);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          clearToken();
        } else if (err.status === 0) {
          console.warn("Server unreachable during auth refresh");
          return;
        }
      }
      setUser(null);
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        await refreshMe();
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [refreshMe]);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const response = await apiLogin(payload);
      setToken(response.accessToken);
      setTokenState(response.accessToken);
      setUser(response.user);
      refreshSocketToken();
      return response.user;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          throw new ApiError(
            "Unable to connect to server. Please check your internet connection.",
            0,
          );
        }
        if (err.status === 401) {
          throw new ApiError(
            (err.message.includes("verify")
              ? err.message
              : "Invalid email or password"),
            401,
          );
        }
        if (err.status === 429) {
          throw new ApiError(
            "Too many login attempts. Please try again later.",
            429,
          );
        }
      }
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      const response = await apiRegister(payload);
      // Registration doesn't log the user in — they must verify their email first.
      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          throw new ApiError(
            "Unable to connect to server. Please check your internet connection.",
            0,
          );
        }
        if (err.status === 409) {
          throw new ApiError("An account with this email already exists", 409);
        }
        if (err.status === 429) {
          throw new ApiError(
            "Too many registration attempts. Please try again later.",
            429,
          );
        }
      }
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setTokenState(null);
    disconnectSocket();
  }, []);

  const updateMe = useCallback(
    async (payload: { name?: string; phone?: string; location?: string }) => {
      const next = await apiUpdateProfile(payload);
      setUser(next);
      return next;
    },
    [],
  );

  const uploadAvatar = useCallback(async (file: File) => {
    const next = await apiUploadUserAvatar(file);
    setUser(next);
    return next;
  }, []);

  const verifyEmailWithToken = useCallback(
    async (token: string) => {
      await apiVerifyEmail(token);
      await refreshMe();
    },
    [refreshMe],
  );

  const googleSignIn = useCallback(() => {
    window.location.assign(getGoogleAuthUrl());
  }, []);

  const bootstrapWithToken = useCallback(async (incoming: string) => {
    setToken(incoming);
    setTokenState(incoming);
    try {
      const me = await getMe();
      setUser(me);
      refreshSocketToken();
      return me;
    } catch (err) {
      clearToken();
      setTokenState(null);
      setUser(null);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshMe,
      updateMe,
      uploadAvatar,
      verifyEmailWithToken,
      googleSignIn,
      bootstrapWithToken,
    }),
    [
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshMe,
      updateMe,
      uploadAvatar,
      verifyEmailWithToken,
      googleSignIn,
      bootstrapWithToken,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}