type TableProps = {
  children: React.ReactNode;
  minWidth?: string;
};

export function Table({ children, minWidth = "1000px" }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-sm"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
      {children}
    </thead>
  );
}

export function TRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-t border-slate-100 transition-colors hover:bg-slate-50">
      {children}
    </tr>
  );
}

export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-14 text-center text-sm text-slate-400"
      >
        {children}
      </td>
    </tr>
  );
}