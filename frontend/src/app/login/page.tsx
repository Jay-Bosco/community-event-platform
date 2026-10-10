"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon } from "@/components/EyeIcon";
import { ApiError, login } from "@/lib/api";
import { flash } from "@/lib/flash";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await login(email, password);
      flash.successNext("Logged in successfully.");
      router.push(session.user.role === "venue_manager" ? "/manager/queue" : "/events");
    } catch (err) {
      flash.error(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell py-8 sm:py-16">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rise space-y-2">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Log in</h1>
          <p className="text-sm text-ink/60 sm:text-base">Pick up where the Lagos crowd left off.</p>
        </div>
        <form onSubmit={onSubmit} className="panel rise rise-delay-1 space-y-4 p-4 sm:p-6">
          <label className="field">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <div className="field">
            <span>Password</span>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-0! pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink/55 hover:bg-mist hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-dark w-full">
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="text-sm text-ink/60">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-ink underline decoration-leaf/50 underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
