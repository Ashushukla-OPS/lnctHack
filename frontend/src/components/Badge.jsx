import React from "react";

const Badge = ({ text, variant = "gray" }) => {
  const styles = {
    indigo: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border border-red-500/20",
    gray: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tracking-wide ${
        styles[variant] || styles.gray
      }`}
    >
      {text}
    </span>
  );
};

export default Badge;
