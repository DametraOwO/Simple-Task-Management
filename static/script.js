const DB_NAME = "TaskDB";
const DB_VERSION = 1;
let db;

const modal = document.getElementById("taskModal");
const openModalBtn = document.getElementById("openModal");
const closeModalBtn = document.querySelector(".close");

const titleInput = document.getElementById("taskTitle");
const dateInput = document.getElementById("taskDate");
const timeInput = document.getElementById("taskTime");
const descInput = document.getElementById("taskDesc");
const searchInput = document.getElementById("searchTask");
const taskList = document.getElementById("taskList");
const filterInput = document.getElementById("taskFilter");

// Fungsi membuka database IndexedDB
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            let db = event.target.result;
            if (!db.objectStoreNames.contains("tasks")) {
                db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = function (event) {
            reject("Database error: " + event.target.errorCode);
        };
    });
}

// Fungsi menambahkan task ke IndexedDB
async function addTaskToDB(task) {
    const db = await openDatabase();
    const transaction = db.transaction("tasks", "readwrite");
    const store = transaction.objectStore("tasks");
    store.add(task);
}

// Fungsi mengambil semua task dari IndexedDB
async function getTasksFromDB() {
    const db = await openDatabase();
    const transaction = db.transaction("tasks", "readonly");
    const store = transaction.objectStore("tasks");
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error fetching tasks");
    });
}

// Fungsi menghapus task dari IndexedDB
async function deleteTaskFromDB(taskId) {
    const db = await openDatabase();
    const transaction = db.transaction("tasks", "readwrite");
    const store = transaction.objectStore("tasks");
    store.delete(taskId);
}

// Fungsi menampilkan daftar task
async function fetchTasks() {
    const tasks = await getTasksFromDB();
    taskList.innerHTML = ""; // Kosongkan sebelum ditampilkan ulang

    tasks.forEach(task => {
        const listItem = document.createElement("li");
        listItem.classList.toggle("checked", task.completed);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;
            listItem.classList.toggle("checked", checkbox.checked);
            updateTaskStatus(task.id, task.completed);
        });

        const taskTitle = document.createElement("div");
        taskTitle.classList.add("task-title");
        taskTitle.innerHTML = task.title;

        const taskInfo = document.createElement("div");
        taskInfo.classList.add("task-info");
        taskInfo.innerHTML = `<span>${task.date} ${task.time}</span>`;

        const taskDesc = document.createElement("div");
        taskDesc.classList.add("task-desc");
        taskDesc.innerHTML = task.desc;

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-task");
        deleteBtn.innerHTML = "❌";
        deleteBtn.onclick = async () => {
            await deleteTaskFromDB(task.id);
            listItem.remove();
        };

        listItem.appendChild(checkbox);
        listItem.appendChild(taskTitle);
        listItem.appendChild(taskInfo);
        listItem.appendChild(taskDesc);
        listItem.appendChild(deleteBtn);

        taskList.appendChild(listItem);
    });

    filterInput.dispatchEvent(new Event("change"));
}

// Fungsi menyimpan status checkbox ke IndexedDB
async function updateTaskStatus(taskId, status) {
    const tasks = await getTasksFromDB();
    const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
            task.completed = status;
        }
        return task;
    });

    const db = await openDatabase();
    const transaction = db.transaction("tasks", "readwrite");
    const store = transaction.objectStore("tasks");
    updatedTasks.forEach(task => store.put(task));
}

// Fungsi menambahkan task baru ke IndexedDB
async function submitTask() {
    const title = titleInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const desc = descInput.value.trim();

    if (title === "" || date === "" || time === "") return alert("Harap isi semua data!");

    const newTask = {
        title,
        date,
        time,
        desc,
        completed: false,
    };

    await addTaskToDB(newTask);
    closeModal();
    fetchTasks(); // Perbarui daftar task
}

// Fungsi menutup modal & reset input
function closeModal() {
    modal.style.display = "none";
    resetInputs();
}

function resetInputs() {
    titleInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
    descInput.value = "";
}

// Filter task berdasarkan status
filterInput.addEventListener("change", function () {
    const filterValue = this.value.toLowerCase();
    const tasks = document.querySelectorAll("#taskList li");

    tasks.forEach(task => {
        const isCompleted = task.classList.contains("checked");
        if (filterValue === "" || (filterValue === "completed" && isCompleted) || (filterValue === "not-completed" && !isCompleted)) {
            task.style.display = "flex";
        } else {
            task.style.display = "none";
        }
    });
});

// Fungsi pencarian task
searchInput.addEventListener("input", function () {
    const searchValue = this.value.toLowerCase();
    const tasks = document.querySelectorAll("#taskList li");

    tasks.forEach(task => {
        const title = task.querySelector(".task-title").textContent.toLowerCase();
        if (title.includes(searchValue)) {
            task.style.display = "flex";
        } else {
            task.style.display = "none";
        }
    });
});

// Inisialisasi modal
window.onload = function () {
    modal.style.display = "none";
    fetchTasks();
};

openModalBtn.onclick = function () {
    modal.style.display = "flex";
};

closeModalBtn.onclick = closeModal;

window.onclick = function (event) {
    if (event.target === modal) {
        closeModal();
    }
};