"use client";

import { AccountDataProvider } from "./account-data-provider";
import { ClerkProvider, useClerk, useSession, useUser } from "@clerk/react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getClerkPublishableKey, isClerkConfigured } from "@/lib/clerk/config";
import { setCurrentAuthUser } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import { clearCurrentProfileCache } from "@/lib/services/current-profile";
import { bindAuthUser, setSupabaseAccessTokenProvider } from "@/lib/supabase/client";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const clerkPublishableKey = getClerkPublishableKey();

  if (!clerkPublishableKey) {
    return (
      <StaticAuthProvider isConfigured={false}>{children}</StaticAuthProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/auth/login"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <ClerkAuthProvider>{children}</ClerkAuthProvider>
    </ClerkProvider>
  );
}

function StaticAuthProvider({
  children,
  isConfigured,
}: {
  children: ReactNode;
  isConfigured: boolean;
}) {
  const value = useMemo<AuthContextType>(() => {
    return {
      user: null,
      isLoading: false,
      isConfigured,
      signOut: async () => {},
    };
  }, [isConfigured]);

  useEffect(() => {
    setCurrentAuthUser(null);
    clearCurrentProfileCache();
    setSupabaseAccessTokenProvider(null);
  }, []);

  return <AuthContext.Provider value={value}><AccountDataProvider>{children}</AccountDataProvider></AuthContext.Provider>;
}

function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { signOut: clerkSignOut } = useClerk();
  const { isLoaded: isSessionLoaded, session } = useSession();
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();

  const user = useMemo<AuthUser | null>(() => {
    if (!clerkUser || !session?.id) return null;

    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      displayName: clerkUser.fullName ?? clerkUser.username ?? null,
      avatarUrl: clerkUser.imageUrl ?? null,
    };
  }, [clerkUser, session?.id]);

  const authBridgeKey = `${isSessionLoaded}:${isUserLoaded}:${
    session?.id ?? "none"
  }:${user?.id ?? "none"}`;
  const [readyAuthBridgeKey, setReadyAuthBridgeKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    let isCurrent = true;

    setSupabaseAccessTokenProvider(
      session ? async () => session.getToken() : null
    );
    setCurrentAuthUser(user);
    bindAuthUser(user);
    clearCurrentProfileCache();
    if (!user) {
      clearCurrentProfileCache();
    }

    queueMicrotask(() => {
      if (isCurrent) {
        setReadyAuthBridgeKey(authBridgeKey);
      }
    });

    return () => {
      isCurrent = false;
      setSupabaseAccessTokenProvider(null);
      setCurrentAuthUser(null);
    };
  }, [authBridgeKey, session, user]);

  const signOut = async () => {
    setReadyAuthBridgeKey(null);
    setSupabaseAccessTokenProvider(null);
    setCurrentAuthUser(null);
    clearCurrentProfileCache();
    await clerkSignOut({ redirectUrl: "/" });
  };

  const isLoading =
    !isUserLoaded || !isSessionLoaded || readyAuthBridgeKey !== authBridgeKey;
  const contextUser = isLoading ? null : user;

  return (
    <AuthContext.Provider
      value={{
        user: contextUser,
        isLoading,
        isConfigured: isClerkConfigured(),
        signOut,
      }}
    >
      <AccountDataProvider key={isLoading ? "loading" : authBridgeKey}>{children}</AccountDataProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
