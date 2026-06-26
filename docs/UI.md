# Table Tennis Tournament — UI Specification

Menus, screens, browser routes, and API usage for the React SPA (v1). Requirements: [prd.md](prd.md). Routes overview: [ARCHITECTURE.md](ARCHITECTURE.md). API details: [API.md](API.md).

---

## Global layout

All authenticated screens share a common shell:

| Area | Content |
|------|---------|
| Top bar | App title, logged-in username, role badge, **Logout** |
| Main nav | Role-filtered menu items (see below) |
| Error banner | Backend errors shown prominently at top (dismissible) |
| Main content | Screen body |

**Logout** calls `POST /api/auth/logout` and redirects to `/login`.

Unauthenticated users are redirected to `/login`. Insufficient role shows an error message or redirect to `/`.

---

## Navigation menu

Top-level items appear in this order. Items marked **hidden** are not shown in the nav for that role (direct URL access returns forbidden / redirect).

| Menu item | Min role | Has tournament picker | Has stage tabs | Browser entry URL |
|-----------|----------|----------------------|----------------|-------------------|
| Home | guest+ | — | — | `/` |
| Tournaments | superadmin | — | — | `/tournaments` |
| Registration | guest+ | yes | — | `/registration` |
| Stages | guest+ | yes | — | `/stages` |
| Fixtures | admin+ | yes | yes | `/fixtures` |
| Schedule | guest+ | yes | yes | `/schedule` |
| Scores | guest+ | yes | yes | `/scores` |
| Leaderboard | guest+ | yes | yes | `/leaderboard` |
| Move to Stage | admin+ | yes | yes | `/move-players` |

There are no nested dropdown submenus in v1. **Tournament picker** and **stage tabs** are in-page navigation steps after choosing a top-level menu item.

### Menu visibility by role

| Menu | guest | scorer | admin | superadmin |
|------|:-----:|:------:|:-----:|:----------:|
| Home | ✓ | ✓ | ✓ | ✓ |
| Tournaments | — | — | — | ✓ |
| Registration | ✓ | ✓ | ✓ | ✓ |
| Stages | ✓ | ✓ | ✓ | ✓ |
| Fixtures | — | — | ✓ | ✓ |
| Schedule | ✓ | ✓ | ✓ | ✓ |
| Scores | ✓ | ✓ | ✓ | ✓ |
| Leaderboard | ✓ | ✓ | ✓ | ✓ |
| Move to Stage | — | — | ✓ | ✓ |

---

## URL patterns

| Pattern | Purpose |
|---------|---------|
| `/login` | Login |
| `/` | Home |
| `/tournaments` | Tournament list / CRUD (superadmin) |
| `/tournaments/new` | Create tournament form |
| `/tournaments/:slug/edit` | Edit tournament form |
| `/registration` | Pick tournament → Registration |
| `/tournaments/:slug/registration` | Registration screen |
| `/stages` | Pick tournament → Stages |
| `/tournaments/:slug/stages` | Stages list / CRUD |
| `/tournaments/:slug/stages/new` | Create stage form |
| `/tournaments/:slug/stages/:stage/edit` | Edit stage form |
| `/fixtures` | Pick tournament → Fixtures |
| `/tournaments/:slug/fixtures` | Fixtures (first stage tab selected) |
| `/tournaments/:slug/fixtures/:stage` | Fixtures for stage |
| `/schedule` | Pick tournament → Schedule |
| `/tournaments/:slug/schedule` | Schedule (first stage tab) |
| `/tournaments/:slug/schedule/:stage` | Schedule for stage |
| `/scores` | Pick tournament → Scores |
| `/tournaments/:slug/scores` | Scores (first stage tab) |
| `/tournaments/:slug/scores/:stage` | Scores for stage |
| `/leaderboard` | Pick tournament → Leaderboard |
| `/tournaments/:slug/leaderboard` | Leaderboard (first stage tab) |
| `/tournaments/:slug/leaderboard/:stage` | Leaderboard for stage |
| `/move-players` | Pick tournament → Move to Stage |
| `/tournaments/:slug/move-players` | Move players (first stage tab) |
| `/tournaments/:slug/move-players/:stage` | Move players for source stage |

`:slug` and `:stage` are URL path segments (e.g. `summer-open-2026`, `league`).

**Stage tabs:** When a tournament has stages, tabs link to the same screen with a different `:stage` segment. If no stages exist, show message: “Create stages first” with link to `/tournaments/:slug/stages`.

**Default stage:** `/tournaments/:slug/<screen>` redirects or selects the first stage returned by `GET /api/tournaments/:slug/stages` (ordered by creation or name).

---

## Screen catalog

| # | Screen | Browser URL | Min role |
|---|--------|-------------|----------|
| 1 | Login | `/login` | public |
| 2 | Home | `/` | guest+ |
| 3 | Tournament list | `/tournaments` | superadmin |
| 4 | Create tournament | `/tournaments/new` | superadmin |
| 5 | Edit tournament | `/tournaments/:slug/edit` | superadmin |
| 6 | Tournament picker | `/registration`, `/stages`, `/fixtures`, … | varies |
| 7 | Registration | `/tournaments/:slug/registration` | guest+ |
| 8 | Stages list | `/tournaments/:slug/stages` | guest+ |
| 9 | Create stage | `/tournaments/:slug/stages/new` | admin+ |
| 10 | Edit stage | `/tournaments/:slug/stages/:stage/edit` | admin+ |
| 11 | Fixtures | `/tournaments/:slug/fixtures/:stage` | admin+ |
| 12 | Schedule | `/tournaments/:slug/schedule/:stage` | guest+ (admin+ creates) |
| 13 | Scores | `/tournaments/:slug/scores/:stage` | guest+ |
| 14 | Score edit popup | (modal on Scores screen) | scorer+ |
| 15 | Leaderboard | `/tournaments/:slug/leaderboard/:stage` | guest+ |
| 16 | Move to Stage | `/tournaments/:slug/move-players/:stage` | admin+ |

---

## Screen specifications

### 1. Login

**URL:** `/login`

**Purpose:** Authenticate with username and password.

**Layout:**

| Element | Type | Notes |
|---------|------|-------|
| Username | text input | Required |
| Password | password input | Required |
| Login | button | Submit |

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Submit | POST | `/api/auth/login` |
| Already logged in (optional check on mount) | GET | `/api/auth/me` |

**On success:** Redirect to `/` (or previous intended URL).

**Errors:** Banner at top for `401`; field hints for `400`.

---

### 2. Home

**URL:** `/`

**Purpose:** Landing page after login; shortcuts to main modules.

**Layout:**

| Element | Notes |
|---------|-------|
| Welcome | “Logged in as {username} ({role})” |
| Quick links | Cards or list mirroring nav items visible to current role |

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount | GET | `/api/auth/me` |

---

### 3. Tournament list (CRUD table)

**URL:** `/tournaments`  
**Role:** superadmin

**Purpose:** List, create, edit, and delete tournaments ([prd.md](prd.md)).

**Layout:**

| Element | Notes |
|---------|-------|
| Page title | “Tournaments” |
| Create Tournament | button → navigates to `/tournaments/new` |
| Data table | Standard CRUD table (see below) |

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount | GET | `/api/tournaments` |
| Delete row (after confirm) | DELETE | `/api/tournaments/:slug` |
| Refresh | GET | `/api/tournaments` |

**Row actions:** Edit → `/tournaments/:slug/edit`; Delete → confirm dialog then DELETE.

---

### 4. Create tournament

**URL:** `/tournaments/new`  
**Role:** superadmin

**Layout:**

| Field | Type | Required |
|-------|------|----------|
| Name | text | yes |
| Slug | text | yes |
| Description | textarea | no |
| Status | select (`open` / `closed`) | yes, default `open` |
| Save | button | |
| Cancel | button | → `/tournaments` |

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Save | POST | `/api/tournaments` |

**On success:** Navigate to `/tournaments`.

---

### 5. Edit tournament

**URL:** `/tournaments/:slug/edit`  
**Role:** superadmin

Same fields as Create. Slug is read-only (display only).

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount | GET | `/api/tournaments/:slug` |
| Save | PUT | `/api/tournaments/:slug` |

**On success:** Navigate to `/tournaments`.

---

### Tournament CRUD table (screens 3–5)

Standard table for tournaments:

| Column | Source field | Notes |
|--------|--------------|-------|
| Name | `name` | |
| Slug | `slug` | |
| Description | `description` | Truncate long text |
| Status | `status` | Badge: open / closed |
| Actions | — | **Edit** · **Delete** |

Delete uses browser confirm: “Delete tournament {name}? This cannot be undone.”

---

### 6. Tournament picker

**URLs:** `/registration`, `/stages`, `/fixtures`, `/schedule`, `/scores`, `/leaderboard`, `/move-players`  
**Role:** per parent menu

**Purpose:** PRD step — choose tournament before module screen.

**Layout:**

| Element | Notes |
|---------|-------|
| Page title | e.g. “Registration — Select tournament” |
| Tournament table | Clickable rows or **Open** action |

| Column | Source |
|--------|--------|
| Name | `name` |
| Slug | `slug` |
| Status | `status` |
| Action | **Open** |

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount | GET | `/api/tournaments` |

**On row select:** Navigate to module URL, e.g. `/tournaments/summer-open-2026/registration`.

---

### 7. Registration

**URL:** `/tournaments/:slug/registration`  
**Role:** guest+ (admin+ can edit; others read-only)

**Layout:**

| Element | Role | Notes |
|---------|------|-------|
| Tournament name | all | Header |
| Player rows | admin+ | 30 text inputs for player names |
| Player list | guest, scorer | Read-only table of names |
| Save | admin+ | Persist list |
| Cancel | admin+ | Reload from server (discard local edits) |

Read-only table columns: `#`, `Player name` (from `sort_order` + 1).

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount / Cancel | GET | `/api/tournaments/:slug/registration` |
| Save | PUT | `/api/tournaments/:slug/registration` |

**Request body (Save):** `{ "players": ["Alice", "Bob", ...] }` — up to 30 entries; empty strings skipped.

---

### 8. Stages list (CRUD table)

**URL:** `/tournaments/:slug/stages`  
**Role:** guest+ (admin+ can create/edit/delete; others read-only table)

**Layout:**

| Element | Role | Notes |
|---------|------|-------|
| Tournament name | all | Header |
| Create Stage | admin+ | → `/tournaments/:slug/stages/new` |
| Data table | all | Standard CRUD table (see below) |

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount | GET | `/api/tournaments/:slug/stages` |
| Delete (admin+, after confirm) | DELETE | `/api/tournaments/:slug/stages/:stage` |

**Row actions (admin+):** View details (read-only modal or expand row), **Edit**, **Delete**.  
**Guest/scorer:** Table is read-only; no Create or Actions.

---

### 9. Create stage

**URL:** `/tournaments/:slug/stages/new`  
**Role:** admin+

| Field | Type | Required |
|-------|------|----------|
| Name | text | yes |
| Slug | text | yes |
| Description | textarea | no |
| Stage type | dropdown | yes |
| Is completed | checkbox | no, default false |
| Save | button | |
| Cancel | button | → stages list |

**Stage type** options (maps to `stage_type` in API): League (`league`), Super League (`superleague`), Playoff (`playoff`). Set explicitly — not inferred from slug. See [ChangeRequest1.md](ChangeRequest1.md) for how each type affects fixtures and scheduling.

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Save | POST | `/api/tournaments/:slug/stages` |

---

### 10. Edit stage

**URL:** `/tournaments/:slug/stages/:stage/edit`  
**Role:** admin+

Same fields as Create. Slug read-only.

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount | GET | `/api/tournaments/:slug/stages/:stage` |
| Save | PUT | `/api/tournaments/:slug/stages/:stage` |

---

### Stage CRUD table (screens 8–10)

| Column | Source field | Notes |
|--------|--------------|-------|
| Name | `name` | |
| Slug | `slug` | |
| Stage type | `stage_type` | League / Super League / Playoff |
| Description | `description` | |
| Completed | `is_completed` | Yes / No |
| Actions | — | **Edit** · **Delete** (admin+ only) |

Delete confirm: “Delete stage {name}? All fixtures and scores for this stage will be removed.”

---

### 11. Fixtures

**URL:** `/tournaments/:slug/fixtures/:stage`  
**Role:** admin+

**Layout:**

| Element | Notes |
|---------|-------|
| Tournament name | Header |
| Stage tabs | One tab per stage; active tab = `:stage` |
| Players | Read-only list (`player_name`) |
| Approx total matches | number input; **shown only when `stage_type === 'league'`** |
| Create Fixtures | button |
| Existing groups | Read-only (if `has_fixtures`) |
| Existing matches | Read-only table: slno, player1, player2 |

**Fixture rules by `stage_type`** (see [ChangeRequest1.md](ChangeRequest1.md)):

| `stage_type` | UI inputs | Player requirements |
|--------------|-----------|---------------------|
| `league` | Approx total matches | ≥ 2; shuffled internally on generate |
| `superleague` | None (no approx field) | Exactly 8 in rank order |
| `playoff` | None (no approx field) | 4 (SF) or 2 (Final) in rank order |

**Create Fixtures confirm (if `has_fixtures`):**  
“This action is dangerous and will remove all existing fixtures and scores for this stage. Continue?”

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount / tab change | GET | `/api/tournaments/:slug/stages` (tabs) |
| Mount / tab change | GET | `/api/tournaments/:slug/stages/:stage/fixtures` |
| Create Fixtures | POST | `/api/tournaments/:slug/stages/:stage/fixtures` |

**POST body:** `{ "approx_total_matches": 70 }` for league; `{}` for superleague / playoff.

**On success:** Refresh fixtures GET; show summary (`total_matches`, `matches_per_player`).

---

### 12. Schedule

**URL:** `/tournaments/:slug/schedule/:stage`  
**Role:** guest+ (view); admin+ (create / re-run schedule)

**Layout:**

| Element | Role | Notes |
|---------|------|-------|
| Stage tabs | guest+ | Same pattern as Fixtures |
| Matches table (unscheduled) | guest+ | See **View modes** below |
| Schedule grid (scheduled) | guest+ | See **View modes** below |
| Hour slots | admin+ | number input; **league only** |
| Tables | admin+ | number input; **league only** |
| Max matches per table/slot | admin+ | number input; **league only** |
| Schedule | admin+ | button; **league only** |

If no fixtures (`409` or `has_fixtures: false`): show “Create fixtures first”. **admin+** also see a link to the fixtures screen; **guest+** see the message only (no link).

**View modes** (per [prd.md](prd.md)):

The UI picks the layout from `matches` returned by `GET .../schedule`. If **no** match has a non-null `hour_slot` or `tbl`, use the **unscheduled** table. If **any** match has a non-null `hour_slot` or `tbl`, use the **scheduled** grid.

1. **Unscheduled** — flat table with columns: `slno`, `player1`, `player2`, `hour_slot`, `tbl`. The last two columns are empty until scheduling runs.
2. **Scheduled** — grid grouped by hour slot and table:
   - Column 1: `hour_slot` (row-span = number of match rows in that slot).
   - Columns 2…N: “Matches in Table 1”, “Matches in Table 2”, … (one column per table in use).
   - Each cell shows `slno, player1, player2`.

**`stage_type` behaviour (admin+ only for controls):**

- **`league`** — show scheduling inputs and Schedule button; POST calls external schedule service via API.
- **`superleague` / `playoff`** — hide scheduling inputs and Schedule button; show read-only message that automated scheduling is available for league stages only (per [prd.md](prd.md)). Knockout fixtures are few — see [ChangeRequest1.md](ChangeRequest1.md). Admin may set `tbl` / `hour_slot` via hand-edit when needed. **guest+** still see the matches table or grid when fixtures exist.

**Schedule confirm (admin+; if matches already have `hour_slot`/`tbl`):**  
“This action overwrites the earlier schedule. Continue?”

**API calls:**

| When | Method | URL | Role |
|------|--------|-----|------|
| Mount / tab change | GET | `/api/tournaments/:slug/stages` | guest+ |
| Mount / tab change | GET | `/api/tournaments/:slug/stages/:stage/schedule` | guest+ |
| Schedule | POST | `/api/tournaments/:slug/stages/:stage/schedule` | admin+ (league only) |

**POST body (league):** `{ "numSlots": 7, "numTables": 2, "maxMatchesPerSlot": 6 }`

---

### 13. Scores

**URL:** `/tournaments/:slug/scores/:stage`  
**Role:** guest+ (scorer+ edits; guest read-only)

**Layout:**

| Element | Role | Notes |
|---------|------|-------|
| Stage tabs | all | |
| Filters | all | Dropdowns: Player, Hour slot, Table; empty option = “—select—” |
| Refresh | all | Icon button reloads table |
| Matches table | all | Sort: hour_slot, then table (server order) |

**Matches table columns:**

| Column | Editable (scorer+) | Notes |
|--------|-------------------|-------|
| Slno | — | |
| Player 1 | — | |
| Player 2 | — | |
| Game 1 … Game 5 | yes* | `n1-n2` format; validation on blur/submit |
| Walkover win | yes* | Dropdown: empty, player1 name, player2 name |
| Match Over | scorer+ | Button; see **Match Over rules** below |

\*Read-only for guest. Read-only for scorer when `is_completed` (admin+ can still edit).

**Match Over rules** (per [prd.md](prd.md); UI-only enablement — backend may accept broader input):

- Disabled when `is_completed`.
- Disabled when `walkover_win` is empty **and** Game 1 and Game 2 do not both hold valid `n1-n2` scores.
- Disabled when `walkover_win` is empty and each player has won the same number of games (player1 wins a game when `n1 > n2`; player2 wins when `n2 > n1`; counts all non-empty valid game scores).
- Enabled when `walkover_win` is set (non-empty player name).
- Enabled when `walkover_win` is empty, Game 1 and Game 2 each contain a valid score string (validated the same way as inline edits), and one player has won more games than the other. Game 3–Game 5 alone are not sufficient without valid Game 1 and Game 2.

**Row click:** Opens score edit popup (screen 14).

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount / tab change | GET | `/api/tournaments/:slug/stages` |
| Mount / refresh / filter change | GET | `/api/tournaments/:slug/stages/:stage/matches?player=&hour_slot=&tbl=` |
| Inline field change (scorer+) | PATCH | `/api/tournaments/:slug/stages/:stage/matches/:slno` |
| Match Over | POST | `/api/tournaments/:slug/stages/:stage/matches/:slno/complete` |

Filter query params omitted when “—select—” is chosen.

---

### 14. Score edit popup (modal)

**Parent:** Scores screen  
**Role:** scorer+ (guest: view-only modal or disabled fields)

**Layout:**

| Element | Notes |
|---------|-------|
| Header | Match slno, hour slot, table number |
| Score grid | Column headers: label · `{player1}` vs `{player2}` |
| Rows | Game 1 … Game 5 with score inputs |
| Walkover | Dropdown (same rules as table) |
| Match Over | button; same enable/disable rules as table |
| Close | button |

**API calls:** Same PATCH / POST complete as inline table; one match at a time.

---

### 15. Leaderboard

**URL:** `/tournaments/:slug/leaderboard/:stage`  
**Role:** guest+

**Layout:**

| Element | Notes |
|---------|-------|
| Stage tabs | |
| Refresh | button |
| Leaderboard table | Read-only |

**Leaderboard columns:**

| Column | Source |
|--------|--------|
| Rank | `rank` |
| Player | `player_name` |
| Wins | `wins` |
| NRR | `nrr` |
| Set W/L ratio | `swlr` |
| Points W/L ratio | `pwlr` |

**Auto-refresh:** Every 5 minutes (`setInterval` → GET leaderboard).

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount / tab change | GET | `/api/tournaments/:slug/stages` |
| Mount / refresh / auto-refresh | GET | `/api/tournaments/:slug/stages/:stage/leaderboard` |

---

### 16. Move to Stage

**URL:** `/tournaments/:slug/move-players/:stage`  
**Role:** admin+

**Layout:**

| Element | Notes |
|---------|-------|
| Stage tabs | Source stage = `:stage` |
| Leaderboard table | Same columns as Leaderboard + checkbox in first column |
| Target stage | dropdown — all stages except current; required |
| Move to Stage | button |

**Confirm:** “Move {n} player(s) to {target_stage}? This replaces the player list for that stage.”

**API calls:**

| When | Method | URL |
|------|--------|-----|
| Mount / tab change | GET | `/api/tournaments/:slug/stages` (tabs + target dropdown) |
| Mount / tab change | GET | `/api/tournaments/:slug/stages/:stage/leaderboard` |
| Move to Stage | POST | `/api/tournaments/:slug/stages/:stage/move-players` |

**POST body:** `{ "target_stage": "qf", "players": ["Alice", "Bob"] }`

**On success:** Success banner; optional refresh of leaderboard.

---

## Stage tabs (shared component)

Used on screens 11–16.

```text
[ League ] [ QF ] [ SF ] [ F ]
─────────────────────────────────
  … screen content …
```

| Behavior | Detail |
|----------|--------|
| Data source | `GET /api/tournaments/:slug/stages` |
| Active tab | Matches URL `:stage` segment |
| Click tab | Navigate to same module with new `:stage` |
| No stages | Message + link to `/tournaments/:slug/stages` |

---

## API usage matrix

Summary of APIs each screen invokes (excluding shared auth).

| Screen | Load (GET) | Actions (POST / PUT / PATCH / DELETE) |
|--------|------------|--------------------------------------|
| Login | `/api/auth/me` (optional) | `POST /api/auth/login` |
| Home | `/api/auth/me` | — |
| Tournament list | `/api/tournaments` | `DELETE /api/tournaments/:slug` |
| Create tournament | — | `POST /api/tournaments` |
| Edit tournament | `/api/tournaments/:slug` | `PUT /api/tournaments/:slug` |
| Tournament picker | `/api/tournaments` | — |
| Registration | `/api/tournaments/:slug/registration` | `PUT /api/tournaments/:slug/registration` |
| Stages list | `/api/tournaments/:slug/stages` | `DELETE /api/tournaments/:slug/stages/:stage` |
| Create stage | — | `POST /api/tournaments/:slug/stages` |
| Edit stage | `/api/tournaments/:slug/stages/:stage` | `PUT /api/tournaments/:slug/stages/:stage` |
| Fixtures | `/api/tournaments/:slug/stages`, `.../fixtures` | `POST .../fixtures` |
| Schedule | `/api/tournaments/:slug/stages`, `.../schedule` (guest+) | `POST .../schedule` (admin+) |
| Scores | `/api/tournaments/:slug/stages`, `.../matches?...` | `PATCH .../matches/:slno`, `POST .../complete` |
| Leaderboard | `/api/tournaments/:slug/stages`, `.../leaderboard` | — |
| Move to Stage | `/api/tournaments/:slug/stages`, `.../leaderboard` | `POST .../move-players` |

---

## Error and validation UX

| Source | Display |
|--------|---------|
| API `error` (no fields) | Top error banner |
| API `fields` | Inline next to matching inputs |
| `401` | Redirect to `/login` |
| `403` | Banner: “You do not have permission” |
| `409` / `502` | Banner with server message |
| Destructive actions | Native or in-app confirm dialog before API call |

---

## Responsive notes

| Screen | Mobile / tablet |
|--------|-----------------|
| CRUD tables | Horizontal scroll |
| Scores table | Horizontal scroll; prefer row popup for editing |
| Stage tabs | Scrollable tab bar |
| Registration | 30 rows vertical stack |
| Filters (Scores) | Stack dropdowns vertically on narrow viewports |

---

## Document map

| Document | Contents |
|----------|----------|
| [prd.md](prd.md) | Product behavior |
| [DESIGN.md](DESIGN.md) | Repo layout, DB schema |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System structure, deployment |
| [API.md](API.md) | Request/response specs |
| **UI.md** (this file) | Menus, routes, screens, API per screen |
