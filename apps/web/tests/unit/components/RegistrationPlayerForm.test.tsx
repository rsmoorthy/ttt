import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { REGISTRATION_ROW_COUNT } from "../../../src/constants/registration";
import { RegistrationPlayerForm } from "../../../src/components/registration/RegistrationPlayerForm";

describe("RegistrationPlayerForm", () => {
  it("renders 30 player inputs", () => {
    render(
      <RegistrationPlayerForm
        rows={Array.from({ length: REGISTRATION_ROW_COUNT }, () => "")}
        fieldErrors={{}}
        submitting={false}
        onRowChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("textbox")).toHaveLength(
      REGISTRATION_ROW_COUNT,
    );
    expect(screen.getByLabelText("Player 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 30")).toBeInTheDocument();
  });

  it("calls save and cancel handlers", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <RegistrationPlayerForm
        rows={Array.from({ length: REGISTRATION_ROW_COUNT }, () => "")}
        fieldErrors={{}}
        submitting={false}
        onRowChange={vi.fn()}
        onSave={onSave}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});