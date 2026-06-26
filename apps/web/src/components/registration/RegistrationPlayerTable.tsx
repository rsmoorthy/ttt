import type { RegisteredPlayer } from "../../types/registration";

interface RegistrationPlayerTableProps {
  players: RegisteredPlayer[];
}

export function RegistrationPlayerTable({
  players,
}: RegistrationPlayerTableProps) {
  const sorted = [...players].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="w-16 px-4 py-3 text-left font-semibold text-slate-700">
              #
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">
              Player name
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={2}
                className="px-4 py-8 text-center text-slate-500"
              >
                No players registered yet.
              </td>
            </tr>
          ) : (
            sorted.map((player) => (
              <tr key={`${player.sort_order}-${player.player_name}`}>
                <td className="px-4 py-3 text-slate-600">
                  {player.sort_order + 1}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {player.player_name}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}