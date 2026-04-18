"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase-app";
import { apiAuthVerify } from "@/lib/api";
import { getApiBase } from "@/lib/constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userExists, setUserExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoNoBackend, setDemoNoBackend] = useState(false);

  const refreshSession = useCallback(async (user) => {
    if (!user) {
      setProfile(null);
      setUserExists(false);
      setDemoNoBackend(false);
      return;
    }
    const token = await user.getIdToken();
    try {
      const v = await apiAuthVerify(token);
      if (v._demoNoBackend) {
        setDemoNoBackend(true);
        setUserExists(true);
        setProfile(null);
        return;
      }
      setDemoNoBackend(false);
      setUserExists(Boolean(v.userExists));
      setProfile(v.profile ?? null);
    } catch {
      setDemoNoBackend(false);
      setUserExists(false);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) await refreshSession(user);
      else {
        setProfile(null);
        setUserExists(false);
        setDemoNoBackend(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setProfile(null);
    setUserExists(false);
    setDemoNoBackend(false);
  }, []);

  const getIdToken = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return null;
    return u.getIdToken();
  }, []);

  const isAdmin = Boolean(profile?.userType === "Admin");

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      userExists,
      isAdmin,
      loading,
      demoNoBackend,
      apiConfigured: Boolean(getApiBase()),
      signOut,
      refreshSession,
      getIdToken,
    }),
    [
      firebaseUser,
      profile,
      userExists,
      isAdmin,
      loading,
      demoNoBackend,
      signOut,
      refreshSession,
      getIdToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
