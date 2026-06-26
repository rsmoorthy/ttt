import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/Home";
import { LoginPage } from "../pages/Login";
import { TournamentCreatePage } from "../pages/tournaments/TournamentCreate";
import { TournamentEditPage } from "../pages/tournaments/TournamentEdit";
import { RegistrationPage } from "../pages/registration/RegistrationPage";
import { RegistrationPickerPage } from "../pages/registration/RegistrationPicker";
import { StageCreatePage } from "../pages/stages/StageCreate";
import { StageEditPage } from "../pages/stages/StageEdit";
import { StageListPage } from "../pages/stages/StageList";
import { FixturesPage } from "../pages/fixtures/FixturesPage";
import { FixturesPickerPage } from "../pages/fixtures/FixturesPicker";
import { FixturesStageRedirect } from "../pages/fixtures/FixturesStageRedirect";
import { SchedulePage } from "../pages/schedule/SchedulePage";
import { SchedulePickerPage } from "../pages/schedule/SchedulePicker";
import { ScheduleStageRedirect } from "../pages/schedule/ScheduleStageRedirect";
import { LeaderboardPage } from "../pages/leaderboard/LeaderboardPage";
import { LeaderboardPickerPage } from "../pages/leaderboard/LeaderboardPicker";
import { LeaderboardStageRedirect } from "../pages/leaderboard/LeaderboardStageRedirect";
import { MovePlayersPage } from "../pages/move-players/MovePlayersPage";
import { MovePlayersPickerPage } from "../pages/move-players/MovePlayersPicker";
import { MovePlayersStageRedirect } from "../pages/move-players/MovePlayersStageRedirect";
import { ScoresPage } from "../pages/scores/ScoresPage";
import { ScoresPickerPage } from "../pages/scores/ScoresPicker";
import { ScoresStageRedirect } from "../pages/scores/ScoresStageRedirect";
import { StagesPickerPage } from "../pages/stages/StagesPicker";
import { TournamentListPage } from "../pages/tournaments/TournamentList";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

function SuperadminRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute minimumRole="superadmin">{children}</RoleRoute>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute minimumRole="admin">{children}</RoleRoute>;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
              <SuperadminRoute>
                <TournamentListPage />
              </SuperadminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/new"
          element={
            <ProtectedRoute>
              <SuperadminRoute>
                <TournamentCreatePage />
              </SuperadminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:slug/edit"
          element={
            <ProtectedRoute>
              <SuperadminRoute>
                <TournamentEditPage />
              </SuperadminRoute>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}