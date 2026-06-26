import { screen, waitFor } from "@testing-library/react";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Fixtures stage redirect", () => {
  it("redirects to the first stage when no stage is selected", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/fixtures",
      user: mockAdmin,
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "League" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});