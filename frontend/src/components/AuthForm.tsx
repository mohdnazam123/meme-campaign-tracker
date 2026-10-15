"use client";

import { FormEvent, useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Role } from "@/lib/types";

type Mode = "login" | "signup";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function AuthForm() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("creator");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  function validate(): string | null {
    if (mode === "signup" && name.trim().length < 2) {
      return "Name must be at least 2 characters.";
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      return "Please enter a valid email address.";
    }
    if (mode === "signup" && password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (mode === "login" && password.length === 0) {
      return "Please enter your password.";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await signup(name.trim(), email.trim(), password, role);
      }
      // Success ke baad page.tsx user ko uske dashboard par bhej deta hai
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="tabs">
        <button
          type="button"
          className={mode === "login" ? "tab tab-active" : "tab"}
          aria-pressed={mode === "login"}
          onClick={() => switchMode("login")}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "tab tab-active" : "tab"}
          aria-pressed={mode === "signup"}
          onClick={() => switchMode("signup")}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        {mode === "signup" && (
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mode === "signup" && (
          <fieldset className="form-field role-field">
            <legend>I am a</legend>
            <label className="radio">
              <input
                type="radio"
                name="role"
                value="creator"
                checked={role === "creator"}
                onChange={() => setRole("creator")}
              />
              Creator
            </label>
            <label className="radio">
              <input
                type="radio"
                name="role"
                value="brand"
                checked={role === "brand"}
                onChange={() => setRole("brand")}
              />
              Brand
            </label>
          </fieldset>
        )}

        {error && <ErrorMessage message={error} />}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting
            ? "Please wait..."
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}