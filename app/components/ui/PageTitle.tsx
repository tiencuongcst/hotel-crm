export default function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-lg font-bold uppercase tracking-wide text-slate-950">
      {children}
    </h1>
  );
}