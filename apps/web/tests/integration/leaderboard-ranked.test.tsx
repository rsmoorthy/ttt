import { screen, within } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Leaderboard rankings", () => {
  it("ranks players from scored matches", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/leaderboard/league",
      user: mockGuest,
      seedFixtures: [{ scored: true }],
    });

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    const dataRows = rows.slice(1);

    expect(dataRows[0]).toHaveTextContent("1");
    expect(dataRows[0]).toHaveTextContent("Alice");
    expect(dataRows[0]).toHaveTextContent("1");
    expect(dataRows[1]).toHaveTextContent("2");
    expect(dataRows[1]).toHaveTextContent("Bob");
    expect(dataRows[1]).toHaveTextContent("0");
  });
});