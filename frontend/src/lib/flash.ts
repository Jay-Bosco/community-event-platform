export type FlashKind = "success" | "error";

export type FlashMessage = {
  id: number;
  kind: FlashKind;
  text: string;
};

const EVENT = "cep-flash";

let seq = 0;
let pending: { kind: FlashKind; text: string } | null = null;

function emit(kind: FlashKind, text: string) {
  if (typeof window === "undefined") return;
  const message: FlashMessage = { id: ++seq, kind, text };
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export const flash = {
  success(text: string) {
    emit("success", text);
  },
  error(text: string) {
    emit("error", text);
  },
  // show after the next navigation
  successNext(text: string) {
    pending = { kind: "success", text };
  },
  errorNext(text: string) {
    pending = { kind: "error", text };
  },
};

export function subscribeFlash(handler: (msg: FlashMessage) => void) {
  const onFlash = (e: Event) => {
    handler((e as CustomEvent<FlashMessage>).detail);
  };
  window.addEventListener(EVENT, onFlash);
  return () => window.removeEventListener(EVENT, onFlash);
}

export function consumePendingFlash() {
  if (!pending) return;
  const next = pending;
  pending = null;
  emit(next.kind, next.text);
}
