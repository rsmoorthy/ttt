import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createStage } from "../../api/stages";
import { getTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import {
  StageForm,
  type StageFormValues,
} from "../../components/stages/StageForm";
import { PageHeader } from "../../components/ui/PageHeader";
import { useErrorBanner } from "../../context/error-context";

const INITIAL_VALUES: StageFormValues = {
  name: "",
  slug: "",
  description: "",
  stage_type: "league",
  is_completed: false,
};

export function StageCreatePage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { setError, clearError } = useErrorBanner();
  const [tournamentName, setTournamentName] = useState("");
  const [values, setValues] = useState<StageFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearError();
    getTournament(slug)
      .then((tournament) => setTournamentName(tournament.name))
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Failed to load tournament";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [slug, clearError, setError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setFieldErrors({});
    setSubmitting(true);

    try {
      await createStage(slug, {
        name: values.name,
        slug: values.slug,
        description: values.description,
        stage_type: values.stage_type,
        is_completed: values.is_completed,
      });
      navigate(`/tournaments/${slug}/stages`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) {
          setFieldErrors(err.fields);
        }
      } else {
        setError("Failed to create stage");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return (
    <div>
      <PageHeader title={`Create Stage — ${tournamentName || slug}`} />
      <StageForm
        mode="create"
        tournamentSlug={slug}
        values={values}
        fieldErrors={fieldErrors}
        submitting={submitting}
        onChange={setValues}
        onSubmit={handleSubmit}
      />
    </div>
  );
}