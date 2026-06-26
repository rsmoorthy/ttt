import { render, screen } from "@testing-library/react";
import { FixtureGroups } from "../../../src/components/fixtures/FixtureGroups";

describe("FixtureGroups", () => {
  it("renders group player lists", () => {
    render(
      <FixtureGroups
        groups={{
          A: ["Alice", "Bob"],
          B: ["Carol"],
        }}
      />,
    );

    expect(screen.getByText("Group A")).toBeInTheDocument();
    expect(screen.getByText("Group B")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("renders nothing when there are no groups", () => {
    const { container } = render(<FixtureGroups groups={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});