import { AuthProvider } from "./context/auth-context";
import { ErrorProvider } from "./context/error-context";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <ErrorProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorProvider>
  );
}