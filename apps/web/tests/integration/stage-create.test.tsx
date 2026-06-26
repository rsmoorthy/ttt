import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Create stage", () => {
  it("submits the form and returns to the stage list", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/stages/new",
      user: mockAdmin,
    });

    expect(
      await screen.findByRole("heading", {
        name: "Create Stage — Summer Open 2026",
      }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^name$/i), "Semi Final");
    await user.type(screen.getByLabelText(/^slug$/i), "sf");
    await user.selectOptions(screen.getByLabelText(/stage type/i), "playoff");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Summer Open 2026" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Semi Final")).toBeInTheDocument();
    expect(screen.getByText("sf")).toBeInTheDocument();
    expect(screen.getByText("Playoff")).toBeInTheDocument();
  });
});