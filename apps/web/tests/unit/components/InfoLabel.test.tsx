import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoLabel } from "../../../src/components/ui/InfoLabel";

describe("InfoLabel", () => {
  it("shows help text on hover and hides it on mouse leave", async () => {
    const user = userEvent.setup();

    render(
      <InfoLabel label="NRR" info="Net run rate calculation details" />,
    );

    expect(
      screen.queryByRole("tooltip", { name: "Net run rate calculation details" }),
    ).toBeNull();

    await user.hover(screen.getByText("NRR"));

    expect(
      await screen.findByRole("tooltip", {
        name: "Net run rate calculation details",
      }),
    ).toBeInTheDocument();

    await user.unhover(screen.getByText("NRR"));

    expect(
      screen.queryByRole("tooltip", { name: "Net run rate calculation details" }),
    ).toBeNull();
  });
});