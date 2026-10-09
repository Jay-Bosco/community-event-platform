import type { EventStatus } from "@/lib/types";

const styles: Record<EventStatus, string> = {
  pending: "bg-[color-mix(in_oklab,var(--warn)_18%,white)] text-[color-mix(in_oklab,var(--warn)_85%,black)]",
  approved: "bg-[color-mix(in_oklab,var(--ok)_16%,white)] text-[color-mix(in_oklab,var(--ok)_90%,black)]",
  rejected: "bg-[color-mix(in_oklab,var(--danger)_14%,white)] text-[color-mix(in_oklab,var(--danger)_90%,black)]",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold capitalize tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}
