"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mirrors scripts/seed.ts. Shown so reviewers can switch accounts quickly.
const DEMO_ACCOUNTS = [
  { email: "alice@example.com", name: "Alice" },
  { email: "bob@example.com", name: "Bob" },
  { email: "carol@example.com", name: "Carol" },
];
const DEMO_PASSWORD = "demo1234";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn(e?: React.FormEvent, creds?: { email: string; password: string }) {
    e?.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds ?? { email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't sign in.");
      }
      router.replace("/documents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={signIn} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
      <div className="demo-accounts">
        Demo accounts (password <code>{DEMO_PASSWORD}</code>):
        <ul>
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button type="button" disabled={pending} onClick={() => signIn(undefined, { email: a.email, password: DEMO_PASSWORD })}>
                Sign in as {a.name}
              </button>{" "}
              ({a.email})
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
