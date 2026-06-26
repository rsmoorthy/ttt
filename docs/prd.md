This is the Product Requirements of Table Tennis (TT) Tournament management.

## Overview

The app will provide the following functionalities:

* Registration of players
* Support multiple stages (league, knock out stages)
* Fixtures and Scheduling of matches
* Record scoring of matches
* Move selected players to the next stage
* Leader board showing current status of players ranks at each stage
* Allow heavy admin actions to fine-tune / hand-edit to tackle real world issues

## Technical

* Code to be written in javascript (node js and browser)
* Will use sqlite3 database
* App should be accessible over mobile, tab and laptop browsers.
* SPA is preferred
* Errors should be prominently displayed. Errors from the backend is shown at the top / via popup.
  Validation errors on fields should be shown right around that field.

## Functional Modules

### Authentication and Roles

* Supported roles: superadmin, admin, scorer, guest
* Authentication: Using username, password. Password stored in DB hashed
* Ability to create users / passwords by directly inserting into DB. No UI screens needed
* superadmin role can: 
    * create tournaments 
    * and everything done by admin
  admin role can:
    * create different stages (like league, QF, SF, F)
    * register players by UI
    * upload players list by CSV (future)
    * creating fixtures
    * scheduling matches
    * move players to the next stage
    * and everything done by scorer
  scorer role can:
    * record scores for all matches
    * and everything done by guest
  guest role can:
    * view list of players
    * view list of matches
    * see scores for matches
    * see leader board for each stage

* At the moment, each user will be tied to one role only
* In the future, each user can be tied multiple roles (one-to-many), while each user-role
  combo can be tied to multiple tournaments

### Creating Tournament

* superadmin should get a screen for creating, listing, editing, deleting tournaments
* A tournament has following properties:
  - name
  - slug
  - description
  - status: open or closed

The rest of subsections comes under a specific tournament. For ex, if the user wants to register
players and clicks a Registration Menu, the UI should show a list of tournaments and should take
to the registration page for that specific tournament selected.

### Registration

* This comes under a specific tournament. For ex, if the user clicks Registration menu, the UI should show a 
  list of tournaments and should take to the registration page for that specific tournament selected.
* Show a simple screen for Admin role that allows editing the list of players. The screen will
  show 30 rows of names of players. Save button will save the players list, Cancel will simply
  refresh the same screen
* For scorer and guest, the UI will show a read only list of players
* DB table: registration

### Create Stages

* This comes under a specific tournament. For ex, if the user clicks Stages menu, the UI should show a 
  list of tournaments and should take to the Stages page for that specific tournament selected.
* Admin role can create different stages of a tournament. The stages could be "League", "QF", "SF", "F"
  for example.
* User will be shown a list of stages already created (using a table). The table will have options to
  view details / edit / delete the stage. At the top of the table, a Create Stage button should allow
  to create a stage.
* Properties of a Stage:
  - name
  - slug
  - description
  - is_completed (boolean)


### Generate Fixtures

* This comes under a specific tournament and specific stage. For ex, if the user clicks Fixtures menu, the UI should show a 
  list of tournaments and after selecting a tournament, there should be tabs showing each stage (1 tab for 1 stage). The following
  should appear within that group.
* To create fixtures, the UI screen should show:
  - the list of players (read-only)
  - Approx total matches
  - A button with "Create Fixtures"
* When "Create Fixtures" button is clicked, the front-end will pass the info to backend. ~The backend~
  ~will call an external service (POST http://localhost:8383/fixtures) with the same data received.~

* The groups and matches (fixtures) information should be saved in the DB (table: fixtures)
* Important: The list of players will come from the registered players list (table: registration), by default
  - But if players have been "moved" (see below) to this stage, then the players will come from there (table: stages_players)
  - The order of the players in the registered list / moved list should be maintained strictly
* Note: As per Change Request 1 (see docs/ChangeRequest1.md), it is suggested to not use external service
for this and integrate the code from temp/fixtures.

* It is possible that Re-running "Create Fixtures" can be done. If that happens, remove all existing entries from the
  DB for that stage and add the new matches into the DB (table: fixtures). Provide a big fat warning that says "this
  action is dangerous and do you want to continue"

### Scheduling matches

* This comes under a specific tournament and specific stage. For ex, if the user clicks Schedule menu, the UI should show a 
  list of tournaments and after selecting a tournament, there should be tabs showing each stage (1 tab for 1 stage). The following
  should appear within that stage.

* After selecting a tournament / stage (that tab), if there are no matches (fixtures) created earlier, then it will shown an error and asking
  the user to Fixtures first.

* If the matches (fixtures) are already created, then the UI should ask (for admin+ roles):
  - list of matches created (read-only)
  - number of hour slots (numSlots)
  - number of tables (numTables)
  - max number of matches in a table / hour slot (maxMatchesPerSlot)
  - a button with "Schedule"
* When "Schedule" is clicked, the front-end will pass the info to backend. Only for stage_type is `league`, the backend will 
  call an external service (POST http://localhost:8383/schedule) with the data received and additional data needed. 

  The request json to the external service will be as follows:
  ```json
  {
    "numSlots": 7,
    "numTables": 2,
    "maxMatchesPerSlot": 6,
    "scheme": "<stage_slug>",
    "totalPlayers": [ "A1", "A2" ],
    "matches": [
      {  "player1": "A1", "player2": "A2", }
    ]
  }
  ```

* The external service response json will be as follows:
  ```json
  {
    "status": "ok|error",
    "error": "only if error",
    "matches": [
      {  "player1": "A1", "player2": "A2", "hour_slot" : 1, "tbl": 1}
    ]
  }
  ```

* The information received for each match should be saved in the DB (the `hour_slot` and `tbl`), against the tournament
  and stage. (table: fixtures)
* It is possible that Re-running "Schedule" can be done. If that happens, overwrite all existing values of hour_slot and tbl
  in the DB for that stage(table: fixtures). Provide a big fat warning that says "this action overwrites the earlier schedule and 
  do you want to continue"

* View: If the scheduling is not done yet, the view should simply display a table with the fixtures of matches (slno, player1, player2, hour_slot, tbl) with the last 2 columns being empty.
* View: If the scheduling has been done (tbl, hour_slot is non-empty even for one match), then the first column is the hour_slot - which has row-span=X where X is the number of matches in that hour_slot. The second column is the "Matches in Table 1" with multiple
rows for each match. The third column is "Matches in Table 2" (and so on). Second, third columns will have the text as "slno, player1, player2".
* View: The above view should be displayed for "guest+". Only "admin+" will be able to create Schedule.

### Scores

* This comes under a specific tournament and specific stage. For ex, if the user clicks Scores menu, the UI should show a 
  list of tournaments and after selecting a tournament, there should be tabs showing each stage (1 tab for 1 stage). The following
  should appear within that stage.

* This screen should be editable by scorer role (or above). Guest role can only view the contents
* At the top of the table, there should be filterable options for:
  - Player names (drop down). If specified, the following table will only contain if the player is present as "player1" or "player2"
  - Hour slot (drop down). If specified, the following table will only contain if the "hour_slot" matches this value
  - Table name (drop down). If specified, the following table will only contain if the "tbl" matches the value
  - The user should be able to specify multiple filters and it should be honoured
  - Each filter can also be reset, if the drop down value "-select-" (empty value) is chosen
* The following table should be sorted first by hour slot, then by table name
* A table with the list of matches will be shown.
  - The first 3 columns will indicate the slno and two players.
  - The next 5 columns should specify the scores of each game (Game 1, Game 2...). The scores mentioned will be
    in the format of 11-7 or 5-11 or 16-18. The scores are standard TT score - which is "first to 11 or win with a diff of 2"
  - Validation should be done to ensure it is in the form of "n1-n2" where n1 and n2 are integers usually between 0 to 11.
    There should be a difference of minimum 2 n1 and n2, if both n1 and n2 are less than or equal to 11.
    There should be a difference of exactly 2, if n1 and n2 are greater than 10.
    One of n1 or n2 should at least be 11 or greater.
  - Values should not be entered for 2nd game, if the first game info is not filled.
  - The last-but-one column will be a drop down with heading "walkover_win" containing value empty, player1 or player2. If this dropdown is 
    selected with non-empty value, the scores for Game1, Game2 etc cannot be edited. Similarly, if any of the scores for Game1, Game2, 
    etc are present, then this walkover_win dropdown cannot be selected and it should stay empty.
  - The last column should have a button "Match Over"
    - If already clicked, the scores / walkover_win dropdown will become read-only for the scorer role
    - For the scorer role, the backend also will not allow any score updates, if the "Match Over" has been clicked
    - Admin role should still be able to make changes to scores / walkover_win, even if Match over has been clicked
    - "Match over" cannot be clicked, if the scores are empty and walkover_win is empty.
    - "Match over" cannot be clicked, if walkover_win is empty and game1 and game2 are not updated with valid values.
    - "Match over" cannot be clicked, if each player has won equal number of games. A win means: player1 wins if n1 > n2 and 
      player2 wins if n2 > n1.

* Any valid information updated on the Table should be updated in real-time to the backend
* A refresh icon in the screen (top of the table) will refresh the contents from the backend
* In addition to this, one should be able to click on any of the row which will show a popup screen where the
  above information can be edited comfortably. The popup screen will have:
    - Match slno, hour slot, and table number at the top
    - A table containing 2 columns, where the header for 2nd column is "player1" vs "player2"
    - Each data row - first column contains "Game n" (where n is from 1 to 5), second column should be
      editable fields for scores in the format of "n1-n2" (as described above)
* The scores are stored against matches in the DB as "game1", "game2", "game3", "game4" and "game5". They can be empty or in the 
  format of "n1-n2"
* "walkover_win" is another field which can be empty or containing a player name

### Leaderboard

* This comes under a specific tournament and specific stage. For ex, if the user clicks Leaderboard menu, the UI should show a 
  list of tournaments and after selecting a tournament, there should be tabs showing each stage (1 tab for 1 stage). The following
  should appear within that stage.

* This screen contains only read-only information. No editable info present here. 
* The leaderboard should be sorted based on number of wins and then NRR (in the descending order)
* The leaderboard table will have the following columns:
  - Rank no (should be 1, 2, 3....)
  - Player name
  - Number of wins
  - NRR (calculation for this is shared below)
  - Set Win / Set Loss ratio
  - Points Win / Points Loss ratio
* Scratchpad calculation: Get the scores for a player from each match:
  - For each match, get the scores in favour of the player. In a match, if player name is there in player1, then it is already in the favour
    of the player. Else, reverse the scores. For ex, if player1="x", player2="y", game1 = "11-7", game2 = "7-11", game3="8-11" - if player is x,
    then keep the scores as is. Else the scores will become "7-11", "11-7", "11-8" in favour of player y. This info is kept only within
    the function for calculation, not stored anywhere else
  - This info can be referred as "relative_scores" for each player
* How to calculate "Number of wins":
  - If the walkover_win says a player name, then that player has won the match.
  - Using "relative_scores", assuming each score is in format of "n1-n2", if n1 > n2 then the player has won the set. If the number of sets won is gt than
    number of sets lots, the player has won the match.
  - Do this for all matches. Identify total wins and add that count into "number of wins" for that player
* How to calculate Set Win / Set Loss ratio (SWLR):
  - If the walkover_win says a player name, then the number of sets_won and sets_lost will be zero
  - Using "relative_scores" for that player, identify if n1 > n2. If yes, add to "sets_won". Else, add to "sets_lost"
  - Do this for all matches. At the end, if sets_lost is 0 - then the set win/set loss ratio (SWLR) is 99. Else it will be sets_won/sets_lost and the float
    value is stopped at 2 decimal points.:n1-n2
* How to calculate Set Win / Set Loss ratio (PWLR):
  - If the walkover_win says a player name, then the number of points_won and points_lost will be zero
  - Using "relative_scores" for that player, add all n1 to a counter called "points_won". Add all n2 to "points_lost"
  - Do this for all matches. At the end, if points_lost is 0 - then the point win/set loss ratio (PWLR) is 99. Else it will be points_won/points_lost and the float
    value is stopped at 2 decimal points.
* NRR:
  - NRR is equal to ((SWLR*100) + (PWLR))/100. Four decimal places.

* I would suggest that all the calculations happen in the backend, including sorting the table. This helps in easily
  testing - where the API results can be easily tested.
* None of the calculations will need to be stored in the DB.
* This screen should auto-refresh itself every 5 mins. A refresh button will also refresh the contents on this page.

### Move players to next stage

* This comes under a specific tournament and specific stage. For ex, if the user clicks MoveToStage menu, the UI should show a 
  list of tournaments and after selecting a tournament, there should be tabs showing each stage (1 tab for 1 stage). The following
  should appear within that stage.

* This screen is available only for admin role. For others, the menu itself should not be available or it should show an error.
* The screen shows the same info as Leaderboard for this stage. In addition, 
  - the first column should have checkboxes.
  - there should be dropdown at the bottom of the table with all stages (except this stage). Required field.
  - A button "Move to Stage"

* When the button is pressed "Move to Stage", the players are moved to that specific stage. A success message is shown.
* This action can be done multiple times. When ever it is done, it should remove all "Players for that stage", and add these
  selected players to that stage.
* Please add a confirmation prompt, before actually invoking the change

## Guidance to DB Model

This is a rough input to create the DB model. Further precise DB models (specific to the chosen database) needs to be
created. 

* users
  - username
  - password # Hashed password
  - role (admin|superadmin|scorer|guest)

* tournament
  - name
  - slug
  - description
  - status (open|closed)

* registration
  - tournament # same as tournament -> slug
  - player_name

* stages
  - tournament # same as tournament -> slug
  - name
  - slug
  - description
  - is_completed (true|false)
  - stage_type (league|superleague|playoff)

* stages_players
  - tournament # same as tournament -> slug
  - stage  # same as stages -> slug
  - player_name

* fixtures
  - tournament # same as tournament -> slug
  - stage  # same as stages -> slug
  - slno
  - player1
  - player2
  - tbl
  - hour_slot
  - game1
  - game2
  - game3
  - game4
  - game5
  - walkover_win # player name|empty
  - is_completed (true|false)

Notes:
* Some of the guidance is provided in the no-sql style. Even with SQLite DB, it is okay to use the similar style. For example, players
  can be referenced by names, no need to refer them by ids.

## Additional notes

These notes are responses to review comments:

* The fields "game1" to "game5" are created, so that there is flexibility to use Best of 3 or 5 sets during the tournament. For
  the software, if only info for 3 sets are there, then it would be best-of-3. Else best-of-5. So software is flexible to handle both.
  No best-of-7 needed.
* Admin will ensure player names are unique within the tournament, software need not worry about it
* Scorers and Admin will ensure that incomplete scoring will not be done

