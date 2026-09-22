import { Pencil } from "lucide-react";
import { useState } from "react";
import { allPages } from "../../../shared/api/client";
import type { User } from "../../../shared/api/types";
import { useAsync } from "../../../shared/lib/hooks";
import { ErrorState, Loading } from "../../../shared/ui/index";

export function UserList({ edit }: { edit: (u: User) => void }) {
  const data = useAsync((signal) => allPages<User>("/users", signal));
  const [search, setSearch] = useState("");
  if (data.loading) return <Loading />;
  if (data.error) return <ErrorState error={data.error} retry={data.reload} />;
  const users = data.value?.filter((u) =>
    `${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <label className="user-search">
        Hľadať používateľa
        <input
          placeholder="Meno alebo e-mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Používateľ</th>
              <th>Rola</th>
              <th>Účet</th>
              <th>
                <span className="sr-only">Akcie</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.full_name}</strong>
                  <small>{u.email}</small>
                </td>
                <td>
                  {
                    {
                      USER: "Zákazník",
                      MANAGER: "Manažér",
                      ADMIN: "Administrátor",
                    }[u.role]
                  }
                </td>
                <td>
                  <span
                    className={`badge ${u.is_active ? "published" : "cancelled"}`}
                  >
                    {u.is_active ? "Aktívny" : "Deaktivovaný"}
                  </span>
                </td>
                <td>
                  <button
                    className="btn secondary small"
                    onClick={() => edit(u)}
                  >
                    <Pencil size={14} />
                    Upraviť
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users?.length && (
          <p className="table-empty text-center text-cinema-muted text-[13px]">
            Žiadny používateľ nezodpovedá vyhľadávaniu.
          </p>
        )}
      </div>
    </>
  );
}
