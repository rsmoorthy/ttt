import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTournament, updateTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import {
  TournamentForm,
  type TournamentFormValues,
} from "../../components/tournaments/TournamentForm";
import { PageHeader } from "../../components/ui/PageHeader";
import { useErrorBanner } from "../../context/error-context";

export function TournamentEditPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { setError, clearError } = useErrorBanner();
  const [values, setValues] = useState<TournamentFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearError();
    setLoading(true);

    getTournament(slug)
      .then((tournament) => {
        setValues({
          name: tournament.name,
          slug: tournament.slug,
          description: tournament.description,
          status: tournament.status,
        });
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Failed to load tournament";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [slug, clearError, setError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values) {
      return;
    }

    clearError();
    setFieldErrors({});
    setSubmitting(true);

    try {
      await updateTournament(slug, {
        name: values.name,
        description: values.description,
        status: values.status,
      });
      navigate("/tournaments");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) {
          setFieldErrors(err.fields);
        }
      } else {
        setError("Failed to update tournament");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading tournament…</p>;
  }

  if (!values) {
    return (
      <p className="text-sm text-slate-500">
        Tournament not found or could not be loaded.
      </p>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Tournament" />
      <TournamentForm
        mode="edit"
        values={values}
        fieldErrors={fieldErrors}
        submitting={submitting}
        onChange={setValues}
        onSubmit={handleSubmit}
      />
    </div>
  );
}