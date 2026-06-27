import { useId, useState } from "react";

interface InfoLabelProps {
  label: string;
  info: string;
  className?: string;
}

export function InfoLabel({ label, info, className = "" }: InfoLabelProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  function showTooltip(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    setPosition({
      left: rect.left,
      top: rect.bottom + 6,
    });
    setVisible(true);
  }

  return (
    <>
      <span
        className={`inline-flex items-center gap-1 ${className}`}
        onMouseEnter={(event) => showTooltip(event.currentTarget)}
        onMouseLeave={() => setVisible(false)}
        aria-describedby={visible ? tooltipId : undefined}
      >
        <span className="cursor-help">{label}</span>
        <span
          aria-hidden="true"
          className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-slate-400 text-[9px] font-bold italic leading-none text-slate-500"
        >
          i
        </span>
      </span>
      {visible ? (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: "fixed",
            left: position.left,
            top: position.top,
            zIndex: 100,
          }}
          className="pointer-events-none max-w-xs rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal normal-case tracking-normal text-slate-700 shadow-lg"
        >
          {info}
        </span>
      ) : null}
    </>
  );
}