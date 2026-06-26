import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ErrorContextValue {
  message: string | null;
  setError: (message: string | null) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const clearError = useCallback(() => setMessage(null), []);

  const value = useMemo(
    () => ({
      message,
      setError: setMessage,
      clearError,
    }),
    [message, clearError],
  );

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
}

export function useErrorBanner() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrorBanner must be used within ErrorProvider");
  }
  return context;
}