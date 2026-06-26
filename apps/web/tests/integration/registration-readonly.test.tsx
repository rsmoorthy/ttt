import { screen } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Registration read-only view", () => {
  it("shows a player table without edit controls for guests", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/registration",
      user: mockGuest,
    });

    expect(
      await screen.findByRole("heading", { name: "Summer Open 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.queryByLabelText("Player 1")).toBeNull();
  });
});