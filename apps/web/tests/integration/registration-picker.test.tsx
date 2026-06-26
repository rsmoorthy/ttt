import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Registration tournament picker", () => {
  it("lists tournaments and opens the registration screen", async () => {
    const user = userEvent.setup();

    renderApp({ route: "/registration", user: mockGuest });

    expect(
      await screen.findByRole("heading", {
        name: "Registration — Select tournament",
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Summer Open 2026")).toBeInTheDocument();

    const openLinks = screen.getAllByRole("link", { name: "Open" });
    await user.click(openLinks[0]);

    expect(await screen.findByRole("heading", { name: "Summer Open 2026" }))
      .toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});