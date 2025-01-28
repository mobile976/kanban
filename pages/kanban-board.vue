<template>
  <div>
    <h1>Kanban Dashboard</h1>

    <div v-if="!user">
      <p>Please log in to view tasks.</p>
      <button @click="$router.push('/login')">Go to Login</button>
    </div>

    <div v-else>
      <div class="header-controls">
        <div class="left-controls">
          <button @click="logout" class="logout">Logout</button>
          <p>Welcome, {{ user.name }}</p>
        </div>
        <div class="right-controls">
          <button @click="$router.push('/add-task')">Add Task</button>
          <button @click="$router.push('/remind-board')">Reminders</button>
        </div>
      </div>

      <!-- Sorting Controls -->
      <div class="sorting-controls">
        <label for="sortCriteria">Sort by:</label>
        <select id="sortCriteria" v-model="sortCriteria" @change="organizeTasksByStatus">
          <option value="userInsertDate">Due Date</option>
          <option value="status">Completion Status</option>
          <option value="priority">Priority</option>
        </select>

        <button @click="toggleSortOrder">
          Sort: {{ sortOrder === 'asc' ? 'Ascending' : 'Descending' }}
        </button>
      </div>

      <div class="kanban-board">
        <div class="kanban-column" v-for="(statusTasks, status) in tasksByStatus" :key="status">
          <h2>{{ capitalize(status) }}</h2>
          <div v-if="statusTasks.length === 0">No tasks in this column</div>
          <div v-for="task in statusTasks" :key="task.id" class="kanban-card">
            <h3>{{ task.title }}</h3>
            <p>{{ task.description }}</p>
            <p><strong>Finished on</strong> {{ formatDate(task.userInsertDate) }}</p>
            <p><strong>Assigned to:</strong> {{ task.userName || 'Unknown' }}</p>
            <p><strong>Priority:</strong> {{ getPriorityLabel(task.priority) }}</p>
            <button @click="editTask(task.id)">Edit</button>
            <button @click="deleteTask(task.id)">Delete</button>
            <button @click="shareTask(task.id)">Share Task</button>
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
      tasksByStatus: { todo: [], "in-progress": [], done: [] },
      sortCriteria: "userInsertDate", // Default sort by due date
      sortOrder: "asc", // Default to ascending order
      allUsers: [], // Store all users for sharing tasks
    };
  },
  created() {
    this.checkAuth();
    this.fetchAllUsers(); // Fetch all users for sharing tasks
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
        this.fetchUserTasks();
      } else {
        this.user = null;
      }
    },

    async fetchAllUsers() {
      try {
        const snapshot = await firestore.collection("users").get();
        this.allUsers = snapshot.docs.map((doc) => doc.data());
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    },

    async fetchUserTasks() {
      try {
        const snapshot = await firestore
          .collection("tasks")
          .where("userUid", "==", this.user.uid)
          .get();

        const sharedSnapshot = await firestore
          .collection("tasks")
          .where("sharedWithNames", "array-contains", this.user.name)
          .get();

        const tasks = [
          ...snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          ...sharedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ];

        this.tasks = tasks;
        this.organizeTasksByStatus();
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    },

    organizeTasksByStatus() {
      const sortedTasks = [...this.tasks].sort((a, b) => {
        let valueA = a[this.sortCriteria];
        let valueB = b[this.sortCriteria];

        // Handle userInsertDate separately
        if (this.sortCriteria === "userInsertDate") {
          valueA = a.userInsertDate ? a.userInsertDate.toDate() : new Date(0);
          valueB = b.userInsertDate ? b.userInsertDate.toDate() : new Date(0);
        }

        if (this.sortOrder === "asc") {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });

      this.tasksByStatus = {
        todo: sortedTasks.filter((task) => task.status === "todo"),
        "in-progress": sortedTasks.filter((task) => task.status === "in-progress"),
        done: sortedTasks.filter((task) => task.status === "done"),
      };
    },

    toggleSortOrder() {
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      this.organizeTasksByStatus();
    },

    async addTask(taskData, sharedWithNames = []) {
      try {
        await firestore.collection("tasks").add({
          title: taskData.title,
          description: taskData.description,
          status: "todo",
          userInsertDate: taskData.userInsertDate || null,
          userName: this.user.name,
          createdAt: new Date(),
          priority: taskData.priority || 3,
          userUid: this.user.uid,
          sharedWithNames, // Share by user name
        });
        console.log("Task added successfully");
        this.fetchUserTasks();
      } catch (error) {
        console.error("Error adding task:", error);
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

    async shareTask(taskId) {
      const taskRef = firestore.collection("tasks").doc(taskId);
      const taskSnapshot = await taskRef.get();

      if (taskSnapshot.exists) {
        const task = taskSnapshot.data();
        const sharedWithNames = task.sharedWithNames || [];
        const recipientName = prompt("Enter the name of the user to share the task with:");

        if (recipientName && !sharedWithNames.includes(recipientName)) {
          sharedWithNames.push(recipientName);
          await taskRef.update({ sharedWithNames });
          console.log("Task shared successfully");
          this.fetchUserTasks();
        } else {
          console.log("Task already shared or invalid user name");
        }
      } else {
        console.log("Task not found");
      }
    },

    logout() {
      auth.signOut();
      this.$router.push("/login");
    },

    capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    formatDate(date) {
      if (!date) return "";
      const jsDate = date.toDate();
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
  },
};
</script>

<style scoped>
/* Header Layout */
.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 20px;
}

.left-controls {
  display: flex;
  align-items: center;
}

.left-controls button {
  background-color: #f44336;
  margin-right: 10px;
}

.left-controls p {
  margin: 0;
  font-size: 1rem;
  color: #2d3a3f;
}

.right-controls {
  display: flex;
  align-items: center;
}

.right-controls button {
  margin-left: 10px;
  background-color: #007bff;
  color: white;
  padding: 8px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.right-controls button:hover {
  background-color: #0056b3;
}

/* Kanban Board Styles */
.kanban-board {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding: 0 20px;
}

.kanban-column {
  width: 30%;
  padding: 20px;
  background-color: #eeeeee;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.kanban-column:hover {
  transform: scale(1.02);
}

.kanban-column h2 {
  font-size: 1.5rem;
  color: #2d3a3f;
  text-align: center;
  margin-bottom: 15px;
}

.kanban-card {
  background-color: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.kanban-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.kanban-card h3 {
  font-size: 1.1rem;
  color: #333;
}

.kanban-card p {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
}

.sorting-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.sorting-controls label {
  font-weight: bold;
  color: #2d3a3f;
}

.sorting-controls select,
.sorting-controls button {
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #e1e4e8;
}

.sorting-controls select {
  background-color: #fff;
  color: #555;
}

.sorting-controls button {
  background-color: #007bff;
  color: white;
  border: none;
}

.sorting-controls button:hover {
  background-color: #0056b3;
}

/* Empty State */
.kanban-column div {
  text-align: center;
  font-size: 1.2rem;
  color: #888;
}

/* Form Styles */
input, textarea, select {
  padding: 8px;
  font-size: 1rem;
  margin-bottom: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
  width: 100%;
  box-sizing: border-box;
}

input:focus, textarea:focus, select:focus {
  border-color: #007bff;
  outline: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .kanban-board {
    flex-direction: column;
    padding: 0 10px;
  }

  .kanban-column {
    width: 100%;
    margin-bottom: 20px;
  }

  .sorting-controls {
    flex-direction: column;
  }

  .header-controls {
    flex-direction: column;
  }
}
</style>