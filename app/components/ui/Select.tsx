type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${className}`}
    >
      {children}
    </select>
  );
}