import type { ReactNode } from "react";

type DataTableProps = {
  title: string;
  columns: string[];
  rows: Array<Array<ReactNode>>;
  emptyMessage?: string;
};

export function DataTable({ title, columns, rows, emptyMessage = "No data available." }: DataTableProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={`${title}-${index}`}>
                {row.map((value, cellIndex) => (
                  <td key={`${title}-${index}-${cellIndex}`}>{value}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="data-table-empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
