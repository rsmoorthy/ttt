import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  StageForm,
  type StageFormValues,
} from "../../../src/components/stages/StageForm";

const baseValues: StageFormValues = {
  name: "League",
  slug: "league",
  description: "Round robin",
  stage_type: "league",
  is_completed: false,
};

function renderForm(
  props: Partial<Parameters<typeof StageForm>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <StageForm
        mode="create"
        tournamentSlug="summer-open-2026"
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

describe("StageForm", () => {
  it("renders editable slug in create mode", () => {
    renderForm({ mode: "create" });
    expect(screen.getByLabelText(/^slug$/i)).toHaveValue("league");
  });

  it("shows slug as read-only text in edit mode", () => {
    renderForm({ mode: "edit" });
    expect(screen.getByText("league")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /slug/i }),
    ).not.toBeInTheDocument();
  });

  it("renders stage type options", () => {
    renderForm();
    expect(screen.getByRole("option", { name: "League" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Super League" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Playoff" })).toBeInTheDocument();
  });

  it("calls onChange when the completed checkbox is toggled", () => {
    const onChange = vi.fn();
    renderForm({ onChange });

    fireEvent.click(screen.getByLabelText(/is completed/i));

    expect(onChange).toHaveBeenCalledWith({
      ...baseValues,
      is_completed: true,
    });
  });
});