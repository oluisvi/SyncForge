"use client";
import { AuthProvider, useAuth } from "./auth-provider";
import { AuthScreen } from "./auth-screen";
import { LaunchSequence } from "./launch-sequence";

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  return <><LaunchSequence ready={!loading} />{!loading && (user ? children : <AuthScreen />)}</>;
}
export function AppProviders({ children }: { children: React.ReactNode }) { return <AuthProvider><Gate>{children}</Gate></AuthProvider>; }
