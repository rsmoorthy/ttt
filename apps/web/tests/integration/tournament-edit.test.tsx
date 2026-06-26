import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockSuperadmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Edit tournament", () => {
  it("loads an existing tournament and saves changes", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/edit",
      user: mockSuperadmin,
    });

    expect(
      await screen.findByRole("heading", { name: "Edit Tournament" }),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/^name$/i);
    expect(nameInput).toHaveValue("Summer Open 2026");
    expect(screen.getByText("summer-open-2026")).toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, "Summer Open 2026 Updated");
    await user.selectOptions(screen.getByLabelText(/^status$/i), "closed");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Tournaments" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Summer Open 2026 Updated")).toBeInTheDocument();
    expect(screen.getAllByText("closed").length).toBeGreaterThan(0);
  });
});