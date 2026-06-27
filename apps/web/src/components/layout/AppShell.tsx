import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { useErrorBanner } from "../../context/error-context";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RoleBadge } from "../ui/RoleBadge";
import { MainNav } from "./MainNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const { message, clearError } = useErrorBanner();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  async function handleLogout() {
    clearError();
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="relative z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-brand-700">TTT</h1>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {user.username}
                </p>
              </div>
              <RoleBadge role={user.role} />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-2 border-t border-slate-100 pt-2">
            <MainNav />
          </div>
        </div>
      </header>

      {message ? (
        <ErrorBanner message={message} onDismiss={clearError} />
      ) : null}

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}