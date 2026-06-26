#!/usr/bin/env python3

from typing import Any
from itertools import combinations
from collections import defaultdict
from tabulate import tabulate

# type: ignore[reportAttributeAccessIssue]
from ortools.sat.python import cp_model as _cp_model
import sys

cp_model: Any = _cp_model

fmt = "html"

dummy = ""
# Create a clean, modern HTML template with embedded CSS
html_document = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formatted Data Table</title>
    <style>
    body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background-color: #f0f2f5;
            padding: 40px 20px;
            margin: 0;
            /* CRITICAL FIX 1: Remove display:flex from body entirely to allow page-breaks */
            display: block; 
        }}
        
        .table-wrapper {{
            /* CRITICAL FIX 2: Center your table container blocks using block margins instead of flexbox alignment */
            margin: 0 auto 35px auto; 
            width: 100%;
            max-width: 900px;
        }}
        
        .table-container {{
            background: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-radius: 8px;
            overflow: hidden; 
            border: 2px solid #1f2937;
            /* Ensures individual long rows do not get sliced awkwardly across page folds */
            page-break-inside: avoid; 
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }}

        th {{
            background-color: #1f2937; 
            color: #ffffff;
            font-weight: 700;
            padding: 16px 20px;
            font-size: 0.95rem;
            /* text-transform: uppercase; */
            letter-spacing: 0.05em;
            border-bottom: 3px solid #111827;
        }}

        td {{
            padding: 16px 20px;
            border-bottom: 1px solid #b3b3b3; 
            color: #1a1a1a;
            font-size: 0.95rem;
        }}

        tbody tr:nth-child(even) {{
            background-color: #f2f5f8 !important;
        }}
        
        tbody tr:nth-child(odd) {{
            background-color: #ffffff !important;
        }}

        /* CRITICAL FIX 3: Clean, explicit block declaration for your break element */
        .page-break {{
            display: block;
            clear: both;
            page-break-before: always !important;
        }}
    </style>
</head>
<body>
    {dummy}
"""


def schedule(data, fmt="json"):
    print("Schedule", data)
    ##
    # ----------------------------------------------------------
    # Configuration
    # ----------------------------------------------------------

    NUM_SLOTS = data["numSlots"]
    NUM_TABLES = data["numTables"]

    MAX_MATCHES_PER_SLOT = data["maxMatchesPerSlot"]

    # Slots 0..3 => 10 matches
    # Slots 4..7 => 8 matches
    #
    # Total:
    #
    # 4 * 10 + 4 * 8
    # = 72

    GROUP_MATCH_TARGET = [5, 5, 5, 5, 4, 4, 4, 4]

    # ----------------------------------------------------------
    # Players
    # ----------------------------------------------------------

    A_PLAYERS = [f"A{i}" for i in range(1, 10)]
    B_PLAYERS = [f"B{i}" for i in range(1, 10)]

    ALL_PLAYERS = A_PLAYERS + B_PLAYERS
    if "totalPlayers" in data:
        ALL_PLAYERS = data["totalPlayers"]

    # ----------------------------------------------------------
    # Matches
    # ----------------------------------------------------------

    matches = []

    if "matches" in data:
        matches = []
        for m in data["matches"]:
            matches.append({"players": (m["player1"], m["player2"]), "group": ""})
    else:
        ##
        for p1, p2 in combinations(A_PLAYERS, 2):
            matches.append(
                {
                    "players": (p1, p2),
                    "group": "A",
                }
            )

        for p1, p2 in combinations(B_PLAYERS, 2):
            matches.append(
                {
                    "players": (p1, p2),
                    "group": "B",
                }
            )

        assert len(matches) == 72

    # ----------------------------------------------------------
    # Model
    # ----------------------------------------------------------

    model = cp_model.CpModel()

    # x[m,s,t]
    #
    # match m scheduled
    # in slot s
    # on table t

    x = {}

    for m in range(len(matches)):
        for s in range(NUM_SLOTS):
            for t in range(NUM_TABLES):
                x[m, s, t] = model.NewBoolVar(f"x_m{m}_s{s}_t{t}")

    # ----------------------------------------------------------
    # Constraint 1
    # Every match exactly once
    # ----------------------------------------------------------

    for m in range(len(matches)):
        model.Add(
            sum(x[m, s, t] for s in range(NUM_SLOTS) for t in range(NUM_TABLES)) == 1
        )

    # ----------------------------------------------------------
    # Constraint 2
    # Table capacity
    # ----------------------------------------------------------

    for s in range(NUM_SLOTS):
        for t in range(NUM_TABLES):
            model.Add(
                sum(x[m, s, t] for m in range(len(matches))) <= MAX_MATCHES_PER_SLOT
            )

    # ----------------------------------------------------------
    # Constraint 3
    # Equal A/B distribution
    # ----------------------------------------------------------

    for s in range(NUM_SLOTS):
        a_matches = []
        b_matches = []
        # Disable this constraint
        if len(a_matches) == 0:
            break

        for m, match in enumerate(matches):
            expr = sum(x[m, s, t] for t in range(NUM_TABLES))

            if match["group"] == "A":
                a_matches.append(expr)
            else:
                b_matches.append(expr)

        model.Add(sum(a_matches) == GROUP_MATCH_TARGET[s])
        model.Add(sum(b_matches) == GROUP_MATCH_TARGET[s])

    # ----------------------------------------------------------
    # Constraint 4
    # Player appearances per slot <= 2
    # ----------------------------------------------------------

    player_slot_count = {}

    for player in ALL_PLAYERS:
        for s in range(NUM_SLOTS):
            vars_ = []

            for m, match in enumerate(matches):
                if player in match["players"]:
                    vars_.append(sum(x[m, s, t] for t in range(NUM_TABLES)))

            v = model.NewIntVar(
                0,
                2,
                f"cnt_{player}_{s}",
            )

            model.Add(v == sum(vars_))

            player_slot_count[player, s] = v

            model.Add(v <= 2)

    # ----------------------------------------------------------
    # Table counts per player
    # ----------------------------------------------------------

    table_count = {}

    for player in ALL_PLAYERS:
        for t in range(NUM_TABLES):
            vars_ = []

            for m, match in enumerate(matches):
                if player in match["players"]:
                    for s in range(NUM_SLOTS):
                        vars_.append(x[m, s, t])

            v = model.NewIntVar(
                0,
                8,
                f"table_{player}_{t}",
            )
            table_count[player, t] = v

            ## DISABLE this constraint
            if len(vars_) == 0:
                continue

            model.Add(v == sum(vars_))

    # ----------------------------------------------------------
    # Soft objective:
    # target 4 matches/table
    # ----------------------------------------------------------

    objective_terms = []

    for player in ALL_PLAYERS:
        for t in range(NUM_TABLES):
            dev = model.NewIntVar(
                0,
                8,
                f"dev_{player}_{t}",
            )

            model.AddAbsEquality(
                dev,
                table_count[player, t] - 4,
            )

            objective_terms.append(dev * 1000)

    # ----------------------------------------------------------
    # Soft objective:
    # avoid consecutive slots
    # ----------------------------------------------------------

    for player in ALL_PLAYERS:
        for s in range(NUM_SLOTS - 1):
            b = model.NewBoolVar(f"back2back_{player}_{s}")

            c1 = model.NewBoolVar(f"play_{player}_{s}")

            c2 = model.NewBoolVar(f"play_{player}_{s + 1}")

            model.Add(player_slot_count[player, s] >= 1).OnlyEnforceIf(c1)

            model.Add(player_slot_count[player, s] == 0).OnlyEnforceIf(c1.Not())

            model.Add(player_slot_count[player, s + 1] >= 1).OnlyEnforceIf(c2)

            model.Add(player_slot_count[player, s + 1] == 0).OnlyEnforceIf(c2.Not())

            model.AddBoolAnd([c1, c2]).OnlyEnforceIf(b)

            objective_terms.append(b * 10)

    # ----------------------------------------------------------
    # Soft objective:
    # avoid double matches in same slot
    # ----------------------------------------------------------

    for player in ALL_PLAYERS:
        for s in range(NUM_SLOTS):
            double_match = model.NewBoolVar(f"double_{player}_{s}")

            model.Add(player_slot_count[player, s] == 2).OnlyEnforceIf(double_match)

            model.Add(player_slot_count[player, s] <= 1).OnlyEnforceIf(
                double_match.Not()
            )

            objective_terms.append(double_match)

    # ----------------------------------------------------------
    # Objective
    # ----------------------------------------------------------

    model.Minimize(sum(objective_terms))

    # ----------------------------------------------------------
    # Solve
    # ----------------------------------------------------------

    solver = cp_model.CpSolver()

    solver.parameters.max_time_in_seconds = 300
    solver.parameters.num_search_workers = 8

    status = solver.Solve(model)

    if status not in (
        cp_model.OPTIMAL,
        cp_model.FEASIBLE,
    ):
        if fmt == "json":
            return {"status": "error", "error": "No solution found"}
        print("No solution found")
        raise SystemExit(1)

    # print()
    # print("Objective =", solver.ObjectiveValue())
    # print()

    # ----------------------------------------------------------
    # Produce schedule
    # ----------------------------------------------------------

    schedule = defaultdict(list)

    for m, match in enumerate(matches):
        for s in range(NUM_SLOTS):
            for t in range(NUM_TABLES):
                # print(f"Match {m} Slot {s} Table {t} Value --> {solver.Value(x[m, s, t])}")
                if solver.Value(x[m, s, t]):
                    schedule[s].append(
                        (
                            t,
                            match["players"][0],
                            match["players"][1],
                            match["group"],
                        )
                    )

    if fmt == "json":
        response = {"status": "ok"}
        response["player_distribution_by_hour"] = {}  # type: ignore
        for player in ALL_PLAYERS:
            row = []
            for s in range(NUM_SLOTS):
                v = solver.Value(player_slot_count[player, s])
                row.append(v)
            response["player_distribution_by_hour"][player] = row
        response["player_distribution_by_table"] = {}  # type: ignore
        for player in ALL_PLAYERS:
            row = []
            for t in range(NUM_TABLES):
                v = solver.Value(table_count[player, t])
                row.append(v)
            response["player_distribution_by_table"][player] = row

        matches = []
        for s in range(NUM_SLOTS):
            for table in range(NUM_TABLES):
                for t, p1, p2, grp in sorted(schedule[s]):
                    if t == table:
                        matches.append(
                            {
                                "player1": p1,
                                "player2": p2,
                                "hour_slot": s + 1,
                                "tbl": t + 1,
                            }
                        )
        response["matches"] = matches  # type: ignore

        return response

    if fmt == "html":
        print(html_document)

    if fmt == "html":
        print("<h2>Player Matches Distribution by hour</h2>")
    else:
        print(f"\n{'Player Matches Distribution by hour':-^80}")
    ptable = []
    header = ["Player"]
    for s in range(NUM_SLOTS):
        header.append(f"Hr {s + 1}")
    for player in ALL_PLAYERS:
        row = [player]
        for s in range(NUM_SLOTS):
            v = solver.Value(player_slot_count[player, s])
            row.append(v)
        ptable.append(row)
    if fmt == "html":
        print(f"""
            <div class="table-wrapper">
            <div class="table-container">
              {tabulate(ptable, headers=header, tablefmt="html")}
            </div>
            </div>
            <div class="page-break"></div>
            """)
    else:
        print(tabulate(ptable, headers=header, tablefmt="pipe"))

    if fmt == "html":
        print("<h2>Player Table Distribution</h2>")
    else:
        print(f"\n{'Player Table Distribution':-^80}")
    ptable = []
    header = ["Player"]
    for t in range(NUM_TABLES):
        header.append(f"Table {t + 1}")
    for player in ALL_PLAYERS:
        row = [player]
        for t in range(NUM_TABLES):
            v = solver.Value(table_count[player, t])
            row.append(v)
        ptable.append(row)

    if fmt == "html":
        print(f"""
            <div class="table-wrapper">
            <div class="table-container">
              {tabulate(ptable, headers=header, tablefmt="html")}
            </div>
            </div>
            <div class="page-break"></div>
            """)
    else:
        print(tabulate(ptable, headers=header, tablefmt="pipe"))

    if fmt == "html":
        print("<h2>Matches</h2>")
    else:
        print(f"\n{'Matches':-^80}")
    ptable = []
    header = ["Hour Slot"]
    for t in range(NUM_TABLES):
        header.append(f"Table {t + 1}")

    for s in range(NUM_SLOTS):
        row = [f"Hour {s + 1}"]
        for table in range(NUM_TABLES):
            idx = 1
            txt = ""
            if fmt != "html":
                txt = "Matches\n"

            for t, p1, p2, grp in sorted(schedule[s]):
                if t == table:
                    txt += f"{idx:2d}. {p1} vs {p2} ({grp})"
                    if fmt == "html":
                        txt += "\n<br>"
                    else:
                        txt += "\n"
                    idx += 1
            row.append(txt)
        ptable.append(row)
    htm = tabulate(ptable, headers=header, tablefmt="html")
    htm = htm.replace("&lt;br&gt;", "<br>")
    if fmt == "html":
        print(f"""
            <div class="table-wrapper">
            <div class="table-container">
              {htm}
            </div>
            </div>
            """)
    else:
        print(tabulate(ptable, headers=header, tablefmt="grid"))

    sys.exit(0)

    for s in range(NUM_SLOTS):
        print()
        print("=" * 60)
        print(f"H.Slot {s + 1}")
        print("=" * 60)

        for table in range(NUM_TABLES):
            print()
            print(f"Table {table + 1}")

            idx = 1

            for t, p1, p2, grp in sorted(schedule[s]):
                if t == table:
                    print(f"{idx:2d}. {p1} vs {p2} ({grp})")

                    idx += 1
