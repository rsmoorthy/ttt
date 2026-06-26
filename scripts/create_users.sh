PASS=$(node -e "const bcrypt=require('bcrypt'); console.log(bcrypt.hashSync('asecretz', 10))" 2>/dev/null)

sqlite3 /data/ttt.db "INSERT INTO users (username, password, role) VALUES ('superadmin', '$PASS', 'superadmin');"
sqlite3 /data/ttt.db "INSERT INTO users (username, password, role) VALUES ('admin', '$PASS', 'admin');"
sqlite3 /data/ttt.db "INSERT INTO users (username, password, role) VALUES ('scorer', '$PASS', 'scorer');"
sqlite3 /data/ttt.db "INSERT INTO users (username, password, role) VALUES ('guest', '$PASS', 'guest');"
