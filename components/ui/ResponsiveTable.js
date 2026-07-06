// Stacked cards on mobile (<768px), a real <table> on desktop. Used by
// Drafts list, Clients, Court Dates, Admin user table — never ships a
// horizontally-scrolling table on small screens.
export function ResponsiveTable({ columns, rows, rowKey = 'id' }) {
  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <div key={row[rowKey]} className="rounded-card bg-surface border border-border p-4 flex flex-col gap-2">
            {columns.map((col) => (
              <div key={String(col.key)} className="flex justify-between gap-3 text-sm">
                <span className="text-ink-muted">{col.label}</span>
                <span className="text-ink text-right">{col.render ? col.render(row) : String(row[col.key] ?? '')}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <table className="hidden md:table w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-ink-muted text-xs uppercase tracking-wide">
            {columns.map((col) => <th key={String(col.key)} className="py-3 px-4 font-medium">{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} className="border-b border-border hover:bg-surface-2">
              {columns.map((col) => (
                <td key={String(col.key)} className="py-3 px-4 text-ink">{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
