import { api } from "../../../shared/api/client";
import type { AuditPage } from "../../../shared/api/types";
import { dateLabel, time } from "../../../shared/lib/format";
import { useAsync } from "../../../shared/lib/hooks";
import { Empty, ErrorState, Loading, Notice } from "../../../shared/ui/index";

const entityLabel: Record<string, string> = {
  user: "Účet",
  manager_assignment: "Pridelenie manažéra",
  cinema: "Kino",
  auditorium: "Sála",
};

export function AuditLog() {
  const data = useAsync((signal) =>
    api<AuditPage>("/admin/audit?limit=100", { signal }),
  );
  if (data.loading) return <Loading />;
  if (data.error || !data.value)
    return <ErrorState error={data.error} retry={data.reload} />;
  return (
    <>
      <Notice>
        Zaznamenané je vytvorenie a posledná zmena každého záznamu, nie celá
        história úprav ani zmazané záznamy. Prázdny autor znamená systémovú
        operáciu alebo staršie dáta bez evidovaného autorstva.
      </Notice>
      {data.value.items.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Záznam</th>
                <th>Typ</th>
                <th>Posledná zmena</th>
                <th>Autor zmeny</th>
                <th>Vytvoril</th>
              </tr>
            </thead>
            <tbody>
              {data.value.items.map((row) => (
                <tr key={`${row.entity}-${row.record_id}`}>
                  <td>
                    <strong>{row.label}</strong>
                  </td>
                  <td>{entityLabel[row.entity] || row.entity}</td>
                  <td>
                    {dateLabel(row.updated_at)} · {time(row.updated_at)}
                  </td>
                  <td>
                    {row.updated_by_email || (
                      <span className="muted">Systém</span>
                    )}
                  </td>
                  <td>
                    {row.created_by_email || (
                      <span className="muted">Systém</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty action={false} title="Žiadne zaznamenané zásahy.">
          Zmeny účtov, kín a sál sa tu objavia po prvej úprave.
        </Empty>
      )}
    </>
  );
}
