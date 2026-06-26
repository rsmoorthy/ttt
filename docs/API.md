# Table Tennis Tournament — API Specification

HTTP API for the TT tournament management app (v1). Product rules: [prd.md](prd.md). System context: [ARCHITECTURE.md](ARCHITECTURE.md). Database fields: [DESIGN.md](DESIGN.md).

All endpoints are under the `/api` prefix. Request and response bodies are JSON unless noted otherwise.

TypeScript types for these shapes live in `packages/shared` (`@ttt/shared`).

---

## Conventions

### Base URL

| Environment | Base |
|-------------|------|
| Development | `http://localhost:3000/api` |
| Production | `https://<your-host>/api` |

### Authentication

Session-based auth via cookie set by `POST /api/auth/login`.

| Item | Value |
|------|-------|
| Cookie name | `connect.sid` (default `express-session`) |
| Client behavior | Send `credentials: 'include'` on all API requests |
| Unauthenticated | `401` |
| Wrong role | `403` |

### Role shorthand

| Symbol | Roles allowed |
|--------|---------------|
| public | No auth required |
| auth | Any logged-in user |
| guest+ | `guest`, `scorer`, `admin`, `superadmin` |
| scorer+ | `scorer`, `admin`, `superadmin` |
| admin+ | `admin`, `superadmin` |
| superadmin | `superadmin` only |

Higher roles inherit lower-role permissions (see [ARCHITECTURE.md](ARCHITECTURE.md)).

### Path parameters

| Param | Type | Description |
|-------|------|-------------|
| `slug` | string | Tournament slug (URL-safe identifier) |
| `stage` | string | Stage slug, unique within the tournament |
| `slno` | integer | Match serial number within the stage |

### HTTP status codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `204` | Success, no body (e.g. delete) |
| `400` | Validation error |
| `401` | Not logged in |
| `403` | Forbidden (role or locked match for scorer) |
| `404` | Tournament, stage, or match not found |
| `409` | Business rule conflict |
| `502` | External schedule service failure |

### Error response body

All error responses use this shape:

```json
{
  "error": "Human-readable summary",
  "fields": {
    "game1": "Invalid score format",
    "target_stage": "Required"
  }
}
```

`fields` is optional; omit when the error is not field-specific.

### Common types

```typescript
type Role = "superadmin" | "admin" | "scorer" | "guest";
type TournamentStatus = "open" | "closed";
type WalkoverWin = "" | string; // empty or a player name (player1 or player2)
type ScoreString = "" | string; // empty or "n1-n2" e.g. "11-7"
```

### Boolean fields in JSON

API uses JSON booleans (`true` / `false`). SQLite stores them as `0` / `1`.

### Schedule field naming

The database column is `tbl`. JSON uses `tbl` in schedule-related responses to match the external service and PRD wording.

---

## Health

### `GET /api/health`

**Role:** public

**Response `200`:**

```json
{
  "ok": true,
  "db": "connected"
}
```

---

## Authentication

### `POST /api/auth/login`

**Role:** public

**Request body:**

```json
{
  "username": "scorer1",
  "password": "secret"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `username` | string | yes | |
| `password` | string | yes | Plain text over HTTPS |

**Response `200`:**

```json
{
  "username": "scorer1",
  "role": "scorer"
}
```

Sets session cookie.

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Missing username or password |
| `401` | Invalid credentials |

---

### `POST /api/auth/logout`

**Role:** auth

**Request body:** none

**Response `204`:** empty body. Clears session cookie.

---

### `GET /api/auth/me`

**Role:** auth

**Response `200`:**

```json
{
  "username": "admin1",
  "role": "admin"
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `401` | No session |

---

## Tournaments

### `GET /api/tournaments`

**Role:** guest+

List tournaments for navigation pickers and the superadmin management screen.

**Query parameters:** none

**Response `200`:**

```json
{
  "tournaments": [
    {
      "slug": "summer-open-2026",
      "name": "Summer Open 2026",
      "description": "Club championship",
      "status": "open"
    }
  ]
}
```

Sorted by `name` ascending.

---

### `POST /api/tournaments`

**Role:** superadmin

**Request body:**

```json
{
  "name": "Summer Open 2026",
  "slug": "summer-open-2026",
  "description": "Club championship",
  "status": "open"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | yes | Non-empty |
| `slug` | string | yes | Unique; lowercase alphanumeric, hyphens |
| `description` | string | no | Default `""` |
| `status` | string | no | `"open"` or `"closed"`; default `"open"` |

**Response `201`:**

```json
{
  "slug": "summer-open-2026",
  "name": "Summer Open 2026",
  "description": "Club championship",
  "status": "open"
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Validation failure |
| `409` | `slug` already exists |

---

### `GET /api/tournaments/:slug`

**Role:** guest+

**Response `200`:**

```json
{
  "slug": "summer-open-2026",
  "name": "Summer Open 2026",
  "description": "Club championship",
  "status": "open"
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `404` | Tournament not found |

---

### `PUT /api/tournaments/:slug`

**Role:** superadmin

**Request body:** same fields as create; all optional except at least one field must be present.

```json
{
  "name": "Summer Open 2026 (updated)",
  "description": "Updated description",
  "status": "closed"
}
```

`slug` in the path is the identifier; renaming slug is not supported in v1.

**Response `200`:** updated tournament object (same shape as `GET`).

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Validation failure |
| `404` | Tournament not found |

---

### `DELETE /api/tournaments/:slug`

**Role:** superadmin

Deletes tournament and all dependent data (cascade).

**Response `204`:** empty body

**Errors:**

| Code | Condition |
|------|-----------|
| `404` | Tournament not found |

---

## Registration

### `GET /api/tournaments/:slug/registration`

**Role:** guest+

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "players": [
    { "player_name": "Alice", "sort_order": 0 },
    { "player_name": "Bob", "sort_order": 1 }
  ]
}
```

Players ordered by `sort_order` ascending. Empty registration returns `"players": []`.

---

### `PUT /api/tournaments/:slug/registration`

**Role:** admin+

Replaces the full player list for the tournament. Empty names are skipped. Maximum 30 non-empty names (UI shows 30 rows).

**Request body:**

```json
{
  "players": [
    "Alice",
    "Bob",
    "",
    "Carol"
  ]
}
```

Alternative form (explicit ordering):

```json
{
  "players": [
    { "player_name": "Alice" },
    { "player_name": "Bob" },
    { "player_name": "Carol" }
  ]
}
```

`sort_order` is assigned from array index (0-based) for non-empty names.

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "players": [
    { "player_name": "Alice", "sort_order": 0 },
    { "player_name": "Bob", "sort_order": 1 },
    { "player_name": "Carol", "sort_order": 2 }
  ]
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | More than 30 players; empty `player_name` objects |
| `404` | Tournament not found |

---

## Stages

Each stage has a `stage_type` that drives fixture generation and whether automated scheduling is available. See [ChangeRequest1.md](ChangeRequest1.md) for fixture algorithms per type.

| `stage_type` | Typical use | Fixture generation | Automated schedule (`POST .../schedule`) |
|--------------|-------------|--------------------|------------------------------------------|
| `league` | Opening round | Variable players; `approx_total_matches` required | Yes — external schedule service |
| `superleague` | QF (top 8) | Exactly 8 players in rank order | No — league-only per PRD |
| `playoff` | SF (4) or Final (2) | 4 or 2 players in rank order | No — league-only per PRD |

`stage_type` is set explicitly at create/edit. Slug-based inference is **not** used.

### `GET /api/tournaments/:slug/stages`

**Role:** guest+

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "stages": [
    {
      "slug": "league",
      "name": "League",
      "description": "Round robin groups",
      "stage_type": "league",
      "is_completed": false
    },
    {
      "slug": "qf",
      "name": "Quarter Finals",
      "description": "",
      "stage_type": "superleague",
      "is_completed": false
    }
  ]
}
```

---

### `POST /api/tournaments/:slug/stages`

**Role:** admin+

**Request body:**

```json
{
  "name": "League",
  "slug": "league",
  "description": "Round robin groups",
  "stage_type": "league",
  "is_completed": false
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | yes | Non-empty |
| `slug` | string | yes | Unique per tournament |
| `description` | string | no | Default `""` |
| `stage_type` | string | yes | One of `league`, `superleague`, `playoff` |
| `is_completed` | boolean | no | Default `false` |

**Response `201`:** stage object (same shape as list item).

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Validation failure |
| `404` | Tournament not found |
| `409` | `(tournament, slug)` already exists |

---

### `GET /api/tournaments/:slug/stages/:stage`

**Role:** guest+

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "slug": "league",
  "name": "League",
  "description": "Round robin groups",
  "stage_type": "league",
  "is_completed": false
}
```

---

### `PUT /api/tournaments/:slug/stages/:stage`

**Role:** admin+

**Request body:** partial update allowed.

```json
{
  "name": "League Stage",
  "description": "Updated",
  "stage_type": "league",
  "is_completed": true
}
```

`slug` cannot be changed in v1.

**Response `200`:** updated stage object.

---

### `DELETE /api/tournaments/:slug/stages/:stage`

**Role:** admin+

Deletes stage and all dependent fixtures, groups, and stage players (cascade).

**Response `204`:** empty body

---

## Stage players (fixture input source)

### `GET /api/tournaments/:slug/stages/:stage/players`

**Role:** admin+

Returns the player list that fixture generation will use.

**Source rule:** If any `stages_players` rows exist for this stage, return those; otherwise return `registration` players.

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "stage": "league",
  "source": "registration",
  "players": [
    { "player_name": "Alice", "sort_order": 0 },
    { "player_name": "Bob", "sort_order": 1 }
  ]
}
```

`source` is `"registration"` or `"stages_players"`.

**Errors:**

| Code | Condition |
|------|-----------|
| `404` | Tournament or stage not found |

---

## Fixtures

### `GET /api/tournaments/:slug/stages/:stage/fixtures`

**Role:** admin+

Fixture screen state: resolved players, existing groups/matches (if any).

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "stage": "league",
  "stage_type": "league",
  "players": [
    { "player_name": "Alice", "sort_order": 0 },
    { "player_name": "Bob", "sort_order": 1 }
  ],
  "player_source": "registration",
  "has_fixtures": true,
  "groups": {
    "A": ["Alice", "Bob"],
    "B": ["Carol", "Dave"]
  },
  "matches": [
    {
      "slno": 1,
      "player1": "Alice",
      "player2": "Bob",
      "tbl": null,
      "hour_slot": null,
      "game1": "",
      "game2": "",
      "game3": "",
      "game4": "",
      "game5": "",
      "walkover_win": "",
      "is_completed": false
    }
  ],
  "summary": {
    "total_matches": 6,
    "matches_per_player": 2
  }
}
```

When no fixtures exist: `"has_fixtures": false`, `"groups": {}`, `"matches": []`, `"summary": null`.

`summary` reflects last fixture generation when available (not persisted separately; derived from match count or returned from last POST).

---

### `POST /api/tournaments/:slug/stages/:stage/fixtures`

**Role:** admin+

Generates fixtures in-process (per [ChangeRequest1.md](ChangeRequest1.md)) and **replaces** all `fixtures` and `fixture_groups` for this stage. Scores and schedule from a prior run are discarded. The handler reads `stage_type` from the stage record and dispatches to the matching generator.

**Request body (league):**

```json
{
  "approx_total_matches": 70
}
```

**Request body (superleague or playoff):**

```json
{}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `approx_total_matches` | integer | league only | > 0; ignored for `superleague` / `playoff` |

**Player count rules (from stage player source):**

| `stage_type` | Players required | Order |
|--------------|------------------|-------|
| `league` | ≥ 2 | Shuffled internally before grouping |
| `superleague` | exactly 8 | Rank order preserved (no shuffle) |
| `playoff` | 4 (SF) or 2 (Final) | Rank order preserved; SF order `[A1, A2, B1, B2]` |

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "stage": "league",
  "total_matches": 6,
  "matches_per_player": 2,
  "matches": [
    { "slno": 1, "player1": "Alice", "player2": "Bob" }
  ]
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Validation failure; no players available; wrong player count for `stage_type`; missing `approx_total_matches` for `league` |
| `404` | Tournament or stage not found |

---

## Schedule

### `GET /api/tournaments/:slug/stages/:stage/schedule`

**Role:** guest+

Schedule screen state for all roles. Returns fixture matches with optional `tbl` and `hour_slot` values. The SPA uses these fields to choose the view (per [prd.md](prd.md)):

- **Unscheduled** — all matches have `tbl` and `hour_slot` null; UI shows a flat table with empty slot/table columns.
- **Scheduled** — at least one match has non-null `tbl` or `hour_slot`; UI shows the hour-slot / per-table grid.

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "stage": "league",
  "stage_type": "league",
  "has_fixtures": true,
  "matches": [
    {
      "slno": 1,
      "player1": "Alice",
      "player2": "Bob",
      "tbl": 2,
      "hour_slot": 1
    }
  ]
}
```

Before scheduling, `tbl` and `hour_slot` are `null`. `stage_type` lets the UI show or hide **admin+** scheduling controls (league-only per PRD). `POST .../schedule` remains admin+.

**Errors:**

| Code | Condition |
|------|-----------|
| `404` | Tournament or stage not found |
| `409` | No fixtures created yet (`"error": "Create fixtures before scheduling"`) |

---

### `POST /api/tournaments/:slug/stages/:stage/schedule`

**Role:** admin+

Schedules matches and **overwrites** `tbl` and `hour_slot` on all fixtures for this stage.

**`stage_type` behaviour:**

- **`league`** — calls the external schedule service (`POST {SCHEDULE_SERVICE_URL}/schedule`), then persists the returned slots.
- **`superleague` / `playoff`** — returns `400`; automated scheduling is league-only per [prd.md](prd.md). Knockout stages have few matches (see [ChangeRequest1.md](ChangeRequest1.md)); use admin hand-edit when needed.

**Request body:**

```json
{
  "numSlots": 7,
  "numTables": 2,
  "maxMatchesPerSlot": 6
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `numSlots` | integer | yes | > 0 |
| `numTables` | integer | yes | > 0 |
| `maxMatchesPerSlot` | integer | yes | > 0 |

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "stage": "league",
  "matches": [
    {
      "player1": "Alice",
      "player2": "Bob",
      "hour_slot": 1,
      "tbl": 2
    }
  ]
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Validation failure; `stage_type` is not `league` |
| `404` | Tournament or stage not found |
| `409` | No fixtures to schedule |
| `502` | External `POST /schedule` failed |

#### External service (league only)

When `stage_type === "league"`, the backend sends existing matches to the external service. The following is the backend → external request (not sent by the SPA):


**Request body to external service:**

```json
{
  "numSlots": 7,
  "numTables": 2,
  "maxMatchesPerSlot": 6,
  "scheme": "league",
  "totalPlayers": ["A1", "A2"],
  "matches": [
    { "player1": "Alice", "player2": "Bob" }
  ]
}
```

**Response body from external service:**

```json
  {
    "status": "ok|error",
    "error": "only if error",
    "matches": [
      {  "player1": "A1", "player2": "A2", "hour_slot" : 1, "tbl": 1}
    ]
  }
```

---

## Matches (scores)

### `GET /api/tournaments/:slug/stages/:stage/matches`

**Role:** guest+

List matches for the scores screen. Sorted by `hour_slot` ascending, then `tbl` ascending. Matches with null schedule fields sort last.

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `player` | string | no | Filter: match includes this player as `player1` or `player2` |
| `hour_slot` | integer | no | Filter: exact hour slot |
| `tbl` | integer | no | Filter: exact table number |

Multiple filters are ANDed. Omit or leave empty to ignore a filter.

**Example:** `GET .../matches?player=Alice&hour_slot=2`

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "stage": "league",
  "filters": {
    "player": "Alice",
    "hour_slot": 2,
    "tbl": null
  },
  "matches": [
    {
      "slno": 3,
      "player1": "Alice",
      "player2": "Carol",
      "tbl": 1,
      "hour_slot": 2,
      "game1": "11-7",
      "game2": "9-11",
      "game3": "11-8",
      "game4": "",
      "game5": "",
      "walkover_win": "",
      "is_completed": false
    }
  ],
  "filter_options": {
    "players": ["Alice", "Bob", "Carol", "Dave"],
    "hour_slots": [1, 2, 3],
    "tbls": [1, 2]
  }
}
```

`filter_options` supports populating UI dropdowns without a separate endpoint.

---

### `PATCH /api/tournaments/:slug/stages/:stage/matches/:slno`

**Role:** scorer+ (guest cannot patch)

Updates score fields for one match. Send only fields being changed (partial update). Valid updates are persisted immediately.

**Request body (examples):**

```json
{
  "game1": "11-7"
}
```

```json
{
  "game1": "11-7",
  "game2": "7-11",
  "game3": "11-9"
}
```

```json
{
  "walkover_win": "Alice"
}
```

```json
{
  "game1": "",
  "game2": "",
  "walkover_win": ""
}
```

| Field | Type | Notes |
|-------|------|-------|
| `game1` … `game5` | ScoreString | See score validation below |
| `walkover_win` | WalkoverWin | Empty string, or `player1` / `player2` name |

**Response `200`:** full updated match object (same shape as list item).

**Score validation rules** (enforced in `@ttt/shared` and API):

1. Format `n1-n2` where `n1` and `n2` are non-negative integers.
2. At least one of `n1`, `n2` must be ≥ 11.
3. If both ≤ 11: winner leads by at least 2 (`|n1 - n2| >= 2`).
4. If both > 10: difference must be exactly 2.
5. Sequential games: `gameN` cannot be set unless `game1` … `game(N-1)` are all non-empty.
6. `walkover_win` and game scores are mutually exclusive:
   - If `walkover_win` is non-empty, all `game1`…`game5` must be empty.
   - If any game score is non-empty, `walkover_win` must be empty.
7. `walkover_win` must be empty, or equal to `player1` or `player2` of the match.

**Authorization rules:**

| Role | `is_completed === true` |
|------|-------------------------|
| scorer | `403` — cannot update |
| admin+ | Allowed |

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Score / walkover validation failed (`fields` populated) |
| `403` | Guest role; or scorer on completed match |
| `404` | Tournament, stage, or match not found |

---

### `POST /api/tournaments/:slug/stages/:stage/matches/:slno/complete`

**Role:** scorer+

Marks a match as over (`is_completed = true`). PRD: "Match Over" button.

**Request body:** none

**Preconditions:**

- At least one of: non-empty valid game scores (sufficient to determine play), or non-empty `walkover_win`.
- Match must not already be completed (idempotent re-POST may return `200` with unchanged state — implementation choice; prefer `409` if already complete for scorer).

**Response `200`:**

```json
{
  "slno": 3,
  "player1": "Alice",
  "player2": "Carol",
  "tbl": 1,
  "hour_slot": 2,
  "game1": "11-7",
  "game2": "9-11",
  "game3": "11-8",
  "game4": "",
  "game5": "",
  "walkover_win": "",
  "is_completed": true
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | No scores and no walkover |
| `403` | Guest role |
| `404` | Match not found |
| `409` | Already completed (optional strict mode) |

Admin may still `PATCH` scores after completion but cannot use this endpoint to uncomplete a match in v1.

---

## Leaderboard

### `GET /api/tournaments/:slug/stages/:stage/leaderboard`

**Role:** guest+

Computed rankings; nothing is stored in the database.

**Query parameters:** none

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "stage": "league",
  "entries": [
    {
      "rank": 1,
      "player_name": "Alice",
      "wins": 3,
      "nrr": 2.855,
      "swlr": 2.5,
      "pwlr": 1.35
    },
    {
      "rank": 2,
      "player_name": "Bob",
      "wins": 2,
      "nrr": 2.100,
      "swlr": 1.5,
      "pwlr": 0.9
    }
  ]
}
```

**Sort order:** `wins` descending, then `nrr` descending.

**Calculation (backend only):**

| Metric | Rule |
|--------|------|
| Wins | Walkover → walkover winner gets the win. Otherwise derive `relative_scores` per player per match; count sets won; player wins match if sets won > sets lost. |
| SWLR | Walkover → 0 sets counted. Else ratio `sets_won / sets_lost`; if `sets_lost === 0` use `99`. Two decimal places. |
| PWLR | Walkover → 0 points counted. Else `points_won / points_lost` from relative scores; if `points_lost === 0` use `99`. Two decimal places. |
| NRR | `((SWLR * 100) + PWLR)/100`. Four decimal places. |

Players with no matches appear with zero wins and zero ratios unless they have walkover-only results.

---

## Move players to stage

### `POST /api/tournaments/:slug/stages/:stage/move-players`

**Role:** admin+

Moves selected players from the current stage context into a **target** stage. Replaces the entire `stages_players` list for the target stage.

**Request body:**

```json
{
  "target_stage": "qf",
  "players": ["Alice", "Bob"]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `target_stage` | string | yes | Must exist; must differ from path `:stage` |
| `players` | string[] | yes | Non-empty; names from leaderboard / current stage |

**Response `200`:**

```json
{
  "tournament": "summer-open-2026",
  "source_stage": "league",
  "target_stage": "qf",
  "players": [
    { "player_name": "Alice", "sort_order": 0 },
    { "player_name": "Bob", "sort_order": 1 }
  ]
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Missing `target_stage` or empty `players` |
| `404` | Tournament or stage not found |
| `409` | `target_stage` equals source stage |

---

## Endpoint summary

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/health` | public | Health check |
| POST | `/api/auth/login` | public | Login |
| POST | `/api/auth/logout` | auth | Logout |
| GET | `/api/auth/me` | auth | Current user |
| GET | `/api/tournaments` | guest+ | List tournaments |
| POST | `/api/tournaments` | superadmin | Create tournament |
| GET | `/api/tournaments/:slug` | guest+ | Get tournament |
| PUT | `/api/tournaments/:slug` | superadmin | Update tournament |
| DELETE | `/api/tournaments/:slug` | superadmin | Delete tournament |
| GET | `/api/tournaments/:slug/registration` | guest+ | List registered players |
| PUT | `/api/tournaments/:slug/registration` | admin+ | Replace registration |
| GET | `/api/tournaments/:slug/stages` | guest+ | List stages |
| POST | `/api/tournaments/:slug/stages` | admin+ | Create stage |
| GET | `/api/tournaments/:slug/stages/:stage` | guest+ | Get stage |
| PUT | `/api/tournaments/:slug/stages/:stage` | admin+ | Update stage |
| DELETE | `/api/tournaments/:slug/stages/:stage` | admin+ | Delete stage |
| GET | `/api/tournaments/:slug/stages/:stage/players` | admin+ | Fixture player source |
| GET | `/api/tournaments/:slug/stages/:stage/fixtures` | admin+ | Fixture screen state |
| POST | `/api/tournaments/:slug/stages/:stage/fixtures` | admin+ | Generate fixtures |
| GET | `/api/tournaments/:slug/stages/:stage/schedule` | guest+ | Schedule screen state |
| POST | `/api/tournaments/:slug/stages/:stage/schedule` | admin+ | Run scheduling |
| GET | `/api/tournaments/:slug/stages/:stage/matches` | guest+ | List/filter matches |
| PATCH | `/api/tournaments/:slug/stages/:stage/matches/:slno` | scorer+ | Update scores |
| POST | `/api/tournaments/:slug/stages/:stage/matches/:slno/complete` | scorer+ | Match over |
| GET | `/api/tournaments/:slug/stages/:stage/leaderboard` | guest+ | Rankings |
| POST | `/api/tournaments/:slug/stages/:stage/move-players` | admin+ | Move players to stage |

---

## External service contract (reference)

The API proxies to `SCHEDULE_SERVICE_URL` (default `http://localhost:8383`). These are **not** exposed by the TT app; documented here for implementers.

### `POST {SCHEDULE_SERVICE_URL}/fixtures`

Note: This external service will not be used. Kept for historical reasons.

**Request:**

```json
{
  "approx_total_matches": 8,
  "number_of_groups": 2,
  "scheme": "league",
  "players": ["Alice", "Bob", "Carol", "Dave"]
}
```

**Response:**

```json
{
  "total_matches": 6,
  "matches_per_player": 2,
  "groups": {
    "A": ["Alice", "Bob"],
    "B": ["Carol", "Dave"]
  },
  "matches": [
    { "slno": 1, "player1": "Alice", "player2": "Bob" }
  ]
}
```

### `POST {SCHEDULE_SERVICE_URL}/schedule`

**Request:**

```json
  {
    "numSlots": 7,
    "numTables": 2,
    "maxMatchesPerSlot": 6,
    "scheme": "league",
    "totalPlayers": ["A1", "A2"],
    "matches": [
      {  "player1": "A1", "player2": "A2", }
    ]
  }
```

**Response:**

```json
  {
    "status": "ok|error",
    "error": "only if error",
    "matches": [
      {  "player1": "A1", "player2": "A2", "hour_slot" : 1, "tbl": 1}
    ]
  }
```

---

## Implementation notes

1. **Transactions:** `PUT registration`, `POST fixtures`, `POST schedule`, and `POST move-players` should use SQLite transactions where multiple writes occur.
2. **Content-Type:** Clients send `Content-Type: application/json`. Responses are `application/json` except `204`.
3. **CORS:** Not required when SPA is same-origin in production. Dev Vite proxy avoids CORS locally.
4. **OpenAPI:** Optional later export from Zod schemas in `apps/api/validators`.
5. **Types:** Mirror this spec in `packages/shared/src/types/` for compile-time safety in API and web.
