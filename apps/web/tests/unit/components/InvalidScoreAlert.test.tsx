import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvalidScoreAlert } from "../../../src/components/scores/InvalidScoreAlert";

describe("InvalidScoreAlert", () => {
  it("focuses the target field when Ok is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <div>
        <input id="score-table-1-game1" aria-label="game1 for match 1" />
        <InvalidScoreAlert
          fieldId="score-table-1-game1"
          onDismiss={onDismiss}
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Ok" }));

    expect(onDismiss).toHaveBeenCalled();
    expect(screen.getByLabelText("game1 for match 1")).toHaveFocus();
  });
});