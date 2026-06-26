import { screen } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Stages read-only view", () => {
  it("shows stages without admin actions for guests", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/stages",
      user: mockGuest,
    });

    expect(
      await screen.findByRole("heading", { name: "Summer Open 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Quarter Finals")).toBeInTheDocument();
    expect(screen.getByText("Super League")).toBeInTheDocument();
    expect(screen.getByText("league")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Stage" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });
});