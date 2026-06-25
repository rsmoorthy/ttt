import type { UserRole } from "../db/repositories/users";

const ROLE_RANK: Record<UserRole, number> = {
  guest: 0,
  scorer: 1,
  admin: 2,
  superadmin: 3,
};

export function hasMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole,
): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole];
}