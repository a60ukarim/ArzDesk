"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CircleCheck, X } from "lucide-react";
const FeedbackContext = createContext<{ notify: (message: string) => void }>({
  notify: () => {},
});
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(""), 5000);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <FeedbackContext.Provider value={{ notify }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={message ? "feedback-toast" : "sr-only"}
      >
        {message && (
          <>
            <CircleCheck size={20} />
            <span>{message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setMessage("")}
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
    </FeedbackContext.Provider>
  );
}
export function useFeedback() {
  return useContext(FeedbackContext);
}
