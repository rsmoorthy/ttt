import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuccessBanner } from "../../../src/components/ui/SuccessBanner";

describe("SuccessBanner", () => {
  it("renders a dismissible success message", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <SuccessBanner
        message="Moved 2 player(s) to Quarter Finals successfully."
        onDismiss={onDismiss}
      />,
    );

    expect(
      screen.getByText("Moved 2 player(s) to Quarter Finals successfully."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss success message" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});