"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon } from "@/components/EyeIcon";
import { ApiError, register } from "@/lib/api";
import { flash } from "@/lib/flash";
import type { UserRole } from "@/lib/types";

function getPasswordChecks(password: string) {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      id: "number",
      label: "Contains a number",
      met: /\d/.test(password),
    },
    {
      id: "sign",
      label: "Contains a symbol (!@#$…)",
      met: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: "upper",
      label: "Contains an uppercase letter",
      met: /[A-Z]/.test(password),
    },
  ] as const;
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordStrong = checks.every((c) => c.met);
  const metCount = checks.filter((c) => c.met).length;
  const strengthLabel =
    metCount <= 2 ? "Poor" : metCount === 3 ? "Fair" : "Strong";
  const strengthColor =
    metCount <= 2
      ? "bg-danger"
      : metCount === 3
        ? "bg-warn"
        : "bg-ok";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!passwordStrong) {
      flash.error("Please meet all password requirements before continuing.");
      return;
    }

    setLoading(true);
    try {
      const session = await register({
        email,
        password,
        display_name: displayName,
        role,
      });
      flash.successNext("Account created successfully.");
      router.push(session.user.role === "venue_manager" ? "/manager/queue" : "/events");
    } catch (err) {
      flash.error(err instanceof ApiError ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell py-10 sm:py-16">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rise space-y-2">
          <h1 className="font-display text-4xl font-bold text-ink">Sign up</h1>
          <p className="text-ink/60">Join as a customer or venue manager.</p>
        </div>
        <form onSubmit={onSubmit} className="panel rise rise-delay-1 space-y-4 p-5 sm:p-6">
          <label className="field">
            Display name
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </label>
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="!mt-0 pr-12"
                aria-describedby="password-requirements"
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

            {password.length > 0 && (
              <div className="mt-3 space-y-2" id="password-requirements">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
                    <div
                      className={`h-full rounded-full transition-all ${strengthColor}`}
                      style={{ width: `${(metCount / checks.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-ink/60">{strengthLabel}</span>
                </div>
                <ul className="space-y-1.5 text-xs">
                  {checks.map((check) => (
                    <li
                      key={check.id}
                      className={`flex items-center gap-2 ${
                        check.met ? "text-ok" : "text-ink/45"
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                          check.met
                            ? "bg-ok text-white"
                            : "border border-[var(--line)] bg-white text-ink/40"
                        }`}
                        aria-hidden
                      >
                        {check.met ? "✓" : ""}
                      </span>
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <fieldset className="space-y-2 text-sm">
            <legend className="mb-1 font-medium text-ink/80">Role</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-3">
              <input
                type="radio"
                name="role"
                className="mt-1"
                checked={role === "customer"}
                onChange={() => setRole("customer")}
              />
              <span>
                <span className="font-semibold text-ink">Customer</span>
                <span className="mt-0.5 block text-ink/55">Suggest and upvote events</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-3">
              <input
                type="radio"
                name="role"
                className="mt-1"
                checked={role === "venue_manager"}
                onChange={() => setRole("venue_manager")}
              />
              <span>
                <span className="font-semibold text-ink">Venue manager</span>
                <span className="mt-0.5 block text-ink/55">Approve or reject your queue</span>
              </span>
            </label>
          </fieldset>
          <button
            type="submit"
            disabled={loading || !passwordStrong}
            className="btn btn-dark w-full"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline decoration-leaf/50 underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
