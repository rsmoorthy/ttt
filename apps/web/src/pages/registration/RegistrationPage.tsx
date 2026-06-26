import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRegistration, saveRegistration } from "../../api/registration";
import { getTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import { RegistrationPlayerForm } from "../../components/registration/RegistrationPlayerForm";
import { RegistrationPlayerTable } from "../../components/registration/RegistrationPlayerTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { hasMinimumRole } from "../../constants/navigation";
import { REGISTRATION_ROW_COUNT } from "../../constants/registration";
import { useAuth } from "../../context/auth-context";
import { useErrorBanner } from "../../context/error-context";
import type { RegisteredPlayer } from "../../types/registration";
import { playersToRows, rowsToPayload } from "../../utils/registration";

export function RegistrationPage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const { setError, clearError } = useErrorBanner();
  const [tournamentName, setTournamentName] = useState("");
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [rows, setRows] = useState<string[]>(
    Array.from({ length: REGISTRATION_ROW_COUNT }, () => ""),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user ? hasMinimumRole(user.role, "admin") : false;

  const loadRegistration = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const [tournament, registration] = await Promise.all([
        getTournament(slug),
        getRegistration(slug),
      ]);

      setTournamentName(tournament.name);
      setPlayers(registration.players);
      setRows(playersToRows(registration.players));
      setFieldErrors({});
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load registration";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, clearError, setError]);

  useEffect(() => {
    loadRegistration();
  }, [loadRegistration]);

  function handleRowChange(index: number, value: string) {
    setRows((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  async function handleSave() {
    clearError();
    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await saveRegistration(slug, {
        players: rowsToPayload(rows),
      });
      setPlayers(response.players);
      setRows(playersToRows(response.players));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) {
          setFieldErrors(err.fields);
        }
      } else {
        setError("Failed to save registration");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading registration…</p>;
  }

  return (
    <div>
      <PageHeader title={tournamentName || slug} />

      {canEdit ? (
        <RegistrationPlayerForm
          rows={rows}
          fieldErrors={fieldErrors}
          submitting={submitting}
          onRowChange={handleRowChange}
          onSave={handleSave}
          onCancel={loadRegistration}
        />
      ) : (
        <RegistrationPlayerTable players={players} />
      )}
    </div>
  );
}