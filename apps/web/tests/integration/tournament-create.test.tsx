import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockSuperadmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Create tournament", () => {
  it("submits the form and returns to the list", async () => {
    const user = userEvent.setup();

    renderApp({ route: "/tournaments/new", user: mockSuperadmin });

    expect(
      await screen.findByRole("heading", { name: "Create Tournament" }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^name$/i), "Spring Cup");
    await user.type(screen.getByLabelText(/^slug$/i), "spring-cup");
    await user.type(
      screen.getByLabelText(/^description$/i),
      "One-day event",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByRole("heading", { name: "Tournaments" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Spring Cup")).toBeInTheDocument();
    expect(screen.getByText("spring-cup")).toBeInTheDocument();
  });
});