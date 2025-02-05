from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

# Path ke file JSON untuk menyimpan data
DATA_FILE = "tasks.json"

# Fungsi untuk membaca data dari file JSON
def read_tasks():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as file:
        return json.load(file)

# Fungsi untuk menyimpan data ke file JSON
def write_tasks(tasks):
    with open(DATA_FILE, "w") as file:
        json.dump(tasks, file, indent=4)

# Route untuk halaman utama
@app.route("/")
def home():
    return render_template("index.html")

# API untuk mendapatkan semua tugas
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    tasks = read_tasks()
    return jsonify(tasks)

# API untuk menambah tugas baru
@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.json
    tasks = read_tasks()
    new_task = {
        "id": len(tasks) + 1,
        "title": data["title"],
        "date": data["date"],
        "time": data["time"],
        "desc": data["desc"],
        "completed": False
    }
    tasks.append(new_task)
    write_tasks(tasks)
    return jsonify(new_task), 201

# API untuk mengubah status tugas (selesai/belum)
@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    tasks = read_tasks()
    for task in tasks:
        if task["id"] == task_id:
            task["completed"] = not task["completed"]
            write_tasks(tasks)
            return jsonify(task)
    return jsonify({"error": "Task not found"}), 404

# API untuk menghapus tugas
@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    tasks = read_tasks()
    tasks = [task for task in tasks if task["id"] != task_id]
    write_tasks(tasks)
    return jsonify({"message": "Task deleted"}), 200

if __name__ == "__main__":
    app.run(debug=True)