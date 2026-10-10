"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { flash } from "@/lib/flash";
import {
  clearSession,
  getSession,
  subscribeIdleLogout,
  touchSessionActivity,
} from "@/lib/session";

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
];

export function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const lastTouch = useRef(0);

  useEffect(() => {
    const onActivity = () => {
      if (!getSession()) return;
      const now = Date.now();
      if (now - lastTouch.current < 1000) return;
      lastTouch.current = now;
      touchSessionActivity();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onActivity);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onActivity);
    };
  }, []);

  useEffect(() => {
    return subscribeIdleLogout(() => {
      clearSession();
      flash.error("Signed out due to inactivity. Please log in again.");
      if (pathname !== "/login" && pathname !== "/signup" && pathname !== "/") {
        router.replace("/login");
      }
    });
  }, [pathname, router]);

  return null;
}
