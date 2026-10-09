"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    router.replace(session.user.role === "venue_manager" ? "/manager/queue" : "/events");
  }, [router]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink text-foam">
      <div className="absolute inset-0">
        <div className="hero-drift absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,#2a5c4a_0%,transparent_45%),radial-gradient(ellipse_at_80%_10%,#e07a5f33_0%,transparent_35%),linear-gradient(160deg,#0d1f1a_0%,#17352c_48%,#0a1814_100%)]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-40"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="stage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e07a5f" stopOpacity="0.35" />
              <stop offset="55%" stopColor="#2a5c4a" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0d1f1a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <ellipse className="hero-glow" cx="720" cy="210" rx="280" ry="120" fill="url(#stage)" />
          <path
            d="M120 720c120-90 260-140 400-140s280 50 400 140c90 68 180 110 280 130v90H-40v-90c100-20 190-62 280-130z"
            fill="#0a1612"
            opacity="0.85"
          />
          <rect x="250" y="470" width="940" height="18" rx="9" fill="#e07a5f" opacity="0.22" />
          <rect x="320" y="390" width="80" height="220" rx="8" fill="#1c4034" />
          <rect x="1040" y="390" width="80" height="220" rx="8" fill="#1c4034" />
          <circle cx="360" cy="360" r="18" fill="#e07a5f" opacity="0.7" />
          <circle cx="1080" cy="360" r="18" fill="#e07a5f" opacity="0.7" />
          <g opacity="0.35" fill="#e4efe9">
            <circle cx="480" cy="640" r="10" />
            <circle cx="520" cy="655" r="8" />
            <circle cx="560" cy="640" r="11" />
            <circle cx="610" cy="650" r="9" />
            <circle cx="660" cy="638" r="10" />
            <circle cx="720" cy="648" r="12" />
            <circle cx="780" cy="640" r="9" />
            <circle cx="830" cy="652" r="10" />
            <circle cx="880" cy="642" r="8" />
            <circle cx="930" cy="650" r="11" />
          </g>
        </svg>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(13,31,26,0.2),rgba(13,31,26,0.55)_55%,rgba(13,31,26,0.92))]" />
      </div>

      <div className="page-shell relative flex min-h-screen flex-col justify-end pb-16 pt-28 sm:pb-24">
        <p className="rise font-display text-5xl font-bold leading-[0.95] text-white sm:text-7xl md:text-8xl">
          Community
          <br />
          Events
        </p>
        <p className="rise rise-delay-1 mt-5 max-w-xl text-base text-white/75 sm:text-lg">
          From Ikeja to Yaba — Lagosians suggest the night. Venues green-light what rises to the top.
        </p>
        <div className="rise rise-delay-2 mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="btn btn-primary">
            Log in
          </Link>
          <Link href="/signup" className="btn btn-ghost border-white/25 bg-white/10 text-white hover:bg-white/20">
            Sign up
          </Link>
        </div>
      </div>
    </section>
  );
}
