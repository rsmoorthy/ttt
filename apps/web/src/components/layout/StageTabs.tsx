import { Link } from "react-router-dom";
import type { Stage } from "../../types/stage";

interface StageTabsProps {
  stages: Stage[];
  currentStageSlug: string;
  buildPath: (stageSlug: string) => string;
}

export function StageTabs({
  stages,
  currentStageSlug,
  buildPath,
}: StageTabsProps) {
  if (stages.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Stage tabs"
      className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200"
    >
      {stages.map((stage) => {
        const active = stage.slug === currentStageSlug;

        return (
          <Link
            key={stage.slug}
            to={buildPath(stage.slug)}
            aria-current={active ? "page" : undefined}
            className={[
              "whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900",
            ].join(" ")}
          >
            {stage.name}
          </Link>
        );
      })}
    </nav>
  );
}