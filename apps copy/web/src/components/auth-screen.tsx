"use client";
import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "./auth-provider";

export function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login"); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else { await signup(email, password); setMode("login"); setNotice("Account request accepted. Sign in with your credentials."); }
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not reach SyncForge API."); }
    finally { setBusy(false); }
  }
  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="brand-kicker">Collaborative architecture intelligence</div>
        <h1>See the system.<br /><span>Understand the system.</span></h1>
        <p>Turn repositories and engineering knowledge into a living architecture map your team can explore together.</p>
        <div className="auth-signal-card" aria-hidden="true">
          <div className="signal-node"><b>Web</b><small>Next.js</small></div><div className="signal-edge"><span /></div><div className="signal-node accent"><b>API</b><small>NestJS</small></div><div className="signal-edge"><span /></div><div className="signal-node"><b>Data</b><small>PostgreSQL</small></div>
        </div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-wordmark">SyncForge</div>
          <h2>{mode === "login" ? "Welcome back" : "Create your workspace"}</h2>
          <p>{mode === "login" ? "Continue exploring your software architecture." : "Start with a repository or build an architecture manually."}</p>
          <form onSubmit={submit} className="auth-form">
            <label>Email<input autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label>
            <label>Password<input autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" required minLength={mode === "signup" ? 15 : 1} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "15+ characters" : "Your password"} /></label>
            {error && <div className="form-error" role="alert">{error}</div>}{notice && <div className="form-notice" role="status">{notice}</div>}
            <button className="primary-button auth-submit" disabled={busy}>{busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
          <button className="text-button auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); }}>
            {mode === "login" ? "New to SyncForge? Create an account" : "Already have an account? Sign in"}
          </button>
          <p className="auth-security-note">Repository code is analyzed as untrusted text and is never executed.</p>
        </div>
      </section>
    </main>
  );
}
