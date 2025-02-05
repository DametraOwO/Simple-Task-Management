const API_URL = "/api/tasks";
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

filterInput.addEventListener("change", function() {
    const filterValue = this.value.toLowerCase();
    const tasks = document.querySelectorAll("#taskList li");

    tasks.forEach(task => {
        const isCompleted = task.classList.contains("checked");

        // Menyaring task berdasarkan status
        if (filterValue === "" || 
            (filterValue === "completed" && isCompleted) ||
            (filterValue === "not-completed" && !isCompleted)) {
            task.style.display = "flex"; // Tampilkan task yang sesuai dengan filter
        } else {
            task.style.display = "none"; // Sembunyikan task yang tidak sesuai
        }
    });
});


window.onload = function() {
    modal.style.display = "none";
};

// Fungsi untuk membuka modal
openModalBtn.onclick = function() {
    modal.style.display = "flex";
};

// Fungsi untuk menutup modal & reset input
function closeModal() {
    modal.style.display = "none";
    resetInputs();
}

// Klik tombol X menutup modal
closeModalBtn.onclick = closeModal;

// Klik di luar modal menutup modal
window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
};

// Fungsi reset input setelah submit atau tutup modal
function resetInputs() {
    titleInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
    descInput.value = "";
}

// Fungsi menampilkan daftar task dengan format yang terurut
async function fetchTasks() {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    taskList.innerHTML = ""; // Kosongkan sebelum ditampilkan ulang

    tasks.forEach(task => {
        const listItem = document.createElement("li");
        listItem.classList.toggle("checked", task.completed);

        // Checkbox untuk status task
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        // Event listener untuk checkbox
        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;
            listItem.classList.toggle("checked", checkbox.checked);
            saveTaskStatusToLocalStorage(task.id, checkbox.checked);
        });

        // Judul task
        const taskTitle = document.createElement("div");
        taskTitle.classList.add("task-title");
        taskTitle.innerHTML = task.title || "Judul tidak tersedia";

        // Informasi tanggal & waktu
        const taskInfo = document.createElement("div");
        taskInfo.classList.add("task-info");
        taskInfo.innerHTML = `<span>${task.date} ${task.time}</span>`;

        // Deskripsi task
        const taskDesc = document.createElement("div");
        taskDesc.classList.add("task-desc");
        taskDesc.innerHTML = task.desc || "Deskripsi tidak tersedia";

        // Membuat tombol hapus (❌)
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-task");
        deleteBtn.innerHTML = "❌";
        deleteBtn.onclick = async () => {
            await deleteTask(task.id);
            listItem.remove(); // Hapus dari tampilan
        };

        // Tambahkan elemen ke dalam list item
        listItem.appendChild(checkbox);
        listItem.appendChild(taskTitle);
        listItem.appendChild(taskInfo);
        listItem.appendChild(taskDesc);
        listItem.appendChild(deleteBtn); // Tambahkan tombol hapus

        taskList.appendChild(listItem);

        // Set status checkbox dari localStorage
        const savedStatus = getTaskStatusFromLocalStorage(task.id);
        if (savedStatus !== null) {
            checkbox.checked = savedStatus;
            listItem.classList.toggle("checked", savedStatus);
        }
    });

    // Terapkan filter berdasarkan pilihan dropdown setelah tasks dimuat
    filterInput.dispatchEvent(new Event("change"));
}

// Fungsi menambahkan task ke database
async function submitTask() {
    const title = titleInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const desc = descInput.value.trim();

    if (title === "" || date === "" || time === "") return alert("Harap isi semua data!");

    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, time, desc })
    });

    closeModal();
    fetchTasks(); // Perbarui daftar task
}

// Fungsi untuk menghapus task dari database
async function deleteTask(taskId) {
    await fetch(`${API_URL}/${taskId}`, {
        method: "DELETE",
    });
}

// Fungsi untuk menyimpan status checkbox ke localStorage
function saveTaskStatusToLocalStorage(taskId, status) {
    let taskStatus = JSON.parse(localStorage.getItem("taskStatus")) || {};
    taskStatus[taskId] = status;
    localStorage.setItem("taskStatus", JSON.stringify(taskStatus));
}

// Fungsi untuk mengambil status checkbox dari localStorage
function getTaskStatusFromLocalStorage(taskId) {
    let taskStatus = JSON.parse(localStorage.getItem("taskStatus")) || {};
    return taskStatus[taskId];
}

// Fungsi untuk menyaring task berdasarkan input search bar
searchInput.addEventListener("input", function() {
    const searchValue = this.value.toLowerCase();
    const tasks = document.querySelectorAll("#taskList li");

    tasks.forEach(task => {
        const title = task.querySelector(".task-title").textContent.toLowerCase();
        if (title.includes(searchValue)) {
            task.style.display = "flex"; // Tampilkan jika cocok
        } else {
            task.style.display = "none"; // Sembunyikan jika tidak cocok
        }
    });
});

// Jalankan fetchTasks saat halaman pertama kali dimuat
fetchTasks();
