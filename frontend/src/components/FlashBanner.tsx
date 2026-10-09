"use client";

import { useEffect, useState } from "react";
import {
  consumePendingFlash,
  subscribeFlash,
  type FlashMessage,
} from "@/lib/flash";

const AUTO_HIDE_MS = 4500;

export function FlashBanner() {
  const [message, setMessage] = useState<FlashMessage | null>(null);

  useEffect(() => {
    consumePendingFlash();
    return subscribeFlash((msg) => setMessage(msg));
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), AUTO_HIDE_MS);
    return () => window.clearTimeout(t);
  }, [message]);

  if (!message) return null;

  const isSuccess = message.kind === "success";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-3 pt-3 sm:pt-4">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-xl border-2 bg-white px-4 py-3 text-sm font-medium shadow-sm ${
          isSuccess
            ? "border-ok text-ok"
            : "border-danger text-danger"
        }`}
      >
        <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>
          {isSuccess ? "✓" : "!"}
        </span>
        <p className="min-w-0 flex-1 leading-snug text-ink">{message.text}</p>
        <button
          type="button"
          onClick={() => setMessage(null)}
          className={`shrink-0 rounded-md px-1.5 py-0.5 hover:bg-mist ${
            isSuccess ? "text-ok/70 hover:text-ok" : "text-danger/70 hover:text-danger"
          }`}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
