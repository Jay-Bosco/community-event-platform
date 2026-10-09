"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import type { UserRole } from "@/lib/types";

export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: UserRole;
}) {
  const router = useRouter();
  const { session, ready } = useSession();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (role && session.user.role !== role) {
      router.replace(
        session.user.role === "venue_manager" ? "/manager/queue" : "/events"
      );
    }
  }, [ready, session, role, router]);

  if (!ready || !session) {
    return (
      <div className="page-shell py-16">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  if (role && session.user.role !== role) {
    return (
      <div className="page-shell py-16">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
