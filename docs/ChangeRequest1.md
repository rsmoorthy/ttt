# Change Request 1

As per prd.md, creating fixtures require talking to an external service. Which we are going to move away from.


Please take a look at temp/fixtures.html. It is a self-contained HTML+JS+CSS, which has the logic for creating
fixtures. We are going to use this logic / code mostly, except for few minor modifications.

In that file temp/fixtures.html, there is a function scheduleTournament() and other functions it calls. We are only
interested in that. Some of the function code may invoke DOM, which will need to be changed.

The scheduleTournament() will take following arguments:
a. Approx number of matches
b. players: [ .. ]

**League stages only.** `scheduleTournament()` applies exclusively to **league** stages (see stage types
below). Other stage types use separate fixture algorithms in the same module.

The function will return:
a. actual total matches
b. number of matches per player (all of them gets equal number of matches)
c. matches: [ { slno: 1, player1: "", player2: ""} ]
d. groups: { A: [...], B: [....] }

The objective of this function is to identify the actual number of matches / fixtures (around the given
approx number of matches), keeping an equal number of matches per player. For ex, if 17 players are given, 
and 70 matches are given as target, it could identify 8 matches per player and total 68 matches.

To facilitate, in creating a fixtures, internally it will group players into 2 or 3 or 4 groups (A, B, C).
The logic is all A group players with each other, B and C similarly. For addl matches, players randomly
play among the groups (not everyone can play with each other). The groups created are for internal purposes
only, though they are exposed as return values.

The current code assumes that number of groups is given as input. This needs to be changed. We need to try
with 2 groups (A and B). If we cannot get equal number of matches per player (for ex: 17 players, 2 groups), 
then we should try with 3 groups and try.

## Stage types

Post-league stages are **not strict knockout** — they use a **super league** model. The tournament
defines three stage types. Each type selects its own fixture algorithm when "Create Fixtures" is invoked.

| Type | Typical use | Player count | Shuffle? |
|------|-------------|--------------|----------|
| `league` | Opening round | Variable (registration or moved) | **Yes** — shuffle before grouping |
| `superleague` | QF (top 8) | Exactly 8, in rank order | **No** — rank order preserved |
| `playoff` | SF (4 players), Final (2 players) | 4 or 2, in rank order | **No** |

### Type 1: `league`

- Uses modified `scheduleTournament(approx_total_matches, players)`.
- Players are **shuffled randomly** before internal group assignment.
- Auto-selects 2, 3, or 4 internal groups to hit approx total matches with equal matches per player.

### Type 2: `superleague`

- Used for stages like QF after league.
- Input: **8 players in rank order** (1st through 8th from league leaderboard / move-to-stage).
- **No shuffling.** Split by rank into two groups:
  - **Group A:** ranks 1, 3, 5, 7 (indices 0, 2, 4, 6)
  - **Group B:** ranks 2, 4, 6, 8 (indices 1, 3, 5, 7)
- Fixtures: every player within A plays every other player in A; same for B. **No cross-group matches.**
- With 4 players per group: 6 matches per group, 12 total, 3 matches per player.
- Top 2 from each group advance to SF (handled by existing move-to-stage, not fixture generation).

### Type 3: `playoff`

- Used for SF and Final.
- **SF (4 players):** players arrive in order `[A1, A2, B1, B2]` — top 2 from superleague group A,
  then top 2 from group B. Fixtures:
  - Match 1: A1 vs B2
  - Match 2: B1 vs A2
- **Final (2 players):** single match between the two finalists.
- `approx_total_matches` is not used for `superleague` or `playoff` stages.


------ Review comments from Implementer below ---------

## Feasibility: Yes

**Verdict:** This change request is implementable. The league fixture algorithm in `temp/fixtures.html` is self-contained, well-understood, and maps cleanly onto the existing API (`POST /api/tournaments/:slug/stages/:stage/fixtures`). The backend already persists groups and matches via `replaceFixtures()` — only the generation step needs to change.

**Scope of this CR:**

- **In scope:** Internal fixture generation for all three stage types (`league`, `superleague`, `playoff`). Replaces external `POST /fixtures` service entirely.
- **Out of scope:** Schedule external service (`POST http://localhost:8383/schedule`, logic in `temp/gpt2.py`) — remains as-is per the PRD.

---

## Implementation plan

### 1. Stage type on `stages` table

Add a `stage_type` column to the `stages` table and stage CRUD API:

```sql
stage_type TEXT NOT NULL DEFAULT 'league'
  CHECK (stage_type IN ('league', 'superleague', 'playoff'))
```

- Set at stage creation / edit (admin UI dropdown).
- Fixture route reads `stage_type` and dispatches to the correct generator.
- Slug-based inference is **not** used — explicit `stage_type` only.

### 2. New backend module: `apps/api/src/services/fixture-generator.ts`

Three public entry points plus shared helpers. Port league logic from `temp/fixtures.html` (lines ~533–845).

| Function | Stage type | Purpose |
|----------|------------|---------|
| `scheduleTournament(targetTotal, players)` | `league` | Variable N; shuffle + auto groups + inter-group matches |
| `generateSuperLeagueFixtures(players)` | `superleague` | 8 ranked players → A(1,3,5,7) vs B(2,4,6,8), intra-group RR only |
| `generatePlayoffFixtures(players)` | `playoff` | 4 players → SF cross-pairing; 2 players → single final |
| `generateFixtures(stageType, players, approxTotal?)` | all | Dispatcher called by route handler |

**League helpers** (ported from fixtures.html):

| Function | Purpose |
|----------|---------|
| `getGroupSizes(n, g)` | Split n players into g groups as evenly as possible |
| `buildGroups(players, g)` | Assign shuffled players to groups A, B, C, … |
| `computeIntraTotal(groups)` | Count within-group matches |
| `findBestTAndKs(groups, targetTotal)` | Find matches-per-player T closest to target |
| `generateInterMatchesDifferential(groups, kPerGroup)` | Build cross-group pairings |
| `generateAllMatches(groups, kPerGroup)` | Intra + inter match list |
| `shufflePlayers(players)` | Fisher–Yates shuffle (league only) |

**DOM dependencies to remove:**

- `buildGroups` currently calls `getTotalPlayers()` (reads 20 HTML inputs). Replaced by accepting `players: string[]`.
- All render functions and the `/schedule` call in `onScheduleReal()` are **not** ported.

### 3. Fixture algorithms by stage type

Shared result shape:

```typescript
type StageType = "league" | "superleague" | "playoff";

interface FixtureGenerationResult {
  total_matches: number;
  matches_per_player: number;
  groups: Record<string, string[]>;
  matches: Array<{ slno: number; player1: string; player2: string }>;
}
```

#### `league` — `scheduleTournament(approx_total_matches, players)`

1. Validate: at least 2 players; `approx_total_matches` > 0.
2. **Shuffle players randomly** (differs from registration order intentionally).
3. Auto-select group count — try `g = 2`, then `3`, then `4`.
4. For each `g`, call `findBestTAndKs`. Skip if infeasible.
5. Pick feasible result whose `total_matches` is closest to `approx_total_matches`.
6. Generate matches via `generateAllMatches` (intra + inter-group).
7. Retry once if per-player totals diverge (existing fixtures.html behaviour).

#### `superleague` — `generateSuperLeagueFixtures(players)`

1. Validate: exactly **8 players**; must be in **rank order** (no shuffle).
2. Build groups:
   - `A = [players[0], players[2], players[4], players[6]]`  (ranks 1, 3, 5, 7)
   - `B = [players[1], players[3], players[5], players[7]]`  (ranks 2, 4, 6, 8)
3. Generate all within-group pairings (6 per group, 12 total, 3 per player).
4. Return `groups: { A, B }`, `total_matches: 12`, `matches_per_player: 3`.
5. `approx_total_matches` request field is **ignored**.

#### `playoff` — `generatePlayoffFixtures(players)`

1. Validate player count is **4** (SF) or **2** (Final). Must be in rank order (no shuffle).
2. **SF (4 players)** — input order `[A1, A2, B1, B2]`:
   - Match 1: `A1` vs `B2`
   - Match 2: `B1` vs `A2`
   - `groups: { A: [A1, A2], B: [B1, B2] }`, `total_matches: 2`, `matches_per_player: 1`
3. **Final (2 players)** — input order `[finalist1, finalist2]`:
   - Match 1: `finalist1` vs `finalist2`
   - `groups: {}` (or omit), `total_matches: 1`, `matches_per_player: 1`
4. `approx_total_matches` request field is **ignored**.

### 4. Replace external fixture service call

In `apps/api/src/routes/fixtures.ts`:

- Replace `callFixtureService(...)` with `generateFixtures(stage.stage_type, players, approx_total_matches)`.
- Remove dependency on `apps/api/src/services/fixture-client.ts` for fixtures.
- Remove `FIXTURE_SERVICE_URL` from env for fixtures (schedule URL stays).

### 5. API / validator changes

**`createFixturesSchema`** (`apps/api/src/validators/fixtures.ts`):

- Keep: `approx_total_matches` (optional for `superleague` / `playoff`; required for `league`)
- Remove: `number_of_groups` (auto-computed for league; fixed for other types)

**Route handler changes:**

- Load ordered player names from `resolveStagePlayers()` (unchanged).
- Read `stage_type` from stage record.
- Dispatch:
  - `league` → `scheduleTournament(approx_total_matches, players)` — shuffles internally
  - `superleague` → `generateSuperLeagueFixtures(players)` — requires 8 players in rank order
  - `playoff` → `generatePlayoffFixtures(players)` — requires 4 or 2 players in rank order
- Return `400` with a clear message on validation failure (wrong player count, missing `approx_total_matches` for league, etc.).

**Stages API** — add `stage_type` to create/update/response payloads.

### 6. Frontend changes (when SPA exists)

**Fixtures screen** (`docs/UI.md` screen 11):

- Remove "Number of groups" input.
- Show "Approx total matches" input **only** when `stage_type === 'league'`.
- POST body: `{ "approx_total_matches": 70 }` for league; `{}` for superleague / playoff.

**Stages create/edit screen:**

- Add `stage_type` dropdown: League / Super League / Playoff.

**Move to stage:**

- For superleague: admin moves top 8 from league in rank order.
- For SF: admin moves top 2 from each superleague group — order must be `[A1, A2, B1, B2]`.
- For Final: admin moves 2 SF winners in rank order.

### 7. Documentation updates

- `docs/API.md` — `stage_type` on stages; conditional `approx_total_matches`; remove `number_of_groups`.
- `docs/prd.md` — reference three stage types.
- `docs/UI.md` — stage type dropdown; conditional fixtures form.
- `.env.example` — remove `FIXTURE_SERVICE_URL` if no longer used for fixtures.
- `scripts/create_db.sh` — add `stage_type` column.

### 8. Tests

**League** (`scheduleTournament`):

| Case | Players | Target | Expected |
|------|---------|--------|----------|
| Small even | 4 | 6 | ~2 groups, equal matches/player |
| PRD example | 17 | 70 | ~8 matches/player, ~68 total |
| Infeasible target | 4 | 1 | Error: target < intra-group minimum |

**Superleague** (`generateSuperLeagueFixtures`):

| Case | Players | Expected |
|------|---------|----------|
| Valid 8 | ranks 1–8 | A=[1,3,5,7], B=[2,4,6,8], 12 matches, 3/player |
| Wrong count | 7 or 9 | Error |

**Playoff** (`generatePlayoffFixtures`):

| Case | Players | Expected |
|------|---------|----------|
| SF | [A1,A2,B1,B2] | A1–B2, B1–A2 |
| Final | [P1,P2] | P1–P2 |
| Wrong count | 3 | Error |

Integration test: `POST .../fixtures` per stage type with seeded players.

---

## Assumptions (pending confirmation)

| # | Topic | Assumption |
|---|-------|------------|
| 1 | **League shuffle** | League stages **shuffle players randomly** before group assignment. Superleague and playoff preserve rank order exactly. |
| 2 | **Superleague size** | Superleague always expects exactly **8 players**. Generalising to other even counts (e.g. top 6) is out of scope for v1. |
| 3 | **SF player order** | Move-to-stage delivers SF players as `[A1, A2, B1, B2]` — top 2 from superleague group A, then top 2 from group B, each subgroup sorted by standing. |
| 4 | **Max league groups** | Try 2 → 3 → 4 internal groups, then fail with a clear error. |
| 5 | **Randomness (league)** | Inter-group match pairing uses random shuffling (up to 800 attempts). Results differ per run but always satisfy equal matches-per-player. |
| 6 | **Advancement** | Top 2 per superleague group → SF; SF winners → Final. Handled by existing move-to-stage UI, not fixture generation. |

---

## Open questions for product owner

1. **Group upper bound (league):** Is 4 internal groups sufficient, or try up to 6?
2. **SF ordering:** Confirm move-to-stage produces `[A1, A2, B1, B2]` automatically (by superleague group standing), or admin selects manually in that order?
3. **Superleague generalisation:** Always 8 players, or should the algorithm support other counts (e.g. top 6 with groups of 3)?

---

## Files to touch

| File | Action |
|------|--------|
| `scripts/create_db.sh` | **Edit** — add `stage_type` column |
| `apps/api/src/services/fixture-generator.ts` | **Create** — all three algorithms |
| `apps/api/src/routes/fixtures.ts` | **Edit** — dispatch by `stage_type` |
| `apps/api/src/validators/fixtures.ts` | **Edit** — conditional `approx_total_matches` |
| `apps/api/src/validators/stages.ts` | **Edit** — add `stage_type` |
| `apps/api/src/db/repositories/stages.ts` | **Edit** — read/write `stage_type` |
| `apps/api/src/services/fixture-client.ts` | **Delete** |
| `apps/api/src/config/env.ts` | **Edit** — remove fixture service URL |
| `docs/API.md`, `docs/UI.md`, `docs/prd.md` | **Edit** |
| `apps/api/src/services/fixture-generator.test.ts` | **Create** — unit tests per stage type |

**Estimated effort:** ~1–2 PRs. Requires a small DB schema change (`stage_type` on `stages`).
