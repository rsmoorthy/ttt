import { REGISTRATION_ROW_COUNT } from "../../../src/constants/registration";
import { playersToRows, rowsToPayload } from "../../../src/utils/registration";

describe("registration utils", () => {
  it("maps API players into 30 editable rows", () => {
    const rows = playersToRows([
      { player_name: "Alice", sort_order: 0 },
      { player_name: "Bob", sort_order: 1 },
    ]);

    expect(rows).toHaveLength(REGISTRATION_ROW_COUNT);
    expect(rows[0]).toBe("Alice");
    expect(rows[1]).toBe("Bob");
    expect(rows[2]).toBe("");
  });

  it("builds a save payload from row values", () => {
    const payload = rowsToPayload(["Alice", "", "Carol"]);
    expect(payload).toEqual(["Alice", "", "Carol"]);
    expect(payload).toHaveLength(3);
  });
});