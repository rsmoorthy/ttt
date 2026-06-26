import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Tournament role guard", () => {
  it("redirects non-superadmin users away from tournaments", async () => {
    renderApp({ route: "/tournaments", user: mockGuest });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Welcome" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("heading", { name: "Tournaments" })).toBeNull();
  });
});