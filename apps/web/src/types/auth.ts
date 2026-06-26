export type UserRole = "superadmin" | "admin" | "scorer" | "guest";

export interface AuthUser {
  username: string;
  role: UserRole;
}