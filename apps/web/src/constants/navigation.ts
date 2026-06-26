import type { UserRole } from "../types/auth";

export interface NavItem {
  label: string;
  path: string;
  minimumRole: UserRole;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", minimumRole: "guest" },
  { label: "Tournaments", path: "/tournaments", minimumRole: "superadmin" },
  { label: "Registration", path: "/registration", minimumRole: "guest" },
  { label: "Stages", path: "/stages", minimumRole: "guest" },
  { label: "Fixtures", path: "/fixtures", minimumRole: "admin" },
  { label: "Schedule", path: "/schedule", minimumRole: "guest" },
  { label: "Scores", path: "/scores", minimumRole: "guest" },
  { label: "Leaderboard", path: "/leaderboard", minimumRole: "guest" },
  { label: "Move to Stage", path: "/move-players", minimumRole: "admin" },
];

/** Top-level routes that are implemented and navigable. */
export const IMPLEMENTED_PATHS = new Set([
  "/",
  "/tournaments",
  "/tournaments/new",
  "/registration",
  "/stages",
  "/fixtures",
  "/schedule",
  "/scores",
  "/leaderboard",
  "/move-players",
]);

export function isNavItemImplemented(path: string): boolean {
  return IMPLEMENTED_PATHS.has(path);
}

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

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => hasMinimumRole(role, item.minimumRole));
}