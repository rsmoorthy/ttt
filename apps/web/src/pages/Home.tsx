import { Link } from "react-router-dom";
import {
  isNavItemImplemented,
  navItemsForRole,
} from "../constants/navigation";
import { useAuth } from "../context/auth-context";
import { RoleBadge } from "../components/ui/RoleBadge";

export function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const items = navItemsForRole(user.role);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Welcome</h2>
        <p className="mt-2 text-slate-600">
          Logged in as{" "}
          <span className="font-semibold text-slate-900">{user.username}</span>{" "}
          <RoleBadge role={user.role} />
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Use the menu or the shortcuts below to open a module.
        </p>
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Quick links
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const implemented = isNavItemImplemented(item.path);
            const target = implemented ? item.path : "/";

            return (
              <Link
                key={item.label}
                to={target}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500 hover:shadow-md"
              >
                <h4 className="font-semibold text-slate-900 group-hover:text-brand-700">
                  {item.label}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {implemented
                    ? item.path
                    : `Coming soon: ${item.path}`}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}