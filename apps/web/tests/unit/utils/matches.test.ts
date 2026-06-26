import { describe, expect, it } from "vitest";
import {
  countMatchCompletion,
  formatMatchDescription,
} from "../../../src/utils/matches";

describe("matches utils", () => {
  it("formats match descriptions", () => {
    expect(
      formatMatchDescription({
        slno: 3,
        player1: "Alice",
        player2: "Bob",
      }),
    ).toBe("3. Alice vs Bob");
  });

  it("counts completed matches", () => {
    expect(
      countMatchCompletion([
        { is_completed: true },
        { is_completed: false },
        { is_completed: true },
      ]),
    ).toEqual({ completed: 2, total: 3 });
  });
});