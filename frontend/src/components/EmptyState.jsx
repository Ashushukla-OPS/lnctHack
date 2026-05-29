import React from "react";

const EmptyState = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[#2e2e2e] bg-[#1a1a1a]/50 p-8 text-center">
      {/* Icon Frame */}
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-[#94a3b8] mb-4">
          {icon}
        </div>
      )}

      {/* Text Context */}
      <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
      <p className="mt-1.5 text-xs text-[#94a3b8] max-w-sm leading-relaxed">{message}</p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 active:scale-[0.98] transition-all focus:outline-none"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
