import { render, screen } from "@testing-library/react";
import { RegistrationPlayerTable } from "../../../src/components/registration/RegistrationPlayerTable";

describe("RegistrationPlayerTable", () => {
  it("renders registered players with row numbers", () => {
    render(
      <RegistrationPlayerTable
        players={[
          { player_name: "Alice", sort_order: 0 },
          { player_name: "Bob", sort_order: 1 },
        ]}
      />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows an empty state when there are no players", () => {
    render(<RegistrationPlayerTable players={[]} />);
    expect(screen.getByText("No players registered yet.")).toBeInTheDocument();
  });
});