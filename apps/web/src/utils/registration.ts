import { REGISTRATION_ROW_COUNT } from "../constants/registration";
import type { RegisteredPlayer } from "../types/registration";

export function playersToRows(players: RegisteredPlayer[]): string[] {
  const rows = Array.from({ length: REGISTRATION_ROW_COUNT }, () => "");
  const sorted = [...players].sort((a, b) => a.sort_order - b.sort_order);

  sorted.forEach((player, index) => {
    if (index < REGISTRATION_ROW_COUNT) {
      rows[index] = player.player_name;
    }
  });

  return rows;
}

export function rowsToPayload(rows: string[]): string[] {
  return rows.slice(0, REGISTRATION_ROW_COUNT);
}