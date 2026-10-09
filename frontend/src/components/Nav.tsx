"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready, logout: clearAuth } = useSession();
  const onHome = pathname === "/";

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <header
      className={`z-20 ${
        onHome
          ? "absolute inset-x-0 top-0 bg-transparent"
          : "sticky top-0 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--foam)_82%,transparent)] backdrop-blur-md"
      }`}
    >
      <div className="page-shell flex items-center justify-between gap-4 py-4">
        <Link
          href="/"
          className={`font-display text-lg font-bold tracking-tight ${
            onHome ? "text-white" : "text-ink"
          }`}
        >
          Community Events
        </Link>
        <nav
          className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium ${
            onHome ? "text-white/85" : "text-ink/75"
          }`}
        >
          {!ready ? null : session ? (
            <>
              {session.user.role === "customer" && (
                <>
                  <Link href="/events" className="hover:opacity-100 opacity-90 transition">
                    Events
                  </Link>
                  <Link href="/events/new" className="hover:opacity-100 opacity-90 transition">
                    Suggest
                  </Link>
                </>
              )}
              {session.user.role === "venue_manager" && (
                <Link href="/manager/queue" className="hover:opacity-100 opacity-90 transition">
                  Queue
                </Link>
              )}
              <span className={onHome ? "text-white/60" : "text-ink/45"}>
                {session.user.display_name}
              </span>
              <button
                type="button"
                onClick={logout}
                className={`rounded-lg px-3 py-1.5 transition ${
                  onHome
                    ? "border border-white/25 bg-white/10 hover:bg-white/20"
                    : "border border-[var(--line)] bg-white hover:bg-mist"
                }`}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="opacity-90 transition hover:opacity-100">
                Log in
              </Link>
              <Link
                href="/signup"
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  onHome
                    ? "bg-accent text-accent-ink hover:brightness-105"
                    : "bg-ink text-foam hover:bg-moss"
                }`}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
