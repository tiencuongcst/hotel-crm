type TableProps = {
  children: React.ReactNode;
  minWidth?: string;
};

export function Table({ children, minWidth = "1000px" }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className="
          w-full border-collapse text-[13px] text-black

          [&_thead_th]:h-[35px]
          [&_thead_th]:px-4
          [&_thead_th]:py-0
          [&_thead_th]:text-center
          [&_thead_th]:align-middle
          [&_thead_th]:text-[13px]
          [&_thead_th]:font-bold
          [&_thead_th]:text-black

          [&_tbody_td]:h-[35px]
          [&_tbody_td]:px-4
          [&_tbody_td]:py-2
          [&_tbody_td]:align-middle
          [&_tbody_td]:text-[13px]
          [&_tbody_td]:leading-[17px]
          [&_tbody_td]:text-black

          [&_tbody_td_a]:text-blue-700
        "
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-slate-50">{children}</thead>;
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
      <td colSpan={colSpan} className="h-[50px] text-center text-slate-400">
        {children}
      </td>
    </tr>
  );
}