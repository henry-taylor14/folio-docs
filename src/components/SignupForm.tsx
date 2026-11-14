"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signUp() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't create your account.");
      }
      router.replace("/documents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account.");
      setPending(false);
    }
  }

  return (
    <form
      className="login-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void signUp();
      }}
    >
      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          className="input"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          className="input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete="new-password"
          aria-describedby="password-hint"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p id="password-hint" className="t-caption">
          At least 8 characters.
        </p>
      </div>
      <div>
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
