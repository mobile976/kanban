<template>
    <div>
      <h1>component / Add Task</h1>
      <div v-if="!user">
        <p>Please log in to add tasks.</p>
        <button @click="$router.push('/login')">Go to Login</button>
      </div>
  
      <div v-else>
        <p>Welcome, {{ user.name }}</p>
        <button @click="logout">Logout</button>
  
        <div>
          <input
            v-model="newTask.title"
            type="text"
            placeholder="Task Title"
            required
          />
          <textarea
            v-model="newTask.description"
            placeholder="Task Description"
            required
          ></textarea>
          <select v-model="newTask.status">
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button @click="addTask">Add Task</button>
        </div>
  
        <p v-if="successMessage" style="color: green;">{{ successMessage }}</p>
        <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
      </div>
    </div>
  </template>
  
  <script>
  import { auth, firestore } from "~/plugins/firebase";
  import "firebase/firestore";
  
  export default {
    data() {
      return {
        user: null,
        newTask: {
          title: "",
          description: "",
          status: "todo",
          userInsertDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        },
        successMessage: "",
        errorMessage: "",
      };
    },
    created() {
      auth.onAuthStateChanged((user) => {
        if (user) {
          this.user = {
            uid: user.uid,
            name: user.displayName || "Anonymous",
          };
        } else {
          this.user = null;
        }
      });
    },
    methods: {
      async addTask() {
        if (!this.newTask.title || !this.newTask.description) {
          this.errorMessage = "Please fill in all fields.";
          this.successMessage = "";
          return;
        }
  
        const task = {
          title: this.newTask.title,
          description: this.newTask.description,
          status: this.newTask.status,
          userInsertDate: this.newTask.userInsertDate,
          userName: this.user.name,
          createdAt: firestore.FieldValue.serverTimestamp(),
        };
  
        try {
          const docRef = await firestore.collection("tasks").add(task);
          this.successMessage = "Task added successfully!";
          this.errorMessage = "";
  
          // Reset task form
          this.newTask.title = "";
          this.newTask.description = "";
          this.newTask.status = "todo";
        } catch (error) {
          console.error("Error adding task: ", error);
          this.errorMessage = "Failed to add task. Please try again.";
          this.successMessage = "";
        }
      },
      async logout() {
        try {
          await auth.signOut();
          this.$router.push("/login");
        } catch (error) {
          console.error("Error logging out: ", error);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  h1 {
    text-align: center;
  }
  
  div {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  input,
  textarea,
  select {
    width: 100%;
    margin-bottom: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  button {
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
  }
  
  button:hover {
    background-color: #0056b3;
  }
  
  p {
    text-align: center;
  }
  </style>
  