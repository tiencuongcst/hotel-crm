type ButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  className?: string;
};

export function Button({
  children,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`h-11 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}