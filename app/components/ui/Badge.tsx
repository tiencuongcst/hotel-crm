export type BadgeVariant =
  | "platinum"
  | "gold"
  | "silver"
  | "success"
  | "danger"
  | "default";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    platinum: "bg-indigo-600 text-white",
    gold: "bg-amber-500 text-white",
    silver: "bg-slate-400 text-white",
    success: "bg-emerald-500 text-white",
    danger: "bg-red-500 text-white",
    default: "bg-slate-200 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}