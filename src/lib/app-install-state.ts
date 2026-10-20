// Kept for this browser tab so navigation does not lose an install invitation.
export interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let pending: InstallPrompt | null = null;
const listeners = new Set<() => void>();
export function getInstallPrompt() {
  return pending;
}
export function subscribeInstallPrompt(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}
export function clearInstallPrompt() {
  pending = null;
  listeners.forEach((notify) => notify());
}
export function captureInstallPrompt(event: Event) {
  event.preventDefault();
  pending = event as InstallPrompt;
  listeners.forEach((notify) => notify());
}
