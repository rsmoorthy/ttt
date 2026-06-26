import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../../../src/components/ui/StatusBadge";

describe("StatusBadge", () => {
  it("renders open status", () => {
    render(<StatusBadge status="open" />);
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("renders closed status", () => {
    render(<StatusBadge status="closed" />);
    expect(screen.getByText("closed")).toBeInTheDocument();
  });
});