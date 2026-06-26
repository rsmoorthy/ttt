import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import {
  TournamentForm,
  type TournamentFormValues,
} from "../../components/tournaments/TournamentForm";
import { PageHeader } from "../../components/ui/PageHeader";
import { useErrorBanner } from "../../context/error-context";

const INITIAL_VALUES: TournamentFormValues = {
  name: "",
  slug: "",
  description: "",
  status: "open",
};

export function TournamentCreatePage() {
  const navigate = useNavigate();
  const { setError, clearError } = useErrorBanner();
  const [values, setValues] = useState<TournamentFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setFieldErrors({});
    setSubmitting(true);

    try {
      await createTournament({
        name: values.name,
        slug: values.slug,
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
        setError("Failed to create tournament");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Create Tournament" />
      <TournamentForm
        mode="create"
        values={values}
        fieldErrors={fieldErrors}
        submitting={submitting}
        onChange={setValues}
        onSubmit={handleSubmit}
      />
    </div>
  );
}