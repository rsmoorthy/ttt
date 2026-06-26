import type { AuthUser } from "../../src/types/auth";
import type { RegisteredPlayer } from "../../src/types/registration";
import type { Stage } from "../../src/types/stage";
import type { Tournament } from "../../src/types/tournament";

export const mockSuperadmin: AuthUser = {
  username: "super1",
  role: "superadmin",
};

export const mockGuest: AuthUser = {
  username: "guest1",
  role: "guest",
};

export const mockAdmin: AuthUser = {
  username: "admin1",
  role: "admin",
};

export const mockScorer: AuthUser = {
  username: "scorer1",
  role: "scorer",
};

export const sampleTournaments: Tournament[] = [
  {
    slug: "summer-open-2026",
    name: "Summer Open 2026",
    description: "Club championship",
    status: "open",
  },
  {
    slug: "winter-league",
    name: "Winter League",
    description: "",
    status: "closed",
  },
];

export const sampleRegistrationPlayers: RegisteredPlayer[] = [
  { player_name: "Alice", sort_order: 0 },
  { player_name: "Bob", sort_order: 1 },
];

export const sampleStages: Stage[] = [
  {
    slug: "league",
    name: "League",
    description: "Round robin groups",
    stage_type: "league",
    is_completed: false,
  },
  {
    slug: "qf",
    name: "Quarter Finals",
    description: "",
    stage_type: "superleague",
    is_completed: false,
  },
];