import { render, screen } from "@testing-library/react";
import { MatchCompletionSummary } from "../../../src/components/matches/MatchCompletionSummary";

describe("MatchCompletionSummary", () => {
  it("renders styled centered completion text", () => {
    render(<MatchCompletionSummary completed={2} total={5} />);
    const summary = screen.getByText("Total matches completed: 2/5");
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveClass("text-[1.225rem]");
    expect(summary).toHaveClass("rounded-[10px]");
    expect(summary).toHaveClass("bg-emerald-50");
    expect(summary).toHaveClass("border");
  });

  it("renders nothing when there are no matches", () => {
    const { container } = render(
      <MatchCompletionSummary completed={0} total={0} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});