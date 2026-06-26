import {
  canCompleteMatch,
  canCompleteMatchState,
  canEditMatch,
  countGamesWon,
  fieldErrorKey,
  hasDecisiveGameWins,
  hasScoreContent,
  hasValidRequiredGames,
  scoreInputClassName,
  validateMatchScores,
  validateScoreString,
} from "../../../src/utils/scores";

const emptyMatch = {
  slno: 1,
  player1: "Alice",
  player2: "Bob",
  tbl: 1,
  hour_slot: 1,
  game1: "",
  game2: "",
  game3: "",
  game4: "",
  game5: "",
  walkover_win: "",
  is_completed: false,
};

const emptyState = {
  game1: "",
  game2: "",
  game3: "",
  game4: "",
  game5: "",
  walkover_win: "",
};

describe("scores utils", () => {
  it("validates table tennis score strings", () => {
    expect(validateScoreString("11-7")).toBeNull();
    expect(validateScoreString("16-14")).toBeNull();
    expect(validateScoreString("11-10")).toMatch(/lead by at least 2/);
    expect(validateScoreString("10-8")).toMatch(/At least one score must be 11/);
  });

  it("rejects walkover combined with game scores", () => {
    const errors = validateMatchScores(
      {
        game1: "11-7",
        game2: "",
        game3: "",
        game4: "",
        game5: "",
        walkover_win: "Alice",
      },
      "Alice",
      "Bob",
    );

    expect(errors?.walkover_win).toMatch(/Walkover cannot be set/);
  });

  it("builds field error keys and error input classes", () => {
    expect(fieldErrorKey(3, "game2")).toBe("3:game2");
    expect(scoreInputClassName(true)).toMatch(/border-red-500/);
    expect(scoreInputClassName(false)).toMatch(/border-slate-300/);
  });

  it("requires game1-game2 or walkover for match over", () => {
    expect(hasScoreContent({ ...emptyState, game1: "11-7" })).toBe(true);
    expect(hasScoreContent(emptyState)).toBe(false);

    expect(
      hasValidRequiredGames({
        ...emptyState,
        game1: "11-7",
        game2: "9-11",
      }),
    ).toBe(true);
    expect(
      hasValidRequiredGames({
        ...emptyState,
        game1: "11-7",
      }),
    ).toBe(false);
    expect(
      hasValidRequiredGames({
        ...emptyState,
        game1: "11-7",
        game2: "9-11",
        game3: "11-8",
      }),
    ).toBe(true);

    expect(canCompleteMatchState({ ...emptyState, walkover_win: "Alice" })).toBe(
      true,
    );
    expect(
      canCompleteMatchState({
        ...emptyState,
        game1: "11-7",
        game2: "11-5",
      }),
    ).toBe(true);
    expect(
      canCompleteMatchState({
        ...emptyState,
        game1: "11-7",
      }),
    ).toBe(false);
    expect(canCompleteMatchState(emptyState)).toBe(false);
  });

  it("counts game wins from player1 perspective", () => {
    expect(
      countGamesWon({
        ...emptyState,
        game1: "11-7",
        game2: "9-11",
        game3: "11-8",
      }),
    ).toEqual({ player1Wins: 2, player2Wins: 1 });
    expect(
      countGamesWon({
        ...emptyState,
        game1: "11-7",
        game2: "9-11",
      }),
    ).toEqual({ player1Wins: 1, player2Wins: 1 });
  });

  it("disables match over when players have equal game wins", () => {
    expect(
      hasDecisiveGameWins({
        ...emptyState,
        game1: "11-7",
        game2: "9-11",
      }),
    ).toBe(false);
    expect(
      canCompleteMatchState({
        ...emptyState,
        game1: "11-7",
        game2: "9-11",
      }),
    ).toBe(false);
    expect(
      canCompleteMatchState({
        ...emptyState,
        game1: "11-7",
        game2: "9-11",
        game3: "11-8",
      }),
    ).toBe(true);
  });

  it("checks role and completion state for match over", () => {
    expect(canEditMatch("guest", emptyMatch)).toBe(false);
    expect(canEditMatch("scorer", emptyMatch)).toBe(true);
    expect(
      canEditMatch("scorer", { ...emptyMatch, is_completed: true }),
    ).toBe(false);
    expect(
      canEditMatch("admin", { ...emptyMatch, is_completed: true }),
    ).toBe(true);

    expect(
      canCompleteMatch("scorer", {
        ...emptyMatch,
        game1: "11-7",
        game2: "11-5",
      }),
    ).toBe(true);
    expect(
      canCompleteMatch("scorer", {
        ...emptyMatch,
        game1: "11-7",
        game2: "9-11",
      }),
    ).toBe(false);
    expect(
      canCompleteMatch("scorer", { ...emptyMatch, game1: "11-7" }),
    ).toBe(false);
    expect(canCompleteMatch("scorer", emptyMatch)).toBe(false);
    expect(
      canCompleteMatch("scorer", {
        ...emptyMatch,
        walkover_win: "Alice",
      }),
    ).toBe(true);
  });
});