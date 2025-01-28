<template>
  <div id="app">
    <!-- Header Section -->
    <header class="header">
  <nav class="nav">
    <div class="logo">
      <router-link to="/">Khanban Application</router-link>
    </div>
    <ul class="nav-center">
      <li><router-link to="/add-task">Add Task</router-link></li>
      <li><router-link to="/kanban-board">Dashboard</router-link></li>
      <li><router-link to="/remind-board">Reminders Tasks</router-link></li>
    </ul>
    <ul class="nav-right">
      <li v-if="!user"><router-link to="/signup">Sign Up</router-link></li>
      <li v-if="user">Welcome, {{ user.name }}</li>
      <li v-if="user"><button @click="logout">Logout</button></li>
    </ul>
  </nav>
</header>

    <!-- Main Content Section -->
    <main>
      <div class="content-container">
        <h1>Remind Board</h1>
    
        <div v-if="!user" class="auth-message">
          <p>Please log in to view reminders.</p>
          <button @click="$router.push('/login')" class="btn">Go to Login</button>
        </div>
    
        <div v-else>
          <div v-if="filteredTasks.length === 0" class="no-tasks">
    <p>No current reminders found.</p>
  </div>

  <div v-else class="reminder-cards-container">
    <div v-for="task in filteredTasks" :key="task.id" class="reminder-card">
      <h3>{{ task.title }}</h3>
      <p>{{ task.description }}</p>
      <p><strong>Finished on:</strong> {{ formatDate(task.userInsertDate) }}</p>
      <p><strong>Assigned to:</strong> {{ task.userName }}</p>
      <p><strong>Priority:</strong> {{ getPriorityLabel(task.priority) }}</p>
      <p><strong>Shared With:</strong> {{ task.sharedWithNames && Array.isArray(task.sharedWithNames) ? task.sharedWithNames.join(", ") : 'N/A' }}</p>
    </div>
  </div>
</div>

    
        <!-- Toast Notification -->
        <div v-if="showToast" class="toast">
          <p>{{ toastMessage }}</p>
        </div>
      </div>
    </main>

    <!-- Footer Section -->
    <footer class="footer">
      <p>Web-based Task Management Application Development</p>
    </footer>
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
<style scoped src="@/assets/css/header.css"></style>
<style scoped src="@/assets/css/footer.css"></style>
<style scoped src="@/assets/css/main.css"></style>
<style scoped src="@/assets/css/general.css"></style>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"></link>
<style scoped>
/* General Styles for Content Container */
.content-container {
  padding: 2rem;
  background-color: #f4f6f9;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 900px;
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

.btn {
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  background-color: #2980b9;
  color: white;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 1rem;
}

.btn:hover {
  background-color: #1f6d7b;
}

.no-tasks {
  text-align: center;
  font-size: 1.2rem;
  color: #888;
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
  background-color: white;
  padding: 1.5rem;
  flex: 0 0 48%; /* Takes up 48% of the available space (2 cards per row) */
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.reminder-card h3 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.reminder-card p {
  font-size: 1rem;
  color: #555;
  margin: 0.5rem 0;
}

.reminder-card strong {
  color: #000000;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 1rem 2rem;
  border-radius: 6px;
  font-size: 1.1rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  animation: toast-animation 3s forwards;
}

@keyframes toast-animation {
  0% {
    opacity: 0;
    bottom: 0;
  }
  100% {
    opacity: 1;
    bottom: 20px;
  }
}

</style>
