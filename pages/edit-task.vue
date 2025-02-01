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
              <h1>Edit Task</h1>
              <form @submit.prevent="updateTask">
                <div>
                  <label for="title">Title:</label>
                  <input v-model="task.title" id="title" type="text" required />
                </div>
                <div>
                  <label for="description">Description:</label>
                  <textarea v-model="task.description" id="description" required></textarea>
                </div>
                <div>
                  <label for="status">Status:</label>
                  <select v-model="task.status" id="status" required>
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label for="userInsertDate">Finished Date:</label>
                  <input v-model="formattedUserInsertDate" id="userInsertDate" type="date" required />
                </div>
                <div>
                  <label for="priority">Priority:</label>
                  <select v-model="task.priority" id="priority" required>
                    <option value="1">High</option>
                    <option value="2">Medium</option>
                    <option value="3">Low</option>
                  </select>
                </div>
                <button type="submit">Update Task</button>
                <button type="button" @click="$router.push('/')">Cancel</button>
              </form>
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
      task: {
        title: "",
        description: "",
        status: "todo",
        userInsertDate: null,
        priority: 3, // Default priority
      },
    };
  },
  computed: {
    formattedUserInsertDate: {
      get() {
        if (this.task.userInsertDate && this.task.userInsertDate.toDate) {
          // Convert Firebase Timestamp to ISO date string
          return this.task.userInsertDate.toDate().toISOString().split("T")[0];
        }
        // If not a Timestamp, return as is
        return this.task.userInsertDate || "";
      },
      set(newDate) {
        // Convert ISO date string back to Firebase Timestamp
        if (newDate) {
          const date = new Date(newDate);
          this.task.userInsertDate = firebase.firestore.Timestamp.fromDate(date);
        } else {
          this.task.userInsertDate = null;
        }
      },
    },
  },
  created() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.user = {
          uid: user.uid,
          name: user.displayName || "Anonymous",
        };
        this.fetchTask();
      } else {
        this.user = null;
      }
    });
  },
  methods: {
    async fetchTask() {
      try {
        const taskId = this.$route.params.taskId;
        const taskRef = firestore.collection("tasks").doc(taskId);
        const taskSnapshot = await taskRef.get();
        if (taskSnapshot.exists) {
          this.task = { id: taskSnapshot.id, ...taskSnapshot.data() };
          console.log('Fetched task:', this.task); // Log task to check priority
        } else {
          console.log("Task not found");
        }
      } catch (error) {
        console.error("Error fetching task: ", error);
      }
    },
    async updateTask() {
      try {
        // Log the task object to ensure priority is correct before update
        console.log('Updating task:', this.task);

        const taskRef = firestore.collection("tasks").doc(this.task.id);
        await taskRef.update({
          title: this.task.title,
          description: this.task.description,
          status: this.task.status,
          userInsertDate: this.task.userInsertDate,
          priority: Number(this.task.priority), // Ensure priority is a number
        });
        this.$router.push("/");
        console.log("Task updated successfully");
      } catch (error) {
        console.error("Error updating task: ", error);
      }
    },
    logout() {
      auth.signOut();
      this.$router.push("/login");
    },
  },
};
</script>
<style scoped src="@/assets/css/main.css"></style>
<style scoped src="@/assets/css/general.css"></style>
<style scoped src="@/assets/css/boarder.css"></style>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"></link>