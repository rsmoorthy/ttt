import type { UserRole } from "../../types/auth";

const ROLE_STYLES: Record<UserRole, string> = {
  guest: "bg-slate-100 text-slate-700 ring-slate-200",
  scorer: "bg-sky-100 text-sky-800 ring-sky-200",
  admin: "bg-amber-100 text-amber-900 ring-amber-200",
  superadmin: "bg-violet-100 text-violet-900 ring-violet-200",
};

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${ROLE_STYLES[role]}`}
    >
      {role}
    </span>
  );
}