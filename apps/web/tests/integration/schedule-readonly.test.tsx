import { screen } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Schedule read-only view", () => {
  it("shows the unscheduled matches table without admin controls for guests", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/schedule/league",
      user: mockGuest,
      withLeagueFixtures: true,
    });

    expect(
      await screen.findByRole("heading", { name: "Summer Open 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1. Alice vs Bob")).toBeInTheDocument();
    expect(screen.getByText("Total matches completed: 0/1")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Hour slot" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Table" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule" })).toBeNull();
    expect(screen.queryByLabelText(/hour slots/i)).toBeNull();
  });

  it("shows the scheduled grid without admin controls for guests", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/schedule/league",
      user: mockGuest,
      seedFixtures: [{ scheduled: true }],
    });

    await screen.findByRole("columnheader", { name: "Hour slot" });
    expect(screen.getByRole("columnheader", { name: "Matches in Table 1" })).toBeInTheDocument();
    expect(screen.getByText("1. Alice vs Bob")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Slno" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Schedule" })).toBeNull();
  });
});