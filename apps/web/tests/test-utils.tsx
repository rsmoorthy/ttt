import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/context/auth-context";
import { ErrorProvider } from "../src/context/error-context";
import { HomePage } from "../src/pages/Home";
import { TournamentCreatePage } from "../src/pages/tournaments/TournamentCreate";
import { TournamentEditPage } from "../src/pages/tournaments/TournamentEdit";
import { RegistrationPage } from "../src/pages/registration/RegistrationPage";
import { RegistrationPickerPage } from "../src/pages/registration/RegistrationPicker";
import { StageCreatePage } from "../src/pages/stages/StageCreate";
import { StageEditPage } from "../src/pages/stages/StageEdit";
import { StageListPage } from "../src/pages/stages/StageList";
import { FixturesPage } from "../src/pages/fixtures/FixturesPage";
import { FixturesPickerPage } from "../src/pages/fixtures/FixturesPicker";
import { FixturesStageRedirect } from "../src/pages/fixtures/FixturesStageRedirect";
import { SchedulePage } from "../src/pages/schedule/SchedulePage";
import { SchedulePickerPage } from "../src/pages/schedule/SchedulePicker";
import { ScheduleStageRedirect } from "../src/pages/schedule/ScheduleStageRedirect";
import { LeaderboardPage } from "../src/pages/leaderboard/LeaderboardPage";
import { LeaderboardPickerPage } from "../src/pages/leaderboard/LeaderboardPicker";
import { LeaderboardStageRedirect } from "../src/pages/leaderboard/LeaderboardStageRedirect";
import { MovePlayersPage } from "../src/pages/move-players/MovePlayersPage";
import { MovePlayersPickerPage } from "../src/pages/move-players/MovePlayersPicker";
import { MovePlayersStageRedirect } from "../src/pages/move-players/MovePlayersStageRedirect";
import { ScoresPage } from "../src/pages/scores/ScoresPage";
import { ScoresPickerPage } from "../src/pages/scores/ScoresPicker";
import { ScoresStageRedirect } from "../src/pages/scores/ScoresStageRedirect";
import { StagesPickerPage } from "../src/pages/stages/StagesPicker";
import { TournamentListPage } from "../src/pages/tournaments/TournamentList";
import { ProtectedRoute } from "../src/routes/ProtectedRoute";
import { RoleRoute } from "../src/routes/RoleRoute";

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute minimumRole="admin">{children}</RoleRoute>;
}
import type { AuthUser } from "../src/types/auth";
import { resetMockState, seedLeagueFixtures, setMockUser } from "./mocks/handlers";

function TestAppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="superadmin">
              <TournamentListPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/new"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="superadmin">
              <TournamentCreatePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/edit"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="superadmin">
              <TournamentEditPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/registration"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <RegistrationPickerPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/registration"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <RegistrationPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stages"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <StagesPickerPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/stages"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <StageListPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/stages/new"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <StageCreatePage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/stages/:stage/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <StageEditPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fixtures"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <FixturesPickerPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/fixtures"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <FixturesStageRedirect />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/fixtures/:stage"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <FixturesPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <SchedulePickerPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/schedule"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <ScheduleStageRedirect />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/schedule/:stage"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <SchedulePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scores"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <ScoresPickerPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/scores"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <ScoresStageRedirect />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/scores/:stage"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <ScoresPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <LeaderboardPickerPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/leaderboard"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <LeaderboardStageRedirect />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/leaderboard/:stage"
        element={
          <ProtectedRoute>
            <RoleRoute minimumRole="guest">
              <LeaderboardPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/move-players"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MovePlayersPickerPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/move-players"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MovePlayersStageRedirect />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:slug/move-players/:stage"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MovePlayersPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

interface FixtureSeed {
  tournamentSlug?: string;
  stageSlug?: string;
  scheduled?: boolean;
  scored?: boolean;
}

interface RenderAppOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  user?: AuthUser;
  withLeagueFixtures?: boolean;
  seedFixtures?: FixtureSeed[];
}

export function renderApp({
  route = "/",
  user,
  withLeagueFixtures = false,
  seedFixtures = [],
  ...options
}: RenderAppOptions = {}) {
  resetMockState();
  if (user) {
    setMockUser(user);
  }
  if (withLeagueFixtures) {
    seedLeagueFixtures();
  }
  for (const seed of seedFixtures) {
    seedLeagueFixtures(seed.tournamentSlug, seed.stageSlug, {
      scheduled: seed.scheduled,
      scored: seed.scored,
    });
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <ErrorProvider>
        <AuthProvider>
          <TestAppRoutes />
        </AuthProvider>
      </ErrorProvider>
    </MemoryRouter>,
    options,
  );
}