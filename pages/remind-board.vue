<template>
  <div>
    <div v-if="!user" class="center-container">
      <p>Please login in to Kanban board.</p><br>
      <button @click="$router.push('/login')">Go to Login</button>
    </div>

    <div v-else>
      <div class="dashboard">
        <!-- Left Section -->
        <div class="left-section">
          <br />
          <p><b>Welcome, {{ user.name }}</b></p>
          <br />
          <button @click="$router.push('/add-task')">Add Task</button>
          <button @click="$router.push('/')">Dashboard</button>
          <button @click="$router.push('/remind-board')">Remind Board</button>
          <br />
          <button @click="logout" class="logout">Logout</button>
        </div>

        <!-- Right Section -->
        <div class="right-section">
          <div class="content-container"><br>
            <h1>Remind Board</h1><br>

            <div v-if="filteredTasks.length" class="reminder-cards-container">
              <div
                v-for="task in filteredTasks"
                :key="task.id"
                class="reminder-card"
              >
                <h3>{{ task.title }}</h3>
                <br />
                <p>{{ task.description }}</p>
                <br />
                <p><strong>Finished on:</strong> {{ formatDate(task.userInsertDate) }}</p>
                <p><strong>Assigned to:</strong> {{ task.userName }}</p>
                <p><strong>Priority:</strong> {{ getPriorityLabel(task.priority) }}</p>
                <p>
                  <strong>Shared With:</strong>
                  {{
                    task.sharedWithNames && Array.isArray(task.sharedWithNames)
                      ? task.sharedWithNames.join(", ")
                      : "N/A"
                  }}
                </p>
                <br />
                <button @click="editTask(task.id)">Edit</button>
                <button @click="deleteTask(task.id)">Delete</button>
              </div>
            </div>

            <!-- No Reminders Message -->
            <p v-else>No reminders available.</p>
          </div>

          <!-- Toast Notification -->
          <div v-if="showToast" class="toast">
            <p>{{ toastMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { auth, firestore } from "~/plugins/firebase";

export default {
data() {
  return {
    user: null,
    tasks: [],
    showToast: false,
    toastMessage: '',
  };
},
computed: {
  filteredTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to the start of the day
    return this.tasks.filter((task) => {
      if (!task.userInsertDate) {
        console.warn("Task missing userInsertDate:", task);
        return false;
      }
      const insertedDate = task.userInsertDate.toDate ? task.userInsertDate.toDate() : new Date(task.userInsertDate);
      insertedDate.setHours(0, 0, 0, 0); // Reset to the start of the day
      return insertedDate <= today;
    });
  },
},
created() {
  this.checkAuth();
},
methods: {
  async checkAuth() {
    const user = await new Promise((resolve) => {
      auth.onAuthStateChanged(resolve);
    });

    if (user) {
      this.user = {
        uid: user.uid,
        name: user.displayName || "Anonymous",
      };
      this.fetchReminders(); // Fetch reminders after user login
    } else {
      this.user = null;
    }
  },

  async fetchReminders() {
    try {
      const snapshot = await firestore
        .collection("tasks")
        .where("status", "==", "in-progress") // Update status filter
        .get();

      if (snapshot.empty) {
        console.log("No tasks found.");
        return;
      }

      this.tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  },

  async editTask(taskId) {
      const taskRef = firestore.collection("tasks").doc(taskId);
      const taskSnapshot = await taskRef.get();
      if (taskSnapshot.exists) {
        const task = taskSnapshot.data();
        this.$router.push({ name: "edit-task", params: { taskId, task } });
      } else {
        console.log("Task not found");
      }
    },

    async deleteTask(taskId) {
      try {
        await firestore.collection("tasks").doc(taskId).delete();
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        this.organizeTasksByStatus();
        console.log("Task deleted successfully");
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    },

  formatDate(date) {
    if (!date) return "";
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return jsDate.toLocaleDateString();
  },

  getPriorityLabel(priority) {
    switch (priority) {
      case 1:
        return "High";
      case 2:
        return "Medium";
      case 3:
        return "Low";
      default:
        return "Low";
    }
  },

  logout() {
    auth.signOut();
    this.$router.push("/login");
  },

  showToastMessage(message) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  },
},
};
</script>
<style scoped src="@/assets/css/main.css"></style>
<style scoped src="@/assets/css/general.css"></style>
<style scoped src="@/assets/css/boarder.css"></style>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"></link>

<style scoped>
/* General Styles for Content Container */
.content-container {
padding: 10px;
width: 90%;
background-color: #fff;
border-radius: 10px;
box-shadow: 0 2px 8px rgba(9, 91, 75, 0.4);
max-width: 100%;
margin: 2rem auto;
}

h1 {
font-size: 2rem;
font-weight: bold;
color: #333;
text-align: center;
margin-bottom: 1.5rem;
}

.auth-message {
text-align: center;
margin-top: 1rem;
}

.auth-message p {
font-size: 1.1rem;
color: #555;
}

.no-tasks {
text-align: center;
font-size: 1.1rem;
color: #000000;
margin-top: 2rem;
}

/* Flexbox for reminder cards */
.reminder-cards-container {
display: flex;
flex-wrap: wrap;
gap: 1rem;
justify-content: space-between;
}

.reminder-card {
background-color: rgb(245, 245, 245);
border: 1px solid #d3d3d3;
padding: 1.5rem;
flex: 0 0 48%; /* Takes up 48% of the available space (2 cards per row) */
border-radius: 8px;
box-shadow: 0 2px 6px rgba(41, 34, 34, 0.1);
}

.reminder-card h3 {
font-size: 1.1rem;
font-weight: bold;
margin-bottom: 0.5rem;
color: #e77737;
}

.reminder-card p {
font-size: 0.9rem;
color: #555;
margin: 0.5rem 0;
line-height: 1.5;
}

.reminder-card strong {
color: #000000;
}
</style>