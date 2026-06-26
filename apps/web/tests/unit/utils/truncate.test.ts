import { describe, expect, it } from "vitest";
import { truncate } from "../../../src/utils/truncate";

describe("truncate", () => {
  it("returns the original text when shorter than the limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long text with an ellipsis", () => {
    expect(truncate("abcdefghijklmnopqrstuvwxyz", 10)).toBe("abcdefghij…");
  });
});