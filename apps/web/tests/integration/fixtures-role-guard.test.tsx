import { screen, waitFor } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Fixtures role guard", () => {
  it("redirects guests away from fixtures", async () => {
    renderApp({ route: "/fixtures", user: mockGuest });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Welcome" })).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("heading", { name: "Fixtures — Select tournament" }),
    ).toBeNull();
  });
});