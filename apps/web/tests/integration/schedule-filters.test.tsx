import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Schedule filters", () => {
  it("filters matches by player name and completion status", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/schedule/league",
      user: mockGuest,
      seedFixtures: [{ scheduled: true, scored: true }],
    });

    expect(await screen.findByText("1. Alice vs Bob")).toBeInTheDocument();
    expect(screen.getByText("Total matches completed: 1/1")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Player name"),
      "Alice",
    );

    expect(screen.getByText("1. Alice vs Bob")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Match status"),
      "Pending matches",
    );

    expect(screen.queryByText("1. Alice vs Bob")).toBeNull();
    expect(screen.getByText("Total matches completed: 1/1")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Match status"),
      "Completed matches",
    );

    expect(screen.getByText("1. Alice vs Bob")).toBeInTheDocument();
  });
});