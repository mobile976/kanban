<template>
  <div>
    <div v-if="!user">
      <p>Please log in to Kanban board.</p>
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
          <div class="task-form">
            <div v-if="!user">
              <p>Please log in to add tasks.</p>
              <button @click="$router.push('/login')">Go to Login</button>
            </div>

            <div v-else>
              <h2>Add Task</h2>
              <input v-model="newTask.title" placeholder="Task Title" />
              <textarea v-model="newTask.description" placeholder="Task Description"></textarea>
              <select v-model="newTask.status">
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <input v-model.number="newTask.priority" type="number" placeholder="Priority (1-5)" min="1" max="5" />
              <input v-model="newTask.userInsertDate" type="date" />
              <button @click="addTask">Add Task</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, firestore } from "~/plugins/firebase";
import firebase from "firebase/app";

export default {
  data() {
    return {
      user: null,
      newTask: {
        title: "",
        description: "",
        status: "todo",
        priority: 1,
        userInsertDate: new Date().toISOString().split("T")[0], // Default to today's date
      },
    };
  },
  created() {
    // Check Firebase authentication state
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.user = {
          uid: user.uid,
          name: user.displayName || user.email || "Anonymous",
        };
      } else {
        this.user = null;
      }
    });
  },
  methods: {
    async addTask() {
      // Validate form inputs
      if (!this.newTask.title || !this.newTask.description) {
        alert("Please fill in all fields.");
        return;
      }

      // Prepare task object
      const task = {
        title: this.newTask.title,
        description: this.newTask.description,
        status: this.newTask.status,
        priority: this.newTask.priority,
        userInsertDate: firebase.firestore.Timestamp.fromDate(new Date(this.newTask.userInsertDate)),
        userName: this.user ? this.user.name : "Anonymous",
        userUid: this.user ? this.user.uid : null,
        createdAt: firebase.firestore.Timestamp.now(), // Store as timestamp
      };

      try {
        // Save task to Firestore
        const docRef = await firestore.collection("tasks").add(task);
        console.log("Task added with ID:", docRef.id);
        this.resetForm();
      } catch (error) {
        console.error("Error adding task:", error);
      }
    },
    resetForm() {
      // Reset the task form
      this.newTask = {
        title: "",
        description: "",
        status: "todo",
        priority: 1,
        userInsertDate: new Date().toISOString().split("T")[0], // Reset to today's date
      };
    },
    async logout() {
      try {
        await auth.signOut();
        this.user = null;
        this.$router.push("/login");
      } catch (error) {
        console.error("Error during logout:", error);
      }
    },
  },
};
</script>
<style scoped src="@/assets/css/main.css"></style>
<style scoped src="@/assets/css/general.css"></style>
<style scoped src="@/assets/css/boarder.css"></style>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"></link>