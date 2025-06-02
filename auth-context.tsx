"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    name: string;
    email: string;
  } | null;
};

type AuthContextType = {
  authState: AuthState;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const signOut = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
    router.replace("/");
  };

  const refreshAuth = async () => {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: {
        name: `${profile!.first_name} ${profile!.last_name}`,
        email: user.email || "",
      },
    });
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ authState, refreshAuth, signOut }}>
      {children}
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
