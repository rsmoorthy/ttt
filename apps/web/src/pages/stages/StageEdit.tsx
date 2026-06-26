import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStage, updateStage } from "../../api/stages";
import { ApiError } from "../../api/client";
import {
  StageForm,
  type StageFormValues,
} from "../../components/stages/StageForm";
import { PageHeader } from "../../components/ui/PageHeader";
import { useErrorBanner } from "../../context/error-context";

export function StageEditPage() {
  const { slug = "", stage: stageSlug = "" } = useParams();
  const navigate = useNavigate();
  const { setError, clearError } = useErrorBanner();
  const [values, setValues] = useState<StageFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearError();
    setLoading(true);

    getStage(slug, stageSlug)
      .then((stage) => {
        setValues({
          name: stage.name,
          slug: stage.slug,
          description: stage.description,
          stage_type: stage.stage_type,
          is_completed: stage.is_completed,
        });
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Failed to load stage";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [slug, stageSlug, clearError, setError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values) {
      return;
    }

    clearError();
    setFieldErrors({});
    setSubmitting(true);

    try {
      await updateStage(slug, stageSlug, {
        name: values.name,
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
        setError("Failed to update stage");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading stage…</p>;
  }

  if (!values) {
    return (
      <p className="text-sm text-slate-500">
        Stage not found or could not be loaded.
      </p>
    );
  }

  return (
    <div>
      <PageHeader title={`Edit Stage — ${values.name}`} />
      <StageForm
        mode="edit"
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