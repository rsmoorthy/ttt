import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { hasMinimumRole } from "../constants/navigation";
import { useAuth } from "../context/auth-context";
import type { UserRole } from "../types/auth";

interface RoleRouteProps {
  minimumRole: UserRole;
  children: ReactNode;
}

export function RoleRoute({ minimumRole, children }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user || !hasMinimumRole(user.role, minimumRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}