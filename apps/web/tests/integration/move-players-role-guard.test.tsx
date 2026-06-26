import { screen, waitFor } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Move players role guard", () => {
  it("redirects guests away from move players", async () => {
    renderApp({ route: "/move-players", user: mockGuest });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Welcome" })).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("heading", {
        name: "Move to Stage — Select tournament",
      }),
    ).toBeNull();
  });
});