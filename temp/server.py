from flask import Flask, request, send_file, jsonify
import json
import os

from gpt2 import schedule

app = Flask(__name__)

# Ensure fixtures.json exists
FIXTURES_FILE = "fixtures.json"
if not os.path.exists(FIXTURES_FILE):
    with open(FIXTURES_FILE, "w") as f:
        json.dump([], f)


@app.route("/", methods=["GET"])
def index():
    return send_file("fixtures.html")


@app.route("/schedule", methods=["POST"])
def schedule_endpoint():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        result = schedule(data)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/save", methods=["POST"])
def save_fixtures():
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"error": "Invalid JSON"}), 400

        with open(FIXTURES_FILE, "w") as f:
            json.dump(data, f, indent=2)

        return jsonify({"status": "success", "message": "Fixtures saved successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/fixtures", methods=["GET"])
def get_fixtures():
    try:
        if os.path.exists(FIXTURES_FILE):
            with open(FIXTURES_FILE, "r") as f:
                data = json.load(f)
            return jsonify(data)
        else:
            return jsonify([])  # return empty array if file doesn't exist
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=8383, host="0.0.0.0")
