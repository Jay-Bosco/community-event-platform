"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready, logout: clearAuth } = useSession();
  const onHome = pathname === "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function logout() {
    clearAuth();
    setOpen(false);
    router.push("/login");
  }

  const linkMuted = onHome ? "text-white/85 hover:text-white" : "text-ink/75 hover:text-ink";
  const nameMuted = onHome ? "text-white/60" : "text-ink/45";
  const logoutBtn = onHome
    ? "border border-white/25 bg-white/10 hover:bg-white/20"
    : "border border-[var(--line)] bg-white hover:bg-mist";
  const menuBtn = onHome
    ? "border border-white/25 bg-white/10 text-white"
    : "border border-[var(--line)] bg-white text-ink";

  function NavLinks({ stacked }: { stacked?: boolean }) {
    if (!ready) return null;

    const item = stacked ? "block py-1" : "shrink-0";
    const compact = stacked ? "w-full" : "!min-h-0 !px-3 !py-1.5 text-sm";
    const loginBtn = `btn btn-primary ${compact}`;
    const signupBtn = onHome
      ? `btn ${compact} border border-white/25 bg-white/10 !text-white hover:bg-white/20`
      : `btn btn-ghost ${compact}`;

    if (session) {
      return (
        <>
          {session.user.role === "customer" && (
            <>
              <Link
                href="/events"
                className={`${linkMuted} ${item} transition`}
                onClick={() => setOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/events/new"
                className={`${linkMuted} ${item} transition`}
                onClick={() => setOpen(false)}
              >
                Suggest
              </Link>
            </>
          )}
          {session.user.role === "venue_manager" && (
            <Link
              href="/manager/queue"
              className={`${linkMuted} ${item} transition`}
              onClick={() => setOpen(false)}
            >
              Queue
            </Link>
          )}
          <span className={`${nameMuted} ${item} text-sm`}>{session.user.display_name}</span>
          <button
            type="button"
            onClick={logout}
            className={`rounded-lg px-3 py-1.5 transition ${logoutBtn} ${stacked ? "w-full text-left" : "shrink-0"}`}
          >
            Log out
          </button>
        </>
      );
    }

    return (
      <>
        <Link href="/login" className={loginBtn} onClick={() => setOpen(false)}>
          Log in
        </Link>
        <Link href="/signup" className={signupBtn} onClick={() => setOpen(false)}>
          Sign up
        </Link>
      </>
    );
  }

  return (
    <header
      className={`z-30 ${
        onHome
          ? "absolute inset-x-0 top-0 bg-transparent"
          : "sticky top-0 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--foam)_82%,transparent)] backdrop-blur-md"
      }`}
    >
      <div className="page-shell flex items-center justify-between gap-3 py-3 md:py-4">
        <Link
          href={
            session?.user.role === "venue_manager"
              ? "/manager/queue"
              : session
                ? "/events"
                : "/"
          }
          className={`font-display min-w-0 truncate text-base font-bold tracking-tight md:text-lg ${
            onHome ? "text-white" : "text-ink"
          }`}
        >
          Community Events
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
          <NavLinks />
        </nav>

        <button
          type="button"
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:hidden ${menuBtn}`}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div
          className={`border-t md:hidden ${
            onHome
              ? "border-white/15 bg-ink/95 text-white backdrop-blur-md"
              : "border-[var(--line)] bg-foam/95 backdrop-blur-md"
          }`}
        >
          <nav className="page-shell flex flex-col gap-3 py-4 text-sm font-medium">
            <NavLinks stacked />
          </nav>
        </div>
      ) : null}
    </header>
  );
}
