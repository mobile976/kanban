<template>
  <div>
    <div v-if="!user" class="center-container">
      <p>Please log in to Kanban board...</p>
      <button @click="$router.push('/login')">Go to Login</button>
    </div>
    <div v-else>
      <div class="dashboard">
        <!-- Left Section -->
        <div class="left-section"><br>
          <p><b>Welcome, {{ user.name }}</b></p>
          <label for="sortCriteria">Tasks sort by:</label>
          <select id="sortCriteria" v-model="sortCriteria" @change="organizeTasksByStatus">
            <option value="userInsertDate">Due Date</option>
            <option value="status">Completion Status</option>
            <option value="priority">Priority</option>
          </select>
          <button @click="toggleSortOrder">
            Sort: {{ sortOrder === 'asc' ? 'Ascending' : 'Descending' }}
          </button><br>
          <button @click="$router.push('/add-task')">Add Task</button>
          <button @click="$router.push('/')">Dashboard</button>
          <button @click="$router.push('/remind-board')">Remind Board</button><br>
          <button @click="logout" class="logout">Logout</button>
          
        </div>

        <!-- Right Section -->
        <div class="right-section">
          <div class="kanban-board">
            <div class="kanban-column" v-for="(statusTasks, status) in tasksByStatus" :key="status">
              <h2>{{ capitalize(status) }}</h2>
              <div v-if="statusTasks.length === 0">No tasks in this column</div>
              <div v-for="task in statusTasks" :key="task.id" class="kanban-card">
                <h3>{{ task.title }}</h3><br>
                <p>{{ task.description }}</p><br>
                <p><strong>Finished on</strong> {{ formatDate(task.userInsertDate) }}</p>
                <p><strong>Assigned to:</strong> {{ task.userName || 'Unknown' }}</p>
                <p><strong>Priority:</strong> {{ getPriorityLabel(task.priority) }}</p>
                <p><strong>Shared With:</strong> {{ task.sharedWithNames && Array.isArray(task.sharedWithNames) ? task.sharedWithNames.join(", ") : 'N/A' }}</p><br>
                <button @click="editTask(task.id)">Edit</button>
                <button @click="deleteTask(task.id)">Delete</button>
                <button @click="shareTask(task.id)">Share Task</button>
              </div>
            </div>
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
<style scoped src="@/assets/css/main.css"></style>
<style scoped src="@/assets/css/general.css"></style>
<style scoped src="@/assets/css/boarder.css"></style>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"></link>