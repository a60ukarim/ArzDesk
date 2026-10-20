"use client";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
export type ThemePreference = "light" | "dark";
const key = "arzdesk-theme",
  event = "arzdesk-theme-change";
const ThemeContext = createContext<{
  resolved: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}>({ resolved: "light", setTheme: () => {} });
function readTheme(): ThemePreference {
  try {
    return localStorage.getItem(key) === "dark" ? "dark" : "light";
  } catch {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }
}
function subscribe(notify: () => void) {
  window.addEventListener(event, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(event, notify);
    window.removeEventListener("storage", notify);
  };
}
function setTheme(theme: ThemePreference) {
  try {
    localStorage.setItem(key, theme);
  } catch {}
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(event));
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const resolved = useSyncExternalStore(
    subscribe,
    readTheme,
    () => "light" as const,
  );
  useEffect(() => {
    if (resolved === readTheme())
      document.documentElement.dataset.theme = resolved;
  }, [resolved]);
  return (
    <ThemeContext.Provider value={{ resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  return useContext(ThemeContext);
}
