"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import Loading from "@/components/Loading";
import { getHomePath, useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(getHomePath(user.role));
    }
  }, [loading, user, router]);

  if (loading) return <Loading />;
  if (user) return <Loading message="Redirecting..." />;

  return (
    <main className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-title">Meme&apos;d</h1>
        <p className="muted auth-subtitle">Campaign Payout Tracker</p>
        <AuthForm />
      </div>
    </main>
  );
}