import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  TournamentForm,
  type TournamentFormValues,
} from "../../../src/components/tournaments/TournamentForm";

const baseValues: TournamentFormValues = {
  name: "Summer Open",
  slug: "summer-open",
  description: "Club event",
  status: "open",
};

function renderForm(
  props: Partial<Parameters<typeof TournamentForm>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <TournamentForm
        mode="create"
        values={baseValues}
        fieldErrors={{}}
        submitting={false}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("TournamentForm", () => {
  it("renders editable slug in create mode", () => {
    renderForm({ mode: "create" });
    expect(screen.getByLabelText(/slug/i)).toHaveValue("summer-open");
  });

  it("shows slug as read-only text in edit mode", () => {
    renderForm({ mode: "edit" });
    expect(screen.getByText("summer-open")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /slug/i }),
    ).not.toBeInTheDocument();
  });

  it("displays field validation errors", () => {
    renderForm({
      fieldErrors: {
        name: "Name is required",
        slug: "Slug must be lowercase",
      },
    });

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Slug must be lowercase")).toBeInTheDocument();
  });

  it("calls onChange when a field is edited", () => {
    const onChange = vi.fn();

    renderForm({ onChange });

    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "Winter League" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...baseValues,
      name: "Winter League",
    });
  });
});