import { getDb } from "../connection";

export type UserRole = "superadmin" | "admin" | "scorer" | "guest";

export interface UserRow {
  id: number;
  username: string;
  password: string;
  role: UserRole;
}

export function findUserByUsername(username: string): UserRow | undefined {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, username, password, role FROM users WHERE username = ?",
    )
    .get(username) as UserRow | undefined;

  return row;
}